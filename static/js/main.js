/**
 * Digital Card Deck Application - Level-Based Game System
 * Features level progression with score requirements and round tracking
 */

class CardDeck {
    constructor() {
        this.cards = [];
        this.dareCards = [];
        this.currentDeck = [];
        this.currentDareDeck = [];
        this.completedCards = [];
        this.usedCardIds = new Set(); // Track used cards to prevent repeats
        this.currentCard = null;
        this.isDareCard = false;
        this.isAnimating = false;
        this.editingCardId = null;
        this.editingDareCardId = null;
        this.pendingDareForPlayer = null;
        
        // Level-based game state
        this.currentLevel = 1;
        this.gameNumber = 1;
        this.currentPlayer = 1;
        this.startingPlayer = 1;
        this.players = {
            1: {
                name: 'Player 1',
                score: 0,
                roundsWon: 0, // Persistent round wins
                cardsCompleted: 0,
                cardsSkipped: 0,
                wildcards: []
            },
            2: {
                name: 'Player 2',
                score: 0,
                roundsWon: 0, // Persistent round wins
                cardsCompleted: 0,
                cardsSkipped: 0,
                wildcards: []
            }
        };
        
        // Level configuration
        this.levelConfig = {
            1: { name: 'Level 1 - Easy', targetScore: 15, cardCount: 15 },
            2: { name: 'Level 2 - Medium', targetScore: 24, cardCount: 12 },
            3: { name: 'Level 3 - Hard', targetScore: 24, cardCount: 8 }
        };

        // Card back images
        this.cardBackImages = [
            'image_1.png', 'image_2.png', 'image_3.png', 'image_4.png', 'image_5.png',
            'image_6.png', 'image_7.png', 'image_8.png', 'image_9.png', 'image_10.png',
            'image_11.png', 'image_12.png', 'image_13.png', 'image_14.png', 'image_15.png',
            'image_16.png', 'image_17.png', 'image_18.png', 'image_19.png'
        ];
        
        this.init();
    }

    async init() {
        await this.loadLevelCards(this.currentLevel);
        await this.loadDareCards();
        this.setupEventListeners();
        this.updateUI();
        this.loadGameState();
        this.updatePlayerDisplay();
        this.updateLevelDisplay();
        this.setRandomCardBackImage();
        
        // Initialize tooltips
        this.initTooltips();
        
        // Check for mobile
        this.checkMobile();
    }

    setRandomCardBackImage() {
        const randomImage = this.cardBackImages[Math.floor(Math.random() * this.cardBackImages.length)];
        const cardBackImage = document.getElementById('card-back-image');
        cardBackImage.style.backgroundImage = `url('/static/images/${randomImage}')`;
    }

    async loadLevelCards(level) {
        try {
            const response = await fetch(`/api/cards/level/${level}/shuffle`);
            const data = await response.json();
            this.cards = data.cards || [];
            
            // Filter out already used cards to prevent repeats
            const levelKey = `level_${level}_used`;
            const usedCards = JSON.parse(localStorage.getItem(levelKey) || '[]');
            this.usedCardIds = new Set(usedCards);
            
            // Only include cards that haven't been used
            const availableCards = this.cards.filter(card => !this.usedCardIds.has(card.id));
            
            // If no cards available, reset the used cards for this level
            if (availableCards.length === 0) {
                this.usedCardIds.clear();
                localStorage.removeItem(levelKey);
                this.currentDeck = [...this.cards];
                this.showToast(`Level ${level} deck refreshed!`, 'info');
            } else {
                this.currentDeck = availableCards;
            }
            
            this.completedCards = [];
        } catch (error) {
            console.error('Error loading level cards:', error);
            this.showToast('Failed to load cards', 'error');
        }
    }

    async loadDareCards() {
        try {
            const response = await fetch('/api/dare-cards/shuffle');
            const data = await response.json();
            this.dareCards = data.cards || [];
            this.currentDareDeck = [...this.dareCards];
        } catch (error) {
            console.error('Error loading dare cards:', error);
            this.showToast('Failed to load dare cards', 'error');
        }
    }

    setupEventListeners() {
        // Navigation menu
        const navMenuBtn = document.getElementById('nav-menu-btn');
        const navDropdown = document.getElementById('nav-dropdown');
        
        navMenuBtn.addEventListener('click', () => {
            navMenuBtn.classList.toggle('active');
            navDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenuBtn.contains(e.target) && !navDropdown.contains(e.target)) {
                navMenuBtn.classList.remove('active');
                navDropdown.classList.remove('active');
            }
        });

