# Diatessaron-TB

A static web reader for the Diatessaron (Gospel Harmony) in Indonesian (Terjemahan Baru).

## Features

- **Continuous text stream** for immersive reading
- **Chapter navigation** via sidebar (desktop) or dropdown (mobile)
- **Lazy loading** - chapters load on demand
- **Verse highlighting** on click with sticky header showing reference
- **Responsive design** with serif typography

## File Structure

```
Diatessaron-TB/
├── data/              # Chapter JSON files (generated)
│   ├── index.json
│   ├── bab_1.json
│   └── ...
├── index.html
├── styles.css
├── script.js
└── README.md
```

## Usage

### 1. Prepare Your Text

Create a text file with this format:

```
BAB I
6 Luke 1:5 Pada zaman Herodes, raja Yudea...
7 Luke 1:6 Keduanya adalah benar di hadapan Allah...

BAB II
8 Luke 1:7 Tetapi mereka tidak mempunyai anak...
```

### 2. Run the Parser

```bash
cd tools
python parser.py your_text_file.txt
```

This generates files in `data/` folder.

### 3. Open the Reader

Open `index.html` in your browser (requires a local server for fetch to work).

```bash
# Simple Python server
python -m http.server 8000
```

Then visit `http://localhost:8000`

## License

MIT
