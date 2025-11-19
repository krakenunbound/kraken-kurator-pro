# 🦑 Kraken Kurator Pro - New Features Guide

## 📋 Overview

This update transforms Kraken Kurator into a true "Super App" with powerful batch processing, AI-enhanced metadata editing, and streamlined workflows for managing large media collections.

---

## ✨ What's New

### 1. ✅ Track Number Field (COMPLETED)
**Location:** Metadata Editor panel

- Added a dedicated "Track" field to the metadata editor
- Reads and writes track numbers from/to MP3 files
- Fully integrated with the save/load metadata system
- Supports both manual entry and batch auto-numbering

---

### 2. ⚡ Batch Editor Panel (NEW!)
**Location:** Appears above metadata panel when 2+ audio files are selected

The Batch Editor allows you to apply metadata changes to multiple files at once.

#### Fields:
- **Artist:** Apply the same artist to all selected files
- **Album:** Apply the same album to all selected files  
- **Genre:** Apply the same genre to all selected files

#### Options:
- **Get Title from Filename:** Automatically extracts song title from filenames
  - Example: `01. My Song.mp3` → Title: "My Song"
  - Removes leading numbers and file extensions
  
- **Auto-number Tracks:** Automatically numbers tracks sequentially starting from 1
  - Perfect for creating album track lists
  - Numbers files in the order they appear in the list

#### Buttons:
- **📋 Apply to Selected:** Applies all batch settings to selected audio files
- **⚡ Convert Selected to MP3:** Batch converts all selected .WAV files to MP3
- **🤖 AI Rename Duplicates:** Uses AI to creatively rename duplicate files

---

### 3. 🤖 Enhanced AI Features

#### Poetic Comments
The AI Suggest feature now generates thoughtful, poetic comments based on the song's metadata:

**Old behavior:**
```
Comment: <generic 1-2 sentence description>
```

**New behavior:**
```
Comment: A haunting journey through moonlit forests, where ethereal vocals 
dance with atmospheric synths to create a dreamscape of melancholy beauty.
```

The AI analyzes the Title, Artist, and Album to write unique, mood-based descriptions that capture the song's emotional essence.

#### AI Rename Duplicates
**How it works:**
1. Select multiple files (use checkboxes or Ctrl+click)
2. Click "🤖 AI Rename Duplicates"
3. The AI finds files with duplicate markers like `(1)`, `(2)`, etc.
4. Each duplicate is renamed with a creative, poetic alternative

**Examples:**
- `Rose(1).mp3` → `By Any Other Name.mp3`
- `Sunset(2).mp3` → `Golden Hour Reverie.mp3`
- `Storm(1).wav` → `Thunder's Whisper.wav`

**Requirements:**
- Ollama must be running on `localhost:11434`
- Uses the `llama3.2:latest` model by default

---

### 4. 🔄 Batch MP3 Conversion

Select multiple .WAV files and convert them all to MP3 with one click!

**Features:**
- Maintains VBR quality settings (V0, V2, or V4)
- Shows real-time progress: "Converting 3/10..."
- Updates the file list automatically as each conversion completes
- Preserves the original .WAV files (creates new .MP3 files)

**Workflow:**
1. Select multiple .WAV files using checkboxes
2. Choose quality from the converter panel (V0/V2/V4)
3. Click "⚡ Convert Selected to MP3" in the Batch Editor
4. Watch as each file is converted with progress updates
5. All converted files remain selected for further batch operations

---

## 🎯 Workflows

### Workflow 1: Organize a New Album
1. Drag & drop all album files into Kraken Kurator
2. Select all files (Ctrl+A or "✓ All" button)
3. In Batch Editor:
   - Enter Artist name
   - Enter Album name
   - Enter Genre
   - Check "Auto-number Tracks"
   - Click "📋 Apply to Selected"
4. Done! All files now have consistent metadata with track numbers

### Workflow 2: Clean Up AI-Generated Music
1. Load your Suno AI exports
2. Select all files
3. Click "🤖 AI Suggest" to get poetic metadata for each song
4. Use Batch Editor to apply consistent Artist/Album info
5. Use "🤖 AI Rename Duplicates" to fix any duplicate filenames

### Workflow 3: Convert & Tag in One Session
1. Load .WAV files from a folder
2. Select all files
3. Click "⚡ Convert Selected to MP3"
4. Wait for conversion to complete
5. In Batch Editor:
   - Check "Get Title from Filename"
   - Fill in Artist, Album, Genre
   - Click "📋 Apply to Selected"
