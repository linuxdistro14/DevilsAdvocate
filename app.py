from flask import Flask, render_template, jsonify, request, session
import json
import random
from pathlib import Path
from datetime import datetime
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'

# Load cards from JSON file
def load_cards():
    cards_file = Path('cards.json')
    if cards_file.exists():
        try:
            with open(cards_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.info(f"Loaded {len(data.get('cards', []))} main cards")
                return data
        except (json.JSONDecodeError, FileNotFoundError) as e:
            logger.error(f"Error loading cards: {e}")
            return {"cards": []}
    return {"cards": []}

# Load dare cards from JSON file (separate from main deck)
def load_dare_cards():
    dare_cards_file = Path('dare_cards.json')
    if dare_cards_file.exists():
        try:
            with open(dare_cards_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.info(f"Loaded {len(data.get('cards', []))} dare cards")
                return data
        except (json.JSONDecodeError, FileNotFoundError) as e:
            logger.error(f"Error loading dare cards: {e}")
            return {"cards": []}
    return {"cards": []}

# Save cards to JSON file
def save_cards(cards_data):
    try:
        with open('cards.json', 'w', encoding='utf-8') as f:
            json.dump(cards_data, f, indent=2, ensure_ascii=False)
        logger.info("Main cards saved successfully")
    except Exception as e:
        logger.error(f"Error saving cards: {e}")
        raise

# Save dare cards to JSON file
def save_dare_cards(dare_cards_data):
    try:
        with open('dare_cards.json', 'w', encoding='utf-8') as f:
            json.dump(dare_cards_data, f, indent=2, ensure_ascii=False)
        logger.info("Dare cards saved successfully")
    except Exception as e:
        logger.error(f"Error saving dare cards: {e}")
        raise

@app.route('/')
def index():
    # Initialize session ID if not exists
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    return render_template('index.html')

@app.route('/api/cards', methods=['GET'])
def get_cards():
    """Get all main cards (excludes dare cards)"""
    try:
        cards_data = load_cards()
        return jsonify(cards_data)
    except Exception as e:
        logger.error(f"Error getting cards: {e}")
        return jsonify({'error': 'Failed to load cards'}), 500

@app.route('/api/dare-cards', methods=['GET'])
def get_dare_cards():
    """Get all dare cards (separate from main deck)"""
    try:
        dare_cards_data = load_dare_cards()
        return jsonify(dare_cards_data)
    except Exception as e:
        logger.error(f"Error getting dare cards: {e}")
        return jsonify({'error': 'Failed to load dare cards'}), 500

@app.route('/api/cards/shuffle', methods=['GET'])
def get_shuffled_cards():
    """Get shuffled deck of main cards only"""
    try:
        cards_data = load_cards()
        cards = cards_data.get('cards', [])
        shuffled_cards = random.sample(cards, len(cards)) if cards else []
        return jsonify({'cards': shuffled_cards})
    except Exception as e:
        logger.error(f"Error shuffling cards: {e}")
        return jsonify({'error': 'Failed to shuffle cards'}), 500

@app.route('/api/dare-cards/shuffle', methods=['GET'])
def get_shuffled_dare_cards():
    """Get shuffled deck of dare cards"""
    try:
        dare_cards_data = load_dare_cards()
        dare_cards = dare_cards_data.get('cards', [])
        shuffled_dare_cards = random.sample(dare_cards, len(dare_cards)) if dare_cards else []
        return jsonify({'cards': shuffled_dare_cards})
    except Exception as e:
        logger.error(f"Error shuffling dare cards: {e}")
        return jsonify({'error': 'Failed to shuffle dare cards'}), 500

@app.route('/api/cards/<int:card_id>', methods=['GET'])
def get_card(card_id):
    """Get specific main card by ID"""
    try:
        cards_data = load_cards()
        cards = cards_data.get('cards', [])
        for card in cards:
            if card['id'] == card_id:
                return jsonify(card)
        return jsonify({'error': 'Card not found'}), 404
    except Exception as e:
        logger.error(f"Error getting card {card_id}: {e}")
        return jsonify({'error': 'Failed to get card'}), 500

@app.route('/api/dare-cards/<int:card_id>', methods=['GET'])
def get_dare_card(card_id):
    """Get specific dare card by ID"""
    try:
        dare_cards_data = load_dare_cards()
        dare_cards = dare_cards_data.get('cards', [])
        for card in dare_cards:
            if card['id'] == card_id:
                return jsonify(card)
        return jsonify({'error': 'Dare card not found'}), 404
    except Exception as e:
        logger.error(f"Error getting dare card {card_id}: {e}")
        return jsonify({'error': 'Failed to get dare card'}), 500

@app.route('/api/cards', methods=['POST'])
def add_card():
    """Add a new main card"""
    try:
        cards_data = load_cards()
        new_card = request.json
        
        # Validate required fields
        if not new_card.get('title') or not new_card.get('content'):
            return jsonify({'error': 'Title and content are required'}), 400
        
        # Sanitize input
        new_card['title'] = new_card['title'].strip()[:50]
        new_card['content'] = new_card['content'].strip()[:300]
        
        # Generate new ID
        cards = cards_data.get('cards', [])
        new_id = max([c.get('id', 0) for c in cards], default=0) + 1
        new_card['id'] = new_id
        new_card['created_at'] = datetime.now().isoformat()
        
        # Assign score value based on type and level
        card_type = new_card.get('type', 'truth')
        card_level = new_card.get('level', 'level 1')
        
        score_values = {
            'truth': {'level 1': 1, 'level 2': 2, 'level 3': 4},
            'dare': {'level 1': 1, 'level 2': 2, 'level 3': 4},
            'never_ever': {'level 1': 1, 'level 2': 2, 'level 3': 4},
            'kink': {'level 1': 2, 'level 2': 4, 'level 3': 6},
            'wild_card': {'level 1': 0, 'level 2': 0, 'level 3': 0}
        }
        
        new_card['scoreValue'] = score_values.get(card_type, {}).get(card_level, 1)
        
        cards.append(new_card)
        cards_data['cards'] = cards
        save_cards(cards_data)
        
        return jsonify(new_card), 201
    except Exception as e:
        logger.error(f"Error adding card: {e}")
        return jsonify({'error': 'Failed to add card'}), 500

@app.route('/api/dare-cards', methods=['POST'])
def add_dare_card():
    """Add a new dare card"""
    try:
        dare_cards_data = load_dare_cards()
        new_card = request.json
        
        # Validate required fields
        if not new_card.get('title') or not new_card.get('content'):
            return jsonify({'error': 'Title and content are required'}), 400
        
        # Sanitize input
        new_card['title'] = new_card['title'].strip()[:50]
        new_card['content'] = new_card['content'].strip()[:300]
        
        # Generate new ID
        dare_cards = dare_cards_data.get('cards', [])
        new_id = max([c.get('id', 0) for c in dare_cards], default=0) + 1
        new_card['id'] = new_id
        new_card['created_at'] = datetime.now().isoformat()
        new_card['type'] = 'dare'
        new_card['scoreValue'] = 0  # Dare cards don't award points
        
        # Set default difficulty if not provided
        if 'difficulty' not in new_card:
            new_card['difficulty'] = 'easy'
        
        dare_cards.append(new_card)
        dare_cards_data['cards'] = dare_cards
        save_dare_cards(dare_cards_data)
        
        return jsonify(new_card), 201
    except Exception as e:
        logger.error(f"Error adding dare card: {e}")
        return jsonify({'error': 'Failed to add dare card'}), 500

@app.route('/api/cards/<int:card_id>', methods=['PUT'])
def update_card(card_id):
    """Update existing main card"""
    try:
        cards_data = load_cards()
        cards = cards_data.get('cards', [])
        
        for i, card in enumerate(cards):
            if card['id'] == card_id:
                updated_data = request.json
                
                # Sanitize input
                if 'title' in updated_data:
                    updated_data['title'] = updated_data['title'].strip()[:50]
                if 'content' in updated_data:
                    updated_data['content'] = updated_data['content'].strip()[:300]
                
                updated_card = {**card, **updated_data, 'id': card_id}
                updated_card['updated_at'] = datetime.now().isoformat()
                
                # Update score value if type or level changed
                if 'type' in updated_data or 'level' in updated_data:
                    card_type = updated_card.get('type', 'truth')
                    card_level = updated_card.get('level', 'level 1')
                    
                    score_values = {
                        'truth': {'level 1': 1, 'level 2': 2, 'level 3': 4},
                        'dare': {'level 1': 1, 'level 2': 2, 'level 3': 4},
                        'never_ever': {'level 1': 1, 'level 2': 2, 'level 3': 4},
                        'kink': {'level 1': 2, 'level 2': 4, 'level 3': 6},
                        'wild_card': {'level 1': 0, 'level 2': 0, 'level 3': 0}
                    }
                    
                    updated_card['scoreValue'] = score_values.get(card_type, {}).get(card_level, 1)
                
                cards[i] = updated_card
                cards_data['cards'] = cards
                save_cards(cards_data)
                return jsonify(cards[i])
        
        return jsonify({'error': 'Card not found'}), 404
    except Exception as e:
        logger.error(f"Error updating card {card_id}: {e}")
        return jsonify({'error': 'Failed to update card'}), 500

@app.route('/api/dare-cards/<int:card_id>', methods=['PUT'])
def update_dare_card(card_id):
    """Update existing dare card"""
    try:
        dare_cards_data = load_dare_cards()
        dare_cards = dare_cards_data.get('cards', [])
        
        for i, card in enumerate(dare_cards):
            if card['id'] == card_id:
                updated_data = request.json
                
                # Sanitize input
                if 'title' in updated_data:
                    updated_data['title'] = updated_data['title'].strip()[:50]
                if 'content' in updated_data:
                    updated_data['content'] = updated_data['content'].strip()[:300]
                
                updated_card = {**card, **updated_data, 'id': card_id}
                updated_card['updated_at'] = datetime.now().isoformat()
                updated_card['type'] = 'dare'
                updated_card['scoreValue'] = 0
                
                dare_cards[i] = updated_card
                dare_cards_data['cards'] = dare_cards
                save_dare_cards(dare_cards_data)
                return jsonify(dare_cards[i])
        
        return jsonify({'error': 'Dare card not found'}), 404
    except Exception as e:
        logger.error(f"Error updating dare card {card_id}: {e}")
        return jsonify({'error': 'Failed to update dare card'}), 500

@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    """Delete a main card"""
    try:
        cards_data = load_cards()
        cards = cards_data.get('cards', [])
        
        original_length = len(cards)
        cards_data['cards'] = [c for c in cards if c['id'] != card_id]
        
        if len(cards_data['cards']) < original_length:
            save_cards(cards_data)
            return jsonify({'message': 'Card deleted successfully'}), 200
        
        return jsonify({'error': 'Card not found'}), 404
    except Exception as e:
        logger.error(f"Error deleting card {card_id}: {e}")
        return jsonify({'error': 'Failed to delete card'}), 500

@app.route('/api/dare-cards/<int:card_id>', methods=['DELETE'])
def delete_dare_card(card_id):
    """Delete a dare card"""
    try:
        dare_cards_data = load_dare_cards()
        dare_cards = dare_cards_data.get('cards', [])
        
        original_length = len(dare_cards)
        dare_cards_data['cards'] = [c for c in dare_cards if c['id'] != card_id]
        
        if len(dare_cards_data['cards']) < original_length:
            save_dare_cards(dare_cards_data)
            return jsonify({'message': 'Dare card deleted successfully'}), 200
        
        return jsonify({'error': 'Dare card not found'}), 404
    except Exception as e:
        logger.error(f"Error deleting dare card {card_id}: {e}")
        return jsonify({'error': 'Failed to delete dare card'}), 500

@app.route('/api/session/progress', methods=['POST'])
def save_progress():
    """Save current session progress"""
    try:
        progress_data = request.json
        session['progress'] = progress_data
        return jsonify({'status': 'saved'}), 200
    except Exception as e:
        logger.error(f"Error saving progress: {e}")
        return jsonify({'error': 'Failed to save progress'}), 500

@app.route('/api/session/progress', methods=['GET'])
def get_progress():
    """Get current session progress"""
    return jsonify(session.get('progress', {}))

@app.route('/api/game/state', methods=['POST'])
def save_game_state():
    """Save current game state"""
    try:
        game_state = request.json
        session['game_state'] = game_state
        return jsonify({'status': 'saved'}), 200
    except Exception as e:
        logger.error(f"Error saving game state: {e}")
        return jsonify({'error': 'Failed to save game state'}), 500

@app.route('/api/game/state', methods=['GET'])
def get_game_state():
    """Get current game state"""
    return jsonify(session.get('game_state', {}))

@app.route('/api/stats', methods=['GET'])
def get_game_stats():
    """Get game statistics"""
    try:
        cards_data = load_cards()
        dare_cards_data = load_dare_cards()
        
        stats = {
            'total_cards': len(cards_data.get('cards', [])),
            'total_dare_cards': len(dare_cards_data.get('cards', [])),
            'card_types': {},
            'dare_difficulties': {}
        }
        
        # Count card types
        for card in cards_data.get('cards', []):
            card_type = card.get('type', 'unknown')
            stats['card_types'][card_type] = stats['card_types'].get(card_type, 0) + 1
        
        # Count dare difficulties
        for card in dare_cards_data.get('cards', []):
            difficulty = card.get('difficulty', 'unknown')
            stats['dare_difficulties'][difficulty] = stats['dare_difficulties'].get(difficulty, 0) + 1
        
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': 'Failed to get stats'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
