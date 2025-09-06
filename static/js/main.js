/**
 * Digital Card Deck Application - Level-Based Game System
 * Features: Level progression, round tracking, card repeat prevention
 */

class CardDeck {
    constructor() {
        // Card collections
        this.cards = [];
        this.dareCards = [];
        this.currentDeck = [];
        this.currentDareDeck = [];
        this.completedCards = [];
        this.usedCardsByLevel = {
            1: [],
            2: [],
            3: []
        };
        
        // Current card state
        this.currentCard = null;
        this.isDareCard = false;
        this.isAnimating = false;
        this.editingCardId = null;
        this.editingDareCardId = null;
        this.pendingDareForPlayer = null;
        
        // Level and round tracking
        this.currentLevel = 1;
        this.levelTargetScores = {
            1: 15,
            2: 24,
            3: 24
        };
        this.roundWins = {
            1: 0,
            2: 0
        };
        
        // Game state
        this.gameNumber = 1;
        this.currentPlayer = 1;
        this.startingPlayer = 1;
        this.players = {
            1: {
                name: 'Player 1',
                score: 0,
                cardsCompleted: 0,
                cardsSkipped: 0,
                wildcards: []
            },
            2: {
                name: 'Player 2',
                score: 0,
                cardsCompleted: 0,
                cardsSkipped: 0,
                wildcards: []
            }
        };
        
        // Score values by level
        this.levelScoreValues = {
            1: 1,
            2: 2,
            3: 3
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
        await this.loadGameLevel();
        await this.loadRoundWins();
        await this.loadUsedCards();
        await this.loadLevelCards();
        await this.loadDareCards();
        this.setupEventListeners();
        this.updateUI();
        this.loadGameState();
        this.updatePlayerDisplay();
        this.updateLevelDisplay();
        this.setRandomCardBackImage();
        this.initTooltips();
        this.checkMobile();
    }

    async loadGameLevel() {
        try {
            const response = await fetch('/api/game/current-level');
            const data = await response.json();
            this.currentLevel = data.level || 1;
        } catch (error) {
            console.error('Error loading game level:', error);
            this.currentLevel = 1;
        }
    }

    async saveGameLevel() {
        try {
            await fetch('/api/game/current-level', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level: this.currentLevel })
            });
        } catch (error) {
            console.error('Error saving game level:', error);
        }
    }

    async loadRoundWins() {
        try {
            const response = await fetch('/api/game/round-wins');
            const data = await response.json();
            this.roundWins[1] = data.player_1 || 0;
            this.roundWins[2] = data.player_2 || 0;
        } catch (error) {
            console.error('Error loading round wins:', error);
        }
    }

    async saveRoundWins() {
        try {
            await fetch('/api/game/round-wins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_1: this.roundWins[1],
                    player_2: this.roundWins[2]
                })
            });
        } catch (error) {
            console.error('Error saving round wins:', error);
        }
    }

    async loadUsedCards() {
        // Load from localStorage first
        const localUsedCards = localStorage.getItem('usedCardsByLevel');
        if (localUsedCards) {
            this.usedCardsByLevel = JSON.parse(localUsedCards);
        }
        
        // Also sync with server
        for (let level = 1; level <= 3; level++) {
            try {
                const response = await fetch(`/api/cards/used/${level}`);
                const data = await response.json();
                if (data.used_cards && data.used_cards.length > 0) {
                    this.usedCardsByLevel[level] = data.used_cards;
                }
            } catch (error) {
                console.error(`Error loading used cards for level ${level}:`, error);
            }
        }
    }

    async saveUsedCards(level) {
        // Save to localStorage
        localStorage.setItem('usedCardsByLevel', JSON.stringify(this.usedCardsByLevel));
        
        // Save to server
        try {
            await fetch(`/api/cards/used/${level}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ used_cards: this.usedCardsByLevel[level] })
            });
        } catch (error) {
            console.error(`Error saving used cards for level ${level}:`, error);
        }
    }

    async loadLevelCards() {
        try {
            const response = await fetch(`/api/cards/level/${this.currentLevel}/available`);
            const data = await response.json();
            this.cards = data.cards || [];
            
            // Ensure all cards have proper score values
            this.cards = this.cards.map(card => ({
                ...card,
                scoreValue: card.type === 'wild_card' ? 0 : this.levelScoreValues[this.currentLevel]
            }));
            
            // Shuffle the available cards
            this.currentDeck = this.shuffleArray([...this.cards]);
            this.completedCards = [];
            
            // Update deck count display
            this.updateDeckCount();
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

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    setRandomCardBackImage() {
        const randomImage = this.cardBackImages[Math.floor(Math.random() * this.cardBackImages.length)];
        const cardBackImage = document.getElementById('card-back-image');
        if (cardBackImage) {
            cardBackImage.style.backgroundImage = `url('/static/images/${randomImage}')`;
        }
    }

    setupEventListeners() {
        // Navigation menu
        const navMenuBtn = document.getElementById('nav-menu-btn');
        const navDropdown = document.getElementById('nav-dropdown');
        
        navMenuBtn?.addEventListener('click', () => {
            navMenuBtn.classList.toggle('active');
            navDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenuBtn && navDropdown && 
                !navMenuBtn.contains(e.target) && 
                !navDropdown.contains(e.target)) {
                navMenuBtn.classList.remove('active');
                navDropdown.classList.remove('active');
            }
        });

        // Deck interactions
        const deck = document.getElementById('card-deck');
        deck?.addEventListener('click', () => this.handleDeckClick());
        deck?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleDeckClick();
            }
        });

        // Action buttons
        document.getElementById('skip-btn')?.addEventListener('click', () => this.skipCard());
        document.getElementById('done-btn')?.addEventListener('click', () => this.completeCard());
        document.getElementById('complete-dare-btn')?.addEventListener('click', () => this.completeDare());
        document.getElementById('use-wildcard-btn')?.addEventListener('click', () => this.useWildcardOnOpponent());
        document.getElementById('save-wildcard-btn')?.addEventListener('click', () => this.saveWildcardForLater());

        // Navigation buttons
        document.getElementById('new-game')?.addEventListener('click', () => {
            this.closeNavMenu();
            this.startNewGame();
        });
        document.getElementById('reset-scores')?.addEventListener('click', () => {
            this.closeNavMenu();
            this.resetAllProgress();
        });
        document.getElementById('shuffle-deck')?.addEventListener('click', () => {
            this.closeNavMenu();
            this.shuffleDeck();
        });
        document.getElementById('manage-cards')?.addEventListener('click', () => {
            this.closeNavMenu();
            this.openManageModal();
        });
        document.getElementById('manage-dare-cards')?.addEventListener('click', () => {
            this.closeNavMenu();
            this.openManageDareModal();
        });
        document.getElementById('add-card')?.addEventListener('click', () => {
            this.closeNavMenu();
            this.openCardModal();
        });
        document.getElementById('add-dare-card')?.addEventListener('click', () => {
            this.closeNavMenu();
            this.openDareCardModal();
        });

        // Player name inputs
        document.getElementById('player-1-name')?.addEventListener('change', (e) => {
            this.players[1].name = e.target.value || 'Player 1';
            this.updatePlayerDisplay();
            this.saveGameState();
        });
        
        document.getElementById('player-2-name')?.addEventListener('change', (e) => {
            this.players[2].name = e.target.value || 'Player 2';
            this.updatePlayerDisplay();
            this.saveGameState();
        });

        // Wildcard collection clicks
        document.getElementById('player-1-wildcards')?.addEventListener('click', () => {
            if (this.players[1].wildcards.length > 0) {
                this.showWildcardCollection(1);
            }
        });

        document.getElementById('player-2-wildcards')?.addEventListener('click', () => {
            if (this.players[2].wildcards.length > 0) {
                this.showWildcardCollection(2);
            }
        });

        // Level progression modal
        document.getElementById('continue-next-level')?.addEventListener('click', () => {
            document.getElementById('level-complete-modal').classList.add('hidden');
            this.continueToNextLevel();
        });

        // Winner modal buttons
        document.querySelector('.btn-new-game-modal')?.addEventListener('click', () => {
            document.getElementById('winner-modal').classList.add('hidden');
            this.startNewGame();
        });
        
        document.querySelector('.btn-close-modal')?.addEventListener('click', () => {
            document.getElementById('winner-modal').classList.add('hidden');
        });

        // Modal controls
        this.setupModalControls();
        this.setupFormControls();
        this.setupKeyboardShortcuts();

        // Save game state on page unload
        window.addEventListener('beforeunload', () => this.saveGameState());
    }

    closeNavMenu() {
        document.getElementById('nav-menu-btn')?.classList.remove('active');
        document.getElementById('nav-dropdown')?.classList.remove('active');
    }

    handleDeckClick() {
        if (this.isAnimating) return;
        
        if (this.pendingDareForPlayer) {
            this.showPendingDare();
            return;
        }
        
        this.flipCard();
    }

    flipCard() {
        if (this.isAnimating) return;
        
        if (this.currentDeck.length === 0) {
            this.showToast('No more cards in the deck! Deck will be reshuffled.', 'info');
            this.reshuffleDeck();
            return;
        }

        if (this.currentCard) {
            this.showToast('Please complete or skip the current card first', 'info');
            return;
        }

        this.isAnimating = true;
        this.currentCard = this.currentDeck.shift();
        this.isDareCard = false;
        
        // Track used card
        if (this.currentCard && !this.usedCardsByLevel[this.currentLevel].includes(this.currentCard.id)) {
            this.usedCardsByLevel[this.currentLevel].push(this.currentCard.id);
            this.saveUsedCards(this.currentLevel);
        }
        
        // Add haptic feedback for mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        this.displayCurrentCard();
        this.updateUI();
        this.updateDeckCount();
        this.setRandomCardBackImage();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }

    async reshuffleDeck() {
        // Reset used cards for this level
        this.usedCardsByLevel[this.currentLevel] = [];
        await this.saveUsedCards(this.currentLevel);
        
        // Reload cards for current level
        await this.loadLevelCards();
        this.updateDeckCount();
        this.showToast('Deck reshuffled with all cards!', 'success');
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
        
        this.currentPlayer = this.pendingDareForPlayer;
        this.pendingDareForPlayer = null;

        const deckElement = document.getElementById('card-deck');
        deckElement?.classList.add('dare-deck');
        
        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            instructionText.textContent = 'Dare Card - Must Complete';
        }
        
        this.displayCurrentCard();
        this.updateUI();
        this.updatePlayerDisplay();
        
        setTimeout(() => {
            this.isAnimating = false;
            deckElement?.classList.remove('dare-deck');
        }, 600);
    }

    displayCurrentCard() {
        const cardElement = document.getElementById('current-card');
        const actionButtons = document.getElementById('action-buttons');
        const dareActionButtons = document.getElementById('dare-action-buttons');
        const wildcardActionButtons = document.getElementById('wildcard-action-buttons');
        
        if (this.currentCard && cardElement) {
            const cardFront = cardElement.querySelector('.card-front-large');
            cardFront.style.borderTop = `5px solid ${this.currentCard.color || '#4CAF50'}`;
            
            cardFront.classList.remove('wild-card', 'dare-card');
            cardElement.classList.remove('wild-card-glow', 'dare-card-glow');
            
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
            
            const scoreValue = this.isDareCard ? 0 : (this.currentCard.scoreValue || this.levelScoreValues[this.currentLevel]);
            document.getElementById('card-score').textContent = scoreValue;
            document.getElementById('done-points').textContent = scoreValue;
            
            const typeBadge = cardElement.querySelector('.card-type-badge-large');
            if (this.isDareCard) {
                typeBadge.textContent = '🎯 Dare';
                typeBadge.style.background = '#ff6b35';
            } else {
                typeBadge.textContent = this.getTypeDisplayName(this.currentCard.type);
                typeBadge.style.background = this.getTypeColor(this.currentCard.type);
            }
            typeBadge.style.color = 'white';
            
            const levelElement = cardElement.querySelector('.card-level-large');
            if (this.isDareCard && this.currentCard.difficulty) {
                levelElement.textContent = this.currentCard.difficulty;
                levelElement.style.background = this.getDifficultyColor(this.currentCard.difficulty);
            } else {
                levelElement.textContent = `Level ${this.currentLevel}`;
                levelElement.style.background = this.getLevelColor(this.currentLevel);
            }
            
            cardElement.classList.remove('hidden');
            cardElement.classList.add('flip-animation');
            
            actionButtons?.classList.add('hidden');
            dareActionButtons?.classList.add('hidden');
            wildcardActionButtons?.classList.add('hidden');
            
            if (this.isDareCard) {
                dareActionButtons?.classList.remove('hidden');
            } else if (this.currentCard.type === 'wild_card') {
                wildcardActionButtons?.classList.remove('hidden');
            } else {
                actionButtons?.classList.remove('hidden');
            }
            
            setTimeout(() => {
                cardElement.classList.remove('flip-animation');
            }, 600);
        } else if (cardElement) {
            cardElement.classList.add('hidden');
            actionButtons?.classList.add('hidden');
            dareActionButtons?.classList.add('hidden');
            wildcardActionButtons?.classList.add('hidden');
        }
    }

    skipCard() {
        if (!this.currentCard || this.isAnimating || this.isDareCard) return;
        
        this.isAnimating = true;
        
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.style.animation = 'slideOutLeft 0.3s ease';
        }
        
        setTimeout(() => {
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'skip'
            });
            
            this.players[this.currentPlayer].cardsSkipped++;
            this.addToCompletedStack(this.currentCard, 'skip');
            this.pendingDareForPlayer = this.currentPlayer;
            
            this.currentCard = null;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            this.showToast(`${this.players[this.pendingDareForPlayer].name} must now complete a dare!`, 'info');
            
            if (cardElement) {
                cardElement.style.animation = '';
            }
            
            this.isAnimating = false;
        }, 300);
    }

    completeCard() {
        if (!this.currentCard || this.isAnimating || this.isDareCard) return;
        
        this.isAnimating = true;
        
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.style.animation = 'slideOutRight 0.3s ease';
        }
        
        setTimeout(() => {
            if (this.currentCard.type !== 'wild_card') {
                const points = this.currentCard.scoreValue || this.levelScoreValues[this.currentLevel];
                this.players[this.currentPlayer].score += points;
                this.players[this.currentPlayer].cardsCompleted++;
                
                // Check for level completion
                if (this.players[this.currentPlayer].score >= this.levelTargetScores[this.currentLevel]) {
                    this.handleLevelComplete(this.currentPlayer);
                } else if (points > 0) {
                    this.showToast(`+${points} points! ${this.players[this.currentPlayer === 1 ? 2 : 1].name}'s turn!`, 'success');
                }
            }
            
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'done'
            });
            
            this.addToCompletedStack(this.currentCard, 'done');
            
            if (this.currentCard.type !== 'wild_card') {
                this.switchTurns();
            }
            
            this.currentCard = null;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            if (cardElement) {
                cardElement.style.animation = '';
            }
            
            this.isAnimating = false;
        }, 300);
    }

    handleLevelComplete(winnerPlayer) {
        // Update round wins
        this.roundWins[winnerPlayer]++;
        this.saveRoundWins();
        
        // Show level complete modal
        const modal = document.getElementById('level-complete-modal');
        const winnerName = document.getElementById('level-winner-name');
        const currentLevelText = document.getElementById('current-level-complete');
        const nextLevelText = document.getElementById('next-level-name');
        
        if (modal && winnerName && currentLevelText && nextLevelText) {
            winnerName.textContent = this.players[winnerPlayer].name;
            currentLevelText.textContent = this.currentLevel;
            
            if (this.currentLevel < 3) {
                nextLevelText.textContent = `Level ${this.currentLevel + 1}`;
                document.getElementById('continue-next-level')?.classList.remove('hidden');
                this.showLevelCompleteToast(winnerPlayer);
            } else {
                // Game complete
                nextLevelText.textContent = 'Game Complete!';
                document.getElementById('continue-next-level')?.classList.add('hidden');
                this.endGame();
                return;
            }
            
            modal.classList.remove('hidden');
        }
    }

    showLevelCompleteToast(winnerPlayer) {
        const message = `🎉 ${this.players[winnerPlayer].name} wins Level ${this.currentLevel}! Moving to Level ${this.currentLevel + 1}`;
        this.showToastBanner(message, 'level-complete');
    }

    continueToNextLevel() {
        // Advance to next level
        this.currentLevel++;
        this.saveGameLevel();
        
        // Reset scores for new level
        this.players[1].score = 0;
        this.players[2].score = 0;
        this.players[1].cardsCompleted = 0;
        this.players[2].cardsCompleted = 0;
        this.players[1].cardsSkipped = 0;
        this.players[2].cardsSkipped = 0;
        
        // Keep wildcards
        // Reset decks
        this.completedCards = [];
        this.currentCard = null;
        this.isDareCard = false;
        
        // Load new level cards
        this.loadLevelCards().then(() => {
            this.loadDareCards();
            this.displayCurrentCard();
            document.getElementById('completed-cards-pile').innerHTML = '';
            document.getElementById('empty-completed')?.classList.remove('hidden');
            this.updateUI();
            this.updatePlayerDisplay();
            this.updateLevelDisplay();
            this.setRandomCardBackImage();
            this.saveGameState();
            
            this.showToast(`Level ${this.currentLevel} started! Target: ${this.levelTargetScores[this.currentLevel]} points`, 'success');
        });
    }

    completeDare() {
        if (!this.currentCard || this.isAnimating || !this.isDareCard) return;
        
        this.isAnimating = true;
        
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.style.animation = 'slideOutRight 0.3s ease';
        }
        
        setTimeout(() => {
            this.players[this.currentPlayer].cardsCompleted++;
            
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'dare'
            });
            
            this.addToCompletedStack(this.currentCard, 'dare');
            this.switchTurns();
            
            this.currentCard = null;
            this.isDareCard = false;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            this.showToast(`Dare completed! ${this.players[this.currentPlayer].name}'s turn!`, 'success');
            
            if (cardElement) {
                cardElement.style.animation = '';
            }
            
            this.isAnimating = false;
        }, 300);
    }

    useWildcardOnOpponent() {
        if (!this.currentCard || this.currentCard.type !== 'wild_card') return;
        
        this.pendingDareForPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.completeCard();
        this.showToast(`${this.players[this.pendingDareForPlayer].name} must draw a dare card!`, 'info');
    }

    saveWildcardForLater() {
        if (!this.currentCard || this.currentCard.type !== 'wild_card') return;
        
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
        
        if (list) {
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
        }
        
        modal?.classList.remove('hidden');
    }

    useWildcardFromCollection(playerId, wildcardIndex) {
        if (this.currentCard) {
            this.showToast('Complete the current card first', 'info');
            return;
        }
        
        const wildcard = this.players[playerId].wildcards[wildcardIndex];
        this.players[playerId].wildcards.splice(wildcardIndex, 1);
        
        this.pendingDareForPlayer = playerId === 1 ? 2 : 1;
        this.currentPlayer = playerId;
        
        document.getElementById('wildcard-collection-modal')?.classList.add('hidden');
        
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
        
        emptyState?.classList.add('hidden');
        
        if (completedPile) {
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
            
            if (completedPile.children.length >= 5) {
                completedPile.removeChild(completedPile.lastChild);
            }
            completedPile.insertBefore(cardFace, completedPile.firstChild);
        }
        
        const countElement = document.querySelector('.completed-count-large');
        if (countElement) {
            countElement.textContent = this.completedCards.length;
        }
    }

    startNewGame() {
        if (this.completedCards.length > 0 || this.currentCard) {
            const confirm = window.confirm('Are you sure you want to start a new game? Current game progress will be lost.');
            if (!confirm) return;
        }
        
        // Reset to level 1
        this.currentLevel = 1;
        this.saveGameLevel();
        
        // Reset scores but keep round wins
        this.players[1].score = 0;
        this.players[2].score = 0;
        this.players[1].cardsCompleted = 0;
        this.players[2].cardsCompleted = 0;
        this.players[1].cardsSkipped = 0;
        this.players[2].cardsSkipped = 0;
        
        // Switch starting player
        this.gameNumber++;
        this.startingPlayer = this.startingPlayer === 1 ? 2 : 1;
        this.currentPlayer = this.startingPlayer;
        this.pendingDareForPlayer = null;
        
        // Reset used cards
        this.usedCardsByLevel = { 1: [], 2: [], 3: [] };
        localStorage.setItem('usedCardsByLevel', JSON.stringify(this.usedCardsByLevel));
        
        // Reset game state
        Promise.all([this.loadLevelCards(), this.loadDareCards()]).then(() => {
            this.currentCard = null;
            this.isDareCard = false;
            this.displayCurrentCard();
            const pile = document.getElementById('completed-cards-pile');
            if (pile) pile.innerHTML = '';
            document.getElementById('empty-completed')?.classList.remove('hidden');
            this.updateUI();
            this.updatePlayerDisplay();
            this.updateLevelDisplay();
            this.setRandomCardBackImage();
            this.saveGameState();
            this.showToast(`New game started! Level 1 - ${this.players[this.startingPlayer].name} goes first!`, 'success');
        });
    }

    async resetAllProgress() {
        if (!confirm('Are you sure you want to reset ALL progress including round wins?')) return;
        
        // Reset everything
        this.players[1].score = 0;
        this.players[1].cardsCompleted = 0;
        this.players[1].cardsSkipped = 0;
        this.players[1].wildcards = [];
        this.players[2].score = 0;
        this.players[2].cardsCompleted = 0;
        this.players[2].cardsSkipped = 0;
        this.players[2].wildcards = [];
        
        // Reset round wins
        this.roundWins = { 1: 0, 2: 0 };
        await this.saveRoundWins();
        
        // Reset level
        this.currentLevel = 1;
        await this.saveGameLevel();
        
        // Reset used cards
        this.usedCardsByLevel = { 1: [], 2: [], 3: [] };
        localStorage.setItem('usedCardsByLevel', JSON.stringify(this.usedCardsByLevel));
        
        // Reset to server
        await fetch('/api/game/reset-round-wins', { method: 'POST' });
        await fetch('/api/cards/reset-all-used', { method: 'POST' });
        
        this.gameNumber = 1;
        this.startingPlayer = 1;
        this.currentPlayer = 1;
        this.pendingDareForPlayer = null;
        
        await this.loadLevelCards();
        this.updatePlayerDisplay();
        this.updateLevelDisplay();
        this.saveGameState();
        this.showToast('All progress has been reset!', 'success');
    }

    endGame() {
        const winner = this.roundWins[1] > this.roundWins[2] ? 1 : 
                      this.roundWins[2] > this.roundWins[1] ? 2 : 0;
        
        const modal = document.getElementById('winner-modal');
        const winnerName = document.getElementById('winner-name');
        
        if (winnerName) {
            if (winner === 0) {
                winnerName.textContent = "It's a Tie!";
            } else {
                winnerName.textContent = `${this.players[winner].name} Wins the Game!`;
            }
        }
        
        const finalScore1 = document.getElementById('final-player-1-name');
        const finalScore2 = document.getElementById('final-player-2-name');
        const finalRounds1 = document.getElementById('final-player-1-rounds');
        const finalRounds2 = document.getElementById('final-player-2-rounds');
        
        if (finalScore1) finalScore1.textContent = this.players[1].name;
        if (finalScore2) finalScore2.textContent = this.players[2].name;
        if (finalRounds1) finalRounds1.textContent = `${this.roundWins[1]} rounds won`;
        if (finalRounds2) finalRounds2.textContent = `${this.roundWins[2]} rounds won`;
        
        modal?.classList.remove('hidden');
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
        
        this.isAnimating = true;
        const deck = document.getElementById('card-deck');
        if (deck) {
            deck.style.animation = 'shuffle 0.5s ease';
        }
        
        this.currentDeck = this.shuffleArray(this.currentDeck);
        this.currentDareDeck = this.shuffleArray(this.currentDareDeck);
        
        setTimeout(() => {
            if (deck) {
                deck.style.animation = '';
            }
            this.displayCurrentCard();
            this.updateUI();
            this.setRandomCardBackImage();
            this.showToast('Decks shuffled!', 'success');
            this.isAnimating = false;
        }, 500);
    }

    updatePlayerDisplay() {
        // Update player names
        const player1Name = document.getElementById('player-1-name');
        const player2Name = document.getElementById('player-2-name');
        if (player1Name) player1Name.value = this.players[1].name;
        if (player2Name) player2Name.value = this.players[2].name;
        
        // Update scores
        const player1Score = document.getElementById('player-1-score');
        const player2Score = document.getElementById('player-2-score');
        if (player1Score) player1Score.textContent = this.players[1].score;
        if (player2Score) player2Score.textContent = this.players[2].score;
        
        // Update round wins
        const player1Rounds = document.getElementById('player-1-rounds');
        const player2Rounds = document.getElementById('player-2-rounds');
        if (player1Rounds) player1Rounds.textContent = this.roundWins[1];
        if (player2Rounds) player2Rounds.textContent = this.roundWins[2];
        
        // Update wildcard counts
        const player1Wildcards = document.getElementById('player-1-wildcard-count');
        const player2Wildcards = document.getElementById('player-2-wildcard-count');
        if (player1Wildcards) player1Wildcards.textContent = this.players[1].wildcards.length;
        if (player2Wildcards) player2Wildcards.textContent = this.players[2].wildcards.length;
        
        // Update current turn indicator
        const player1Card = document.getElementById('player-1-card');
        const player2Card = document.getElementById('player-2-card');
        if (player1Card) player1Card.classList.toggle('active', this.currentPlayer === 1);
        if (player2Card) player2Card.classList.toggle('active', this.currentPlayer === 2);
        
        // Update game info
        const currentPlayerEl = document.getElementById('current-player');
        const gameNumberEl = document.getElementById('game-number');
        if (currentPlayerEl) currentPlayerEl.textContent = this.players[this.currentPlayer].name;
        if (gameNumberEl) gameNumberEl.textContent = this.gameNumber;
    }

    updateLevelDisplay() {
        const levelIndicator = document.getElementById('current-level-indicator');
        const levelProgress = document.getElementById('level-progress');
        const targetScore = document.getElementById('target-score');
        
        if (levelIndicator) {
            levelIndicator.textContent = `Level ${this.currentLevel}`;
        }
        
        if (targetScore) {
            targetScore.textContent = this.levelTargetScores[this.currentLevel];
        }
        
        if (levelProgress) {
            const maxScore = Math.max(this.players[1].score, this.players[2].score);
            const progress = (maxScore / this.levelTargetScores[this.currentLevel]) * 100;
            levelProgress.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    updateDeckCount() {
        const deckCount = document.getElementById('deck-count');
        if (deckCount) {
            deckCount.textContent = `${this.currentDeck.length} cards remaining`;
        }
    }

    updateUI() {
        // Update progress bar
        const total = this.cards.length;
        const completed = this.completedCards.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        // Update deck appearance
        const deckElement = document.getElementById('card-deck');
        if (deckElement) {
            if (this.currentDeck.length === 0 && !this.pendingDareForPlayer) {
                deckElement.classList.add('disabled');
            } else {
                deckElement.classList.remove('disabled');
            }
        }
        
        // Update instruction text
        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            if (this.pendingDareForPlayer) {
                instructionText.textContent = `${this.players[this.pendingDareForPlayer].name} must complete a dare!`;
                instructionText.style.color = '#ff6b35';
                instructionText.style.fontWeight = 'bold';
            } else {
                instructionText.textContent = 'Click to draw a card';
                instructionText.style.color = '';
                instructionText.style.fontWeight = '';
            }
        }
        
        // Update empty state
        const emptyState = document.getElementById('empty-completed');
        if (emptyState) {
            if (this.completedCards.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }
        }
        
        // Update completed count
        const completedCount = document.querySelector('.completed-count-large');
        if (completedCount) {
            completedCount.textContent = this.completedCards.length;
        }
        
        this.updateLevelDisplay();
        this.updateDeckCount();
    }

    // Modal and Form Management Methods (keeping existing methods)
    setupModalControls() {
        const modals = ['card-modal', 'dare-card-modal', 'manage-modal', 'manage-dare-modal', 'wildcard-collection-modal'];
        
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
                this.editingCardId = null;
                this.editingDareCardId = null;
            });
        });

        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('card-modal')?.classList.add('hidden');
                document.getElementById('dare-card-modal')?.classList.add('hidden');
                this.editingCardId = null;
                this.editingDareCardId = null;
            });
        });

        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    this.editingCardId = null;
                    this.editingDareCardId = null;
                }
            });
        });

        document.getElementById('card-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCard();
        });

        document.getElementById('dare-card-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDareCard();
        });
    }

    setupFormControls() {
        const contentInput = document.getElementById('card-content-input');
        const charCounter = document.getElementById('char-current');
        const dareContentInput = document.getElementById('dare-card-content-input');
        const dareCharCounter = document.getElementById('dare-char-current');
        
        contentInput?.addEventListener('input', () => {
            if (charCounter) charCounter.textContent = contentInput.value.length;
        });

        dareContentInput?.addEventListener('input', () => {
            if (dareCharCounter) dareCharCounter.textContent = dareContentInput.value.length;
        });

        const colorInput = document.getElementById('card-color-input');
        const colorHex = document.getElementById('color-hex');
        const dareColorInput = document.getElementById('dare-card-color-input');
        const dareColorHex = document.getElementById('dare-color-hex');
        
        colorInput?.addEventListener('input', () => {
            if (colorHex) colorHex.textContent = colorInput.value.toUpperCase();
        });

        dareColorInput?.addEventListener('input', () => {
            if (dareColorHex) dareColorHex.textContent = dareColorInput.value.toUpperCase();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'd':
                    if (this.currentCard && !this.isDareCard) this.handleDeckClick();
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

    // Card management methods
    openManageModal() {
        const modal = document.getElementById('manage-modal');
        modal?.classList.remove('hidden');
        this.loadCardsList();
    }

    openManageDareModal() {
        const modal = document.getElementById('manage-dare-modal');
        modal?.classList.remove('hidden');
        this.loadDareCardsList();
    }

    async loadCardsList() {
        try {
            const response = await fetch(`/api/cards/level/${this.currentLevel}`);
            const data = await response.json();
            this.displayCardsList(data.cards || []);
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
        if (!listContainer) return;
        
        if (cards.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No cards found</p>';
            return;
        }
        
        listContainer.innerHTML = cards.map(card => {
            const score = card.scoreValue || this.levelScoreValues[this.currentLevel];
            return `
                <div class="card-item" data-card-id="${card.id}" data-type="${card.type || ''}">
                    <div class="card-item-info">
                        <div class="card-item-title">
                            ${card.title}
                            <span class="card-item-score">${score} pts</span>
                        </div>
                        <div class="card-item-content">${card.content}</div>
                    </div>
                    <div class="card-item-actions">
                        <button class="btn-edit" onclick="cardDeck.openCardModal(${card.id})">Edit</button>
                        <button class="btn-delete" onclick="cardDeck.deleteCard(${card.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayDareCardsList(cards) {
        const listContainer = document.getElementById('dare-cards-list');
        if (!listContainer) return;
        
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

    openCardModal(cardId = null) {
        const modal = document.getElementById('card-modal');
        const form = document.getElementById('card-form');
        const modalTitle = document.getElementById('modal-title');
        const submitBtn = form?.querySelector('.btn-submit');
        
        if (!modal || !form) return;
        
        if (cardId) {
            this.editingCardId = cardId;
            if (modalTitle) modalTitle.textContent = 'Edit Card';
            if (submitBtn) submitBtn.textContent = 'Update Card';
            
            const card = this.cards.find(c => c.id === cardId);
            if (card) {
                const titleInput = document.getElementById('card-title-input');
                const contentInput = document.getElementById('card-content-input');
                const typeInput = document.getElementById('card-type-input');
                const colorInput = document.getElementById('card-color-input');
                
                if (titleInput) titleInput.value = card.title;
                if (contentInput) contentInput.value = card.content;
                if (typeInput) typeInput.value = card.type || 'truth';
                if (colorInput) colorInput.value = card.color || '#4CAF50';
                
                const colorHex = document.getElementById('color-hex');
                const charCurrent = document.getElementById('char-current');
                if (colorHex) colorHex.textContent = card.color || '#4CAF50';
                if (charCurrent && contentInput) charCurrent.textContent = contentInput.value.length;
            }
        } else {
            this.editingCardId = null;
            if (modalTitle) modalTitle.textContent = 'Add New Card';
            if (submitBtn) submitBtn.textContent = 'Add Card';
            form.reset();
            
            const charCurrent = document.getElementById('char-current');
            const colorHex = document.getElementById('color-hex');
            if (charCurrent) charCurrent.textContent = '0';
            if (colorHex) colorHex.textContent = '#4CAF50';
        }
        
        modal.classList.remove('hidden');
    }

    openDareCardModal(cardId = null) {
        const modal = document.getElementById('dare-card-modal');
        const form = document.getElementById('dare-card-form');
        const modalTitle = document.getElementById('dare-modal-title');
        const submitBtn = form?.querySelector('.btn-submit');
        
        if (!modal || !form) return;
        
        if (cardId) {
            this.editingDareCardId = cardId;
            if (modalTitle) modalTitle.textContent = 'Edit Dare Card';
            if (submitBtn) submitBtn.textContent = 'Update Dare Card';
            
            const card = this.dareCards.find(c => c.id === cardId);
            if (card) {
                const titleInput = document.getElementById('dare-card-title-input');
                const contentInput = document.getElementById('dare-card-content-input');
                const difficultyInput = document.getElementById('dare-card-difficulty-input');
                const colorInput = document.getElementById('dare-card-color-input');
                
                if (titleInput) titleInput.value = card.title;
                if (contentInput) contentInput.value = card.content;
                if (difficultyInput) difficultyInput.value = card.difficulty || 'easy';
                if (colorInput) colorInput.value = card.color || '#FF9800';
                
                const colorHex = document.getElementById('dare-color-hex');
                const charCurrent = document.getElementById('dare-char-current');
                if (colorHex) colorHex.textContent = card.color || '#FF9800';
                if (charCurrent && contentInput) charCurrent.textContent = contentInput.value.length;
            }
        } else {
            this.editingDareCardId = null;
            if (modalTitle) modalTitle.textContent = 'Add New Dare Card';
            if (submitBtn) submitBtn.textContent = 'Add Dare Card';
            form.reset();
            
            const charCurrent = document.getElementById('dare-char-current');
            const colorHex = document.getElementById('dare-color-hex');
            if (charCurrent) charCurrent.textContent = '0';
            if (colorHex) colorHex.textContent = '#FF9800';
        }
        
        modal.classList.remove('hidden');
    }

    async saveCard() {
        const titleInput = document.getElementById('card-title-input');
        const contentInput = document.getElementById('card-content-input');
        const typeInput = document.getElementById('card-type-input');
        const colorInput = document.getElementById('card-color-input');
        
        if (!titleInput || !contentInput) return;
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const type = typeInput?.value || 'truth';
        const color = colorInput?.value || '#4CAF50';
        
        if (!title || !content) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const scoreValue = type === 'wild_card' ? 0 : this.levelScoreValues[this.currentLevel];
        
        const cardData = {
            title,
            content,
            type,
            scoreValue,
            color
        };
        
        try {
            let response;
            if (this.editingCardId) {
                response = await fetch(`/api/cards/${this.editingCardId}/level/${this.currentLevel}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            } else {
                response = await fetch(`/api/cards/level/${this.currentLevel}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            }
            
            if (response.ok) {
                const savedCard = await response.json();
                
                if (this.editingCardId) {
                    const index = this.currentDeck.findIndex(c => c.id === this.editingCardId);
                    if (index !== -1) {
                        this.currentDeck[index] = savedCard;
                    }
                    this.showToast('Card updated successfully!', 'success');
                } else {
                    this.currentDeck.push(savedCard);
                    this.showToast('Card added successfully!', 'success');
                }
                
                await this.loadLevelCards();
                this.updateUI();
                
                document.getElementById('card-modal')?.classList.add('hidden');
                document.getElementById('card-form')?.reset();
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
        const titleInput = document.getElementById('dare-card-title-input');
        const contentInput = document.getElementById('dare-card-content-input');
        const difficultyInput = document.getElementById('dare-card-difficulty-input');
        const colorInput = document.getElementById('dare-card-color-input');
        
        if (!titleInput || !contentInput) return;
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const difficulty = difficultyInput?.value || 'easy';
        const color = colorInput?.value || '#FF9800';
        
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
                response = await fetch(`/api/dare-cards/${this.editingDareCardId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            } else {
                response = await fetch('/api/dare-cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            }
            
            if (response.ok) {
                const savedCard = await response.json();
                
                if (this.editingDareCardId) {
                    const index = this.currentDareDeck.findIndex(c => c.id === this.editingDareCardId);
                    if (index !== -1) {
                        this.currentDareDeck[index] = savedCard;
                    }
                    this.showToast('Dare card updated successfully!', 'success');
                } else {
                    this.currentDareDeck.push(savedCard);
                    this.showToast('Dare card added successfully!', 'success');
                }
                
                await this.loadDareCards();
                this.updateUI();
                
                document.getElementById('dare-card-modal')?.classList.add('hidden');
                document.getElementById('dare-card-form')?.reset();
                this.editingDareCardId = null;
            } else {
                throw new Error('Failed to save dare card');
            }
        } catch (error) {
            console.error('Error saving dare card:', error);
            this.showToast('Failed to save dare card', 'error');
        }
    }

    async deleteCard(cardId) {
        if (!confirm('Are you sure you want to delete this card?')) return;
        
        try {
            const response = await fetch(`/api/cards/${cardId}/level/${this.currentLevel}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.currentDeck = this.currentDeck.filter(c => c.id !== cardId);
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
                this.currentDareDeck = this.currentDareDeck.filter(c => c.id !== cardId);
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
            gameNumber: this.gameNumber,
            currentPlayer: this.currentPlayer,
            startingPlayer: this.startingPlayer,
            pendingDareForPlayer: this.pendingDareForPlayer,
            currentLevel: this.currentLevel,
            roundWins: this.roundWins,
            players: this.players,
            currentDeck: this.currentDeck.map(c => c.id),
            currentDareDeck: this.currentDareDeck.map(c => c.id),
            completedCards: this.completedCards.map(c => ({
                id: c.id,
                playedBy: c.playedBy,
                action: c.action,
                type: c.type || 'main'
            })),
            currentCard: this.currentCard ? {
                id: this.currentCard.id,
                isDare: this.isDareCard
            } : null,
            usedCardsByLevel: this.usedCardsByLevel
        };
        
        localStorage.setItem('cardDeckGameState', JSON.stringify(gameState));
    }

    loadGameState() {
        const saved = localStorage.getItem('cardDeckGameState');
        if (saved) {
            try {
                const gameState = JSON.parse(saved);
                this.gameNumber = gameState.gameNumber || 1;
                this.currentPlayer = gameState.currentPlayer || 1;
                this.startingPlayer = gameState.startingPlayer || 1;
                this.pendingDareForPlayer = gameState.pendingDareForPlayer || null;
                this.currentLevel = gameState.currentLevel || 1;
                this.roundWins = gameState.roundWins || { 1: 0, 2: 0 };
                this.players = gameState.players || this.players;
                this.usedCardsByLevel = gameState.usedCardsByLevel || { 1: [], 2: [], 3: [] };
            } catch (error) {
                console.error('Error loading game state:', error);
            }
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = `toast ${type}`;
            toast.classList.remove('hidden');
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }
    }

    showToastBanner(message, type = 'level-complete') {
        const banner = document.createElement('div');
        banner.className = 'toast-banner ' + type;
        banner.innerHTML = `
            <div class="toast-banner-content">
                <div class="toast-banner-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            banner.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(banner);
            }, 500);
        }, 5000);
    }

    shakeElement(element) {
        if (element) {
            element.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                element.style.animation = '';
            }, 500);
        }
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
            1: '#2ecc71',
            2: '#f39c12',
            3: '#e74c3c'
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
