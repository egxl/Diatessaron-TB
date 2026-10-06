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
│   ├── raw/           # Raw scraped forum posts archive & cache
│   ├── index.json     # Manifest for all 55 chapters
│   ├── bab_1.json     # Chapter 1 (Prologue & Nativity of John)
│   └── ...            # Through bab_55.json
├── tools/
│   ├── scraper.py     # Scrapes forum posts with local disk caching
│   └── parser.py      # Parses HTML into dual-keyed JSON segments
├── index.html
├── styles.css
├── script.js
└── README.md
```

## Usage

### 1. Scrape & Parse Data

To refresh the dataset directly from the source forum (*SarapanPagi Biblika*):

```bash
# 1. Scrape forum posts (pages 1-3) into data/raw/
python tools/scraper.py

# 2. Parse into normalized chapter JSON files
python tools/parser.py
```

### 3. Open the Reader

Open `index.html` in your browser (requires a local server for fetch to work).

```bash
# Simple Python server
python -m http.server 8000
```

Then visit `http://localhost:8000`

## License

MIT
