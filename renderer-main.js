window.addEventListener('DOMContentLoaded', () => {

  // --- App State ---
  const App = {
    videos: [],
    currentIndex: -1,
    viewMode: 'list',
    thumbCache: {},
    coverArtCache: {},
    selectedVideos: new Set(),
    isDeleting: false,
    isMoving: false
  };

  // --- Element Cache ---
  const El = {
    // Media Players
    videoEl: document.getElementById('video'),
    audioEl: document.getElementById('audio'),
    imageEl: document.getElementById('image'),
    placeholderEl: document.getElementById('placeholder'),

    // Sidebar
    playlistEl: document.getElementById('playlist'),
    thumbsEl: document.getElementById('thumbs'),

    // Controls
    playBtn: document.getElementById('play-btn'),
    prevBtn: document.getElementById('btn-prev'),
    nextBtn: document.getElementById('btn-next'),
    timeEl: document.getElementById('time'),
    progressEl: document.getElementById('progress'),
    speedSelect: document.getElementById('speed'),
    volumeSlider: document.getElementById('volume'),

    // Metadata / Status
    metaEl: document.getElementById('meta'),

    // Audio Panels
    metadataPanel: document.getElementById('metadata-panel'),
    converterPanel: document.getElementById('converter-panel'),

    // Metadata Inputs
    metaTitleInput: document.getElementById('meta-title'),
    metaArtistInput: document.getElementById('meta-artist'),
    metaAlbumInput: document.getElementById('meta-album'),
    metaGenreInput: document.getElementById('meta-genre'),
    metaTrackInput: document.getElementById('meta-track'),
    metaCommentInput: document.getElementById('meta-comment'),

    // Cover Art UI
    coverArtInput: document.getElementById('cover-art-input'),
    btnChooseCover: document.getElementById('btn-choose-cover'),
    coverFilename: document.getElementById('cover-filename'),
    coverPreview: document.getElementById('cover-preview'),
    coverPreviewImg: document.getElementById('cover-preview-img'),
    coverPreviewNone: document.getElementById('cover-preview-none'),
    coverReplacementBox: document.getElementById('cover-replacement-box'),
    coverReplacementImg: document.getElementById('cover-replacement-img'),
    coverReplacementPrompt: document.getElementById('cover-replacement-prompt'),

    btnSaveMeta: document.getElementById('btn-save-meta'),
    btnAiSuggest: document.getElementById('btn-ai-suggest'),
    btnTitleFromFilename: document.getElementById('btn-title-from-filename'),
    // Batch Editor UI
    batchEditorPanel: document.getElementById('batch-editor-panel'),
    batchArtistInput: document.getElementById('batch-artist'),
    batchAlbumInput: document.getElementById('batch-album'),
    batchGenreInput: document.getElementById('batch-genre'),
    batchGetTitleCheckbox: document.getElementById('batch-get-title'),
    batchAutoNumberCheckbox: document.getElementById('batch-auto-number'),
    btnApplyBatch: document.getElementById('btn-apply-batch'),
    btnConvertSelected: document.getElementById('btn-convert-selected'),
    btnAiRename: document.getElementById('btn-ai-rename'),


    // Converter UI
    vbrQualitySelect: document.getElementById('vbr-quality'),
    btnConvertWav: document.getElementById('btn-convert-wav'),
    convertStatus: document.getElementById('convert-status'),

    // Main Container (for drag/drop)
    videoContainer: document.getElementById('video-container'),

    // Sidebar
    sidebar: document.getElementById('left'),
    resizer: document.getElementById('resize-handle')
  };


  // --- MODULES ---

  const SharedLogic = {
    // File type detection
    imageExts: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'],
    videoExts: ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.mpg', '.mpeg', '.m4v'],
    audioExts: ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma', '.opus', '.aiff'],

    isImage: (filepath) => SharedLogic.imageExts.some(ext => filepath.toLowerCase().endsWith(ext)),
    isVideo: (filepath) => SharedLogic.videoExts.some(ext => filepath.toLowerCase().endsWith(ext)),
    isAudio: (filepath) => SharedLogic.audioExts.some(ext => filepath.toLowerCase().endsWith(ext)),

    loadFiles: (files, name) => {
      App.videos = files;
      App.selectedVideos.clear();
      App.coverArtCache = {};
      App.thumbCache = {};
      SharedLogic.refreshViews();
      if (App.videos.length) SharedLogic.loadVideo(0);
      El.metaEl.textContent = `Loaded ${name}`;
    },

    loadVideo: (idx) => {
      if (idx < 0 || idx >= App.videos.length) return;
      App.currentIndex = idx;
      const filepath = App.videos[idx];
      const fileUrl = `file://${filepath}`;

      VideoPlayer.stop();
      AudioPlayer.stop();
      El.imageEl.style.display = 'none';
      El.placeholderEl.style.display = 'block';

      El.metadataPanel.style.display = 'none';
      El.converterPanel.style.display = 'none';

      if (SharedLogic.isImage(filepath)) {
        El.imageEl.src = fileUrl;
        El.imageEl.style.display = 'block';
        El.placeholderEl.style.display = 'none';
        El.timeEl.textContent = 'Image';
        El.playBtn.textContent = '▶ Play';
      } else if (SharedLogic.isVideo(filepath)) {
        VideoPlayer.play(fileUrl);
        El.placeholderEl.style.display = 'none';
      } else if (SharedLogic.isAudio(filepath)) {
        AudioPlayer.play(fileUrl);
        AudioPlayer.loadMetadataFields(filepath);
        // Placeholder will be visible until cover art loads
        El.placeholderEl.style.display = 'block';
      }

      SharedLogic.updateSelection();
    },

    refreshViews: () => {
      El.playlistEl.innerHTML = '';
      El.thumbsEl.innerHTML = '';
      App.videos.forEach((v, i) => {
        const basename = v.substring(v.lastIndexOf(v.includes('/') ? '/' : '\\') + 1);
        // List view
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = App.selectedVideos.has(v);
        checkbox.onclick = (e) => { e.stopPropagation(); SharedLogic.toggleSelection(v); };
        li.appendChild(checkbox);
        const textNode = document.createTextNode(basename);
        li.appendChild(textNode);
        li.onclick = (e) => { if (e.target !== checkbox) SharedLogic.loadVideo(i); };
        if (App.selectedVideos.has(v)) li.classList.add('checked');
        El.playlistEl.appendChild(li);

        // Thumb view
        const div = document.createElement('div');
        div.className = 'thumb';
        if (App.selectedVideos.has(v)) div.classList.add('checked');
        const thumbCheckbox = document.createElement('input');
        thumbCheckbox.type = 'checkbox';
        thumbCheckbox.checked = App.selectedVideos.has(v);
        thumbCheckbox.onclick = (e) => { e.stopPropagation(); SharedLogic.toggleSelection(v); };
        div.appendChild(thumbCheckbox);
        const img = document.createElement('img');
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        div.appendChild(img);
        const label = document.createElement('div');
        label.textContent = basename;
        div.appendChild(label);
        div.onclick = (e) => { if (e.target !== thumbCheckbox) SharedLogic.loadVideo(i); };
        El.thumbsEl.appendChild(div);

        SharedLogic.generateThumbnail(v).then(thumbSrc => { if (img) img.src = thumbSrc; });
      });
      SharedLogic.toggleView(App.viewMode);
      SharedLogic.updateSelectionCount();
    },

    generateThumbnail: async (filePath) => {
      if (App.thumbCache[filePath]) return App.thumbCache[filePath];
      if (App.coverArtCache[filePath]) {
        App.thumbCache[filePath] = App.coverArtCache[filePath];
        return App.coverArtCache[filePath];
      }
      if (filePath.toLowerCase().endsWith('.mp3')) {
        try {
          const metadata = await window.electronAPI.readMetadata(filePath);
          if (metadata && metadata.coverArt) {
            App.coverArtCache[filePath] = metadata.coverArt;
            App.thumbCache[filePath] = metadata.coverArt;
            return metadata.coverArt;
          }
        } catch (e) { console.error('Thumb metadata read error:', e); }
      }
      const thumbSrc = await window.electronAPI.getThumbnail(filePath);
      App.thumbCache[filePath] = thumbSrc;
      return thumbSrc;
    },

    updateSelection: () => {
      [...El.playlistEl.children].forEach((li, i) => li.classList.toggle('selected', i === App.currentIndex));
      [...El.thumbsEl.children].forEach((div, i) => div.classList.toggle('selected', i === App.currentIndex));
    },

    toggleSelection: (videoPath) => {
      if (App.selectedVideos.has(videoPath)) {
        App.selectedVideos.delete(videoPath);
      } else {
        App.selectedVideos.add(videoPath);
      }
      SharedLogic.refreshViews();
    },

    selectAll: () => {
      App.selectedVideos.clear();
      App.videos.forEach(v => App.selectedVideos.add(v));
      SharedLogic.refreshViews();
    },

    selectNone: () => {
      App.selectedVideos.clear();
      SharedLogic.refreshViews();
    },

    updateSelectionCount: () => {
      const count = App.selectedVideos.size;
      document.getElementById('selection-count').textContent = `${count} selected`;

      // ★★★ FIX BUG #4: Show/Hide Batch Editor Panel ★★★
      if (count > 0) {
        El.batchEditorPanel.style.display = 'block';
      } else {
        El.batchEditorPanel.style.display = 'none';
      }
    },

    toggleView: (mode) => {
      App.viewMode = mode;
      document.getElementById('btn-view-list').classList.toggle('active', mode === 'list');
      document.getElementById('btn-view-thumbs').classList.toggle('active', mode === 'thumbs');
      El.playlistEl.style.display = mode === 'list' ? 'block' : 'none';
      El.thumbsEl.style.display = mode === 'thumbs' ? 'flex' : 'none';
    },

    deleteVideo: async () => {
      if (App.isDeleting) return;
      const videosToDelete = App.selectedVideos.size > 0
        ? Array.from(App.selectedVideos)
        : (App.currentIndex >= 0 ? [App.videos[App.currentIndex]] : []);
      if (videosToDelete.length === 0) return;
      if (videosToDelete.length > 1) {
        if (!confirm(`Delete ${videosToDelete.length} selected media files?`)) return;
      }
      App.isDeleting = true;
      const currentFile = App.currentIndex >= 0 ? App.videos[App.currentIndex] : null;
      if (currentFile && videosToDelete.includes(currentFile)) {
        VideoPlayer.stop();
        AudioPlayer.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      let successCount = 0, errorCount = 0;
      for (const p of videosToDelete) {
        const result = await window.electronAPI.trashFile(p);
        if (result.error) { errorCount++; }
        else {
          successCount++;
          const idx = App.videos.indexOf(p);
          if (idx !== -1) {
            App.videos.splice(idx, 1);
            if (idx < App.currentIndex) App.currentIndex--;
          }
          App.selectedVideos.delete(p);
          delete App.coverArtCache[p];
          delete App.thumbCache[p];
        }
      }
      SharedLogic.refreshViews();
      if (App.videos.length > 0) {
        if (App.currentIndex >= App.videos.length) App.currentIndex = App.videos.length - 1;
        if (App.currentIndex < 0) App.currentIndex = 0;
        SharedLogic.loadVideo(App.currentIndex);
      } else { SharedLogic.clearAll(); }
      El.metaEl.textContent = `Deleted ${successCount}, ${errorCount} failed`;
      App.isDeleting = false;
    },

    moveVideo: async () => {
      if (App.isMoving) return;
      const videosToMove = App.selectedVideos.size > 0
        ? Array.from(App.selectedVideos)
        : (App.currentIndex >= 0 ? [App.videos[App.currentIndex]] : []);
      if (videosToMove.length === 0) return;
      const destFolder = await window.electronAPI.chooseMoveDestination();
      if (!destFolder) return;
      if (videosToMove.length > 1) {
        if (!confirm(`Move ${videosToMove.length} files to ${destFolder}?`)) return;
      }
      App.isMoving = true;
      const currentFile = App.currentIndex >= 0 ? App.videos[App.currentIndex] : null;
      if (currentFile && videosToMove.includes(currentFile)) {
        VideoPlayer.stop();
        AudioPlayer.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      let successCount = 0, errorCount = 0;
      for (const p of videosToMove) {
        const result = await window.electronAPI.moveFile(p, destFolder);
        if (result.error) { errorCount++; }
        else {
          successCount++;
          const idx = App.videos.indexOf(p);
          if (idx !== -1) {
            App.videos.splice(idx, 1);
            if (idx < App.currentIndex) App.currentIndex--;
          }
          App.selectedVideos.delete(p);
          delete App.coverArtCache[p];
          delete App.thumbCache[p];
        }
      }
      SharedLogic.refreshViews();
      if (App.videos.length > 0) {
        if (App.currentIndex >= App.videos.length) App.currentIndex = App.videos.length - 1;
        if (App.currentIndex < 0) App.currentIndex = 0;
        SharedLogic.loadVideo(App.currentIndex);
      } else { SharedLogic.clearAll(); }
      El.metaEl.textContent = `Moved ${successCount}, ${errorCount} failed`;
      App.isMoving = false;
    },

    clearAll: () => {
      App.videos = [];
      App.selectedVideos.clear();
      App.currentIndex = -1;
      VideoPlayer.stop();
      AudioPlayer.stop();
      SharedLogic.refreshViews();
      El.metaEl.textContent = 'No media loaded';
      El.timeEl.textContent = '00:00 / 00:00';
      El.progressEl.value = 0;
    },

    formatTime: (sec) => {
      if (isNaN(sec)) return '00:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  };

  const VideoPlayer = {
    play: (fileUrl) => {
      El.videoEl.src = fileUrl;
      El.videoEl.style.display = 'block';
      El.videoEl.play();
    },
    stop: () => {
      El.videoEl.pause();
      El.videoEl.src = '';
      El.videoEl.style.display = 'none';
    },
    togglePlay: () => {
      if (El.videoEl.style.display === 'none') return;
      if (El.videoEl.paused) El.videoEl.play();
      else El.videoEl.pause();
    },
    seek: () => {
      if (isNaN(El.videoEl.duration)) return;
      const pos = El.progressEl.value / 1000;
      El.videoEl.currentTime = pos * El.videoEl.duration;
    },
    updateProgress: () => {
      if (isNaN(El.videoEl.duration) || El.videoEl.style.display === 'none') return;
      const pos = (El.videoEl.currentTime / El.videoEl.duration) * 1000;
      El.progressEl.value = pos;
      El.timeEl.textContent = `${SharedLogic.formatTime(El.videoEl.currentTime)} / ${SharedLogic.formatTime(El.videoEl.duration)}`;
    },
    changeSpeed: () => {
      El.videoEl.playbackRate = parseFloat(El.speedSelect.value.replace('x', ''));
    },
    fetchMetadata: async () => {
      if (App.currentIndex < 0 || El.videoEl.style.display === 'none') return;
      const p = App.videos[App.currentIndex];
      const metaText = await window.electronAPI.getMetadata(p);
      El.metaEl.textContent = metaText;
    }
  };

  const AudioPlayer = {
    selectedCoverArt: null,

    play: (fileUrl) => {
      El.audioEl.src = fileUrl;
      El.audioEl.style.display = 'block';
      El.audioEl.play();
    },
    stop: () => {
      El.audioEl.pause();
      El.audioEl.src = '';
      El.audioEl.style.display = 'none';
    },
    togglePlay: () => {
      if (El.audioEl.style.display === 'none') return;
      if (El.audioEl.paused) El.audioEl.play();
      else El.audioEl.pause();
    },
    seek: () => {
      if (isNaN(El.audioEl.duration)) return;
      const pos = El.progressEl.value / 1000;
      El.audioEl.currentTime = pos * El.audioEl.duration;
    },
    updateProgress: () => {
      if (isNaN(El.audioEl.duration) || El.audioEl.style.display === 'none') return;
      const pos = (El.audioEl.currentTime / El.audioEl.duration) * 1000;
      El.progressEl.value = pos;
      El.timeEl.textContent = `${SharedLogic.formatTime(El.audioEl.currentTime)} / ${SharedLogic.formatTime(El.audioEl.duration)}`;
    },
    changeSpeed: () => {
      El.audioEl.playbackRate = parseFloat(El.speedSelect.value.replace('x', ''));
    },
    fetchMetadata: async () => {
      if (App.currentIndex < 0 || El.audioEl.style.display === 'none') return;
      const p = App.videos[App.currentIndex];
      const metaText = await window.electronAPI.getMetadata(p);
      El.metaEl.textContent = metaText;
    },

    loadMetadataFields: async (filepath) => {
      // Reset UI
      El.coverPreviewImg.src = '';
      El.coverPreviewImg.style.display = 'none';
      El.coverPreviewNone.style.display = 'block';
      El.coverReplacementImg.src = '';
      El.coverReplacementImg.style.display = 'none';
      El.coverReplacementPrompt.style.display = 'block';
      El.coverFilename.textContent = '';
      AudioPlayer.selectedCoverArt = null;

      El.metadataPanel.style.display = 'block';
      if (filepath.toLowerCase().endsWith('.wav')) {
        El.converterPanel.style.display = 'block';
      }

      try {
        const metadata = await window.electronAPI.readMetadata(filepath);
        if (metadata.error) { throw new Error(metadata.error); }

        El.metaTitleInput.value = metadata.title || '';
        El.metaArtistInput.value = metadata.artist || '';
        El.metaAlbumInput.value = metadata.album || '';
        El.metaGenreInput.value = metadata.genre || '';
        El.metaCommentInput.value = metadata.comment || '';
        El.metaTrackInput.value = metadata.trackNumber || '';

        if (metadata.coverArt) {
          App.coverArtCache[filepath] = metadata.coverArt;
          El.coverPreviewImg.src = metadata.coverArt;
          El.coverPreviewImg.style.display = 'block';
          El.coverPreviewNone.style.display = 'none';

          // ★★★ FIX: Removed lines that put art in main player ★★★
          // El.imageEl.src = metadata.coverArt;
          // El.imageEl.style.display = 'block';
          // El.placeholderEl.style.display = 'none';
        }
      } catch (e) { console.error('Error loading metadata:', e); }
    },

    titleFromFilename: () => {
      if (App.currentIndex < 0) return;
      const filepath = App.videos[App.currentIndex];

      // Extract filename from path
      const filename = filepath.substring(filepath.lastIndexOf(filepath.includes('/') ? '/' : '\\') + 1);

      // Parse filename: "01. My Song.mp3" -> "My Song"
      let title = filename.replace(/\.[^.]+$/, ''); // Remove extension
      title = title.replace(/^\d+[\.\-\s]+/, ''); // Remove leading numbers
      title = title.trim();

      // Set the title field
      El.metaTitleInput.value = title;
      El.metaEl.textContent = `📄 Title extracted from filename: "${title}"`;
    },

    saveMetadata: async () => {
      if (App.currentIndex < 0) return;
      const filepath = App.videos[App.currentIndex];

      const metadata = {
        title: El.metaTitleInput.value,
        artist: El.metaArtistInput.value,
        album: El.metaAlbumInput.value,
        genre: El.metaGenreInput.value,
        comment: El.metaCommentInput.value,
        trackNumber: El.metaTrackInput.value,
        coverArt: AudioPlayer.selectedCoverArt
      };

      const result = await window.electronAPI.writeMetadata(filepath, metadata);
      if (result.success) {
        El.metaEl.textContent = '💾 Metadata saved! Reloading to verify...';

        const verifyMetadata = await window.electronAPI.readMetadata(filepath);
        if (verifyMetadata && !verifyMetadata.error) {
          // Repopulate
          El.metaTitleInput.value = verifyMetadata.title || '';
          El.metaArtistInput.value = verifyMetadata.artist || '';
          El.metaAlbumInput.value = verifyMetadata.album || '';
          El.metaGenreInput.value = verifyMetadata.genre || '';
          El.metaCommentInput.value = verifyMetadata.comment || '';
          El.metaTrackInput.value = verifyMetadata.trackNumber || '';

          // Reset replacement
          El.coverReplacementImg.src = '';
          El.coverReplacementImg.style.display = 'none';
          El.coverReplacementPrompt.style.display = 'block';
          El.coverFilename.textContent = '';
          AudioPlayer.selectedCoverArt = null;

          // Update existing
          if (verifyMetadata.coverArt) {
            App.coverArtCache[filepath] = verifyMetadata.coverArt;
            El.coverPreviewImg.src = verifyMetadata.coverArt;
            El.coverPreviewImg.style.display = 'block';
            El.coverPreviewNone.style.display = 'none';
            // ★★★ FIX: Removed lines that put art in main player ★★★
            // El.imageEl.src = verifyMetadata.coverArt;
            // El.imageEl.style.display = 'block';
            // El.placeholderEl.style.display = 'none';
          } else {
            El.coverPreviewImg.src = '';
            El.coverPreviewImg.style.display = 'none';
            El.coverPreviewNone.style.display = 'block';
            El.imageEl.src = '';
            El.imageEl.style.display = 'none';
            El.placeholderEl.style.display = 'block';
          }
          El.metaEl.textContent = '✅ Metadata saved and verified!';
          SharedLogic.refreshViews();
        }
      } else {
        El.metaEl.textContent = `Error saving: ${result.error}`;
      }
    },

    convertWavToMp3: async () => {
      if (App.currentIndex < 0) return;
      const filepath = App.videos[App.currentIndex];
      if (!filepath.toLowerCase().endsWith('.wav')) return;

      const quality = parseInt(El.vbrQualitySelect.value);
      El.convertStatus.textContent = `Converting...`;
      El.btnConvertWav.disabled = true;

      const result = await window.electronAPI.convertWavToMp3(filepath, quality);
      if (result.success) {
        El.convertStatus.textContent = `✅ Converted! (${result.sizeMb} MB)`;
        App.videos[App.currentIndex] = result.mp3Path;
        SharedLogic.loadVideo(App.currentIndex);
        SharedLogic.refreshViews();
      } else {
        El.convertStatus.textContent = `Error: ${result.error}`;
      }
      El.btnConvertWav.disabled = false;
    },

    handleReplacementCoverFile: (file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        AudioPlayer.selectedCoverArt = event.target.result;
        El.coverReplacementImg.src = AudioPlayer.selectedCoverArt;
        El.coverReplacementImg.style.display = 'block';
        El.coverReplacementPrompt.style.display = 'none';
        El.coverFilename.textContent = `New: ${file.name}`;
      };
      reader.readAsDataURL(file);
    }
  };


  // --- BATCH PROCESSING LOGIC ---
  const BatchLogic = {
    convertSelectedToMp3: async () => {
      if (App.selectedVideos.size === 0) {
        alert('No files selected!');
        return;
      }

      const selectedArray = Array.from(App.selectedVideos);
      const wavFiles = selectedArray.filter(f => f.toLowerCase().endsWith('.wav'));

      if (wavFiles.length === 0) {
        alert('No .wav files selected!');
        return;
      }

      El.btnConvertSelected.disabled = true;
      El.btnConvertSelected.textContent = `⚡ Converting 0/${wavFiles.length}...`;

      for (let i = 0; i < wavFiles.length; i++) {
        const filepath = wavFiles[i];
        const quality = parseInt(El.vbrQualitySelect.value);

        El.btnConvertSelected.textContent = `⚡ Converting ${i + 1}/${wavFiles.length}...`;
        El.metaEl.textContent = `Converting: ${path.basename(filepath)}`;

        const result = await window.electronAPI.convertWavToMp3(filepath, quality);
        if (result.success) {
          // Update the videos array
          const index = App.videos.indexOf(filepath);
          if (index !== -1) {
            App.videos[index] = result.mp3Path;
          }
          // Update selected set
          App.selectedVideos.delete(filepath);
          App.selectedVideos.add(result.mp3Path);
        } else {
          console.error(`Failed to convert ${filepath}:`, result.error);
        }
      }

      SharedLogic.refreshViews();
      El.btnConvertSelected.textContent = '⚡ Convert Selected to MP3';
      El.btnConvertSelected.disabled = false;
      El.metaEl.textContent = `✅ Converted ${wavFiles.length} files to MP3!`;
    },

    applyBatchMetadata: async () => {
      if (App.selectedVideos.size === 0) {
        alert('No files selected!');
        return;
      }

      const selectedArray = Array.from(App.selectedVideos);
      const audioFiles = selectedArray.filter(f =>
        SharedLogic.audioExts.some(ext => f.toLowerCase().endsWith(ext))
      );

      if (audioFiles.length === 0) {
        alert('No audio files selected!');
        return;
      }

      const batchArtist = El.batchArtistInput.value;
      const batchAlbum = El.batchAlbumInput.value;
      const batchGenre = El.batchGenreInput.value;
      const getTitle = El.batchGetTitleCheckbox.checked;
      const autoNumber = El.batchAutoNumberCheckbox.checked;

      El.btnApplyBatch.disabled = true;
      El.btnApplyBatch.textContent = `📋 Processing 0/${audioFiles.length}...`;

      for (let i = 0; i < audioFiles.length; i++) {
        const filepath = audioFiles[i];
        const filename = filepath.substring(filepath.lastIndexOf(filepath.includes('/') ? '/' : '\\') + 1);

        El.btnApplyBatch.textContent = `📋 Processing ${i + 1}/${audioFiles.length}...`;
        El.metaEl.textContent = `Processing: ${filename}`;

        // Read existing metadata
        const existing = await window.electronAPI.readMetadata(filepath);

        // Build new metadata
        const metadata = {
          title: existing.title || '',
          artist: batchArtist || existing.artist || '',
          album: batchAlbum || existing.album || '',
          genre: batchGenre || existing.genre || '',
          comment: existing.comment || '',
          trackNumber: existing.trackNumber || ''
        };

        // Get title from filename if checked
        if (getTitle) {
          // Parse filename: "01. My Song.mp3" -> "My Song"
          let title = filename.replace(/\.[^.]+$/, ''); // Remove extension
          title = title.replace(/^\d+[\.\-\s]+/, ''); // Remove leading numbers
          title = title.trim();
          metadata.title = title;
        }

        // Auto-number tracks if checked
        if (autoNumber) {
          metadata.trackNumber = String(i + 1);
        }

        // Write metadata
        await window.electronAPI.writeMetadata(filepath, metadata);
      }

      SharedLogic.refreshViews();
      El.btnApplyBatch.textContent = '📋 Apply to Selected';
      El.btnApplyBatch.disabled = false;
      El.metaEl.textContent = `✅ Applied metadata to ${audioFiles.length} files!`;
    },

    aiBatchRename: async () => {
      if (App.selectedVideos.size === 0) {
        alert('No files selected!');
        return;
      }

      // Check if Ollama is running
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) throw new Error('Ollama not responding');
      } catch (e) {
        alert('Ollama is not running! Please start Ollama first.');
        return;
      }

      const selectedArray = Array.from(App.selectedVideos);
      // Find files with (1), (2), etc. in the name
      const duplicateFiles = selectedArray.filter(f => {
        const filename = f.substring(f.lastIndexOf(f.includes('/') ? '/' : '\\') + 1);
        return /\(\d+\)/.test(filename);
      });

      if (duplicateFiles.length === 0) {
        alert('No duplicate files found (files with (1), (2), etc. in their names)');
        return;
      }

      if (!confirm(`Found ${duplicateFiles.length} duplicate files. Rename them with AI?`)) {
        return;
      }

      El.btnAiRename.disabled = true;
      El.btnAiRename.textContent = `🤖 Renaming 0/${duplicateFiles.length}...`;

      for (let i = 0; i < duplicateFiles.length; i++) {
        const filepath = duplicateFiles[i];
        const filename = filepath.substring(filepath.lastIndexOf(filepath.includes('/') ? '/' : '\\') + 1);

        El.btnAiRename.textContent = `🤖 Renaming ${i + 1}/${duplicateFiles.length}...`;
        El.metaEl.textContent = `AI renaming: ${filename}`;

        const result = await window.electronAPI.aiRenameFile(filepath, filename);
        if (result.success) {
          // Update the videos array
          const index = App.videos.indexOf(filepath);
          if (index !== -1) {
            App.videos[index] = result.newPath;
          }
          // Update selected set
          App.selectedVideos.delete(filepath);
          App.selectedVideos.add(result.newPath);

          console.log(`Renamed: ${filename} -> ${result.newName}`);
        } else {
          console.error(`Failed to rename ${filename}:`, result.error);
        }
      }

      SharedLogic.refreshViews();
      El.btnAiRename.textContent = '🤖 AI Rename Duplicates';
      El.btnAiRename.disabled = false;
      El.metaEl.textContent = `✅ Renamed ${duplicateFiles.length} files!`;
    }
  };

  const AILogic = {
    aiSuggestMetadata: async () => {
      if (App.currentIndex < 0) return;
      const filepath = App.videos[App.currentIndex];
      // ★★★ FIX BUG #1: Changed 'v' to 'filepath' ★★★
      const basename = filepath.substring(filepath.lastIndexOf(filepath.includes('/') ? '/' : '\\') + 1);

      try {
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json();
        const models = data.models.map(m => m.name);
        if (!models || models.length === 0) {
          alert('Ollama is not running!');
          return;
        }

        const btn = document.getElementById('btn-ai-suggest');
        btn.disabled = true;
        btn.textContent = '🤖 Thinking...';

        const currentMeta = await window.electronAPI.readMetadata(filepath);
        const prompt = `You are helping organize MP3 files. Generate better metadata.
Current info:
- Filename: ${basename}
- Title: ${currentMeta.title || 'none'}
- Artist: ${currentMeta.artist || 'none'}
- Album: ${currentMeta.album || 'none'}
- Genre: ${currentMeta.genre || 'none'}

Provide improved metadata. If the filename has useful info, extract it.
For the Comment field, write a poetic, unique, thought-provoking 1-2 sentence description about the song's mood, theme, or emotional journey based on the Title, Artist, and Album.

Format your response EXACTLY like this:
Title: <clean title>
Artist: <artist name>
Album: <album name>
Genre: <genre>
Comment: <poetic 1-2 sentence description>`; const aiResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: models[0], prompt: prompt, stream: true
          })
        });

        const reader = aiResponse.body.getReader();
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                fullText += data.response || '';
              } catch { }
            }
          }
        }

        const titleMatch = fullText.match(/Title:\s*(.+)/);
        const artistMatch = fullText.match(/Artist:\s*(.+)/);
        const albumMatch = fullText.match(/Album:\s*(.+)/);
        const genreMatch = fullText.match(/Genre:\s*(.+)/);
        const commentMatch = fullText.match(/Comment:\s*(.+?)(?=\n|$)/s);

        if (titleMatch) El.metaTitleInput.value = titleMatch[1].trim();
        if (artistMatch) El.metaArtistInput.value = artistMatch[1].trim();
        if (albumMatch) El.metaAlbumInput.value = albumMatch[1].trim();
        if (genreMatch) El.metaGenreInput.value = genreMatch[1].trim();
        if (commentMatch) El.metaCommentInput.value = commentMatch[1].trim();

        btn.textContent = '🤖 AI Suggest';
        btn.disabled = false;

      } catch (e) {
        alert(`AI suggestion failed: ${e.message}`);
        const btn = document.getElementById('btn-ai-suggest');
        btn.textContent = '🤖 AI Suggest';
        btn.disabled = false;
      }
    }
  };


  // --- INITIAL WIRING ---

  // --- Top Buttons ---
  document.getElementById('btn-open-folder').addEventListener('click', async () => {
    const folder = await window.electronAPI.chooseFolder();
    if (!folder) return;
    const files = await window.electronAPI.loadFolder(folder);
    if (files.error) { El.metaEl.textContent = `Error: ${files.error}`; }
    else { SharedLogic.loadFiles(files, folder); }
  });
  document.getElementById('btn-open-files').addEventListener('click', async () => {
    const files = await window.electronAPI.chooseFiles();
    if (files && files.length > 0) { SharedLogic.loadFiles(files, `${files.length} files`); }
  });
  document.getElementById('btn-view-list').addEventListener('click', () => SharedLogic.toggleView('list'));
  document.getElementById('btn-view-thumbs').addEventListener('click', () => SharedLogic.toggleView('thumbs'));
  document.getElementById('btn-select-all').addEventListener('click', SharedLogic.selectAll);
  document.getElementById('btn-select-none').addEventListener('click', SharedLogic.selectNone);

  // --- Player Controls ---
  El.playBtn.addEventListener('click', () => {
    if (El.videoEl.style.display === 'block') VideoPlayer.togglePlay();
    else if (El.audioEl.style.display === 'block') AudioPlayer.togglePlay();
  });
  El.prevBtn.addEventListener('click', () => SharedLogic.loadVideo(App.currentIndex - 1));
  El.nextBtn.addEventListener('click', () => SharedLogic.loadVideo(App.currentIndex + 1));

  // --- ★★★ FIX: Added Play/Pause button text toggle ★★★ ---
  El.videoEl.addEventListener('play', () => { El.playBtn.textContent = '⏸ Pause'; });
  El.videoEl.addEventListener('pause', () => { El.playBtn.textContent = '▶ Play'; });
  El.audioEl.addEventListener('play', () => { El.playBtn.textContent = '⏸ Pause'; });
  El.audioEl.addEventListener('pause', () => { El.playBtn.textContent = '▶ Play'; });

  // --- Progress/Time ---
  El.progressEl.addEventListener('input', () => {
    if (El.videoEl.style.display === 'block') VideoPlayer.seek();
    else if (El.audioEl.style.display === 'block') AudioPlayer.seek();
  });
  El.videoEl.addEventListener('timeupdate', VideoPlayer.updateProgress);
  El.audioEl.addEventListener('timeupdate', AudioPlayer.updateProgress);
  El.videoEl.addEventListener('loadedmetadata', VideoPlayer.fetchMetadata);
  El.audioEl.addEventListener('loadedmetadata', AudioPlayer.fetchMetadata);

  // --- Speed/Volume ---
  El.speedSelect.addEventListener('change', () => {
    VideoPlayer.changeSpeed();
    AudioPlayer.changeSpeed();
  });
  El.volumeSlider.addEventListener('input', () => {
    El.videoEl.volume = El.volumeSlider.value / 100;
    El.audioEl.volume = El.volumeSlider.value / 100;
  });

  // --- File Ops ---
  document.getElementById('btn-move').addEventListener('click', SharedLogic.moveVideo);
  document.getElementById('btn-trash').addEventListener('click', SharedLogic.deleteVideo);

  // --- Audio Panel Wiring ---
  El.btnChooseCover.addEventListener('click', () => El.coverArtInput.click());
  El.coverArtInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) AudioPlayer.handleReplacementCoverFile(file);
  });
  El.coverReplacementBox.addEventListener('dragover', (e) => {
    e.preventDefault(); e.stopPropagation();
    El.coverReplacementBox.style.borderColor = '#00d4ff';
  });
  El.coverReplacementBox.addEventListener('dragleave', (e) => {
    e.preventDefault(); e.stopPropagation();
    El.coverReplacementBox.style.borderColor = 'rgba(255,255,255,0.4)';
  });
  El.coverReplacementBox.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    El.coverReplacementBox.style.borderColor = 'rgba(255,255,255,0.4)';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      AudioPlayer.handleReplacementCoverFile(file);
    }
  });
  El.btnSaveMeta.addEventListener('click', AudioPlayer.saveMetadata);
  El.btnAiSuggest.addEventListener('click', AILogic.aiSuggestMetadata);
  El.btnTitleFromFilename.addEventListener('click', AudioPlayer.titleFromFilename);
  El.btnConvertWav.addEventListener('click', AudioPlayer.convertWavToMp3);

  // --- Drag/Drop (Main Player) ---
  let dragCounter = 0;
  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    El.videoContainer.style.borderColor = 'rgba(0, 212, 255, 0.8)';
  });
  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      El.videoContainer.style.borderColor = 'rgba(0, 200, 255, 0.2)';
    }
  });
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    El.videoContainer.style.borderColor = 'rgba(0, 200, 255, 0.2)';

    const filesArray = Array.from(e.dataTransfer.files);
    if (filesArray.length === 0) return;

    const paths = filesArray.map(file => window.electronAPI.getPathFromFile(file)).filter(p => p);

    if (paths.length === 0) {
      El.metaEl.textContent = 'Error: Could not get file paths from drop.';
      return;
    }

    const result = await window.electronAPI.handleDroppedPaths(paths);

    if (result.error) {
      El.metaEl.textContent = `Error: ${result.error}`;
    } else {
      SharedLogic.loadFiles(result.videos, result.name);
    }
  });

  // --- Sidebar Resize ---
  let isResizing = false;
  El.resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    El.resizer.classList.add('resizing');
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= (window.innerWidth * 0.6)) {
      El.sidebar.style.width = `${newWidth}px`;
    }
  });
  document.addEventListener('mouseup', () => {
    isResizing = false;
    El.resizer.classList.remove('resizing');
  });

  // --- Keyboard Shortcuts ---
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === ' ') {
      e.preventDefault();
      if (El.videoEl.style.display === 'block') VideoPlayer.togglePlay();
      else if (El.audioEl.style.display === 'block') AudioPlayer.togglePlay();
    }
    if (e.key === 'ArrowLeft') SharedLogic.loadVideo(App.currentIndex - 1);
    if (e.key === 'ArrowRight') SharedLogic.loadVideo(App.currentIndex + 1);
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      SharedLogic.deleteVideo();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      document.getElementById('btn-open-folder').click();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      SharedLogic.selectAll();
    }
  });

  // --- Initial Load ---
  SharedLogic.toggleView('list');

  // --- ★★★ FIX BUG #2: Moved Batch Editor Buttons INSIDE DOMContentLoaded ★★★
  El.btnApplyBatch.addEventListener('click', BatchLogic.applyBatchMetadata);
  El.btnConvertSelected.addEventListener('click', BatchLogic.convertSelectedToMp3);
  El.btnAiRename.addEventListener('click', BatchLogic.aiBatchRename);

}); // ★★★ END of DOMContentLoaded wrapper ★★★