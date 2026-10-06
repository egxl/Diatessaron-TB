# Diatessaron-TB (Harmoni Empat Injil)

Web reader dan ruang studi digital untuk **Diatessaron** (*διὰ τεσσάρων* — "dari yang empat"), harmoni empat Injil tertua dalam sejarah Gereja yang disusun oleh **Tatianus (± 110–180 M)**, dalam Bahasa Indonesia (LAI-TB).

Aplikasi ini **100% statis**, berkecepatan tinggi, tanpa dependensi server atau runtime Node.js, dan dioptimalkan secara penuh untuk dipublikasikan langsung melalui **GitHub Pages**.

---

## Fitur Utama

- 📖 **Alur Narasi Berkesinambungan (*Continuous Gospel Narrative*)**: Membaca kisah utuh kehidupan dan pelayanan Yesus Kristus yang dirajut dari empat Injil tanpa jeda yang kaku.
- 🎨 **Visualisasi Harmoni Empat Injil**:
  - **Matius** (Kuning Amber): Menekankan Yesus sebagai Raja Mesias penggenap nubuatan.
  - **Markus** (Hijau Zamrud): Menekankan Yesus sebagai Hamba yang giat bertindak.
  - **Lukas** (Biru Safir): Menekankan Yesus sebagai Anak Manusia dan Juruselamat dunia.
  - **Yohanes** (Ungu Ametis): Menekankan Yesus sebagai Firman Allah yang kekal (*Logos*).
  - Indikator meteran komposisi Injil dinamis per bab.
- ⏳ **8 Bagian Kronologis Pelayanan**: Navigasi 55 bab yang terbagi menurut kurun waktu historis pelayanan Yesus, dilengkapi judul perikop yang deskriptif.
- 📜 **Aparatus Varian Naskah (*Textual Critical Notes*)**: Menampilkan catatan ilmiah perbandingan bacaan naskah kuno Diatessaron terhadap teks Yunani modern (UBS/Westcott-Hort) dan *Textus Receptus* (TR/MILT).
- 🏺 **Penanda Halaman Naskah Kuno Arab**: Indeks 208 halaman manuskrip kuno Diatessaron terjemahan bahasa Arab (`p. 2` – `p. 209`).
- 🔍 **Pencarian Cepat Seketika (*Instant In-Memory Search*)**: Pencarian instan berbasis peramban (tekan `Ctrl+K` / `⌘K`) yang menelusuri 5.076 ayat dan 54.000+ kata dengan penyorotan kata kunci dan filter per Injil.
- 🎧 **Narasi Suara (*Text-to-Speech*)**: Pemutar audio bahasa Indonesia terintegrasi dengan penyorotan kalimat otomatis (*auto-scrolling verse tracking*).
- 🏛️ **4 Tema Bacaan Tipografi Suci**:
  - **Skriptorium Putih**: Kontras bersih standar akademis.
  - **Kertas Kuno (*Ancient Parchment*)**: Nuansa papirus hangat yang nyaman di mata.
  - **Perpustakaan Sepia**: Nada klasik perpustakaan naskah kuno.
  - **Malam Teduh (*Midnight Vellum*)**: Tema gelap slate untuk membaca malam hari tanpa silau.
- 🔗 **Tautan Langsung Berbasis Hash (*Zero-404 Deep Linking*)**: Bagikan rujukan ayat secara presisi (contoh: `#bab-1:v1` atau `#bab-4:v67`).
- 📋 **Salin Sitasi Akademis 1-Klik**: Format kutipan lengkap langsung siap pakai untuk makalah atau catatan renungan.

---

## Struktur Berkas

```
Diatessaron-TB/
├── .nojekyll              # Memastikan GitHub Pages menyajikan seluruh file statis
├── data/                  # Data JSON terstruktur
│   ├── raw/               # Arsip scrape forum SarapanPagi Biblika
│   ├── index.json         # Metadata 55 bab, 8 kronologi, dan statistik harmoni
│   ├── search_index.json  # Indeks pencarian instan klien
│   ├── bab_1.json         # Bab 1 (Prolog Sang Sabda & Yohanes Pembaptis)
│   └── ...                # Hingga bab_55.json
├── tools/
│   ├── scraper.py         # Scraper arsip forum phpBB
│   ├── parser.py          # Parser HTML awal
│   ├── footnotes_data.py  # Definisi kurasi catatan aparatus naskah kuno
│   ├── enrich_data.py     # Pipeline normalisasi referensi, perikop & statistik
│   └── verify_site.py     # Pengujian integritas data & kepatuhan GitHub Pages
├── index.html             # Shell aplikasi semantik & metadata OpenGraph
├── styles.css             # Sistem desain tipografi, tema, dan responsif
├── script.js              # State manager, router hash, pencarian & audio
└── README.md
```

---

## Menjalankan Secara Lokal

Cukup jalankan web server lokal sederhana (diperlukan agar `fetch()` file JSON lokal dapat berjalan):

```bash
# Menggunakan Python 3 bawaan
python -m http.server 8000
```

Buka peramban di `http://localhost:8000`.

---

## Publikasi ke GitHub Pages

Proyek ini telah dikonfigurasi secara optimal untuk **GitHub Pages**:

1. Pastikan seluruh perubahan telah di-*commit* dan di-*push* ke repositori GitHub:
   ```bash
   git add .
   git commit -m "Enhance Diatessaron-TB modern reader"
   git push origin main
   ```
2. Buka repositori di GitHub → **Settings** → **Pages**.
3. Di bagian **Build and deployment**:
   - **Source**: Pilih `Deploy from a branch`.
   - **Branch**: Pilih `main`, folder `/ (root)`.
   - Klik **Save**.
4. Dalam 1–2 menit, situs Anda akan aktif di:
   `https://<username>.github.io/Diatessaron-TB/`

---

## Pembaruan & Normalisasi Data

Untuk memperbarui atau memproses ulang data dari awal:

```bash
# 1. Scrape data mentah (opsional, jika ingin memperbarui cache)
python tools/scraper.py

# 2. Jalankan normalisasi dan pembentukan indeks harmoni
python tools/enrich_data.py

# 3. Verifikasi integritas
python tools/verify_site.py
```

---

## Lisensi & Kredit

- **Teks Alkitab**: Terjemahan Baru (LAI-TB), Lembaga Alkitab Indonesia.
- **Harmonisasi**: Diadaptasi dari posting forum *SarapanPagi Biblika Ministry* oleh Sdr. *fajaryehuda*, berdasarkan edisi Hope W. Hogg (*Ante-Nicene Fathers*, Vol. 9).
- **Lisensi Kode**: MIT License.
