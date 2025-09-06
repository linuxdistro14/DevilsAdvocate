from flask import Flask, render_template, jsonify, request, session
import json
import random
from pathlib import Path
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'

# Initialize session data for card tracking
def init_session_data():
    """Initialize session data for tracking used cards"""
    if 'used_cards' not in session:
        session['used_cards'] = {
            'level_1': [],
            'level_2': [],
            'level_3': []
        }
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    if 'current_level' not in session:
        session['current_level'] = 1
    if 'round_wins' not in session:
        session['round_wins'] = {'player_1': 0, 'player_2': 0}

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
            data = json.load(f)
            return data
    
    # Fallback - return empty if file doesn't exist
    return {"cards": []}

# Load dare cards from JSON file
def load_dare_cards():
    """Load dare cards from the cards directory"""
    dare_cards_file = Path('cards/dare_cards.json')
    if dare_cards_file.exists():
        with open(dare_cards_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    return {"cards": []}

# Save cards to level-specific JSON file
def save_level_cards(cards_data, level):
    """Save cards to level-specific file"""
    level_files = {
        1: 'cards/easy_cards.json',
        2: 'cards/medium_cards.json',
        3: 'cards/hard_cards.json'
    }
    
    cards_file = level_files.get(level)
    if cards_file:
        Path('cards').mkdir(exist_ok=True)
        with open(cards_file, 'w', encoding='utf-8') as f:
            json.dump(cards_data, f, indent=2, ensure_ascii=False)

# Save dare cards to JSON file
def save_dare_cards(dare_cards_data):
    """Save dare cards to file"""
    Path('cards').mkdir(exist_ok=True)
    with open('cards/dare_cards.json', 'w', encoding='utf-8') as f:
        json.dump(dare_cards_data, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    """Render the main game page"""
    init_session_data()
    return render_template('index.html')

# Game state and level management endpoints
@app.route('/api/game/level-info', methods=['GET'])
def get_level_info():
    """Get level information and requirements"""
    level_info = {
        1: {
            'name': 'Level 1 - Easy',
            'target_score': 15,
            'description': 'First to 15 points wins the round'
        },
        2: {
            'name': 'Level 2 - Medium',
            'target_score': 24,
            'description': 'First to 24 points wins the round'
        },
        3: {
            'name': 'Level 3 - Hard',
            'target_score': 24,
            'description': 'First to 24 points wins the final round'
        }
    }
    return jsonify(level_info)

@app.route('/api/game/current-level', methods=['GET'])
def get_current_level():
    """Get the current game level"""
    init_session_data()
    return jsonify({'level': session.get('current_level', 1)})

@app.route('/api/game/current-level', methods=['POST'])
def set_current_level():
    """Set the current game level"""
    init_session_data()
    data = request.json
    session['current_level'] = data.get('level', 1)
    return jsonify({'status': 'success', 'level': session['current_level']})

@app.route('/api/game/round-wins', methods=['GET'])
def get_round_wins():
    """Get round win counts for both players"""
    init_session_data()
    return jsonify(session.get('round_wins', {'player_1': 0, 'player_2': 0}))

@app.route('/api/game/round-wins', methods=['POST'])
def update_round_wins():
    """Update round win counts"""
    init_session_data()
    data = request.json
    if 'player_1' in data:
        session['round_wins']['player_1'] = data['player_1']
    if 'player_2' in data:
        session['round_wins']['player_2'] = data['player_2']
    session.modified = True
    return jsonify({'status': 'success', 'round_wins': session['round_wins']})

@app.route('/api/game/reset-round-wins', methods=['POST'])
def reset_round_wins():
    """Reset round win counts"""
    init_session_data()
    session['round_wins'] = {'player_1': 0, 'player_2': 0}
    session.modified = True
    return jsonify({'status': 'success', 'round_wins': session['round_wins']})

# Card tracking endpoints
@app.route('/api/cards/used/<int:level>', methods=['GET'])
def get_used_cards(level):
    """Get list of used card IDs for a level"""
    init_session_data()
    level_key = f'level_{level}'
    return jsonify({'used_cards': session['used_cards'].get(level_key, [])})

@app.route('/api/cards/used/<int:level>', methods=['POST'])
def update_used_cards(level):
    """Update the list of used cards for a level"""
    init_session_data()
    data = request.json
    level_key = f'level_{level}'
    session['used_cards'][level_key] = data.get('used_cards', [])
    session.modified = True
    return jsonify({'status': 'success'})

@app.route('/api/cards/reset-used/<int:level>', methods=['POST'])
def reset_used_cards(level):
    """Reset used cards for a specific level"""
    init_session_data()
    level_key = f'level_{level}'
    session['used_cards'][level_key] = []
    session.modified = True
    return jsonify({'status': 'success'})

@app.route('/api/cards/reset-all-used', methods=['POST'])
def reset_all_used_cards():
    """Reset all used cards across all levels"""
    init_session_data()
    session['used_cards'] = {
        'level_1': [],
        'level_2': [],
        'level_3': []
    }
    session.modified = True
    return jsonify({'status': 'success'})

# Level-based card endpoints
@app.route('/api/cards/level/<int:level>', methods=['GET'])
def get_level_cards(level):
    """Get all cards for a specific level"""
    if level not in [1, 2, 3]:
        level = 1
    
    cards_data = load_level_cards(level)
    return jsonify(cards_data)

@app.route('/api/cards/level/<int:level>/available', methods=['GET'])
def get_available_level_cards(level):
    """Get available (unused) cards for a specific level"""
    init_session_data()
    
    if level not in [1, 2, 3]:
        level = 1
    
    cards_data = load_level_cards(level)
    all_cards = cards_data.get('cards', [])
    
    # Filter out used cards
    level_key = f'level_{level}'
    used_card_ids = session['used_cards'].get(level_key, [])
    available_cards = [c for c in all_cards if c.get('id') not in used_card_ids]
    
    # If no cards available, reset and return all cards
    if not available_cards and all_cards:
        session['used_cards'][level_key] = []
        session.modified = True
        available_cards = all_cards
    
    return jsonify({'cards': available_cards, 'total': len(all_cards), 'available': len(available_cards)})

@app.route('/api/cards/level/<int:level>/shuffle', methods=['GET'])
def get_shuffled_level_cards(level):
    """Get shuffled available cards for a specific level"""
    init_session_data()
    
    if level not in [1, 2, 3]:
        level = 1
    
    cards_data = load_level_cards(level)
    all_cards = cards_data.get('cards', [])
    
    # Filter out used cards
    level_key = f'level_{level}'
    used_card_ids = session['used_cards'].get(level_key, [])
    available_cards = [c for c in all_cards if c.get('id') not in used_card_ids]
    
    # If no cards available, reset and use all cards
    if not available_cards and all_cards:
        session['used_cards'][level_key] = []
        session.modified = True
        available_cards = all_cards
    
    # Shuffle available cards
    shuffled_cards = random.sample(available_cards, len(available_cards)) if available_cards else []
    
    return jsonify({
        'cards': shuffled_cards,
        'level': level,
        'total': len(all_cards),
        'available': len(shuffled_cards)
    })

# Dare card endpoints
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

# Card CRUD operations
@app.route('/api/cards/level/<int:level>', methods=['POST'])
def add_level_card(level):
    """Add a new card to specific level"""
    if level not in [1, 2, 3]:
        return jsonify({'error': 'Invalid level'}), 400
    
    cards_data = load_level_cards(level)
    new_card = request.json
    
    if not new_card.get('title') or not new_card.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400
    
    cards = cards_data.get('cards', [])
    new_id = max([c.get('id', 0) for c in cards], default=0) + 1
    new_card['id'] = new_id
    new_card['created_at'] = datetime.now().isoformat()
    
    # Set score values based on level
    level_scores = {1: 1, 2: 2, 3: 3}
    if new_card.get('type') == 'wild_card':
        new_card['scoreValue'] = 0
    else:
        new_card['scoreValue'] = level_scores.get(level, 1)
    
    cards.append(new_card)
    cards_data['cards'] = cards
    save_level_cards(cards_data, level)
    
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
            
            # Update score value based on level
            level_scores = {1: 1, 2: 2, 3: 3}
            if updated_card.get('type') == 'wild_card':
                updated_card['scoreValue'] = 0
            else:
                updated_card['scoreValue'] = level_scores.get(level, 1)
            
            cards[i] = updated_card
            cards_data['cards'] = cards
            save_level_cards(cards_data, level)
            return jsonify(cards[i])
    
    return jsonify({'error': 'Card not found'}), 404

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

# Dare card CRUD operations
@app.route('/api/dare-cards', methods=['POST'])
def add_dare_card():
    """Add a new dare card"""
    dare_cards_data = load_dare_cards()
    new_card = request.json
    
    if not new_card.get('title') or not new_card.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400
    
    dare_cards = dare_cards_data.get('cards', [])
    new_id = max([c.get('id', 0) for c in dare_cards], default=0) + 1
    new_card['id'] = new_id
    new_card['created_at'] = datetime.now().isoformat()
    new_card['type'] = 'dare'
    new_card['scoreValue'] = 0
    
    dare_cards.append(new_card)
    dare_cards_data['cards'] = dare_cards
    save_dare_cards(dare_cards_data)
    
    return jsonify(new_card), 201

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

# Session management
@app.route('/api/session/reset', methods=['POST'])
def reset_session():
    """Reset session data"""
    session.clear()
    init_session_data()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
