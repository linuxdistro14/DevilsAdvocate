from flask import Flask, render_template, jsonify, request, session
import json
import random
from pathlib import Path
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'

# Load cards from level-specific JSON files
def load_level_cards(level):
    """Load cards for a specific level"""
    level_files = {
        1: 'cards/easy_cards.json',
        2: 'cards/medium_cards.json', 
        3: 'cards/hard_cards.json'
    }
    
    cards_file = Path(level_files.get(level, 'cards/easy_cards.json'))
    if cards_file.exists():
        with open(cards_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"cards": []}

# Load dare cards from JSON file
def load_dare_cards():
    dare_cards_file = Path('cards/dare_cards.json')
    if dare_cards_file.exists():
        with open(dare_cards_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"cards": []}

# Save cards to level-specific JSON file
def save_level_cards(cards_data, level):
    level_files = {
        1: 'cards/easy_cards.json',
        2: 'cards/medium_cards.json',
        3: 'cards/hard_cards.json'
    }
    
    cards_file = level_files.get(level)
    if cards_file:
        with open(cards_file, 'w', encoding='utf-8') as f:
            json.dump(cards_data, f, indent=2, ensure_ascii=False)

# Save dare cards to JSON file
def save_dare_cards(dare_cards_data):
    with open('cards/dare_cards.json', 'w', encoding='utf-8') as f:
        json.dump(dare_cards_data, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    # Initialize session ID if not exists
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    return render_template('index.html')

@app.route('/api/cards/level/<int:level>', methods=['GET'])
def get_level_cards(level):
    """Get all cards for a specific level"""
    if level not in [1, 2, 3]:
        return jsonify({'error': 'Invalid level'}), 400
    
    cards_data = load_level_cards(level)
    return jsonify(cards_data)

@app.route('/api/cards/level/<int:level>/shuffle', methods=['GET'])
def get_shuffled_level_cards(level):
    """Get shuffled deck for a specific level"""
    if level not in [1, 2, 3]:
        return jsonify({'error': 'Invalid level'}), 400
    
    cards_data = load_level_cards(level)
    cards = cards_data.get('cards', [])
    shuffled_cards = random.sample(cards, len(cards)) if cards else []
    return jsonify({'cards': shuffled_cards, 'level': level})

@app.route('/api/dare-cards', methods=['GET'])
def get_dare_cards():
    """Get all dare cards"""
    dare_cards_data = load_dare_cards()
    return jsonify(dare_cards_data)

@app.route('/api/dare-cards/shuffle', methods=['GET'])
def get_shuffled_dare_cards():
    """Get shuffled deck of dare cards"""
    dare_cards_data = load_dare_cards()
    dare_cards = dare_cards_data.get('cards', [])
    shuffled_dare_cards = random.sample(dare_cards, len(dare_cards)) if dare_cards else []
    return jsonify({'cards': shuffled_dare_cards})

@app.route('/api/cards/<int:card_id>/level/<int:level>', methods=['GET'])
def get_level_card(card_id, level):
    """Get specific card by ID from level"""
    if level not in [1, 2, 3]:
        return jsonify({'error': 'Invalid level'}), 400
    
    cards_data = load_level_cards(level)
    cards = cards_data.get('cards', [])
    for card in cards:
        if card['id'] == card_id:
            return jsonify(card)
    return jsonify({'error': 'Card not found'}), 404

@app.route('/api/dare-cards/<int:card_id>', methods=['GET'])
def get_dare_card(card_id):
    """Get specific dare card by ID"""
    dare_cards_data = load_dare_cards()
    dare_cards = dare_cards_data.get('cards', [])
    for card in dare_cards:
        if card['id'] == card_id:
            return jsonify(card)
    return jsonify({'error': 'Dare card not found'}), 404

@app.route('/api/cards/level/<int:level>', methods=['POST'])
def add_level_card(level):
    """Add a new card to specific level"""
    if level not in [1, 2, 3]:
        return jsonify({'error': 'Invalid level'}), 400
    
    cards_data = load_level_cards(level)
    new_card = request.json
    
    # Validate required fields
    if not new_card.get('title') or not new_card.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400
    
    # Generate new ID
    cards = cards_data.get('cards', [])
    new_id = max([c.get('id', 0) for c in cards], default=0) + 1
    new_card['id'] = new_id
    new_card['created_at'] = datetime.now().isoformat()
    
    # Set level-specific attributes
    new_card['level'] = f'level {level}'
    
    # Assign score value based on level
    level_scores = {1: 1, 2: 2, 3: 4}
    if new_card.get('type') == 'wild_card':
        new_card['scoreValue'] = 0
    else:
        new_card['scoreValue'] = level_scores.get(level, 1)
    
    cards.append(new_card)
    cards_data['cards'] = cards
    save_level_cards(cards_data, level)
    
    return jsonify(new_card), 201

@app.route('/api/dare-cards', methods=['POST'])
def add_dare_card():
    """Add a new dare card"""
    dare_cards_data = load_dare_cards()
    new_card = request.json
    
    # Validate required fields
    if not new_card.get('title') or not new_card.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400
    
    # Generate new ID
    dare_cards = dare_cards_data.get('cards', [])
    new_id = max([c.get('id', 0) for c in dare_cards], default=0) + 1
    new_card['id'] = new_id
    new_card['created_at'] = datetime.now().isoformat()
    new_card['type'] = 'dare'
    new_card['scoreValue'] = 0  # Dare cards don't award points
    
    dare_cards.append(new_card)
    dare_cards_data['cards'] = dare_cards
    save_dare_cards(dare_cards_data)
    
    return jsonify(new_card), 201

@app.route('/api/cards/<int:card_id>/level/<int:level>', methods=['PUT'])
def update_level_card(card_id, level):
    """Update existing card in specific level"""
    if level not in [1, 2, 3]:
        return jsonify({'error': 'Invalid level'}), 400
    
    cards_data = load_level_cards(level)
    cards = cards_data.get('cards', [])
    
    for i, card in enumerate(cards):
        if card['id'] == card_id:
            updated_card = {**card, **request.json, 'id': card_id}
            updated_card['updated_at'] = datetime.now().isoformat()
            updated_card['level'] = f'level {level}'
            
            # Update score value based on level
            level_scores = {1: 1, 2: 2, 3: 4}
            if updated_card.get('type') == 'wild_card':
                updated_card['scoreValue'] = 0
            else:
                updated_card['scoreValue'] = level_scores.get(level, 1)
            
            cards[i] = updated_card
            cards_data['cards'] = cards
            save_level_cards(cards_data, level)
            return jsonify(cards[i])
    
    return jsonify({'error': 'Card not found'}), 404

@app.route('/api/dare-cards/<int:card_id>', methods=['PUT'])
def update_dare_card(card_id):
    """Update existing dare card"""
    dare_cards_data = load_dare_cards()
    dare_cards = dare_cards_data.get('cards', [])
    
    for i, card in enumerate(dare_cards):
        if card['id'] == card_id:
            updated_card = {**card, **request.json, 'id': card_id}
            updated_card['updated_at'] = datetime.now().isoformat()
            updated_card['type'] = 'dare'
            updated_card['scoreValue'] = 0
            
            dare_cards[i] = updated_card
            dare_cards_data['cards'] = dare_cards
            save_dare_cards(dare_cards_data)
            return jsonify(dare_cards[i])
    
    return jsonify({'error': 'Dare card not found'}), 404

@app.route('/api/cards/<int:card_id>/level/<int:level>', methods=['DELETE'])
def delete_level_card(card_id, level):
    """Delete a card from specific level"""
    if level not in [1, 2, 3]:
        return jsonify({'error': 'Invalid level'}), 400
    
    cards_data = load_level_cards(level)
    cards = cards_data.get('cards', [])
    
    original_length = len(cards)
    cards_data['cards'] = [c for c in cards if c['id'] != card_id]
    
    if len(cards_data['cards']) < original_length:
        save_level_cards(cards_data, level)
        return jsonify({'message': 'Card deleted successfully'}), 200
    
    return jsonify({'error': 'Card not found'}), 404

@app.route('/api/dare-cards/<int:card_id>', methods=['DELETE'])
def delete_dare_card(card_id):
    """Delete a dare card"""
    dare_cards_data = load_dare_cards()
    dare_cards = dare_cards_data.get('cards', [])
    
    original_length = len(dare_cards)
    dare_cards_data['cards'] = [c for c in dare_cards if c['id'] != card_id]
    
    if len(dare_cards_data['cards']) < original_length:
        save_dare_cards(dare_cards_data)
        return jsonify({'message': 'Dare card deleted successfully'}), 200
    
    return jsonify({'error': 'Dare card not found'}), 404

@app.route('/api/game/level-info', methods=['GET'])
def get_level_info():
    """Get level information and requirements"""
    level_info = {
        1: {'name': 'Level 1 - Easy', 'target_score': 15, 'card_count': 15},
        2: {'name': 'Level 2 - Medium', 'target_score': 24, 'card_count': 12}, 
        3: {'name': 'Level 3 - Hard', 'target_score': 24, 'card_count': 8}
    }
    return jsonify(level_info)

@app.route('/api/session/progress', methods=['POST'])
def save_progress():
    """Save current session progress"""
    progress_data = request.json
    session['progress'] = progress_data
    return jsonify({'status': 'saved'}), 200

@app.route('/api/session/progress', methods=['GET'])
def get_progress():
    """Get current session progress"""
    return jsonify(session.get('progress', {}))

@app.route('/api/game/state', methods=['POST'])
def save_game_state():
    """Save current game state"""
    game_state = request.json
    session['game_state'] = game_state
    return jsonify({'status': 'saved'}), 200

@app.route('/api/game/state', methods=['GET'])
def get_game_state():
    """Get current game state"""
    return jsonify(session.get('game_state', {}))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
