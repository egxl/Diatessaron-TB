import os
import sys
import json
import re

# Add tools dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from footnotes_data import RAW_FOOTNOTES

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# 8 Chronological Ministry Epochs
EPOCHS = [
    {
        "id": 1,
        "title": "I. Masa Kanak-kanak & Kelahiran",
        "title_en": "Infancy & Early Years",
        "description": "Prolog Sang Sabda, silsilah, kelahiran Yohanes Pembaptis dan Yesus, orang Majus, serta masa kanak-kanak.",
        "chapters": [1, 2, 3]
    },
    {
        "id": 2,
        "title": "II. Pembaptisan & Awal Pelayanan",
        "title_en": "Baptism & Early Ministry",
        "description": "Pelayanan Yohanes Pembaptis, baptisan Yesus, pencobaan di padang gurun, perkawinan di Kana, dan panggilan murid.",
        "chapters": [4, 5, 6, 7]
    },
    {
        "id": 3,
        "title": "III. Khotbah di Bukit & Pelayanan Galilea",
        "title_en": "Sermon on the Mount & Galilean Ministry",
        "description": "Khotbah di Bukit (Ucapan Bahagia, Doa Bapa Kami), mukjizat kesembuhan, dan pengajaran perumpamaan penabur.",
        "chapters": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    },
    {
        "id": 4,
        "title": "IV. Mukjizat & Pelayanan di Luar Galilea",
        "title_en": "Miracles & Ministry Beyond Galilee",
        "description": "Yesus memberi makan 5.000 orang, berjalan di atas air, Roti Hidup, Transfigurasi, dan perumpamaan domba yang hilang.",
        "chapters": [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
    },
    {
        "id": 5,
        "title": "V. Pelayanan Akhir di Yudea & Perea",
        "title_en": "Final Ministry in Judea & Perea",
        "description": "Zakheus, pembangkitan Lazarus, wanita berzinah, pembersihan Bait Allah, dan perarakan masuk Yerusalem.",
        "chapters": [31, 32, 33, 34, 35, 36, 37, 38, 39]
    },
    {
        "id": 6,
        "title": "VI. Minggu Sengsara di Yerusalem",
        "title_en": "Passion Week & Final Discourses",
        "description": "Khotbah akhir zaman (Zaitun), persiapan Paskah, pembasuhan kaki, pokok anggur yang benar, dan doa syafaat agung.",
        "chapters": [40, 41, 42, 43, 44, 45, 46, 47, 48]
    },
    {
        "id": 7,
        "title": "VII. Pengadilan & Penyaliban Kristus",
        "title_en": "Trial, Crucifixion & Burial",
        "description": "Pemeriksaan di hadapan Hanas, Kayafas, Pilatus, jalan salib ke Golgota, kematian, dan pemakaman Kristus.",
        "chapters": [49, 50, 51, 52]
    },
    {
        "id": 8,
        "title": "VIII. Kebangkitan, Penampakan & Kenaikan",
        "title_en": "Resurrection, Commission & Ascension",
        "description": "Kubur kosong, penampakan kepada Maria dan murid di jalan ke Emaus, Amanat Agung, dan kenaikan ke Sorga.",
        "chapters": [53, 54, 55]
    }
]

CHAPTER_METADATA = {
    1: {"title_id": "Prolog Sang Sabda & Pemberitaan Kelahiran Yohanes Pembaptis", "title_en": "Prologue of the Word & Annunciation of John the Baptist", "epoch_id": 1},
    2: {"title_id": "Silsilah, Kelahiran Yesus & Masa Kanak-kanak di Bait Allah", "title_en": "Genealogy, Nativity of Jesus & Presentation in the Temple", "epoch_id": 1},
    3: {"title_id": "Orang-orang Majus, Pelarian ke Mesir & Yesus pada Umur 12 Tahun", "title_en": "The Wise Men from the East, Flight to Egypt & Boyhood of Jesus", "epoch_id": 1},
    4: {"title_id": "Pelayanan Yohanes Pembaptis, Baptisan Yesus & Pencobaan", "title_en": "Ministry of John the Baptist, Baptism of Jesus & Fasting in Wilderness", "epoch_id": 2},
    5: {"title_id": "Panggilan Murid-murid Pertama & Perkawinan di Kana", "title_en": "Calling of First Disciples & The Wedding at Cana", "epoch_id": 2},
    6: {"title_id": "Penjala Manusia, Percakapan Nikodemus & Pelayanan Awal", "title_en": "Fishers of Men & Early Ministry in Judea and Galilee", "epoch_id": 2},
    7: {"title_id": "Yesus Menyembuhkan Banyak Orang & Memilih 12 Rasul", "title_en": "Healing the Leper and Paralytic & Choosing the Twelve", "epoch_id": 2},
    8: {"title_id": "Khotbah di Bukit: Ucapan Bahagia & Hukum Kasih", "title_en": "Sermon on the Mount: The Beatitudes & Law of Love", "epoch_id": 3},
    9: {"title_id": "Khotbah di Bukit: Integritas, Doa Bapa Kami & Hal Berpuasa", "title_en": "Sermon on the Mount: The Lord's Prayer & Sincerity", "epoch_id": 3},
    10: {"title_id": "Khotbah di Bukit: Kekuatiran & Rumah di Atas Batu", "title_en": "Sermon on the Mount: Anxiety & House on the Rock", "epoch_id": 3},
    11: {"title_id": "Hamba Perwira Kapernaum, Pemuda di Nain & Angin Ribut", "title_en": "Centurion's Servant, Widow's Son & Stilling the Tempest", "epoch_id": 3},
    12: {"title_id": "Pembebasan Orang Gerasa, Perempuan Pendarahan & Anak Yairus", "title_en": "Healing the Gerasene Demoniac & Jairus' Daughter", "epoch_id": 3},
    13: {"title_id": "Pengutusan 12 Murid & Pertanyaan Yohanes Pembaptis", "title_en": "Mission of the Twelve & Inquiries from John in Prison", "epoch_id": 3},
    14: {"title_id": "Pujian atas Yohanes Pembaptis & Perempuan yang Mengurapi Yesus", "title_en": "Praise of John the Baptist & Anointing by the Sinful Woman", "epoch_id": 3},
    15: {"title_id": "Perumpamaan Dua Orang Berhutang & Syarat Mengikut Yesus", "title_en": "Parable of the Two Debtors & Cost of Discipleship", "epoch_id": 3},
    16: {"title_id": "Tanda Nabi Yunus & Perumpamaan tentang Seorang Penabur", "title_en": "The Sign of Jonah & Parable of the Sower", "epoch_id": 3},
    17: {"title_id": "Perumpamaan Lalang, Biji Sesawi, Ragi & Harta Terpendam", "title_en": "Parables of the Tares, Mustard Seed & Hidden Treasure", "epoch_id": 3},
    18: {"title_id": "Kematian Yohanes Pembaptis & Memberi Makan 5.000 Orang", "title_en": "Death of John the Baptist & Feeding of the 5,000", "epoch_id": 4},
    19: {"title_id": "Yesus Berjalan di Atas Air & Khotbah tentang Roti Hidup", "title_en": "Jesus Walks on Water & Discourse on the Bread of Life", "epoch_id": 4},
    20: {"title_id": "Kata-kata Hidup yang Kekal & Adat Istiadat Nenek Moyang", "title_en": "Words of Eternal Life & Tradition of the Elders", "epoch_id": 4},
    21: {"title_id": "Iman Perempuan Kanaan & Mukjizat di Daerah Dekapolis", "title_en": "Faith of the Canaanite Woman & Healing in Decapolis", "epoch_id": 4},
    22: {"title_id": "Penyembuhan di Kolam Betesda & Kesaksian Bapa tentang Anak", "title_en": "Healing at Pool of Bethesda & Father's Testimony", "epoch_id": 4},
    23: {"title_id": "Yesus Memberi Makan 4.000 Orang & Pengakuan Petrus", "title_en": "Feeding the 4,000 & Peter's Confession of Christ", "epoch_id": 4},
    24: {"title_id": "Transfigurasi di Atas Gunung & Penyembuhan Anak yang Bisu", "title_en": "The Transfiguration & Healing the Possessed Boy", "epoch_id": 4},
    25: {"title_id": "Siapa yang Terbesar di Sorga, Penyesatan & Pengampunan", "title_en": "True Greatness, Temptation to Sin & Forgiveness", "epoch_id": 4},
    26: {"title_id": "Perumpamaan Domba Hilang, Dirham Hilang & Anak Hilang", "title_en": "Parables of Lost Sheep, Lost Coin & Prodigal Son", "epoch_id": 4},
    27: {"title_id": "Perumpamaan Hamba yang Tak Mengampuni & Peringatan Penyesatan", "title_en": "Parable of the Unforgiving Servant & Faith", "epoch_id": 4},
    28: {"title_id": "Hari Raya Pondok Daun, Peringatan Tamak & Orang Muda Kaya", "title_en": "Feast of Tabernacles, Rich Fool & Rich Young Ruler", "epoch_id": 4},
    29: {"title_id": "Perumpamaan Pekerja di Kebun Anggur & Bahaya Kekayaan", "title_en": "Workers in the Vineyard & Danger of Riches", "epoch_id": 4},
    30: {"title_id": "Tempat Duduk Terhormat, 10 Orang Kusta & Permintaan Anak Zebedeus", "title_en": "Places of Honor, Ten Lepers & Sons of Zebedee", "epoch_id": 4},
    31: {"title_id": "Penyembuhan Bartimeus di Yerikho, Zakheus & Perumpamaan Mina", "title_en": "Blind Bartimaeus, Zacchaeus & Parable of the Minas", "epoch_id": 5},
    32: {"title_id": "Pembersihan Bait Allah & Percakapan Nikodemus di Malam Hari", "title_en": "Cleansing the Temple & Night Discourse with Nicodemus", "epoch_id": 5},
    33: {"title_id": "Pohon Ara yang Dikutuk & Perumpamaan Penggarap Kebun Anggur", "title_en": "Cursing the Fig Tree & Parable of the Wicked Tenants", "epoch_id": 5},
    34: {"title_id": "Pertanyaan Pajak kepada Kaisar, Kebangkitan & Hukum Terutama", "title_en": "Tribute to Caesar, Resurrection & Greatest Commandment", "epoch_id": 5},
    35: {"title_id": "Air Hidup pada Hari Terakhir & Perempuan yang Berzinah", "title_en": "Rivers of Living Water & Woman Taken in Adultery", "epoch_id": 5},
    36: {"title_id": "Yesus Terang Dunia & Penyembuhan Orang Buta Sejak Lahir", "title_en": "Jesus the Light of the World & Healing the Blind Man", "epoch_id": 5},
    37: {"title_id": "Gembala yang Baik & Pengakuan Satu dengan Bapa", "title_en": "The Good Shepherd & Feast of Dedication", "epoch_id": 5},
    38: {"title_id": "Pembangkitan Lazarus dari Kematian & Rencana Menangkap Yesus", "title_en": "Resurrection of Lazarus & Plot of the Sanhedrin", "epoch_id": 5},
    39: {"title_id": "Yesus Diurapi di Betania & Pawai Masuk Yerusalem", "title_en": "Anointing at Bethany & Triumphal Entry into Jerusalem", "epoch_id": 5},
    40: {"title_id": "Orang Yunani Mencari Yesus & Tujuh Kecaman atas Ahli Taurat", "title_en": "Greeks Seek Jesus & Seven Woes upon Pharisees", "epoch_id": 6},
    41: {"title_id": "Persembahan Janda Miskin & Pengajaran Tanda Akhir Zaman", "title_en": "The Widow's Mite & The Olivet Discourse", "epoch_id": 6},
    42: {"title_id": "Kehancuran Bait Allah & Peringatan untuk Berjaga-jaga", "title_en": "Destruction of Jerusalem & Need for Watchfulness", "epoch_id": 6},
    43: {"title_id": "Perumpamaan Hamba Setia, Sepuluh Gadis & Talenta", "title_en": "Parables of Ten Virgins, Talents & Final Judgment", "epoch_id": 6},
    44: {"title_id": "Rencana Pembunuhan, Pengkhianatan Yudas & Perjamuan Paskah", "title_en": "Plot to Kill Jesus & Passover Preparation", "epoch_id": 6},
    45: {"title_id": "Pembasuhan Kaki Murid-murid & Janji Penghibur (Roh Kudus)", "title_en": "Washing the Disciples' Feet & The Promised Comforter", "epoch_id": 6},
    46: {"title_id": "Pokok Anggur yang Benar, Damai Sejahtera & Janji Roh Kebenaran", "title_en": "The True Vine, World's Hate & Spirit of Truth", "epoch_id": 6},
    47: {"title_id": "Dukacita Berubah Sukacita & Doa Syafaat Yesus yang Agung", "title_en": "Sorrow Turned to Joy & The Great High Priestly Prayer", "epoch_id": 6},
    48: {"title_id": "Doa di Getsemani, Penangkapan Yesus & Penyangkalan Petrus", "title_en": "Agony in Gethsemane, Arrest of Jesus & Peter's Denial", "epoch_id": 6},
    49: {"title_id": "Pemeriksaan di Hadapan Hanas, Kayafas & Mahkamah Agama", "title_en": "Trial Before Annas, Caiaphas & The Sanhedrin", "epoch_id": 7},
    50: {"title_id": "Yesus di Hadapan Pontius Pilatus dan Herodes Antipas", "title_en": "Jesus Before Pontius Pilate and Herod Antipas", "epoch_id": 7},
    51: {"title_id": "Penghukuman, Mahkota Duri & Perjalanan Menuju Golgota", "title_en": "Mocking by Soldiers, Sentence of Death & Way to Golgotha", "epoch_id": 7},
    52: {"title_id": "Penyaliban, Kematian, Mukjizat di Salib & Pemakaman Kristus", "title_en": "The Crucifixion, Death & Burial by Joseph of Arimathea", "epoch_id": 7},
    53: {"title_id": "Kebangkitan Kristus, Kubur Kosong & Penampakan Pertama", "title_en": "The Resurrection, Empty Tomb & Holy Women", "epoch_id": 8},
    54: {"title_id": "Perjalanan ke Emaus, Penampakan kepada Murid & Tomas", "title_en": "Road to Emmaus & Appearances to Apostles and Thomas", "epoch_id": 8},
    55: {"title_id": "Amanat Agung di Galilea, Kenaikan ke Sorga & Penutup Saksi", "title_en": "The Great Commission, Ascension & Final Witness", "epoch_id": 8}
}

BOOK_CANON_MAP = {
    'mat': ('Matthew', 'Matius', 'Mat'),
    'mrk': ('Mark', 'Markus', 'Mrk'),
    'luk': ('Luke', 'Lukas', 'Luk'),
    'yoh': ('John', 'Yohanes', 'Yoh')
}

def normalize_reference(ref, ch_num, verse_id):
    if not ref:
        return 'Unknown', 'Unknown', 'unk'
        
    s = ref.strip()
    
    # Specific known typo corrections
    if s == 'ohn 2:6':
        s = 'John 2:6'
    elif s == 'a' and ch_num == 12 and verse_id == 1:
        s = 'Luke 8:37a'
    elif s == 'Mathhew 18:7':
        s = 'Matthew 18:7'
    elif s == 'Mathhew 19;19b':
        s = 'Matthew 19:19b'
    elif s == '58' and ch_num == 33 and verse_id == 101:
        s = 'Matthew 21:43'
    elif s == 'ohn 10:31':
        s = 'John 10:31'
    elif s == 'ohn 14:27':
        s = 'John 14:27'
    elif s.startswith('Yoh.'):
        s = 'John ' + s[4:].strip()
    elif s.startswith('Yoh. '):
        s = 'John ' + s[5:].strip()
    elif s.startswith('Luk.'):
        s = 'Luke ' + s[4:].strip()
    elif s.startswith('Mat.'):
        s = 'Matthew ' + s[4:].strip()
    elif s.startswith('Mark.'):
        s = 'Mark ' + s[5:].strip()
    elif s.startswith('Matius '):
        s = 'Matthew ' + s[7:].strip()
    elif s.startswith('Markus '):
        s = 'Mark ' + s[7:].strip()
    elif s.startswith('Lukas '):
        s = 'Luke ' + s[6:].strip()
    elif s.startswith('Yohanes '):
        s = 'John ' + s[8:].strip()
        
    # Normalize colon spacing (e.g. "Matthew 26: 15b" -> "Matthew 26:15b")
    s = re.sub(r'(\d+)\s*:\s*(\d+)', r'\1:\2', s)
    
    # Detect canonical book
    b_code = 'unk'
    b_en = 'Unknown'
    b_id = 'Lainnya'
    
    if re.search(r'^(?:Matthew|Mat)\b', s, re.I):
        b_code, b_en, b_id = 'mat', 'Matthew', 'Matius'
    elif re.search(r'^(?:Mark|Markus|Mrk)\b', s, re.I):
        b_code, b_en, b_id = 'mrk', 'Mark', 'Markus'
    elif re.search(r'^(?:Luke|Lukas|Luk)\b', s, re.I):
        b_code, b_en, b_id = 'luk', 'Luke', 'Lukas'
    elif re.search(r'^(?:John|Yohanes|Yoh|ohn)\b', s, re.I):
        b_code, b_en, b_id = 'yoh', 'John', 'Yohanes'
        
    # Format canonical Indonesian reference
    # e.g. "John 1:1" -> "Yohanes 1:1"
    ref_id = s
    if b_code != 'unk':
        ref_id = re.sub(r'^(?:Matthew|Mark|Luke|John|Mat|Mrk|Luk|Yoh)\.?\s*', f"{b_id} ", s)
        
    return s, ref_id, b_code, b_en, b_id

def process_all_chapters():
    with open(os.path.join(DATA_DIR, 'index.json'), 'r', encoding='utf-8') as f:
        index_data = json.load(f)
        
    all_chapters_summary = []
    search_index = []
    
    global_stats = {
        'total_chapters': 55,
        'total_segments': 0,
        'total_words': 0,
        'gospels': {
            'mat': {'count': 0, 'words': 0, 'name': 'Matius', 'name_en': 'Matthew', 'color': '#d97706'},
            'mrk': {'count': 0, 'words': 0, 'name': 'Markus', 'name_en': 'Mark', 'color': '#059669'},
            'luk': {'count': 0, 'words': 0, 'name': 'Lukas', 'name_en': 'Luke', 'color': '#2563eb'},
            'yoh': {'count': 0, 'words': 0, 'name': 'Yohanes', 'name_en': 'John', 'color': '#7c3aed'}
        }
    }
    
    for ch_meta in index_data['chapters']:
        ch_id = ch_meta['id']
        ch_file = os.path.join(DATA_DIR, ch_meta['file'])
        
        with open(ch_file, 'r', encoding='utf-8') as cf:
            chapter = json.load(cf)
            
        raw_verses = chapter.get('verses', [])
        clean_verses = []
        footnotes = []

        # Step 1: Filter out any raw footnote segments from verses stream
        for v in raw_verses:
            d_verse = str(v.get('diatessaron_verse', '')).strip()
            text = v.get('text', '').strip()
            
            # Check if this segment is a footnote
            if 'catatan kaki' in d_verse.lower() or text.lower().startswith('catatan kaki'):
                continue
            v.pop('footnote_id', None)
            clean_verses.append(v)
                
        # Step 2: Use canonical footnotes for this chapter if any
        footnotes = RAW_FOOTNOTES.get(ch_id, [])
        if footnotes:
            for fn in footnotes:
                target = fn.get('target_ref', '')
                matched = False
                for cv in clean_verses:
                    r = cv.get('ref', '')
                    if r == target or r.startswith(target):
                        cv['footnote_id'] = fn['id']
                        matched = True
                        break
                if not matched and clean_verses:
                    clean_verses[-1]['footnote_id'] = fn['id']
                    
        # Step 2: Normalize verses and compute chapter stats
        ch_stats = {'mat': 0, 'mrk': 0, 'luk': 0, 'yoh': 0, 'unk': 0}
        ch_words = 0
        arabic_pages = []
        d_verse_nums = []
        
        for idx, v in enumerate(clean_verses, 1):
            v['id'] = idx
            ref_raw = v.get('ref', '')
            ref_en, ref_id, b_code, b_en, b_id = normalize_reference(ref_raw, ch_id, idx)
            
            v['ref'] = ref_en
            v['ref_id'] = ref_id
            v['book_code'] = b_code
            v['book_en'] = b_en
            v['book_id'] = b_id
            
            # Text cleaning
            text = v.get('text', '').strip()
            v['text'] = text
            words = len(text.split())
            v['word_count'] = words
            ch_words += words
            
            if b_code in ch_stats:
                ch_stats[b_code] += 1
            else:
                ch_stats['unk'] += 1
                
            if b_code in global_stats['gospels']:
                global_stats['gospels'][b_code]['count'] += 1
                global_stats['gospels'][b_code]['words'] += words
                
            page = v.get('arabic_page')
            if page and page not in arabic_pages:
                arabic_pages.append(page)
                
            dv = v.get('diatessaron_verse')
            if dv and dv not in d_verse_nums:
                d_verse_nums.append(str(dv))
                
            # Add to search index
            search_index.append({
                'c': ch_id,
                'v': idx,
                'dv': dv or '',
                'r': ref_id,
                'b': b_code,
                't': text
            })

        global_stats['total_segments'] += len(clean_verses)
        global_stats['total_words'] += ch_words

        # Diatessaron verse range
        d_range = ""
        if d_verse_nums:
            d_range = f"{d_verse_nums[0]} - {d_verse_nums[-1]}"
            
        # Metadata lookup
        meta = CHAPTER_METADATA.get(ch_id, {
            "title_id": f"Harmoni Injil Bab {ch_id}",
            "title_en": f"Gospel Harmony Chapter {ch_id}",
            "epoch_id": 1
        })
        
        # Save enriched chapter file
        chapter['title'] = f"BAB {ch_id}"
        chapter['title_id'] = meta['title_id']
        chapter['title_en'] = meta['title_en']
        chapter['epoch_id'] = meta['epoch_id']
        chapter['total_segments'] = len(clean_verses)
        chapter['total_words'] = ch_words
        chapter['diatessaron_verse_range'] = d_range
        chapter['arabic_page_range'] = f"p. {min(arabic_pages)} - p. {max(arabic_pages)}" if arabic_pages else None
        chapter['arabic_pages'] = arabic_pages
        chapter['stats'] = ch_stats
        chapter['footnotes'] = footnotes
        chapter['verses'] = clean_verses
        
        with open(ch_file, 'w', encoding='utf-8') as cf:
            json.dump(chapter, cf, ensure_ascii=False, indent=2)
            
        all_chapters_summary.append({
            'id': ch_id,
            'title': f"BAB {ch_id}",
            'title_id': meta['title_id'],
            'title_en': meta['title_en'],
            'epoch_id': meta['epoch_id'],
            'file': ch_meta['file'],
            'total_segments': len(clean_verses),
            'total_words': ch_words,
            'diatessaron_verse_range': d_range,
            'arabic_page_range': f"p. {min(arabic_pages)} - p. {max(arabic_pages)}" if arabic_pages else None,
            'canonical_books': [b for b, count in [('Matius', ch_stats['mat']), ('Markus', ch_stats['mrk']), ('Lukas', ch_stats['luk']), ('Yohanes', ch_stats['yoh'])] if count > 0],
            'stats': ch_stats,
            'has_footnotes': len(footnotes) > 0,
            'footnote_count': len(footnotes)
        })

    # Save enriched index.json
    enriched_index = {
        'title': "Diatessaron (LAI-TB)",
        'subtitle': "Harmoni Empat Injil oleh Tatianus (Versi Bahasa Indonesia, LAI-TB)",
        'greek_title': "διὰ τεσσάρων (dia tessarōn)",
        'compiler': "Tatianus (± 110–180 M)",
        'historical_notes': "Diatessaron adalah harmoni empat Injil tertua dalam sejarah gereja, menggabungkan Injil Matius, Markus, Lukas, dan Yohanes menjadi satu alur kronologis yang berkesinambungan.",
        'source': index_data.get('source', {}),
        'epochs': EPOCHS,
        'global_stats': global_stats,
        'total_chapters': len(all_chapters_summary),
        'chapters': all_chapters_summary
    }

    with open(os.path.join(DATA_DIR, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(enriched_index, f, ensure_ascii=False, indent=2)

    # Save search_index.json (lightweight, minify for fast transfer)
    with open(os.path.join(DATA_DIR, 'search_index.json'), 'w', encoding='utf-8') as f:
        json.dump(search_index, f, ensure_ascii=False, separators=(',', ':'))

    print(f"Data processing successfully completed!")
    print(f"Total chapters: {len(all_chapters_summary)}")
    print(f"Total segments: {global_stats['total_segments']}")
    print(f"Total words: {global_stats['total_words']}")
    print("Gospel distribution:")
    for code, g in global_stats['gospels'].items():
        pct = (g['count'] / global_stats['total_segments']) * 100
        print(f"  {g['name']}: {g['count']} segments ({pct:.1f}%), {g['words']} words")
    print(f"Generated search index with {len(search_index)} items.")

if __name__ == '__main__':
    process_all_chapters()
