# 🃏 Devils Advocate - Adult Couples Card Game

A sophisticated, progressive web application featuring an intimate card game designed for adult couples. The game includes a comprehensive level-based progression system with persistent scoring and intelligent content management.

## 📋 Table of Contents

- [Features](#-features)
- [Level Progression System](#-level-progression-system)
- [Installation & Setup](#-installation--setup)
  - [Windows CLI Setup](#windows-cli-setup)
  - [GitHub Codespaces Setup](#github-codespaces-setup)
- [Usage](#-usage)
- [Game Mechanics](#-game-mechanics)
- [API Endpoints](#-api-endpoints)
- [File Structure](#-file-structure)
- [Contributing](#-contributing)
- [License](#-license)

## 🎮 Features

### Core Gameplay
- **Two-Player Turn-Based System**: Interactive card-based gameplay for couples
- **Progressive Difficulty**: 3-tier level system (Easy → Medium → Hard)
- **Multiple Card Types**: Truth, Dare, Never Have I Ever, Kink, and Wild Cards
- **Scoring System**: Points-based progression with level-specific targets
- **Wildcard Mechanics**: Strategic gameplay elements with opponent targeting

### Advanced Features
- **Level Progression**: Automatic advancement through difficulty tiers
- **Persistent Progress**: Round wins tracking across sessions
- **Card Repeat Prevention**: Smart tracking prevents seeing the same cards
- **Real-Time UI Updates**: Live progress bars and scoring displays
- **Celebration Effects**: Confetti animations and haptic feedback
- **Mobile Responsive**: Optimized for all device sizes

### Technical Capabilities
- **Progressive Web App (PWA)**: Installable on mobile devices
- **Offline Support**: Service worker for offline gameplay
- **Data Persistence**: localStorage and server-side state management
- **RESTful API**: Comprehensive CRUD operations
- **Error Handling**: Robust validation and recovery mechanisms

## 🏆 Level Progression System

### Level Structure
- **Level 1 (Easy)**: 15 points to win round | Green theme
- **Level 2 (Medium)**: 24 points to win round | Orange theme
- **Level 3 (Hard)**: 24 points to win round | Red theme

### Progression Mechanics
1. **Round-Based**: Each level is a complete round with score reset
2. **Persistent Wins**: Round victories tracked across all gameplay
3. **Auto-Advancement**: Automatic progression when target score reached
4. **Card Management**: Unique cards per level with repeat prevention
5. **Celebration**: Level completion modals with progression details

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.7+**
- **pip** (Python package installer)
- **Modern web browser**

---

### Windows CLI Setup

#### 1. Clone or Download Project
```cmd
# If using git
git clone <repository-url>
cd DevilsAdvocate-main

# Or download and extract ZIP, then navigate to folder
cd path\to\DevilsAdvocate-main
```

#### 2. Create Virtual Environment
```cmd
# Create virtual environment
python -m venv devils_advocate_env

# Alternative if python3 is required
python3 -m venv devils_advocate_env
```

#### 3. Activate Virtual Environment
```cmd
# Activate virtual environment (Windows CMD)
devils_advocate_env\Scripts\activate

# Alternative for PowerShell
devils_advocate_env\Scripts\Activate.ps1
```
*Note: You should see `(devils_advocate_env)` prefix in your command prompt when activated*

#### 4. Install Requirements
```cmd
# Ensure pip is up to date
python -m pip install --upgrade pip

# Install project dependencies
pip install -r requirements.txt
```

#### 5. Run the Application
```cmd
# Start the Flask development server
python app.py

# Alternative method
flask run
```

#### 6. Access the Application
Open your web browser and navigate to:
```
http://localhost:5000
```

#### 7. Deactivate Virtual Environment (when done)
```cmd
deactivate
```

---

### GitHub Codespaces Setup

#### 1. Open in Codespaces
- Click the **"Code"** button in the GitHub repository
- Select **"Codespaces"** tab
- Click **"Create codespace on main"**

#### 2. Wait for Environment Setup
Codespaces will automatically:
- Load the development environment
- Install system dependencies
- Prepare the workspace

#### 3. Create Virtual Environment
```bash
# Create virtual environment
python3 -m venv devils_advocate_env

# Activate virtual environment
source devils_advocate_env/bin/activate
```

#### 4. Install Dependencies
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

#### 5. Run the Application
```bash
# Start Flask development server
python app.py

# Or use Flask CLI
flask run --host=0.0.0.0 --port=5000
```

#### 6. Access the Application
- Codespaces will automatically forward port 5000
- Click the **"Open in Browser"** notification
- Or navigate to the **"Ports"** tab and click the forwarded URL

---

## 💻 Usage

### Starting a New Game
1. **Launch Application**: Navigate to `http://localhost:5000`
2. **Enter Player Names**: Click on "Player 1" and "Player 2" to customize names
3. **Begin Play**: Click the deck to draw your first card
4. **Follow Prompts**: Complete or skip cards to earn points and progress

### Game Controls
- **🎴 Draw Card**: Click the card deck to draw next card
- **✅ Complete**: Mark card as completed (earns points)
- **⏭️ Skip**: Skip current card (may trigger dare card)
- **🃏 Wildcards**: Access collected wildcard bonuses
- **⚙️ Settings**: Manage cards, reset scores, view statistics

### Level Progression
- **Progress Tracking**: Monitor advancement via the level progress bar
- **Target Goals**: Reach the target score (15/24 points) to win the round
- **Automatic Advancement**: Game automatically progresses to next level
- **Round Wins**: Track victories with persistent 🏆 counters

### Card Management
- **Add Cards**: Use the settings menu to add new cards
- **Edit Content**: Modify existing cards through the management interface
- **Bulk Operations**: Import/export card collections
- **Category Filtering**: Organize cards by type and difficulty

## 🎲 Game Mechanics

### Scoring System
- **Truth Cards**: 1 point (Easy) | 2 points (Medium) | 4 points (Hard)
- **Dare Cards**: 1 point (Easy) | 2 points (Medium) | 3 points (Hard)
- **Special Cards**: Variable points based on complexity
- **Streak Bonuses**: Additional points for consecutive completions

### Card Types
- **🔍 Truth**: Personal questions and revelations
- **⚡ Dare**: Physical challenges and actions
- **🚫 Never Have I Ever**: Experience-based statements
- **🔥 Kink**: Adult-oriented intimate content
- **🃏 Wild Card**: Strategic bonus cards with special rules

### Wildcard System
- **Collection**: Earned through specific card completions
- **Usage**: Can be played against opponent for strategic advantage
- **Effects**: Skip opponent's turn, double points, or steal points
- **Limitation**: One-time use per wildcard collected

## 🛠️ API Endpoints

### Card Management
```
GET  /api/cards                    # Get all cards
GET  /api/cards/shuffle             # Get shuffled main deck
GET  /api/cards/level/<int:level>   # Get level-specific cards
GET  /api/cards/level/<int:level>/shuffle  # Get shuffled level deck
POST /api/cards                    # Create new card
PUT  /api/cards/<int:card_id>      # Update existing card
DELETE /api/cards/<int:card_id>    # Delete card
```

### Dare Cards
```
GET  /api/dare-cards               # Get all dare cards
GET  /api/dare-cards/shuffle       # Get shuffled dare deck
POST /api/dare-cards               # Create new dare card
PUT  /api/dare-cards/<int:card_id> # Update dare card
DELETE /api/dare-cards/<int:card_id> # Delete dare card
```

### Game State
```
POST /api/game/state               # Save game state
GET  /api/game/state               # Load game state
```

## 📁 File Structure

```
DevilsAdvocate-main/
├── 📱 app.py                      # Flask application main file
├── 📋 requirements.txt            # Python dependencies
├── 📚 README.md                   # Project documentation
├── 🔧 .env                        # Environment variables
│
├── 📂 cards/                      # Level-specific card data
│   ├── easy_cards.json           # Level 1 cards (15pt target)
│   ├── medium_cards.json         # Level 2 cards (24pt target)
│   └── hard_cards.json           # Level 3 cards (24pt target)
│
├── 📂 static/                     # Static assets
│   ├── 🎨 css/
│   │   └── style.css             # Main stylesheet
│   ├── 📱 js/
│   │   └── main.js               # Game logic & UI
│   ├── 🖼️ images/                # Game images & icons
│   └── 📄 manifest.json          # PWA configuration
│
├── 📂 templates/                  # HTML templates
│   └── index.html                # Main game interface
│
├── 📂 work_reports/              # Project documentation
│   └── executive_summary_*.md    # Implementation reports
│
├── 📄 cards.json                 # Original card collection
└── 📄 dare_cards.json            # Dare card collection
```

## 🎯 Gameplay Tips

### Strategy
- **Point Management**: Balance completing easy cards vs. challenging ones
- **Wildcard Timing**: Save wildcards for crucial moments
- **Level Awareness**: Understand the difficulty progression
- **Communication**: Use the game as a tool for couple bonding

### Best Practices
- **Environment**: Play in comfortable, private setting
- **Respect**: Honor boundaries and comfort levels
- **Engagement**: Fully participate for best experience
- **Progression**: Allow natural progression through levels

## 🔧 Development

### Adding Custom Cards
1. **Navigate to Settings**: Click the ⚙️ gear icon
2. **Select Card Type**: Choose main cards or dare cards
3. **Add New Card**: Fill in title, content, type, and level
4. **Save Changes**: Card will be immediately available

### Customizing Levels
Edit the level configuration in `static/js/main.js`:
```javascript
this.levelConfig = {
    1: { name: 'Easy', target: 15, cardsFile: 'easy_cards.json' },
    2: { name: 'Medium', target: 24, cardsFile: 'medium_cards.json' },
    3: { name: 'Hard', target: 24, cardsFile: 'hard_cards.json' }
};
```

### Environment Variables
Create a `.env` file with:
```env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
```

## 🐛 Troubleshooting

### Common Issues

#### **Python Not Found**
```cmd
# Windows: Install Python from python.org
# Ensure "Add to PATH" is checked during installation

# Verify installation
python --version
```

#### **Virtual Environment Issues**
```cmd
# If activation fails, try:
# 1. Use full path
C:\path\to\devils_advocate_env\Scripts\activate

# 2. Check execution policy (PowerShell)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### **Port Already in Use**
```cmd
# Use different port
flask run --port 5001

# Or kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

#### **Module Not Found Errors**
```cmd
# Ensure virtual environment is activated
devils_advocate_env\Scripts\activate

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

#### **Browser Issues**
- **Clear Cache**: Ctrl+F5 to hard refresh
- **Private Mode**: Test in incognito/private browsing
- **Different Browser**: Try Chrome, Firefox, or Edge
- **Console Errors**: Check browser developer tools (F12)

### Getting Help
1. **Check Console**: Look for error messages in terminal
2. **Browser DevTools**: Press F12 to see JavaScript errors
3. **Log Files**: Check Flask output for detailed error messages
4. **Dependencies**: Verify all requirements are installed correctly

## 🚦 System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.14, or Ubuntu 18.04+
- **Python**: 3.7 or higher
- **RAM**: 512MB available memory
- **Storage**: 100MB free space
- **Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

### Recommended Specifications
- **OS**: Windows 11, macOS 12+, Ubuntu 20.04+
- **Python**: 3.9 or higher
- **RAM**: 2GB available memory
- **Storage**: 500MB free space
- **Browser**: Latest version of Chrome, Firefox, Safari, or Edge

## 📜 License

This project is proprietary software. All rights reserved.

---

## 🎉 Getting Started

Ready to play? Follow the installation steps above and start your Devils Advocate journey today!

**Questions?** Check the troubleshooting section or review the executive summary in `work_reports/` for detailed implementation information.

*Built with ❤️ for couples who want to deepen their connection through intimate, fun gameplay.*