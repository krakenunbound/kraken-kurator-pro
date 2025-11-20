const { contextBridge, ipcRenderer } = require('electron');

// Check if webUtils is available (Electron 22+)
let webUtils;
try {
  webUtils = require('electron').webUtils;
} catch (e) {
  console.log('webUtils not available, will use fallback method');
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialogs
  chooseFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  chooseFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  chooseMoveDestination: () => ipcRenderer.invoke('dialog:openMove'),

  // File System
  loadFolder: (folderPath) => ipcRenderer.invoke('fs:loadFolder', folderPath),
  handleDroppedPaths: (paths) => ipcRenderer.invoke('fs:handleDroppedPaths', paths),
  trashFile: (filePath) => ipcRenderer.invoke('fs:trashFile', filePath),
  moveFile: (filePath, destFolder) => ipcRenderer.invoke('fs:moveFile', filePath, destFolder),

  // FFmpeg/FFprobe
  getThumbnail: (mediaPath) => ipcRenderer.invoke('ffmpeg:getThumbnail', mediaPath),
  getMetadata: (mediaPath) => ipcRenderer.invoke('ffmpeg:getMetadata', mediaPath),
  
  // Audio-Specific APIs
  readMetadata: (filePath) => ipcRenderer.invoke('metadata:read', filePath),
  writeMetadata: (filePath, metadata) => ipcRenderer.invoke('metadata:write', filePath, metadata),
  convertWavToMp3: (wavPath, quality) => ipcRenderer.invoke('ffmpeg:convertWav', wavPath, quality),
  
  // AI APIs
  aiRenameFile: (filepath, prompt) => ipcRenderer.invoke('ai:renameFile', filepath, prompt),
  
  // Path utilities
  getPathFromFile: (file) => {
    try {
      // Try webUtils first (Electron 22+)
      if (webUtils && webUtils.getPathForFile) {
        return webUtils.getPathForFile(file);
      }
      // Fallback to file.path (deprecated but works in older Electron versions)
      if (file.path) {
        return file.path;
      }
      console.error('Unable to get file path - no method available');
      return null;
    } catch (e) {
      console.error('Failed to get path for file:', e);
      return null;
    }
  }
});