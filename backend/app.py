from flask import Flask, request, jsonify
import spacy
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from flask_cors import CORS

app = Flask(__name__)
# Use the simplest CORS configuration that works in our test server
CORS(app)

logger.info("Loading spaCy model 'en_core_web_sm'...")
nlp = spacy.load("en_core_web_sm")
logger.info("spaCy model loaded.")

# Load the Anglish wordbook JSON
def load_wordbook(file_path):
    logger.info(f"Attempting to load wordbook from {file_path}")
    try:
        df = pd.read_json(file_path)
        word_map = {}
        for index, row in df.iterrows():
            word = row['word'].lower()
            entries = row['entries']
            
            for entry in entries:
                original_word = entry['original'].lower()
                attested_raw = entry.get('attested', [])
                unattested_raw = entry.get('unattested', [])

                attested_suggestions = []
                if isinstance(attested_raw, list):
                    # If it's a list, join elements and then split by comma
                    temp_string = "".join(str(s) for s in attested_raw)
                    attested_suggestions.extend([w.strip().lower() for w in temp_string.split(',') if w.strip()])
                elif isinstance(attested_raw, str):
                    # If it's a string, split by comma
                    attested_suggestions.extend([w.strip().lower() for w in attested_raw.split(',') if w.strip()])
                attested = attested_suggestions

                unattested_suggestions = []
                if isinstance(unattested_raw, list):
                    # If it's a list, join elements and then split by comma
                    temp_string = "".join(str(s) for s in unattested_raw)
                    unattested_suggestions.extend([w.strip().lower() for w in temp_string.split(',') if w.strip()])
                elif isinstance(unattested_raw, str):
                    # If it's a string, split by comma
                    unattested_suggestions.extend([w.strip().lower() for w in unattested_raw.split(',') if w.strip()])
                unattested = unattested_suggestions
                
                # Add original word and its attested synonyms to the map
                if original_word not in word_map:
                    word_map[original_word] = {'attested': [], 'unattested': []}
                word_map[original_word]['attested'].extend(attested)
                word_map[original_word]['unattested'].extend(unattested)

                # Add attested words to the map, linking back to original's suggestions
                for att in attested:
                    if att not in word_map:
                        word_map[att] = {'attested': [], 'unattested': []}
                    word_map[att]['attested'].extend(attested)
                    word_map[att]['unattested'].extend(unattested)

        logger.info("Wordbook loaded successfully.")
        return word_map
    except Exception as e:
        logger.error(f"Error loading wordbook: {e}")
        return {}

WORDBOOK = load_wordbook('/Users/juan/Documents/code/anglish/anglish_wordbook.json')

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze_text():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        logger.info("Received OPTIONS request")
        return '', 200
        
    logger.info("Received request to analyze text.")
    data = request.get_json()
    text = data.get('text', '')
    logger.info(f"Analyzing text: {text[:50]}...") # Log first 50 chars of text

    doc = nlp(text)
    matches = []

    for token in doc:
        # Check for exact match of the token itself
        if token.text.lower() in WORDBOOK:
            matches.append({
                'word': token.text,
                'start': token.idx,
                'end': token.idx + len(token.text),
                'suggestions': WORDBOOK[token.text.lower()]
            })
        else:
            # Check if any attested/unattested forms match the token
            for original_word, suggestions in WORDBOOK.items():
                if token.text.lower() in suggestions['attested'] or \
                   token.text.lower() in suggestions['unattested']:
                    matches.append({
                        'word': token.text,
                        'start': token.idx,
                        'end': token.idx + len(token.text),
                        'suggestions': suggestions
                    })
                    break # Found a match, move to next token

    logger.info(f"Analysis complete. Found {len(matches)} matches.")
    return jsonify({'original_text': text, 'matches': matches})



if __name__ == '__main__':
    logger.info("Starting Flask application...")
    # Try a different port since 5000 might be in use
    app.run(debug=True, port=5002)