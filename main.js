const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const os = require('os');

// Dependencies from BOTH projects
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const NodeID3 = require('node-id3');
const mm = require('music-metadata'); // Still need this for ffprobe-like audio duration

// --- MERGED EXTENSIONS ---
const videoExts = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.mpg', '.mpeg', '.m4v'];
const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];
const audioExts = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma', '.opus', '.aiff'];
const allMediaExts = [...videoExts, ...imageExts, ...audioExts]; // Combined list

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 950, // Updated height
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  
  // --- Load file with absolute path ---
  const indexPath = path.join(__dirname, 'index.html');
  console.log('--- LOADING FILE:', indexPath);
  win.loadURL(`file://${indexPath}`);
  
  // Clear cache for good measure
  win.webContents.session.clearCache(() => { console.log('Cache cleared!'); });
  
  // win.webContents.openDevTools(); // Keep this commented out
  
  win.on('closed', () => app.quit());
  return win;
}

// --- CUSTOM MENU ---
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({ 
              properties: ['openDirectory'] 
            });
            if (!canceled && filePaths.length > 0) {
              const mainWindow = BrowserWindow.getAllWindows()[0];
              if (mainWindow) {
                // This is a legacy hook from the video app for the menu.
                // We'll leave it, but our buttons are primary.
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'User Guide',
          accelerator: 'F1',
          click: () => createHelpWindow('guide')
        },
        {
          label: 'Multi-Select Tutorial',
          click: () => createHelpWindow('multiselect')
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => createHelpWindow('shortcuts')
        },
        {
          label: 'Troubleshooting',
          click: () => createHelpWindow('troubleshoot')
        },
        { type: 'separator' },
        {
          label: 'About Kraken Kurator',
          click: () => createHelpWindow('about')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- HELP WINDOW ---
let helpWindow = null;
function createHelpWindow(tab = 'guide') {
  if (helpWindow) {
    helpWindow.focus();
    helpWindow.webContents.executeJavaScript(`showTab('${tab}')`).catch(() => {});
    return;
  }
  
  helpWindow = new BrowserWindow({
    width: 900,
    height: 700,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  const helpPath = path.join(__dirname, 'help.html');
  helpWindow.loadURL(`file://${helpPath}`);
  
  helpWindow.webContents.on('did-finish-load', () => {
    helpWindow.webContents.executeJavaScript(`showTab('${tab}')`).catch(() => {});
  });
  
  helpWindow.setMenuBarVisibility(false);
  
  helpWindow.on('closed', () => {
    helpWindow = null;
  });
}


// --- MERGED IPC HANDLERS ---

// --- Dialogs ---
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('dialog:openFiles', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Media', extensions: allMediaExts.map(e => e.slice(1)) },
      { name: 'Videos', extensions: videoExts.map(e => e.slice(1)) },
      { name: 'Audio', extensions: audioExts.map(e => e.slice(1)) },
      { name: 'Images', extensions: imageExts.map(e => e.slice(1)) }
    ]
  });
  if (canceled) return [];
  return filePaths;
});

ipcMain.handle('dialog:openMove', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (canceled) return null;
  return filePaths[0];
});

// --- File System ---
ipcMain.handle('fs:loadFolder', (event, folder) => {
  try {
    return fs.readdirSync(folder)
      .map(f => path.join(folder, f))
      .filter(f => !fs.lstatSync(f).isDirectory())
      .filter(f => allMediaExts.some(ext => f.toLowerCase().endsWith(ext)))
      .sort((a, b) => path.basename(a).toLowerCase().localeCompare(path.basename(b).toLowerCase()));
  } catch (e) { return { error: e.message }; }
});

// ★★★ DEBUGGING ADDED HERE ★★★
ipcMain.handle('fs:handleDroppedPaths', (event, paths) => {
  console.log('--- [main.js] Received paths from preload:', paths);
  if (!paths || !Array.isArray(paths)) return { error: 'Invalid paths' };
  
  const validPaths = paths.filter(p => typeof p === 'string' && p);
  
  let mediaFiles = [];
  let dirs = [];
  
  for (const p of validPaths) {
    try {
      // Try to get file stats
      const stats = fs.lstatSync(p);
      
      if (stats.isDirectory()) {
        console.log(`--- [main.js] Path is a directory: ${p}`);
        dirs.push(p);
      } else if (allMediaExts.some(ext => p.toLowerCase().endsWith(ext))) {
        console.log(`--- [main.js] Path is a valid media file: ${p}`);
        mediaFiles.push(p);
      } else {
        console.log(`--- [main.js] Path is a file but not media: ${p}`);
      }
    } catch (e) {
      // This is where the ENOENT error was happening
      console.error(`--- [main.js] CRITICAL ERROR: fs.lstatSync failed for path: ${p}`);
      console.error(e);
      return { error: `File not found or unreadable: ${p}. Error: ${e.message}` };
    }
  }

  if (dirs.length > 0) {
    const folder = dirs[0];
    console.log(`--- [main.js] Loading first dropped directory: ${folder}`);
    try {
      const videos = fs.readdirSync(folder)
        .map(f => path.join(folder, f))
        .filter(f => !fs.lstatSync(f).isDirectory())
        .filter(f => allMediaExts.some(ext => f.toLowerCase().endsWith(ext)))
        .sort((a, b) => path.basename(a).toLowerCase().localeCompare(path.basename(b).toLowerCase()));
      return { type: 'folder', videos, name: folder };
    } catch (e) { return { error: e.message }; }
  } else {
    console.log(`--- [main.js] Returning ${mediaFiles.length} dropped files.`);
    return {
      type: 'files',
      videos: mediaFiles.sort((a, b) => path.basename(a).toLowerCase().localeCompare(path.basename(b).toLowerCase())),
      name: `${mediaFiles.length} files`
    };
  }
});

