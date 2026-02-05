# Diatessaron-TB

A static web reader for the Diatessaron (Gospel Harmony) in Indonesian (Terjemahan Baru).

## Features

- **Continuous text stream** for immersive reading
- **Chapter navigation** via sidebar (desktop) or dropdown (mobile)
- **Verse highlighting** on click with sticky header showing reference
- **Responsive design** with serif typography for book-like readability

## File Structure

```
Diatessaron-TB/
├── data.json        # Parsed text data
├── parser.py        # Python script to parse raw text
├── index.html       # Main HTML file
├── styles.css       # Stylesheet
├── script.js        # Frontend logic
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
python parser.py your_text_file.txt
```

This generates/overwrites `data.json`.

### 3. Open the Reader

Open `index.html` in your browser to view the content.

## License

MIT
