import os
import re
import sys
import json
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')

class ForumChapterParser(HTMLParser):
    def __init__(self, chapter_num):
        super().__init__()
        self.chapter_num = chapter_num
        self.color_stack = []
        
        self.chapter_title = f"BAB {chapter_num}"
        self.current_diatessaron_verse = None
        self.current_ref = None
        self.current_page = None
        
        self.current_text = []
        self.segments = []
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        style = attrs_dict.get('style', '')
        
        # Check for color attribute in style
        color_match = re.search(r'color:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})', style)
        if color_match:
            c = color_match.group(1).upper()
            self.color_stack.append(c)
        else:
            self.color_stack.append(None)
            
        if tag == 'br':
            self.flush_text()
            
    def handle_endtag(self, tag):
        if self.color_stack:
            self.color_stack.pop()
            
    def get_active_color(self):
        for c in reversed(self.color_stack):
            if c is not None:
                return c
        return None

    def flush_text(self):
        if self.current_text:
            raw_t = "".join(self.current_text)
            
            # Extract and update any [Arabic, p. X] markers embedded in text
            pages = re.findall(r'\[Arabic,\s*p\.\s*(\d+)\]', raw_t)
            if pages:
                self.current_page = int(pages[-1])
            
            # Remove [Arabic, p. X] from display text
            cleaned_t = re.sub(r'\[Arabic,\s*p\.\s*\d+\]', '', raw_t)
            cleaned_t = re.sub(r'\s+', ' ', cleaned_t).strip()
            
            if cleaned_t:
                self.segments.append({
                    "id": len(self.segments) + 1,
                    "diatessaron_verse": self.current_diatessaron_verse,
                    "ref": self.current_ref,
                    "arabic_page": self.current_page,
                    "text": cleaned_t
                })
            self.current_text = []

    def handle_data(self, data):
        active_color = self.get_active_color()
        text = data.strip()
        
        # If whitespace only
        if not text:
            if self.current_text and data:
                self.current_text.append(" ")
            return
            
        # Check if text contains [Arabic, p. X] standalone
        page_match = re.match(r'^\[Arabic,\s*p\.\s*(\d+)\]$', text)
        if page_match:
            self.current_page = int(page_match.group(1))
            return
            
        if active_color in ['#BF0000', '#800000']:
            # Chapter header (e.g. "BAB 1")
            self.flush_text()
            self.chapter_title = text
        elif active_color in ['#FF0000', '#FF0040']:
            # Diatessaron Section Verse Number (e.g. "1", "2,3", "4")
            self.flush_text()
            self.current_diatessaron_verse = text
        elif active_color in ['#0000FF', '#0040FF', '#004000']:
            # Canonical Scripture Reference (e.g. "John 1:1")
            self.flush_text()
            cleaned_ref = text.strip('[] ')
            self.current_ref = cleaned_ref
        else:
            # Regular Scripture Text
            # In case [Arabic, p. X] is in data
            pages = re.findall(r'\[Arabic,\s*p\.\s*(\d+)\]', data)
            if pages:
                self.current_page = int(pages[-1])
            self.current_text.append(data)


def parse_all_chapters(raw_file, output_data_dir):
    with open(raw_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    chapters = data.get("chapters", [])
    index_chapters = []
    
    os.makedirs(output_data_dir, exist_ok=True)
    
    for ch in chapters:
        ch_num = ch["chapter"]
        parser = ForumChapterParser(ch_num)
        parser.feed(ch["raw_html"])
        parser.flush_text()
        
        # Extract unique canonical references and books
        refs = [s["ref"] for s in parser.segments if s["ref"]]
        books = set()
        for r in refs:
            # e.g. "Luke 1:5" -> "Luke"
            b_match = re.match(r'^([1-3]?\s*[A-Za-z]+)', r)
            if b_match:
                books.add(b_match.group(1).strip())
                
        d_verses = [s["diatessaron_verse"] for s in parser.segments if s["diatessaron_verse"]]
        verse_range = ""
        if d_verses:
            verse_range = f"{d_verses[0]} - {d_verses[-1]}"
            
        provenance = {
            "source_forum": "SarapanPagi Biblika Ministry",
            "thread_title": "DIATESSARON (Versi Bahasa Indonesia, LAI-TB)",
            "post_id": ch.get("post_id"),
            "post_url": ch.get("post_url"),
            "page_url": ch.get("page_url"),
            "posted_at": ch.get("posted_at"),
            "author": ch.get("author", {
                "name": "fajaryehuda",
                "profile_url": "https://www.sarapanpagi.org/member24358.html"
            })
        }
        
        chapter_dict = {
            "id": ch_num,
            "title": f"BAB {ch_num}",
            "provenance": provenance,
            "canonical_books": sorted(list(books)),
            "total_segments": len(parser.segments),
            "diatessaron_verse_range": verse_range,
            "verses": parser.segments
        }
        
        # Write bab_{id}.json
        ch_filename = f"bab_{ch_num}.json"
        ch_filepath = os.path.join(output_data_dir, ch_filename)
        with open(ch_filepath, "w", encoding="utf-8") as f:
            json.dump(chapter_dict, f, indent=2, ensure_ascii=False)
            
        index_chapters.append({
            "id": ch_num,
            "title": f"BAB {ch_num}",
            "file": ch_filename,
            "canonical_books": sorted(list(books)),
            "total_segments": len(parser.segments),
            "diatessaron_verse_range": verse_range,
            "post_url": ch.get("post_url"),
            "posted_at": ch.get("posted_at")
        })

    intro_metadata = data.get("intro", {})
    index_dict = {
        "title": "Diatessaron (LAI-TB)",
        "subtitle": "Harmoni Empat Injil oleh Tatianus (Versi Bahasa Indonesia, LAI-TB)",
        "source": {
            "forum": "SarapanPagi Biblika Ministry",
            "thread_url": "https://www.sarapanpagi.org/diatessaron-versi-bahasa-indonesia-lai-tb-vt8647.html",
            "author": {
                "name": "fajaryehuda",
                "profile_url": "https://www.sarapanpagi.org/member24358.html"
            },
            "thread_title": "DIATESSARON (Versi Bahasa Indonesia, LAI-TB)",
            "intro_post": {
                "post_id": intro_metadata.get("post_id"),
                "post_url": intro_metadata.get("post_url"),
                "posted_at": intro_metadata.get("posted_at")
            }
        },
        "total_chapters": len(index_chapters),
        "chapters": index_chapters
    }
    
    index_filepath = os.path.join(output_data_dir, "index.json")
    with open(index_filepath, "w", encoding="utf-8") as f:
        json.dump(index_dict, f, indent=2, ensure_ascii=False)
        
    print(f"[SUCCESS] Parsed and saved all {len(index_chapters)} chapters to {output_data_dir}!", flush=True)


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_file = os.path.join(base_dir, "data", "raw", "chapters_raw.json")
    data_dir = os.path.join(base_dir, "data")
    parse_all_chapters(raw_file, data_dir)