ipcMain.handle('fs:trashFile', (event, p) => {
  try {
    const trashDir = path.join(path.dirname(p), '_CuratorTrash');
    fs.mkdirSync(trashDir, { recursive: true });
    let dest = path.join(trashDir, path.basename(p));
    let i = 1;
    while (fs.existsSync(dest)) {
      const base = path.basename(p, path.extname(p));
      dest = path.join(trashDir, `${base}__${i}${path.extname(p)}`);
      i++;
    }
    fs.renameSync(p, dest);
    return { success: true };
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('fs:moveFile', (event, p, destFolder) => {
  try {
    let dest = path.join(destFolder, path.basename(p));
    let i = 1;
    while (fs.existsSync(dest)) {
      const base = path.basename(p, path.extname(p));
      dest = path.join(destFolder, `${base}__${i}${path.extname(p)}`);
      i++;
    }
    
    try {
      fs.renameSync(p, dest);
    } catch (renameError) {
      if (renameError.code === 'EXDEV') {
        fs.copyFileSync(p, dest);
        fs.unlinkSync(p);
      } else { throw renameError; }
    }
    return { success: true };
  } catch (e) { return { error: e.message }; }
});

// --- FFmpeg/FFprobe Handlers ---

// Merged Thumbnail Generator
ipcMain.handle('ffmpeg:getThumbnail', (event, mediaPath) => {
  return new Promise((resolve) => {
    const output = path.join(os.tmpdir(), `${path.basename(mediaPath)}_${Date.now()}_thumb.jpg`);
    
    const isImage = imageExts.some(ext => mediaPath.toLowerCase().endsWith(ext));
    const isAudio = audioExts.some(ext => mediaPath.toLowerCase().endsWith(ext));
    
    let ffmpegArgs;
    
    if (isImage) {
      ffmpegArgs = [
        '-i', mediaPath,
        '-vf', 'scale=160:90:force_original_aspect_ratio=decrease,pad=160:90:(ow-iw)/2:(oh-ih)/2',
        '-y', output
      ];
    } else if (isAudio) {
      ffmpegArgs = [
        '-i', mediaPath,
        '-filter_complex', 'aformat=channel_layouts=mono,showwavespic=s=160x90:colors=#00d4ff',
        '-vframes', '1',
        '-y', output
      ];
    } else {
      ffmpegArgs = [
        '-i', mediaPath,
        '-ss', '1',
        '-vframes', '1',
        '-vf', 'scale=160:90:force_original_aspect_ratio=decrease,pad=160:90:(ow-iw)/2:(oh-ih)/2',
        '-y', output
      ];
    }
    
    execFile(ffmpegPath, ffmpegArgs, (err) => {
      if (!err && fs.existsSync(output)) {
        resolve(`file://${output}?t=${Date.now()}`);
      } else {
        resolve('');
      }
    });
  });
});

// Merged Metadata Generator
ipcMain.handle('ffmpeg:getMetadata', (event, p) => {
  const isImage = imageExts.some(ext => p.toLowerCase().endsWith(ext));
  const isAudio = audioExts.some(ext => p.toLowerCase().endsWith(ext));
  
  return new Promise((resolve) => {
    try {
      const sizeMb = (fs.statSync(p).size / (1024 * 1024)).toFixed(1);
      let metaText = path.basename(p);

      if (isImage) {
        resolve(`${metaText} | ${sizeMb} MB`);
        return;
      }
      
      execFile(ffprobePath, ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', p], (err, stdout) => {
        if (err) { resolve(metaText); return; }
        try {
          const data = JSON.parse(stdout);
          const duration = data.format.duration ? formatTime(data.format.duration) : '00:00';
          
          if (isAudio) {
            const audioStream = data.streams.find(s => s.codec_type === 'audio');
            const bitrate = audioStream.bit_rate ? `${Math.round(audioStream.bit_rate / 1000)} kbps` : '';
            resolve(`${metaText} | ${duration} | ${bitrate} | ${sizeMb} MB`);
          } else { // Is Video
            const videoStream = data.streams.find(s => s.codec_type === 'video');
            if (videoStream) {
              const w = videoStream.width || 0;
              const h = videoStream.height || 0;
              const fpsStr = videoStream.r_frame_rate || '0/1';
              const parts = fpsStr.split('/');
              const fps = parts.length === 2 ? Math.round(parseFloat(parts[0]) / parseFloat(parts[1])) : 0;
              metaText += ` | ${duration} | ${w}×${h} | ${fps} fps | ${sizeMb} MB`;
            }
            resolve(metaText);
          }
        } catch (e) { resolve(metaText); }
      });
    } catch (e) { resolve(path.basename(p)); }
  });
});

// Helper
function formatTime(sec) {
  if (isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}


// --- Audio-Specific Handlers ---

// Metadata: Read
ipcMain.handle('metadata:read', async (event, filePath) => {
  try {
    const tags = NodeID3.read(filePath);
    if (!tags) {
      return { title: '', artist: '', album: '', genre: '', comment: '', coverArt: null, trackNumber: '' };
    }
    let coverArt = null;
    if (tags.image && tags.image.imageBuffer) {
      const picture = tags.image;
      const base64 = picture.imageBuffer.toString('base64');
      coverArt = `data:${picture.mime};base64,${base64}`;
    }
    const genre = tags.genre || tags.TCON || tags.TCO || '';
    let comment = '';
    if (tags.comment && tags.comment.text) { comment = tags.comment.text; }
    
    return {
      title: tags.title || '',
      artist: tags.artist || '',
      album: tags.album || '',
      genre: genre,
      comment: comment,
      trackNumber: tags.trackNumber || tags.TRCK || '',
      coverArt: coverArt
    };
  } catch (e) { return { error: e.message }; }
});

// Metadata: Write
ipcMain.handle('metadata:write', async (event, filePath, tags) => {
  try {
    const existingTags = NodeID3.read(filePath) || {};
    
    const tagsToWrite = {
      ...existingTags,
      title: tags.title || '',
      artist: tags.artist || '',
      album: tags.album || '',
      genre: tags.genre || '',
      TCON: tags.genre || '',
      TCO: tags.genre || '',
      trackNumber: tags.trackNumber || '',
      TRCK: tags.trackNumber || '',
      comment: {
        language: 'eng',
        text: tags.comment || ''
      }
    };

    if (tags.coverArt) {
      const matches = tags.coverArt.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        tagsToWrite.image = {
          mime: `image/${matches[1]}`,
          type: { id: 3, name: 'front cover' },
          description: 'Cover',
          imageBuffer: Buffer.from(matches[2], 'base64')
        };
      }
    }
    
    const success = NodeID3.write(tagsToWrite, filePath);
    return { success: !!success };
  } catch (e) { return { error: e.message }; }
});

// FFmpeg: Convert WAV
ipcMain.handle('ffmpeg:convertWav', (event, wavPath, quality) => {
  return new Promise((resolve) => {
    const outputPath = wavPath.replace(/\.wav$/i, '.mp3');
    const qualityMap = { 0: '0', 2: '2', 4: '4' };
    
    execFile(ffmpegPath, [
      '-i', wavPath,
      '-q:a', qualityMap[quality],
      '-ar', '44100',
      '-joint_stereo', '1',
      '-codec:a', 'libmp3lame',
      '-y', outputPath
    ], (err) => {
      if (err) {
        resolve({ error: err.message });
      } else {
        const sizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(1);
        resolve({ success: true, mp3Path: outputPath, sizeMb: sizeMb });
      }
    });
  });
});
// AI: Rename File
ipcMain.handle('ai:renameFile', async (event, filepath, oldFilename) => {
  try {
    // Call Ollama API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: `Rename this file to be unique and creative: "${oldFilename}". The file appears to be a duplicate. Respond with ONLY the new filename (including extension), nothing else. Make it poetic or interesting. For example, if the file is "Rose(1).mp3", you might respond with "By Any Other Name.mp3" or "Crimson Petals.mp3". Just give me the new filename:`,
        stream: false
      })
    });
    
    const data = await response.json();
    let newName = data.response.trim();
    
    // Clean up the response (remove quotes if present)
    newName = newName.replace(/['"]/g, '');
    
    // Ensure it has the same extension
    const ext = path.extname(oldFilename);
    if (!newName.toLowerCase().endsWith(ext.toLowerCase())) {
      newName = newName.replace(/\.[^.]+$/, '') + ext;
    }
    
    // Build new path
    const dir = path.dirname(filepath);
    let newPath = path.join(dir, newName);
    
    // Check if file already exists, add number if needed
    let counter = 1;
    while (fs.existsSync(newPath)) {
      const baseName = path.basename(newName, ext);
      newPath = path.join(dir, `${baseName} ${counter}${ext}`);
      counter++;
    }
    
    // Rename the file
    fs.renameSync(filepath, newPath);
    
    return { success: true, newPath: newPath, newName: path.basename(newPath) };
  } catch (e) {
    return { error: e.message };
  }
});