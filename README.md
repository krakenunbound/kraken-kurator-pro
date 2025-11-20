# Kraken Kurator Pro

**Kraken Kurator Pro** is a powerful Electron-based media management tool designed to help you organize, tag, and process your video and audio collections with ease. It features AI-powered metadata suggestions, batch processing, and format conversion.

![Main Interface](screenshots/main-interface.png)
*(Place your screenshot here: `screenshots/main-interface.png`)*

## 🚀 Features

- **Media Organization**: View, sort, and manage video and audio files.
- **AI Metadata**: Use local AI (Ollama) to suggest titles, artists, and poetic comments.
- **Batch Processing**: Apply metadata to multiple files at once or rename duplicates.
- **Format Conversion**: Convert WAV files to MP3 with VBR quality control.
- **Smart Tagging**: Extract metadata from filenames or use AI to generate it.

For a full list of features, see [FEATURES_README.md](FEATURES_README.md).

## 🛠️ Installation & Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Setup AI (Optional)**:
    - Install [Ollama](https://ollama.ai/).
    - Pull a model (e.g., `ollama pull llama3`).

3.  **Run the App**:
    ```bash
    npm start
    ```

For detailed instructions, see [QUICK_START.md](QUICK_START.md).

## 📸 Screenshots

| List View | Batch Editor |
|-----------|--------------|
| ![List View](screenshots/list-view.png) | ![Batch Editor](screenshots/batch-editor.png) |

## 📄 Documentation

- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Delivery Summary](DELIVERY_SUMMARY.md)

## 🤝 Contributing

Feel free to submit issues and enhancement requests.

## 📜 License

[MIT](LICENSE)
