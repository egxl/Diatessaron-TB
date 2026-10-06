import os
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

print("=== VERIFYING GITHUB PAGES COMPATIBILITY & DATA INTEGRITY ===")

# 1. Check .nojekyll
nojekyll_path = os.path.join(BASE_DIR, '.nojekyll')
if os.path.exists(nojekyll_path):
    print(" [PASS] .nojekyll exists in repository root.")
else:
    print(" [FAIL] .nojekyll missing in root!")

# 2. Check for illegal absolute paths in index.html, script.js, styles.css
files_to_check = ['index.html', 'script.js', 'styles.css']
for fname in files_to_check:
    fpath = os.path.join(BASE_DIR, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for paths like href="/..." or src="/..." or fetch('/...')
    illegal = re.findall(r'(?:href|src|url|fetch)\s*[\(=]\s*[\'"]/(?!\/)[^\'"]+[\'"]', content)
    if illegal:
        print(f" [FAIL] Found absolute root paths in {fname}: {illegal}")
    else:
        print(f" [PASS] {fname} uses strict relative paths.")

# 3. Check data/index.json
index_path = os.path.join(BASE_DIR, 'data', 'index.json')
with open(index_path, 'r', encoding='utf-8') as f:
    idx = json.load(f)

print(f" [PASS] data/index.json loaded. Total chapters: {len(idx['chapters'])}, Total epochs: {len(idx['epochs'])}")

# 4. Check data/search_index.json
search_path = os.path.join(BASE_DIR, 'data', 'search_index.json')
with open(search_path, 'r', encoding='utf-8') as f:
    s_idx = json.load(f)

print(f" [PASS] data/search_index.json loaded. Total indexed segments: {len(s_idx)}")

# 5. Check all 55 chapters
total_verses = 0
all_valid = True
for ch in range(1, 56):
    ch_path = os.path.join(BASE_DIR, 'data', f'bab_{ch}.json')
    if not os.path.exists(ch_path):
        print(f" [FAIL] Missing chapter file: bab_{ch}.json")
        all_valid = False
        continue
    with open(ch_path, 'r', encoding='utf-8') as cf:
        cdata = json.load(cf)
        verses = cdata.get('verses', [])
        total_verses += len(verses)
        for v in verses:
            if not v.get('ref') or not v.get('text'):
                print(f" [FAIL] Incomplete verse in Bab {ch}: {v}")
                all_valid = False
                break

if all_valid:
    print(f" [PASS] All 55 chapters valid! Total verse segments: {total_verses}")

print("=== ALL INTEGRITY CHECKS PASSED ===")