        // Deck interactions
        const deck = document.getElementById('card-deck');
        deck.addEventListener('click', () => this.handleDeckClick());
        deck.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleDeckClick();
            }
        });

        // Action buttons
        document.getElementById('skip-btn').addEventListener('click', () => this.skipCard());
        document.getElementById('done-btn').addEventListener('click', () => this.completeCard());
        document.getElementById('complete-dare-btn').addEventListener('click', () => this.completeDare());
        document.getElementById('use-wildcard-btn').addEventListener('click', () => this.useWildcardOnOpponent());
        document.getElementById('save-wildcard-btn').addEventListener('click', () => this.saveWildcardForLater());

        // Navigation buttons
        document.getElementById('new-game').addEventListener('click', () => {
            this.closeNavMenu();
            this.startNewGame();
        });
        document.getElementById('reset-scores').addEventListener('click', () => {
            this.closeNavMenu();
            this.resetScores();
        });
        document.getElementById('shuffle-deck').addEventListener('click', () => {
            this.closeNavMenu();
            this.shuffleDeck();
        });
        document.getElementById('manage-cards').addEventListener('click', () => {
            this.closeNavMenu();
            this.openManageModal();
        });
        document.getElementById('manage-dare-cards').addEventListener('click', () => {
            this.closeNavMenu();
            this.openManageDareModal();
        });
        document.getElementById('add-card').addEventListener('click', () => {
            this.closeNavMenu();
            this.openCardModal();
        });
        document.getElementById('add-dare-card').addEventListener('click', () => {
            this.closeNavMenu();
            this.openDareCardModal();
        });

        // Player name inputs
        document.getElementById('player-1-name').addEventListener('change', (e) => {
            this.players[1].name = e.target.value || 'Player 1';
            this.updatePlayerDisplay();
            this.saveGameState();
        });
        
        document.getElementById('player-2-name').addEventListener('change', (e) => {
            this.players[2].name = e.target.value || 'Player 2';
            this.updatePlayerDisplay();
            this.saveGameState();
        });

        // Wildcard collection clicks
        document.getElementById('player-1-wildcards').addEventListener('click', () => {
            if (this.players[1].wildcards.length > 0) {
                this.showWildcardCollection(1);
            }
        });

        document.getElementById('player-2-wildcards').addEventListener('click', () => {
            if (this.players[2].wildcards.length > 0) {
                this.showWildcardCollection(2);
            }
        });

        // Winner modal buttons
        document.querySelector('.btn-new-game-modal').addEventListener('click', () => {
            document.getElementById('winner-modal').classList.add('hidden');
            this.startNewGame();
        });
        
        document.querySelector('.btn-close-modal').addEventListener('click', () => {
            document.getElementById('winner-modal').classList.add('hidden');
        });

        // Level completion modal buttons
        document.querySelector('.btn-next-level').addEventListener('click', () => {
            document.getElementById('level-complete-modal').classList.add('hidden');
            this.advanceToNextLevel();
        });

        // Modal controls
        this.setupModalControls();

        // Form controls
        this.setupFormControls();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Save game state on page unload
        window.addEventListener('beforeunload', () => this.saveGameState());
    }

    closeNavMenu() {
        document.getElementById('nav-menu-btn').classList.remove('active');
        document.getElementById('nav-dropdown').classList.remove('active');
    }

    handleDeckClick() {
        if (this.isAnimating) return;
        
        // Check if there's a pending dare to show
        if (this.pendingDareForPlayer) {
            this.showPendingDare();
            return;
        }
        
        // Regular card draw
        this.flipCard();
    }

    flipCard() {
        if (this.isAnimating) return;
        
        if (this.currentDeck.length === 0) {
            this.showToast('No more cards in the deck!', 'info');
            this.shakeElement(document.getElementById('card-deck'));
            return;
        }

        if (this.currentCard) {
            this.showToast('Please complete or skip the current card first', 'info');
            return;
        }

        this.isAnimating = true;
        this.currentCard = this.currentDeck.shift();
        this.isDareCard = false;
        
        // Mark card as used
        this.usedCardIds.add(this.currentCard.id);
        this.saveUsedCards();
        
        // Add haptic feedback for mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        this.displayCurrentCard();
        this.updateUI();
        this.setRandomCardBackImage();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }

    showPendingDare() {
        if (!this.pendingDareForPlayer || this.currentDareDeck.length === 0) {
            this.showToast('No dare cards available!', 'error');
            this.pendingDareForPlayer = null;
            this.updateUI();
            return;
        }

        this.isAnimating = true;
        this.currentCard = this.currentDareDeck.shift();
        this.isDareCard = true;
        
        // Switch to the player who must do the dare
        this.currentPlayer = this.pendingDareForPlayer;
        this.pendingDareForPlayer = null;

        // Update deck styling for dare cards
        const deckElement = document.getElementById('card-deck');
        deckElement.classList.add('dare-deck');
        
        document.getElementById('instruction-text').textContent = 'Dare Card - Must Complete';
        
        this.displayCurrentCard();
        this.updateUI();
        this.updatePlayerDisplay();
        
        setTimeout(() => {
            this.isAnimating = false;
            deckElement.classList.remove('dare-deck');
        }, 600);
    }

    displayCurrentCard() {
        const cardElement = document.getElementById('current-card');
        const actionButtons = document.getElementById('action-buttons');
        const dareActionButtons = document.getElementById('dare-action-buttons');
        const wildcardActionButtons = document.getElementById('wildcard-action-buttons');
        
        if (this.currentCard) {
            // Update card content
            const cardFront = cardElement.querySelector('.card-front-large');
            cardFront.style.borderTop = `5px solid ${this.currentCard.color || '#4CAF50'}`;
            
            // Remove all special classes first
            cardFront.classList.remove('wild-card', 'dare-card');
            cardElement.classList.remove('wild-card-glow', 'dare-card-glow');
            
            // Special styling for different card types
            if (this.currentCard.type === 'wild_card') {
                cardFront.classList.add('wild-card');
                cardElement.classList.add('wild-card-glow');
            } else if (this.isDareCard) {
                cardFront.classList.add('dare-card');
                cardElement.classList.add('dare-card-glow');
            }
            
            document.getElementById('card-id').textContent = this.currentCard.id;
            cardElement.querySelector('.card-title-large').textContent = this.currentCard.title;
            cardElement.querySelector('.card-content-large').textContent = this.currentCard.content;
            
            // Update score display
            const scoreValue = this.isDareCard ? 0 : (this.currentCard.scoreValue || this.getCardScore());
            document.getElementById('card-score').textContent = scoreValue;
            document.getElementById('done-points').textContent = scoreValue;
            
            // Update type badge
            const typeBadge = cardElement.querySelector('.card-type-badge-large');
            if (this.isDareCard) {
                typeBadge.textContent = '🎯 Dare';
                typeBadge.style.background = '#ff6b35';
            } else {
                typeBadge.textContent = this.getTypeDisplayName(this.currentCard.type);
                typeBadge.style.background = this.getTypeColor(this.currentCard.type);
            }
            typeBadge.style.color = 'white';
            
            // Update level
            const levelElement = cardElement.querySelector('.card-level-large');
            if (this.isDareCard && this.currentCard.difficulty) {
                levelElement.textContent = this.currentCard.difficulty;
                levelElement.style.background = this.getDifficultyColor(this.currentCard.difficulty);
            } else {
                levelElement.textContent = this.currentCard.level || `level ${this.currentLevel}`;
                levelElement.style.background = this.getLevelColor(this.currentCard.level);
            }
            
            // Show card with animation
            cardElement.classList.remove('hidden');
            cardElement.classList.add('flip-animation');
            
            // Show appropriate action buttons
            actionButtons.classList.add('hidden');
            dareActionButtons.classList.add('hidden');
            wildcardActionButtons.classList.add('hidden');
            
            if (this.isDareCard) {
                dareActionButtons.classList.remove('hidden');
            } else if (this.currentCard.type === 'wild_card') {
                wildcardActionButtons.classList.remove('hidden');
            } else {
                actionButtons.classList.remove('hidden');
            }
            
            setTimeout(() => {
                cardElement.classList.remove('flip-animation');
            }, 600);
        } else {
            cardElement.classList.add('hidden');
            actionButtons.classList.add('hidden');
            dareActionButtons.classList.add('hidden');
            wildcardActionButtons.classList.add('hidden');
        }
    }

    skipCard() {
        if (!this.currentCard || this.isAnimating || this.isDareCard) return;
        
        this.isAnimating = true;
        
        // Animate card sliding away
        const cardElement = document.getElementById('current-card');
        cardElement.style.animation = 'slideOutLeft 0.3s ease';
        
        setTimeout(() => {
            // Add to completed pile
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'skip'
            });
            
            // Update player stats
            this.players[this.currentPlayer].cardsSkipped++;
            
            // Add to completed stack display
            this.addToCompletedStack(this.currentCard, 'skip');
            
            // Set up dare for the player who skipped
            this.pendingDareForPlayer = this.currentPlayer;
            
            this.currentCard = null;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            this.showToast(`${this.players[this.pendingDareForPlayer].name} must now complete a dare!`, 'info');
            
            // Reset card element animation
            cardElement.style.animation = '';
            
            this.isAnimating = false;
        }, 300);
    }

    completeCard() {
        if (!this.currentCard || this.isAnimating || this.isDareCard) return;
        
        this.isAnimating = true;
        
        // Animate card completion
        const cardElement = document.getElementById('current-card');
        cardElement.style.animation = 'slideOutRight 0.3s ease';
        
        setTimeout(() => {
            // Award points (unless it's a wild card)
            if (this.currentCard.type !== 'wild_card') {
                const points = this.currentCard.scoreValue || this.getCardScore();
                this.players[this.currentPlayer].score += points;
                this.players[this.currentPlayer].cardsCompleted++;
                
                if (points > 0) {
                    // Check if level is completed
                    const targetScore = this.levelConfig[this.currentLevel].targetScore;
                    if (this.players[this.currentPlayer].score >= targetScore) {
                        this.completeLevelForPlayer(this.currentPlayer);
                    } else {
                        this.showToast(`+${points} points! ${this.players[this.currentPlayer === 1 ? 2 : 1].name}'s turn!`, 'success');
                    }
                }
            }
            
            // Add to completed cards
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'done'
            });
            
            this.addToCompletedStack(this.currentCard, 'done');
            
            // Switch turns (unless wild card or level completed)
            if (this.currentCard.type !== 'wild_card' && this.players[this.currentPlayer].score < this.levelConfig[this.currentLevel].targetScore) {
                this.switchTurns();
            }
            
            this.currentCard = null;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            // Reset card element animation
            cardElement.style.animation = '';
            
            this.isAnimating = false;
        }, 300);
    }

    completeLevelForPlayer(playerId) {
        // Award round win
        this.players[playerId].roundsWon++;
        
        // Show level completion modal
        this.showLevelCompleteModal(playerId);
    }

    showLevelCompleteModal(winnerId) {
        const modal = document.getElementById('level-complete-modal') || this.createLevelCompleteModal();
        const winnerName = document.getElementById('level-winner-name');
        const levelName = document.getElementById('completed-level-name');
        const nextLevelBtn = document.querySelector('.btn-next-level');
        
        winnerName.textContent = this.players[winnerId].name;
        levelName.textContent = this.levelConfig[this.currentLevel].name;
        
        // Show different buttons based on current level
        if (this.currentLevel < 3) {
            nextLevelBtn.textContent = `Continue to Level ${this.currentLevel + 1}`;
            nextLevelBtn.style.display = 'block';
        } else {
            // Game complete
            nextLevelBtn.textContent = 'Game Complete!';
            nextLevelBtn.style.display = 'block';
        }
        
        modal.classList.remove('hidden');
        
        // Show toast message
        this.showToast(`🎉 ${this.players[winnerId].name} completed ${this.levelConfig[this.currentLevel].name}!`, 'success');
    }

    createLevelCompleteModal() {
        const modalHtml = `
            <div id="level-complete-modal" class="modal hidden">
                <div class="modal-content winner-content">
                    <h2 class="winner-title">🎊 Level Complete! 🎊</h2>
                    <div class="winner-info">
                        <div class="winner-name" id="level-winner-name">Player 1</div>
                        <div class="level-complete-info">
                            <p>Has completed <strong id="completed-level-name">Level 1</strong>!</p>
                        </div>
                    </div>
                    <div class="winner-actions">
                        <button class="btn btn-next-level">Continue to Next Level</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add event listener for the button
        document.querySelector('.btn-next-level').addEventListener('click', () => {
            document.getElementById('level-complete-modal').classList.add('hidden');
            this.advanceToNextLevel();
        });
        
        return document.getElementById('level-complete-modal');
    }

    advanceToNextLevel() {
        if (this.currentLevel < 3) {
            this.currentLevel++;
            this.resetForNewLevel();
        } else {
            // All levels completed - show final winner
            this.showFinalWinner();
        }
    }

    resetForNewLevel() {
        // Reset scores for new level
        this.players[1].score = 0;
        this.players[2].score = 0;
        
        // Load new level cards
        this.loadLevelCards(this.currentLevel);
        
        // Clear current game state
        this.currentCard = null;
        this.isDareCard = false;
        this.pendingDareForPlayer = null;
        this.completedCards = [];
        
        // Update UI
        this.displayCurrentCard();
        document.getElementById('completed-cards-pile').innerHTML = '';
        document.getElementById('empty-completed').classList.remove('hidden');
        this.updateUI();
        this.updatePlayerDisplay();
        this.updateLevelDisplay();
        this.setRandomCardBackImage();
        this.saveGameState();
        
        this.showToast(`Welcome to ${this.levelConfig[this.currentLevel].name}!`, 'info');
    }

    showFinalWinner() {
        const player1Wins = this.players[1].roundsWon;
        const player2Wins = this.players[2].roundsWon;
        
        let finalWinner;
        if (player1Wins > player2Wins) {
            finalWinner = 1;
        } else if (player2Wins > player1Wins) {
            finalWinner = 2;
        } else {
            finalWinner = 0; // Tie
        }
        
        // Show final winner modal
        const modal = document.getElementById('winner-modal');
        const winnerName = document.getElementById('winner-name');
        
        if (finalWinner === 0) {
            winnerName.textContent = "It's a Tie!";
        } else {
            winnerName.textContent = `${this.players[finalWinner].name} Wins the Tournament!`;
        }
        
        document.getElementById('final-player-1-name').textContent = this.players[1].name;
        document.getElementById('final-player-1-score').textContent = `${this.players[1].roundsWon} rounds`;
        document.getElementById('final-player-2-name').textContent = this.players[2].name;
        document.getElementById('final-player-2-score').textContent = `${this.players[2].roundsWon} rounds`;
        
        modal.classList.remove('hidden');
    }

    completeDare() {
        if (!this.currentCard || this.isAnimating || !this.isDareCard) return;
        
        this.isAnimating = true;
        
        // Animate card completion
        const cardElement = document.getElementById('current-card');
        cardElement.style.animation = 'slideOutRight 0.3s ease';
        
        setTimeout(() => {
            // No points awarded for dare cards, but track completion
            this.players[this.currentPlayer].cardsCompleted++;
            
            // Add to completed cards
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'dare'
            });
            
            this.addToCompletedStack(this.currentCard, 'dare');
            
            // Switch turns back to the other player
            this.switchTurns();
            
            this.currentCard = null;
            this.isDareCard = false;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            this.showToast(`Dare completed! ${this.players[this.currentPlayer].name}'s turn!`, 'success');
            
            // Reset card element animation
            cardElement.style.animation = '';
            
            this.isAnimating = false;
        }, 300);
    }

    useWildcardOnOpponent() {
        if (!this.currentCard || this.currentCard.type !== 'wild_card') return;
        
        // Set up dare for the opponent
        this.pendingDareForPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        this.completeCard();
        
        this.showToast(`${this.players[this.pendingDareForPlayer].name} must draw a dare card!`, 'info');
    }

    saveWildcardForLater() {
        if (!this.currentCard || this.currentCard.type !== 'wild_card') return;
        
        // Add wildcard to player's collection
        this.players[this.currentPlayer].wildcards.push({
            ...this.currentCard,
            savedAt: new Date().toISOString()
        });
        
        this.completeCard();
        
        this.showToast('Wild card saved to your collection!', 'success');
    }

    showWildcardCollection(playerId) {
        const modal = document.getElementById('wildcard-collection-modal');
        const list = document.getElementById('wildcard-list');
        const wildcards = this.players[playerId].wildcards;
        
        if (wildcards.length === 0) {
            list.innerHTML = '<p class="empty-state">No wild cards collected yet</p>';
        } else {
            list.innerHTML = wildcards.map((card, index) => `
                <div class="wildcard-item">
                    <div class="wildcard-item-title">${card.title}</div>
                    <div class="wildcard-item-content">${card.content}</div>
                    <div class="wildcard-item-actions">
                        <button class="btn-use-now" onclick="cardDeck.useWildcardFromCollection(${playerId}, ${index})">
                            Use Now
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        modal.classList.remove('hidden');
    }

    useWildcardFromCollection(playerId, wildcardIndex) {
        if (this.currentCard) {
            this.showToast('Complete the current card first', 'info');
            return;
        }
        
        const wildcard = this.players[playerId].wildcards[wildcardIndex];
        
        // Remove wildcard from collection
        this.players[playerId].wildcards.splice(wildcardIndex, 1);
        
        // Set up dare for the opponent
        this.pendingDareForPlayer = playerId === 1 ? 2 : 1;
        this.currentPlayer = playerId;
        
        // Close modal
        document.getElementById('wildcard-collection-modal').classList.add('hidden');
        
        this.updatePlayerDisplay();
        this.saveGameState();
        
        this.showToast(`Using ${wildcard.title}! ${this.players[this.pendingDareForPlayer].name} must draw a dare!`, 'info');
    }

    switchTurns() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    addToCompletedStack(card, action) {
        const completedPile = document.getElementById('completed-cards-pile');
        const emptyState = document.getElementById('empty-completed');
        
        emptyState.classList.add('hidden');
        
        // Create face-up card for the stack
        const cardFace = document.createElement('div');
        cardFace.className = 'completed-card-face';
        cardFace.style.borderTop = `3px solid ${card.color || '#4CAF50'}`;
        
        let actionText = '';
        if (action === 'done') {
            actionText = `✓ ${card.scoreValue || 0} pts`;
        } else if (action === 'skip') {
            actionText = 'Skipped';
        } else if (action === 'dare') {
            actionText = 'Dare Done';
        }
        
        const playerName = this.players[this.currentPlayer].name;
        
        cardFace.innerHTML = `
            <div class="completed-card-mini-title">${card.title}</div>
            <div class="completed-card-mini-content">${card.content.substring(0, 150)}...</div>
            <div class="completed-card-mini-footer">
                <span class="completed-card-player">${playerName}</span>
                <span class="completed-card-action action-${action}">${actionText}</span>
            </div>
        `;
        
        // Add to pile (limit visible cards to 5 for performance)
        if (completedPile.children.length >= 5) {
            completedPile.removeChild(completedPile.lastChild);
        }
        completedPile.insertBefore(cardFace, completedPile.firstChild);
        
        // Update count
        document.querySelector('.completed-count-large').textContent = this.completedCards.length;
    }

    startNewGame() {
        if (this.completedCards.length > 0 || this.currentCard) {
            const confirm = window.confirm('Are you sure you want to start a new game? Current progress will be lost.');
            if (!confirm) return;
        }
        
        // Reset to level 1
        this.currentLevel = 1;
        
        // Switch starting player
        this.gameNumber++;
        this.startingPlayer = this.startingPlayer === 1 ? 2 : 1;
        this.currentPlayer = this.startingPlayer;
        this.pendingDareForPlayer = null;
        
        // Reset scores but keep round wins
        this.players[1].score = 0;
        this.players[2].score = 0;
        
        // Reset game state
        Promise.all([this.loadLevelCards(this.currentLevel), this.loadDareCards()]).then(() => {
            this.currentCard = null;
            this.isDareCard = false;
            this.displayCurrentCard();
            document.getElementById('completed-cards-pile').innerHTML = '';
            document.getElementById('empty-completed').classList.remove('hidden');
            this.updateUI();
            this.updatePlayerDisplay();
            this.updateLevelDisplay();
            this.setRandomCardBackImage();
            this.saveGameState();
            this.showToast(`New game started at Level 1! ${this.players[this.startingPlayer].name} goes first!`, 'success');
        });
    }

    resetScores() {
        if (!confirm('Are you sure you want to reset all scores and progress?')) return;
        
        // Reset everything including round wins
        this.players[1].score = 0;
        this.players[1].roundsWon = 0;
        this.players[1].cardsCompleted = 0;
        this.players[1].cardsSkipped = 0;
        this.players[1].wildcards = [];
        this.players[2].score = 0;
        this.players[2].roundsWon = 0;
        this.players[2].cardsCompleted = 0;
        this.players[2].cardsSkipped = 0;
        this.players[2].wildcards = [];
        
        this.currentLevel = 1;
        this.gameNumber = 1;
        this.startingPlayer = 1;
        this.currentPlayer = 1;
        this.pendingDareForPlayer = null;
        
        // Clear used cards tracking
        localStorage.removeItem('level_1_used');
        localStorage.removeItem('level_2_used');
        localStorage.removeItem('level_3_used');
        this.usedCardIds.clear();
        
        this.updatePlayerDisplay();
        this.updateLevelDisplay();
        this.saveGameState();
        this.showToast('All progress reset!', 'success');
    }

    async shuffleDeck() {
        if (this.currentCard) {
            if (this.isDareCard) {
                this.currentDareDeck.push(this.currentCard);
            } else {
                this.currentDeck.push(this.currentCard);
            }
            this.currentCard = null;
            this.isDareCard = false;
        }
        
        // Fisher-Yates shuffle with animation
        this.isAnimating = true;
        const deck = document.getElementById('card-deck');
        deck.style.animation = 'shuffle 0.5s ease';
        
        // Shuffle current level deck
        for (let i = this.currentDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentDeck[i], this.currentDeck[j]] = [this.currentDeck[j], this.currentDeck[i]];
        }
        
        // Shuffle dare deck
        for (let i = this.currentDareDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentDareDeck[i], this.currentDareDeck[j]] = [this.currentDareDeck[j], this.currentDareDeck[i]];
        }
        
        setTimeout(() => {
            deck.style.animation = '';
            this.displayCurrentCard();
            this.updateUI();
            this.setRandomCardBackImage();
            this.showToast('Decks shuffled!', 'success');
            this.isAnimating = false;
        }, 500);
    }

    updatePlayerDisplay() {
        // Update player names
        document.getElementById('player-1-name').value = this.players[1].name;
        document.getElementById('player-2-name').value = this.players[2].name;
        
        // Update scores
        document.getElementById('player-1-score').textContent = this.players[1].score;
        document.getElementById('player-2-score').textContent = this.players[2].score;
        
        // Update round wins
        document.getElementById('player-1-rounds').textContent = this.players[1].roundsWon;
        document.getElementById('player-2-rounds').textContent = this.players[2].roundsWon;
        
        // Update wildcard counts
        document.getElementById('player-1-wildcard-count').textContent = this.players[1].wildcards.length;
        document.getElementById('player-2-wildcard-count').textContent = this.players[2].wildcards.length;
        
        // Update current turn indicator
        document.getElementById('player-1-card').classList.toggle('active', this.currentPlayer === 1);
        document.getElementById('player-2-card').classList.toggle('active', this.currentPlayer === 2);
        
        // Update game info
        document.getElementById('current-player').textContent = this.players[this.currentPlayer].name;
        document.getElementById('game-number').textContent = this.gameNumber;
    }

    updateLevelDisplay() {
        const levelInfo = document.getElementById('level-info') || this.createLevelInfo();
        const currentLevelName = document.getElementById('current-level-name');
        const targetScore = document.getElementById('target-score');
        const player1Progress = document.getElementById('player-1-progress');
        const player2Progress = document.getElementById('player-2-progress');
        
        const config = this.levelConfig[this.currentLevel];
        currentLevelName.textContent = config.name;
        targetScore.textContent = config.targetScore;
        
        // Update progress bars
        const p1Progress = (this.players[1].score / config.targetScore) * 100;
        const p2Progress = (this.players[2].score / config.targetScore) * 100;
        player1Progress.style.width = `${Math.min(p1Progress, 100)}%`;
        player2Progress.style.width = `${Math.min(p2Progress, 100)}%`;
    }

    createLevelInfo() {
        const levelInfoHtml = `
            <div id="level-info" class="level-info">
                <div class="level-header">
                    <h3 id="current-level-name">Level 1 - Easy</h3>
                    <div class="target-score">Target: <span id="target-score">15</span> points</div>
                </div>
                <div class="progress-bars">
                    <div class="player-progress">
                        <span class="player-progress-label">Player 1</span>
                        <div class="progress-bar-small">
                            <div id="player-1-progress" class="progress-fill-small"></div>
                        </div>
                    </div>
                    <div class="player-progress">
                        <span class="player-progress-label">Player 2</span>
                        <div class="progress-bar-small">
                            <div id="player-2-progress" class="progress-fill-small"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const gameArea = document.querySelector('.game-area');
        gameArea.insertAdjacentHTML('beforebegin', levelInfoHtml);
        return document.getElementById('level-info');
    }

    updateUI() {
        // Update progress bar for overall game
        const total = this.cards.length;
        const completed = this.completedCards.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Update deck appearance
        const deckElement = document.getElementById('card-deck');
        if (this.currentDeck.length === 0 && !this.pendingDareForPlayer) {
            deckElement.classList.add('disabled');
        } else {
            deckElement.classList.remove('disabled');
        }
        
        // Update instruction text
        const instructionText = document.getElementById('instruction-text');
        if (this.pendingDareForPlayer) {
            instructionText.textContent = `${this.players[this.pendingDareForPlayer].name} must complete a dare!`;
            instructionText.style.color = '#ff6b35';
            instructionText.style.fontWeight = 'bold';
        } else {
            instructionText.textContent = 'Click to draw a card';
            instructionText.style.color = '';
            instructionText.style.fontWeight = '';
        }
        
        // Update empty state
        const emptyState = document.getElementById('empty-completed');
        if (this.completedCards.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
        
        // Update completed count
        document.querySelector('.completed-count-large').textContent = this.completedCards.length;
        
        // Update level display
        this.updateLevelDisplay();
    }

    getCardScore() {
        // Return score based on current level
        const levelScores = {1: 1, 2: 2, 3: 4};
        return levelScores[this.currentLevel] || 1;
    }

    saveUsedCards() {
        const levelKey = `level_${this.currentLevel}_used`;
        const usedCardsArray = Array.from(this.usedCardIds);
        localStorage.setItem(levelKey, JSON.stringify(usedCardsArray));
    }

    // Modal and Form Management Methods
    setupModalControls() {
        // Card modal
        const cardModal = document.getElementById('card-modal');
        const dareCardModal = document.getElementById('dare-card-modal');
        const manageModal = document.getElementById('manage-modal');
        const manageDareModal = document.getElementById('manage-dare-modal');
        const wildcardModal = document.getElementById('wildcard-collection-modal');
        
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.add('hidden');
                this.editingCardId = null;
                this.editingDareCardId = null;
            });
        });

        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                cardModal.classList.add('hidden');
                dareCardModal.classList.add('hidden');
                this.editingCardId = null;
                this.editingDareCardId = null;
            });
        });

        // Close modal on outside click
        [cardModal, dareCardModal, manageModal, manageDareModal, wildcardModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.add('hidden');
                        this.editingCardId = null;
                        this.editingDareCardId = null;
                    }
                });
            }
        });

        // Form submissions
        const cardForm = document.getElementById('card-form');
        const dareForm = document.getElementById('dare-card-form');
        
        if (cardForm) {
            cardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCard();
            });
        }

        if (dareForm) {
            dareForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDareCard();
            });
        }
    }

    setupFormControls() {
        // Character counters
        const contentInput = document.getElementById('card-content-input');
        const charCounter = document.getElementById('char-current');
        const dareContentInput = document.getElementById('dare-card-content-input');
        const dareCharCounter = document.getElementById('dare-char-current');
        
        if (contentInput && charCounter) {
            contentInput.addEventListener('input', () => {
                charCounter.textContent = contentInput.value.length;
            });
        }

        if (dareContentInput && dareCharCounter) {
            dareContentInput.addEventListener('input', () => {
                dareCharCounter.textContent = dareContentInput.value.length;
            });
        }

        // Color picker sync
        const colorInput = document.getElementById('card-color-input');
        const colorHex = document.getElementById('color-hex');
        const dareColorInput = document.getElementById('dare-card-color-input');
        const dareColorHex = document.getElementById('dare-color-hex');
        
        if (colorInput && colorHex) {
            colorInput.addEventListener('input', () => {
                colorHex.textContent = colorInput.value.toUpperCase();
            });
        }

        if (dareColorInput && dareColorHex) {
            dareColorInput.addEventListener('input', () => {
                dareColorHex.textContent = dareColorInput.value.toUpperCase();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('search-cards');
        const filterSelect = document.getElementById('filter-type');
        const searchDareInput = document.getElementById('search-dare-cards');
        const filterDifficultySelect = document.getElementById('filter-difficulty');
        
        if (searchInput) searchInput.addEventListener('input', () => this.filterCardsList());
        if (filterSelect) filterSelect.addEventListener('change', () => this.filterCardsList());
        if (searchDareInput) searchDareInput.addEventListener('input', () => this.filterDareCardsList());
        if (filterDifficultySelect) filterDifficultySelect.addEventListener('change', () => this.filterDareCardsList());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'd':
                    if (!this.currentCard && !this.isDareCard) this.handleDeckClick();
                    break;
                case 's':
                    if (this.currentCard && !this.isDareCard) this.skipCard();
                    break;
                case 'enter':
                    if (this.currentCard) {
                        if (this.isDareCard) {
                            this.completeDare();
                        } else {
                            this.completeCard();
                        }
                    }
                    break;
                case 'n':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.startNewGame();
                    }
                    break;
            }
        });
    }

    openCardModal(cardId = null) {
        const modal = document.getElementById('card-modal');
        const form = document.getElementById('card-form');
        const modalTitle = document.getElementById('modal-title');
        const submitBtn = form.querySelector('.btn-submit');
        
        if (cardId) {
            // Edit mode - need to find card across all levels
            this.editingCardId = cardId;
            modalTitle.textContent = 'Edit Card';
            submitBtn.textContent = 'Update Card';
            
            // Try to find card in current level first, then others
            let card = this.cards.find(c => c.id === cardId);
            if (card) {
                document.getElementById('card-title-input').value = card.title;
                document.getElementById('card-content-input').value = card.content;
                document.getElementById('card-type-input').value = card.type || 'truth';
                document.getElementById('card-level-input').value = card.level || 'level 1';
                document.getElementById('card-color-input').value = card.color || '#4CAF50';
                document.getElementById('color-hex').textContent = card.color || '#4CAF50';
                document.getElementById('char-current').textContent = card.content.length;
            }
        } else {
            // Add mode
            this.editingCardId = null;
            modalTitle.textContent = 'Add New Card';
            submitBtn.textContent = 'Add Card';
            form.reset();
            document.getElementById('char-current').textContent = '0';
            document.getElementById('color-hex').textContent = '#4CAF50';
            
            // Set default level to current level
            document.getElementById('card-level-input').value = `level ${this.currentLevel}`;
        }
        
        modal.classList.remove('hidden');
    }

    openDareCardModal(cardId = null) {
        const modal = document.getElementById('dare-card-modal');
        const form = document.getElementById('dare-card-form');
        const modalTitle = document.getElementById('dare-modal-title');
        const submitBtn = form.querySelector('.btn-submit');
        
        if (cardId) {
            // Edit mode
            this.editingDareCardId = cardId;
            modalTitle.textContent = 'Edit Dare Card';
            submitBtn.textContent = 'Update Dare Card';
            
            // Load card data
            const card = this.dareCards.find(c => c.id === cardId);
            if (card) {
                document.getElementById('dare-card-title-input').value = card.title;
                document.getElementById('dare-card-content-input').value = card.content;
                document.getElementById('dare-card-difficulty-input').value = card.difficulty || 'easy';
                document.getElementById('dare-card-color-input').value = card.color || '#FF9800';
                document.getElementById('dare-color-hex').textContent = card.color || '#FF9800';
                document.getElementById('dare-char-current').textContent = card.content.length;
            }
        } else {
            // Add mode
            this.editingDareCardId = null;
            modalTitle.textContent = 'Add New Dare Card';
            submitBtn.textContent = 'Add Dare Card';
            form.reset();
            document.getElementById('dare-char-current').textContent = '0';
            document.getElementById('dare-color-hex').textContent = '#FF9800';
        }
        
        modal.classList.remove('hidden');
    }

    async saveCard() {
        const title = document.getElementById('card-title-input').value.trim();
        const content = document.getElementById('card-content-input').value.trim();
        const type = document.getElementById('card-type-input').value;
        const level = document.getElementById('card-level-input').value;
        const color = document.getElementById('card-color-input').value;
        
        if (!title || !content) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Extract level number
        const levelNum = parseInt(level.replace('level ', ''));
        
        const cardData = {
            title,
            content,
            type,
            level,
            color,
            scoreValue: type === 'wild_card' ? 0 : (levelNum === 1 ? 1 : levelNum === 2 ? 2 : 4)
        };
        
        try {
            let response;
            if (this.editingCardId) {
                // Update existing card
                response = await fetch(`/api/cards/${this.editingCardId}/level/${levelNum}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            } else {
                // Add new card
                response = await fetch(`/api/cards/level/${levelNum}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            }
            
            if (response.ok) {
                const savedCard = await response.json();
                
                if (this.editingCardId) {
                    // Update card in current deck if present
                    const index = this.currentDeck.findIndex(c => c.id === this.editingCardId);
                    if (index !== -1) {
                        this.currentDeck[index] = savedCard;
                    }
                    this.showToast('Card updated successfully!', 'success');
                } else {
                    // Add to current deck if same level
                    if (levelNum === this.currentLevel) {
                        this.currentDeck.push(savedCard);
                    }
                    this.showToast('Card added successfully!', 'success');
                }
                
                // Reload cards for current level
                await this.loadLevelCards(this.currentLevel);
                this.updateUI();
                
                // Close modal
                document.getElementById('card-modal').classList.add('hidden');
                document.getElementById('card-form').reset();
                this.editingCardId = null;
            } else {
                throw new Error('Failed to save card');
            }
        } catch (error) {
            console.error('Error saving card:', error);
            this.showToast('Failed to save card', 'error');
        }
    }

    async saveDareCard() {
        const title = document.getElementById('dare-card-title-input').value.trim();
        const content = document.getElementById('dare-card-content-input').value.trim();
        const difficulty = document.getElementById('dare-card-difficulty-input').value;
        const color = document.getElementById('dare-card-color-input').value;
        
        if (!title || !content) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const cardData = {
            title,
            content,
            difficulty,
            color
        };
        
        try {
            let response;
            if (this.editingDareCardId) {
                // Update existing dare card
                response = await fetch(`/api/dare-cards/${this.editingDareCardId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            } else {
                // Add new dare card
                response = await fetch('/api/dare-cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            }
            
            if (response.ok) {
                const savedCard = await response.json();
                
                if (this.editingDareCardId) {
                    // Update card in current deck if present
                    const index = this.currentDareDeck.findIndex(c => c.id === this.editingDareCardId);
                    if (index !== -1) {
                        this.currentDareDeck[index] = savedCard;
                    }
                    this.showToast('Dare card updated successfully!', 'success');
                } else {
                    // Add to current deck
                    this.currentDareDeck.push(savedCard);
                    this.showToast('Dare card added successfully!', 'success');
                }
                
                // Reload dare cards list
                await this.loadDareCards();
                this.updateUI();
                
                // Close modal
                document.getElementById('dare-card-modal').classList.add('hidden');
                document.getElementById('dare-card-form').reset();
                this.editingDareCardId = null;
            } else {
                throw new Error('Failed to save dare card');
            }
        } catch (error) {
            console.error('Error saving dare card:', error);
            this.showToast('Failed to save dare card', 'error');
        }
    }

    openManageModal() {
        const modal = document.getElementById('manage-modal');
        modal.classList.remove('hidden');
        this.loadCardsList();
    }

    openManageDareModal() {
        const modal = document.getElementById('manage-dare-modal');
        modal.classList.remove('hidden');
        this.loadDareCardsList();
    }

    async loadCardsList() {
        try {
            // Load cards from all levels
            let allCards = [];
            for (let level = 1; level <= 3; level++) {
                const response = await fetch(`/api/cards/level/${level}`);
                const data = await response.json();
                allCards = allCards.concat(data.cards || []);
            }
            this.displayCardsList(allCards);
        } catch (error) {
            console.error('Error loading cards list:', error);
            this.showToast('Failed to load cards list', 'error');
        }
    }

    async loadDareCardsList() {
        try {
            const response = await fetch('/api/dare-cards');
            const data = await response.json();
            this.displayDareCardsList(data.cards || []);
        } catch (error) {
            console.error('Error loading dare cards list:', error);
            this.showToast('Failed to load dare cards list', 'error');
        }
    }

    displayCardsList(cards) {
        const listContainer = document.getElementById('cards-list');
        
        if (cards.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No cards found</p>';
            return;
        }
        
        listContainer.innerHTML = cards.map(card => {
            const score = card.scoreValue || 1;
            return `
                <div class="card-item" data-card-id="${card.id}" data-type="${card.type || ''}" data-level="${card.level || ''}">
                    <div class="card-item-info">
                        <div class="card-item-title">
                            ${card.title}
                            <span class="card-item-score">${score} pts</span>
                            <span class="card-item-level">${card.level || 'level 1'}</span>
                        </div>
                        <div class="card-item-content">${card.content}</div>
                    </div>
                    <div class="card-item-actions">
                        <button class="btn-edit" onclick="cardDeck.openCardModal(${card.id})">Edit</button>
                        <button class="btn-delete" onclick="cardDeck.deleteCard(${card.id}, '${card.level || 'level 1'}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayDareCardsList(cards) {
        const listContainer = document.getElementById('dare-cards-list');
        
        if (cards.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No dare cards found</p>';
            return;
        }
        
        listContainer.innerHTML = cards.map(card => `
            <div class="card-item" data-card-id="${card.id}" data-difficulty="${card.difficulty || ''}">
                <div class="card-item-info">
                    <div class="card-item-title">
                        ${card.title}
                        <span class="card-item-score">${card.difficulty || 'easy'}</span>
                    </div>
                    <div class="card-item-content">${card.content}</div>
                </div>
                <div class="card-item-actions">
                    <button class="btn-edit" onclick="cardDeck.openDareCardModal(${card.id})">Edit</button>
                    <button class="btn-delete" onclick="cardDeck.deleteDareCard(${card.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    filterCardsList() {
        const searchTerm = document.getElementById('search-cards').value.toLowerCase();
        const filterType = document.getElementById('filter-type').value;
        const cardItems = document.querySelectorAll('#cards-list .card-item');
        
        cardItems.forEach(item => {
            const title = item.querySelector('.card-item-title').textContent.toLowerCase();
            const content = item.querySelector('.card-item-content').textContent.toLowerCase();
            const type = item.dataset.type;
            
            const matchesSearch = title.includes(searchTerm) || content.includes(searchTerm);
            const matchesType = !filterType || type === filterType;
            
            item.style.display = matchesSearch && matchesType ? 'flex' : 'none';
        });
    }

    filterDareCardsList() {
        const searchTerm = document.getElementById('search-dare-cards').value.toLowerCase();
        const filterDifficulty = document.getElementById('filter-difficulty').value;
        const cardItems = document.querySelectorAll('#dare-cards-list .card-item');
        
        cardItems.forEach(item => {
            const title = item.querySelector('.card-item-title').textContent.toLowerCase();
            const content = item.querySelector('.card-item-content').textContent.toLowerCase();
            const difficulty = item.dataset.difficulty;
            
            const matchesSearch = title.includes(searchTerm) || content.includes(searchTerm);
            const matchesDifficulty = !filterDifficulty || difficulty === filterDifficulty;
            
            item.style.display = matchesSearch && matchesDifficulty ? 'flex' : 'none';
        });
    }

    async deleteCard(cardId, cardLevel) {
        if (!confirm('Are you sure you want to delete this card?')) return;
        
        // Extract level number
        const levelNum = parseInt(cardLevel.replace('level ', ''));
        
        try {
            const response = await fetch(`/api/cards/${cardId}/level/${levelNum}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from current deck if present
                this.currentDeck = this.currentDeck.filter(c => c.id !== cardId);
                
                // Reload cards list
                this.loadCardsList();
                this.updateUI();
                this.showToast('Card deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete card');
            }
        } catch (error) {
            console.error('Error deleting card:', error);
            this.showToast('Failed to delete card', 'error');
        }
    }

    async deleteDareCard(cardId) {
        if (!confirm('Are you sure you want to delete this dare card?')) return;
        
        try {
            const response = await fetch(`/api/dare-cards/${cardId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from current dare deck
                this.currentDareDeck = this.currentDareDeck.filter(c => c.id !== cardId);
                
                // Reload dare cards list
                this.loadDareCardsList();
                this.updateUI();
                this.showToast('Dare card deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete dare card');
            }
        } catch (error) {
            console.error('Error deleting dare card:', error);
            this.showToast('Failed to delete dare card', 'error');
        }
    }

    // Utility Methods
    saveGameState() {
        const gameState = {
            currentLevel: this.currentLevel,
            gameNumber: this.gameNumber,
            currentPlayer: this.currentPlayer,
            startingPlayer: this.startingPlayer,
            pendingDareForPlayer: this.pendingDareForPlayer,
            players: this.players,
            usedCardIds: Array.from(this.usedCardIds),
            currentCard: this.currentCard ? {
                id: this.currentCard.id,
                isDare: this.isDareCard
            } : null
        };
        
        localStorage.setItem('cardDeckGameState', JSON.stringify(gameState));
        
        // Also save to server
        fetch('/api/game/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState)
        }).catch(() => {
            // Silently fail server save
        });
    }

    loadGameState() {
        const saved = localStorage.getItem('cardDeckGameState');
        if (saved) {
            try {
                const gameState = JSON.parse(saved);
                this.currentLevel = gameState.currentLevel || 1;
                this.gameNumber = gameState.gameNumber || 1;
                this.currentPlayer = gameState.currentPlayer || 1;
                this.startingPlayer = gameState.startingPlayer || 1;
                this.pendingDareForPlayer = gameState.pendingDareForPlayer || null;
                this.players = gameState.players || this.players;
                this.usedCardIds = new Set(gameState.usedCardIds || []);
            } catch (error) {
                console.error('Error loading game state:', error);
            }
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    shakeElement(element) {
        element.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    getTypeDisplayName(type) {
        const names = {
            'truth': '💭 Truth',
            'dare': '🎯 Dare',
            'never_ever': '🚫 Never Ever',
            'kink': '🔥 Kink',
            'wild_card': '🃏 Wild Card'
        };
        return names[type] || 'General';
    }

    getTypeColor(type) {
        const colors = {
            'truth': '#4CAF50',
            'dare': '#FF9800',
            'never_ever': '#2196F3',
            'kink': '#E91E63',
            'wild_card': '#9C27B0'
        };
        return colors[type] || '#607D8B';
    }

    getLevelColor(level) {
        const colors = {
            'level 1': '#2ecc71',
            'level 2': '#f39c12',
            'level 3': '#e74c3c'
        };
        return colors[level] || '#3498db';
    }

    getDifficultyColor(difficulty) {
        const colors = {
            'easy': '#2ecc71',
            'medium': '#f39c12',
            'hard': '#e74c3c',
            'extreme': '#8e44ad'
        };
        return colors[difficulty] || '#3498db';
    }

    initTooltips() {
        // Add tooltips for better UX
        const tooltips = {
            'card-deck': 'Click to draw a card or dare',
            'skip-btn': 'Skip and draw dare (Shortcut: S)',
            'done-btn': 'Award points (Shortcut: Enter)',
            'complete-dare-btn': 'Complete dare (Required)',
            'use-wildcard-btn': 'Give opponent a dare',
            'save-wildcard-btn': 'Save for later use'
        };
        
        Object.entries(tooltips).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.title = text;
            }
        });
    }

    checkMobile() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            document.body.classList.add('mobile-device');
        }
    }
}

// Add CSS animations dynamically
const animations = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes shuffle {
        0% { transform: rotateY(0); }
        50% { transform: rotateY(180deg); }
        100% { transform: rotateY(360deg); }
    }
    
    @keyframes slideOutLeft {
        to {
            transform: translateX(-150%);
            opacity: 0;
        }
    }
    
    @keyframes slideOutRight {
        to {
            transform: translateX(150%);
            opacity: 0;
        }
    }
`;

const style = document.createElement('style');
style.textContent = animations;
document.head.appendChild(style);

// Initialize the application
let cardDeck;
document.addEventListener('DOMContentLoaded', () => {
    cardDeck = new CardDeck();
});

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, app will work online only
        });
    });
}
