import os
import re
import sys
import json
import urllib.request

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

PAGES = [
    ("page_1.html", "https://www.sarapanpagi.org/diatessaron-versi-bahasa-indonesia-lai-tb-vt8647.html"),
    ("page_2.html", "https://www.sarapanpagi.org/diatessaron-versi-bahasa-indonesia-lai-tb-vt8647-20.html"),
    ("page_3.html", "https://www.sarapanpagi.org/diatessaron-versi-bahasa-indonesia-lai-tb-vt8647-40.html")
]

def fetch_pages(cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    pages_html = []
    
    for filename, url in PAGES:
        filepath = os.path.join(cache_dir, filename)
        if os.path.exists(filepath):
            print(f"[CACHE] Loading {filename}...", flush=True)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                html = f.read()
        else:
            print(f"[FETCH] Downloading {url}...", flush=True)
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"[CACHED] Saved {filename} ({len(html)} bytes)", flush=True)
        pages_html.append(html)
    return pages_html

def extract_chapters(pages_html, output_file):
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    all_chapters = []
    intro_post = None
    
    for page_idx, html in enumerate(pages_html, 1):
        # Match each post block in phpBB
        matches = list(re.finditer(
            r'<div id="(p\d+)"[^>]*>.*?<div class="content">(.*?)</div>\s*<div class="back2top">',
            html, re.DOTALL
        ))
        
        for m in matches:
            pid = m.group(1)
            content = m.group(2)
            
            # Check if this is the introduction post
            if pid == 'p51033':
                intro_post = {
                    "post_id": pid,
                    "title": "Introductory Notes & Index",
                    "raw_html": content
                }
                continue
                
            # Extract chapter number
            ch_match = re.search(r'BAB\s*(\d+)', content, re.IGNORECASE)
            if not ch_match:
                continue
                
            ch_num = int(ch_match.group(1))
            all_chapters.append({
                "chapter": ch_num,
                "post_id": pid,
                "title": f"BAB {ch_num}",
                "page": page_idx,
                "raw_html": content
            })

    # Sort chapters by chapter number
    all_chapters.sort(key=lambda x: x["chapter"])
    
    # Verify completeness
    ch_nums = [c["chapter"] for c in all_chapters]
    expected = list(range(1, 56))
    if ch_nums != expected:
        print(f"[WARNING] Expected chapters 1..55, got {ch_nums}", flush=True)
    else:
        print(f"[SUCCESS] All 55 chapters successfully extracted!", flush=True)

    result = {
        "source": "https://www.sarapanpagi.org/diatessaron-versi-bahasa-indonesia-lai-tb-vt8647.html",
        "intro": intro_post,
        "total_chapters": len(all_chapters),
        "chapters": all_chapters
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"[SAVED] Raw chapters written to {output_file} ({len(all_chapters)} chapters)", flush=True)
    return result

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cache_dir = os.path.join(base_dir, "data", "raw", "cache")
    output_file = os.path.join(base_dir, "data", "raw", "chapters_raw.json")
    
    # Also check if scratch cache already has the pages to avoid refetching
    scratch_cache = r"C:\Users\havergal.samosir\.gemini\antigravity\brain\fa6e4ac6-8443-4490-98d5-8f94d00d4cb1\scratch\cache"
    if os.path.exists(scratch_cache) and not os.path.exists(cache_dir):
        import shutil
        print("[SETUP] Copying existing cached forum pages into data/raw/cache...", flush=True)
        shutil.copytree(scratch_cache, cache_dir, dirs_exist_ok=True)
        
    pages = fetch_pages(cache_dir)
    extract_chapters(pages, output_file)
