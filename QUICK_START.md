# 🦑 Kraken Kurator Pro - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install the Update
Replace these files in your Kraken Kurator directory:
- `index.html`
- `main.js`
- `renderer-main.js`
- `preload.js`
- `package.json`

### Step 2: Start Ollama (for AI features)
```bash
ollama serve
```
Keep this terminal running in the background.

### Step 3: Launch the App
```bash
npm start
```

---

## 🎯 Quick Feature Tour

### 1️⃣ Try the Track Number Field (30 seconds)
1. Load an MP3 file
2. Look for the "Track:" field in the metadata editor
3. Enter a number (e.g., "1")
4. Click "💾 Save Metadata"
5. ✅ Done! The track number is now saved

### 2️⃣ Try Batch Metadata (2 minutes)
1. Load a folder of MP3 files
2. Check the boxes next to 5-10 files (or click "✓ All")
3. **Watch:** The Batch Editor panel appears automatically!
4. In the Batch Editor:
   - Type an artist name (e.g., "The Kraken")
   - Type an album name (e.g., "Deep Sea Symphony")
   - Check ☑ "Auto-number Tracks"
5. Click "📋 Apply to Selected"
6. ✅ Done! All files now have matching metadata with track numbers

### 3️⃣ Try WAV→MP3 Conversion (1 minute)
1. Load some .WAV files
2. Select them using checkboxes
3. Click "⚡ Convert Selected to MP3" in the Batch Editor
4. **Watch:** Progress updates as each file converts
5. ✅ Done! New MP3 files created and selected

### 4️⃣ Try Poetic AI Comments (1 minute)
1. Load an MP3 file
2. Make sure it has a Title, Artist, and Album
3. Click "🤖 AI Suggest"
4. **Watch:** The AI fills in all metadata fields
5. Look at the Comment field - it should be poetic!
6. ✅ Done! Click "💾 Save Metadata" to keep it

### 5️⃣ Try AI Rename Duplicates (2 minutes)
1. Create a test duplicate: Copy a file so it gets named "Song(1).mp3"
2. Select the duplicate file
3. Click "🤖 AI Rename Duplicates" in the Batch Editor
4. **Watch:** The AI renames it creatively (e.g., "Echoes of Memory.mp3")
5. ✅ Done! The file is renamed and the list updates

---

## 💡 Pro Tips

### Keyboard Shortcuts
- **Ctrl+A** → Select all files
- **Ctrl+Click** → Select multiple individual files
- **Shift+Click** → Select a range of files

### Batch Editor Tricks
1. **Fill once, apply to many:** Enter artist/album/genre in batch editor, then click "Apply to Selected" to update all files at once
2. **Smart title extraction:** If your files are named like "01. Song Name.mp3", check "Get Title from Filename" to auto-extract titles
3. **Auto-track numbering:** Files will be numbered in their current sort order, so sort them first!

### AI Best Practices
1. **Better prompts = Better results:** Give your files meaningful names before using AI
2. **Poetic comments work best** when Title/Artist/Album are already filled in
3. **AI Rename** looks specifically for files with (1), (2), etc. in their names

### Workflow Optimization
```
Perfect workflow for a new album:
1. Load all files
2. Select all (Ctrl+A)
3. Batch Editor: Enter Artist, Album, Genre
4. Check: "Auto-number Tracks"
5. Click: "Apply to Selected"
6. For each song individually: Click "AI Suggest" for poetic comments
7. Done! Professional metadata in minutes
```

---

## 🐛 Common Issues & Fixes

### "Ollama is not running"
**Fix:**
```bash
ollama serve
```
Keep the terminal open while using the app.

### "No files selected" when clicking batch buttons
**Fix:** Make sure you've checked the boxes next to files (or used "✓ All" button)

### Batch Editor doesn't appear
**Fix:** You need to select at least 2 audio files (.mp3, .wav, etc.)

### AI gives weird responses
**Fix:** Make sure you're using `llama3.2:latest`:
```bash
ollama pull llama3.2:latest
```

### Conversion fails
**Fix:** Make sure you selected actual .WAV files, not MP3s

---

## 📋 Cheat Sheet

| What I Want | How To Do It |
|-------------|-------------|
| Add track numbers to one album | Select all songs → Batch Editor → Check "Auto-number" → Apply |
| Convert 50 WAVs to MP3 | Select all → Click "Convert Selected to MP3" |
| Fix duplicate filenames | Select all → Click "AI Rename Duplicates" |
| Add artist to 100 files | Select all → Batch Editor → Enter artist → Apply |
| Get poetic descriptions | Load file → "AI Suggest" → Save |
| Extract titles from filenames | Select all → Batch Editor → Check "Get Title from Filename" → Apply |

---

## 🎨 UI Guide

### Where to Find Things

**Left Panel:**
- 📁 Folder / 📄 Files buttons → Top
- List/Grid view toggle → Below buttons  
- Select All/None → Below view toggle
- File list → Scrollable area

**Right Panel (Top to Bottom):**
1. **Video/Audio Player** → Main viewing area
2. **Batch Editor** → Shows when 2+ audio files selected
3. **Metadata Editor** → Shows for audio files
4. **WAV Converter** → Shows for .wav files
5. **Playback Controls** → Transport buttons, progress bar
6. **Status Bar** → Bottom (shows what's happening)

---

## ✅ You're Ready!

You now know how to use all the major features. Here's what to try next:

1. **Organize your music library** with batch metadata
2. **Convert old WAV files** to space-saving MP3s
3. **Get creative with AI** for comments and renaming
4. **Build perfect albums** with auto-track numbering

Have fun with your supercharged Kraken Kurator Pro! 🦑

---

**Questions? Check the full documentation:**
- `FEATURES_README.md` → Detailed feature explanations
- `IMPLEMENTATION_SUMMARY.md` → Technical details

**Enjoy! 🎵**
