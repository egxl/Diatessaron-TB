import json
import re
import sys

def parse_text(file_path):
    chapters = []
    current_chapter = None
    
    # Regex for verse line: "6 Luke 1:5 Pada zaman Herodes..."
    # Allowing for flexible whitespace
    # Group 1: ID (digits)
    # Group 2: Ref (Book Chapter:Verse) - assuming greedy match until text starts?
    # Actually, ref can be "Luke 1:5".
    # Pattern: ^(\d+)\s+(.+?)\s+(.*)$
    # Wait, simple regex might capture too much in ref if not careful.
    # User example: "6 Luke 1:5 Pada zaman Herodes..."
    # Let's assume Ref ends with digits:digits usually.
    
    verse_pattern = re.compile(r'^(\d+)\s+(.+?\d+:\d+(?:-\d+)?)\s+(.*)$')
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for Chapter Header
            if line.upper().startswith("BAB"):
                if current_chapter:
                    chapters.append(current_chapter)
                current_chapter = {"title": line, "verses": []}
                continue
                
            # Parse Verse
            match = verse_pattern.match(line)
            if match:
                verse_id = int(match.group(1))
                ref = match.group(2)
                text = match.group(3)
                
                verse_obj = {
                    "id": verse_id,
                    "ref": ref,
                    "text": text
                }
                
                if current_chapter:
                    current_chapter["verses"].append(verse_obj)
                else:
                    # Fallback if text starts without a BAB header
                    if not chapters: # Create a default chapter if none exists
                         current_chapter = {"title": "Unknown Chapter", "verses": []}
                         current_chapter["verses"].append(verse_obj)
            else:
                 # Handle lines that might be continuation or just don't match (optional logging)
                 pass

        if current_chapter:
            chapters.append(current_chapter)
            
        return {"chapters": chapters}

    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
        return None

def save_json(data, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Data saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parser.py <input_text_file>")
        sys.exit(1)
        
    input_file = sys.argv[1]
    parsed_data = parse_text(input_file)
    
    if parsed_data:
        save_json(parsed_data, "data.json")