6. All files are now tagged MP3s ready for upload!

---

## 🔧 Technical Details

### File Structure Updates

#### `index.html`
- Added `#batch-editor-panel` section
- Includes batch metadata inputs
- Added batch operation buttons
- Responsive styling that matches existing UI

#### `renderer-main.js`
- Added `BatchLogic` module with 3 main functions:
  - `convertSelectedToMp3()`: Batch WAV→MP3 conversion
  - `applyBatchMetadata()`: Apply metadata to multiple files
  - `aiBatchRename()`: AI-powered duplicate renaming
- Updated `El` cache with all batch UI elements
- Enhanced `updateSelectionCount()` to show/hide batch panel
- Updated AI prompt for poetic comments

#### `main.js`
- Added `ai:renameFile` IPC handler
- Calls Ollama API with creative renaming prompt
- Handles file renaming with collision detection
- Returns new filename to renderer

#### `preload.js`
- Added `aiRenameFile` API method
- Exposes AI functionality to renderer process

---

## 🎨 UI/UX Enhancements

### Batch Editor Panel
- **Visibility:** Automatically appears when 2+ audio files are selected
- **Color Scheme:** Matches the existing Kraken Kurator cyan/dark theme
- **Placement:** Positioned above metadata panel for logical workflow
- **Responsive:** Checkboxes and buttons wrap nicely on smaller screens

### Progress Feedback
- Button text updates during operations: "⚡ Converting 5/12..."
- Status bar shows current file being processed
- Completion messages confirm successful operations

### Smart Detection
- Batch Editor only shows for audio file selections
- Convert button only processes .WAV files from selection
- AI Rename only targets files with duplicate markers `(1)`, `(2)`, etc.

---

## 📝 Notes & Tips

### AI Requirements
- **Ollama** must be running locally
- Install: [https://ollama.ai](https://ollama.ai)
- Pull model: `ollama pull llama3.2:latest`
- The app checks if Ollama is running before AI operations

### Best Practices
1. **Select Smartly:** Use checkboxes for non-contiguous selections
2. **Test First:** Try batch operations on a few files before processing hundreds
3. **Backup:** Keep originals of important files before batch conversions
4. **Quality Settings:** Use V2 for most purposes (good balance of size/quality)

### Filename Title Extraction
The "Get Title from Filename" feature works best with files named like:
- `01. Song Name.mp3` ✅
- `Track 5 - Artist Name.mp3` ✅
- `mysong.mp3` ✅
- Leading numbers and common separators are automatically removed

### Track Auto-numbering
- Numbers start at 1 and increment for each file
- Files are numbered in their current sort order
- Tip: Sort your files correctly before auto-numbering!

---

## 🐛 Troubleshooting

### "Ollama is not running" Error
**Solution:** Start Ollama in a terminal:
```bash
ollama serve
```

### Batch Editor Not Appearing
**Check:**
- Are 2+ files selected?
- Are they audio files (.mp3, .wav, etc.)?
- Try clicking "✓ All" to select everything

### AI Rename Does Nothing
**Check:**
- Are there files with `(1)` or `(2)` in their names?
- Is Ollama running?
- Check the console (View → Toggle Dev Tools) for errors

### Conversion Fails
**Check:**
- Are the selected files actually .WAV files?
- Do you have write permissions in the folder?
- Is there enough disk space?

---

## 🚀 Future Enhancements (Ideas)

Based on your development plan, future additions might include:
- Custom AI models selection in UI
- Batch cover art operations
- More filename parsing templates
- Export/import metadata profiles
- Integration with online music databases

---

## 📜 Version History

**v1.0.0 - Kraken Kurator Pro**
- ✅ Track number field implementation
- ✅ Batch metadata editor
- ✅ Batch WAV→MP3 conversion
- ✅ AI-powered duplicate renaming
- ✅ Enhanced poetic AI comments
- ✅ Multi-select batch operations

---

## 💡 Quick Reference

| Action | Shortcut/Method |
|--------|----------------|
| Select All | Ctrl+A or "✓ All" button |
| Select None | "✗ None" button |
| Multi-select | Hold Ctrl + Click |
| Range select | Click first, Shift+Click last |
| Batch panel | Auto-shows with 2+ audio files |
| Poetic AI | Click "🤖 AI Suggest" on any file |

---

**Enjoy your enhanced Kraken Kurator Pro! 🦑**
