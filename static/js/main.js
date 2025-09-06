/**
 * Digital Card Deck Application - Two Player Game Version with Enhanced Dare System
 * Enhanced with improved animations, better state management, and refined user experience
 */

class CardDeck {
    constructor() {
        this.cards = [];
        this.dareCards = [];
        this.currentDeck = [];
        this.currentDareDeck = [];
        this.completedCards = [];
        this.currentCard = null;
        this.isDareCard = false;
        this.isAnimating = false;
        this.editingCardId = null;
        this.editingDareCardId = null;
        this.pendingDareForPlayer = null;
        
        // Enhanced game state
        this.gameNumber = 1;
        this.currentPlayer = 1;
        this.startingPlayer = 1;
        this.gameStats = {
            totalGamesPlayed: 0,
            player1Wins: 0,
            player2Wins: 0,
            ties: 0
        };
        
        this.players = {
            1: {
                name: 'Player 1',
                score: 0,
                cardsCompleted: 0,
                cardsSkipped: 0,
                daresCompleted: 0,
                wildcards: [],
                streak: 0
            },
            2: {
                name: 'Player 2',
                score: 0,
                cardsCompleted: 0,
                cardsSkipped: 0,
                daresCompleted: 0,
                wildcards: [],
                streak: 0
            }
        };
        
        // Score values by card type and level
        this.scoreValues = {
            'truth': {'level 1': 1, 'level 2': 2, 'level 3': 4},
            'dare': {'level 1': 1, 'level 2': 2, 'level 3': 4},
            'never_ever': {'level 1': 1, 'level 2': 2, 'level 3': 4},
            'kink': {'level 1': 2, 'level 2': 4, 'level 3': 6},
            'wild_card': {'level 1': 0, 'level 2': 0, 'level 3': 0}
        };

      // Card back images
        this.cardBackImages = [
            'image_1.png', 'image_2.png', 'image_3.png', 'image_4.png', 'image_5.png', 'image_6.png', 'image_7.png', 'image_8.png', 'image_9.png', 'image_10.png', 'image_11.png', 'image_12.png', 'image_13.png', 'image_14.png', 'image_15.png', 'image_16.png', 'image_17.png', 'image_18.png', 'image_19.png', 'image_20.png', 'image_21.png', 'image_22.png', 'image_23.png', 'image_24.png', 'image_25.png', 'image_26.png', 'image_27.png', 'image_28.png', 
            'image_29.png', 'image_30.png'
        ];
        
        // Audio feedback
        this.sounds = {
            cardFlip: null,
            success: null,
            error: null,
            wildcard: null
        };
        
        // Wildcard modal state
        this.wildcardModalPlayer = null;
        
        this.init();
    }

    async init() {
        await this.loadCards();
        await this.loadDareCards();
        this.setupEventListeners();
        this.updateUI();
        this.loadGameState();
        this.updatePlayerDisplay();
        this.setRandomCardBackImage();
        this.initAudioFeedback();
        this.initTooltips();
        this.checkMobile();
        this.preloadImages();
    }

    initAudioFeedback() {
        // Initialize audio context for better UX (optional)
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not available');
        }
    }

    preloadImages() {
        // Preload card back images for smoother transitions
        this.cardBackImages.forEach(image => {
            const img = new Image();
            img.src = `/static/images/${image}`;
        });
    }

    setRandomCardBackImage() {
        const randomImage = this.cardBackImages[Math.floor(Math.random() * this.cardBackImages.length)];
        const cardBackImage = document.getElementById('card-back-image');
        cardBackImage.style.backgroundImage = `url('/static/images/${randomImage}')`;
        
        // Add subtle animation to the new image
        cardBackImage.style.animation = 'fadeIn 0.5s ease';
        setTimeout(() => {
            cardBackImage.style.animation = '';
        }, 500);
    }

    async loadCards() {
        try {
            const response = await fetch('/api/cards/shuffle');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cards = data.cards || [];
            
            // Ensure all cards have score values
            this.cards = this.cards.map(card => ({
                ...card,
                scoreValue: card.scoreValue || this.scoreValues[card.type]?.[card.level] || 1
            }));
            
            this.currentDeck = [...this.cards];
            this.completedCards = [];
            
            if (this.cards.length === 0) {
                this.showToast('No cards found in deck!', 'warning');
            }
        } catch (error) {
            console.error('Error loading cards:', error);
            this.showToast('Failed to load cards. Please refresh the page.', 'error');
        }
    }

    async loadDareCards() {
        try {
            const response = await fetch('/api/dare-cards/shuffle');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.dareCards = data.cards || [];
            this.currentDareDeck = [...this.dareCards];
            
            if (this.dareCards.length === 0) {
                this.showToast('No dare cards found!', 'warning');
            }
        } catch (error) {
            console.error('Error loading dare cards:', error);
            this.showToast('Failed to load dare cards. Some features may be limited.', 'error');
        }
    }

    setupEventListeners() {
        // Navigation menu with improved UX
        const navMenuBtn = document.getElementById('nav-menu-btn');
        const navDropdown = document.getElementById('nav-dropdown');
        
        navMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenuBtn.classList.toggle('active');
            navDropdown.classList.toggle('active');
            
            // Add ripple effect
            this.createRippleEffect(navMenuBtn, e);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenuBtn.contains(e.target) && !navDropdown.contains(e.target)) {
                navMenuBtn.classList.remove('active');
                navDropdown.classList.remove('active');
            }
        });

        // Deck interactions with enhanced feedback
        const deck = document.getElementById('card-deck');
        deck.addEventListener('click', (e) => {
            this.createRippleEffect(deck, e);
            this.handleDeckClick();
        });
        
        deck.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleDeckClick();
            }
        });

        // Action buttons with enhanced animations
        document.getElementById('skip-btn').addEventListener('click', (e) => {
            this.createButtonAnimation(e.target);
            this.skipCard();
        });
        
        document.getElementById('done-btn').addEventListener('click', (e) => {
            this.createButtonAnimation(e.target);
            this.completeCard();
        });
        
        document.getElementById('complete-dare-btn').addEventListener('click', (e) => {
            this.createButtonAnimation(e.target);
            this.completeDare();
        });
        
        document.getElementById('use-wildcard-btn').addEventListener('click', (e) => {
            this.createButtonAnimation(e.target);
            this.useWildcardOnOpponent();
        });
        
        document.getElementById('save-wildcard-btn').addEventListener('click', (e) => {
            this.createButtonAnimation(e.target);
            this.saveWildcardForLater();
        });

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

        // Player name inputs with validation
        document.getElementById('player-1-name').addEventListener('change', (e) => {
            const name = e.target.value.trim() || 'Player 1';
            this.players[1].name = name;
            this.updatePlayerDisplay();
            this.saveGameState();
        });
        
        document.getElementById('player-2-name').addEventListener('change', (e) => {
            const name = e.target.value.trim() || 'Player 2';
            this.players[2].name = name;
            this.updatePlayerDisplay();
            this.saveGameState();
        });

        // FIXED: Enhanced wildcard collection interactions
        document.getElementById('player-1-wildcards').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            if (this.players[1].wildcards.length > 0) {
                this.createRippleEffect(e.currentTarget, e);
                // Allow player to use their wildcards on their turn
                if (!this.currentCard || this.currentPlayer === 1) {
                    this.showWildcardCollection(1);
                } else {
                    this.showToast("It's not your turn!", 'info');
                    this.shakeElement(e.currentTarget);
                }
            } else {
                this.shakeElement(e.currentTarget);
                this.showToast("No wildcards collected yet!", 'info');
            }
        });

        document.getElementById('player-2-wildcards').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            if (this.players[2].wildcards.length > 0) {
                this.createRippleEffect(e.currentTarget, e);
                // Allow player to use their wildcards on their turn
                if (!this.currentCard || this.currentPlayer === 2) {
                    this.showWildcardCollection(2);
                } else {
                    this.showToast("It's not your turn!", 'info');
                    this.shakeElement(e.currentTarget);
                }
            } else {
                this.shakeElement(e.currentTarget);
                this.showToast("No wildcards collected yet!", 'info');
            }
        });

        // Close wildcard modal button
        const closeWildcardBtn = document.querySelector('#wildcard-collection-modal .btn-close-modal');
        if (closeWildcardBtn) {
            closeWildcardBtn.addEventListener('click', () => {
                this.closeModal('wildcard-collection-modal');
            });
        }

        // Winner modal buttons
        document.querySelector('.btn-new-game-modal').addEventListener('click', () => {
            document.getElementById('winner-modal').classList.add('hidden');
            this.startNewGame();
        });
        
        document.querySelector('.btn-close-modal').addEventListener('click', () => {
            document.getElementById('winner-modal').classList.add('hidden');
        });

        // Modal controls
        this.setupModalControls();

        // Form controls
        this.setupFormControls();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Auto-save on page unload
        window.addEventListener('beforeunload', () => this.saveGameState());
        
        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateUI(); // Refresh UI when tab becomes visible
            }
        });
    }

    createRippleEffect(element, event) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;
        
        const container = element.style.position === 'relative' ? element : element.parentNode;
        if (container.style.position !== 'relative') {
            container.style.position = 'relative';
        }
        container.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    createButtonAnimation(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    closeNavMenu() {
        document.getElementById('nav-menu-btn').classList.remove('active');
        document.getElementById('nav-dropdown').classList.remove('active');
    }

    handleDeckClick() {
        if (this.isAnimating) {
            this.showToast('Please wait for the current animation to complete', 'info');
            return;
        }
        
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
            if (this.completedCards.length > 0) {
                this.endGame();
            }
            return;
        }

        if (this.currentCard) {
            this.showToast('Please complete or skip the current card first', 'info');
            this.shakeElement(document.getElementById('current-card'));
            return;
        }

        this.isAnimating = true;
        this.currentCard = this.currentDeck.shift();
        this.isDareCard = false;
        
        // Enhanced haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
        }
        
        // Play sound effect (if available)
        this.playSound('cardFlip');
        
        this.displayCurrentCard();
        this.updateUI();
        this.setRandomCardBackImage();
        
        // Update deck with smooth animation
        this.animateDeckUpdate();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }

    animateDeckUpdate() {
        const deck = document.getElementById('card-deck');
        deck.style.animation = 'deckUpdate 0.3s ease';
        setTimeout(() => {
            deck.style.animation = '';
        }, 300);
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

        // Enhanced dare card presentation
        const deckElement = document.getElementById('card-deck');
        deckElement.classList.add('dare-deck');
        
        // Dramatic text update
        const instructionText = document.getElementById('instruction-text');
        instructionText.textContent = '🎯 DARE CARD - MUST COMPLETE! 🎯';
        instructionText.style.animation = 'pulse 1s ease-in-out';
        
        this.displayCurrentCard();
        this.updateUI();
        this.updatePlayerDisplay();
        
        // Play special dare sound
        this.playSound('wildcard');
        
        // Enhanced vibration pattern for dare
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
        
        setTimeout(() => {
            this.isAnimating = false;
            deckElement.classList.remove('dare-deck');
            instructionText.style.animation = '';
        }, 600);
    }

    displayCurrentCard() {
        const cardElement = document.getElementById('current-card');
        const actionButtons = document.getElementById('action-buttons');
        const dareActionButtons = document.getElementById('dare-action-buttons');
        const wildcardActionButtons = document.getElementById('wildcard-action-buttons');
        
        if (this.currentCard) {
            // Update card content with enhanced styling
            const cardFront = cardElement.querySelector('.card-front-large');
            cardFront.style.borderTop = `5px solid ${this.currentCard.color || '#4CAF50'}`;
            
            // Remove all special classes first
            cardFront.classList.remove('wild-card', 'dare-card');
            cardElement.classList.remove('wild-card-glow', 'dare-card-glow');
            
            // Special styling for different card types
            if (this.currentCard.type === 'wild_card') {
                cardFront.classList.add('wild-card');
                cardElement.classList.add('wild-card-glow');
                this.playSound('wildcard');
            } else if (this.isDareCard) {
                cardFront.classList.add('dare-card');
                cardElement.classList.add('dare-card-glow');
            }
            
            // Update card information
            document.getElementById('card-id').textContent = this.currentCard.id;
            cardElement.querySelector('.card-title-large').textContent = this.currentCard.title;
            cardElement.querySelector('.card-content-large').textContent = this.currentCard.content;
            
            // FIXED: Hide score and level for dare cards
            const scoreElement = document.getElementById('card-score');
            const scoreInfoElement = document.querySelector('.card-score-info-large');
            const levelElement = cardElement.querySelector('.card-level-large');
            
            if (this.isDareCard) {
                // Hide score display for dare cards
                scoreInfoElement.style.display = 'none';
                levelElement.style.display = 'none';
            } else {
                // Show score display for regular cards
                scoreInfoElement.style.display = 'flex';
                levelElement.style.display = 'inline-block';
                
                const scoreValue = this.currentCard.scoreValue || this.scoreValues[this.currentCard.type]?.[this.currentCard.level] || 1;
                scoreElement.textContent = scoreValue;
                document.getElementById('done-points').textContent = scoreValue;
                
                // Animate score if it's high value
                if (scoreValue >= 4) {
                    scoreElement.style.animation = 'scoreHighlight 2s ease-in-out';
                    setTimeout(() => {
                        scoreElement.style.animation = '';
                    }, 2000);
                }
                
                // Update level
                levelElement.textContent = (this.currentCard.level || 'level 1').toUpperCase();
                levelElement.style.background = this.getLevelColor(this.currentCard.level);
            }
            
            // Update type badge
            const typeBadge = cardElement.querySelector('.card-type-badge-large');
            if (this.isDareCard) {
                typeBadge.textContent = '🎯 DARE';
                typeBadge.style.background = '#ff6b35';
            } else {
                typeBadge.textContent = this.getTypeDisplayName(this.currentCard.type);
                typeBadge.style.background = this.getTypeColor(this.currentCard.type);
            }
            typeBadge.style.color = 'white';
            
            // Show card with enhanced animation
            cardElement.classList.remove('hidden');
            cardElement.classList.add('flip-animation');
            
            // Show appropriate action buttons with stagger animation
            this.hideAllActionButtons();
            
            setTimeout(() => {
                if (this.isDareCard) {
                    dareActionButtons.classList.remove('hidden');
                } else if (this.currentCard.type === 'wild_card') {
                    wildcardActionButtons.classList.remove('hidden');
                } else {
                    actionButtons.classList.remove('hidden');
                }
            }, 300);
            
            setTimeout(() => {
                cardElement.classList.remove('flip-animation');
            }, 600);
        } else {
            cardElement.classList.add('hidden');
            this.hideAllActionButtons();
        }
    }

    hideAllActionButtons() {
        document.getElementById('action-buttons').classList.add('hidden');
        document.getElementById('dare-action-buttons').classList.add('hidden');
        document.getElementById('wildcard-action-buttons').classList.add('hidden');
    }

    skipCard() {
        if (!this.currentCard || this.isAnimating || this.isDareCard) return;
        
        this.isAnimating = true;
        
        // Enhanced animation
        const cardElement = document.getElementById('current-card');
        cardElement.style.animation = 'slideOutLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Show skip feedback
        this.showCardActionFeedback('SKIPPED', 'warning');
        
        setTimeout(() => {
            // Add to completed pile
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'skip'
            });
            
            // Update player stats
            this.players[this.currentPlayer].cardsSkipped++;
            this.players[this.currentPlayer].streak = 0; // Reset streak on skip
            
            // Add to completed stack display
            this.addToCompletedStack(this.currentCard, 'skip');
            
            // Set up dare for the player who skipped (SAME PLAYER must do the dare)
            this.pendingDareForPlayer = this.currentPlayer;
            
            this.currentCard = null;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            this.showToast(`${this.players[this.pendingDareForPlayer].name} must now complete a dare!`, 'warning');
            
            // Reset card element animation
            cardElement.style.animation = '';
            
            this.isAnimating = false;
        }, 400);
    }

    completeCard() {
        if (!this.currentCard || this.isAnimating || this.isDareCard) return;
        
        this.isAnimating = true;
        
        // Enhanced completion animation
        const cardElement = document.getElementById('current-card');
        cardElement.style.animation = 'slideOutRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Show completion feedback
        this.showCardActionFeedback('COMPLETED', 'success');
        
        setTimeout(() => {
            let pointsAwarded = 0;
            
            // Award points (unless it's a wild card)
            if (this.currentCard.type !== 'wild_card') {
                pointsAwarded = this.currentCard.scoreValue || this.scoreValues[this.currentCard.type]?.[this.currentCard.level] || 1;
                this.players[this.currentPlayer].score += pointsAwarded;
                this.players[this.currentPlayer].cardsCompleted++;
                this.players[this.currentPlayer].streak++; // Increment streak
                
                // Play success sound
                this.playSound('success');
                
                if (pointsAwarded > 0) {
                    this.showToast(`+${pointsAwarded} points! ${this.players[this.currentPlayer === 1 ? 2 : 1].name}'s turn!`, 'success');
                    this.showScoreAnimation(pointsAwarded);
                }
            }
            
            // Add to completed cards
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'done'
            });
            
            this.addToCompletedStack(this.currentCard, 'done');
            
            // Switch turns (unless wild card)
            if (this.currentCard.type !== 'wild_card') {
                this.switchTurns();
            }
            
            this.currentCard = null;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            // Check if deck is complete
            if (this.currentDeck.length === 0) {
                this.endGame();
            }
            
            // Reset card element animation
            cardElement.style.animation = '';
            
            this.isAnimating = false;
        }, 400);
    }

    completeDare() {
        if (!this.currentCard || this.isAnimating || !this.isDareCard) return;
        
        this.isAnimating = true;
        
        // Enhanced dare completion animation
        const cardElement = document.getElementById('current-card');
        cardElement.style.animation = 'slideOutRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Show dare completion feedback
        this.showCardActionFeedback('DARE COMPLETED!', 'success');
        
        setTimeout(() => {
            // No points awarded for dare cards, but track completion
            this.players[this.currentPlayer].cardsCompleted++;
            this.players[this.currentPlayer].daresCompleted++;
            this.players[this.currentPlayer].streak++; // Maintain streak on dare completion
            
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
            
            // Play success sound
            this.playSound('success');
            
            // Reset card element animation
            cardElement.style.animation = '';
            
            this.isAnimating = false;
        }, 400);
    }

    useWildcardOnOpponent() {
        if (!this.currentCard || this.currentCard.type !== 'wild_card') return;
        
        // Check if this is a dare-forcing wildcard by examining the content
        const isDareForcing = this.isDareForcing(this.currentCard);
        
        if (isDareForcing) {
            // Set up dare for the opponent
            this.pendingDareForPlayer = this.currentPlayer === 1 ? 2 : 1;
            
            // Show special wildcard usage animation
            this.showCardActionFeedback('DARE WILDCARD USED!', 'warning');
            
            this.showToast(`${this.players[this.pendingDareForPlayer].name} must draw a dare card!`, 'warning');
        } else {
            // Regular wildcard - just show usage feedback
            this.showCardActionFeedback('WILDCARD USED!', 'info');
            
            this.showToast(`Wildcard "${this.currentCard.title}" used!`, 'success');
        }
        
        // Complete the card normally but don't switch turns for wildcard
        this.completeWildcard();
    }

    completeWildcard() {
        if (!this.currentCard || this.currentCard.type !== 'wild_card') return;
        
        this.isAnimating = true;
        
        // Enhanced completion animation
        const cardElement = document.getElementById('current-card');
        cardElement.style.animation = 'slideOutRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        setTimeout(() => {
            // Add to completed cards
            this.completedCards.push({
                ...this.currentCard,
                playedBy: this.currentPlayer,
                action: 'wildcard'
            });
            
            this.addToCompletedStack(this.currentCard, 'wildcard');
            
            // Don't switch turns for wildcard - current player continues
            
            this.currentCard = null;
            this.displayCurrentCard();
            this.updateUI();
            this.updatePlayerDisplay();
            this.saveGameState();
            
            // Reset card element animation
            cardElement.style.animation = '';
            
            this.isAnimating = false;
        }, 400);
    }

    // Helper method to determine if a wildcard forces a dare
    isDareForcing(wildcardCard) {
        // Check for specific dare-forcing patterns in the card content
        const dareKeywords = [
            'dare',
            'challenge',
            'must complete a dare',
            'draw a dare',
            'opponent dare',
            'turn up the heat'
        ];
        
        const content = wildcardCard.content.toLowerCase();
        const title = wildcardCard.title.toLowerCase();
        
        // Check if the card content or title contains dare-forcing language
        return dareKeywords.some(keyword => 
            content.includes(keyword) || title.includes(keyword)
        ) || (
            // Specific IDs that we know are dare-forcing cards
            [160, 161, 162, 163, 164].includes(wildcardCard.id)
        );
    }

    saveWildcardForLater() {
        if (!this.currentCard || this.currentCard.type !== 'wild_card') return;
        
        // Add wildcard to player's collection
        this.players[this.currentPlayer].wildcards.push({
            ...this.currentCard,
            savedAt: new Date().toISOString()
        });
        
        // Show wildcard save animation
        this.showCardActionFeedback('WILDCARD SAVED!', 'info');
        
        this.completeWildcard();
        
        this.showToast('Wild card saved to your collection!', 'success');
        this.animateWildcardCount(this.currentPlayer);
    }

    showWildcardCollection(playerId) {
        const modal = document.getElementById('wildcard-collection-modal');
        const list = document.getElementById('wildcard-list');
        const wildcards = this.players[playerId].wildcards;
        
        this.wildcardModalPlayer = playerId;
        
        modal.style.animation = 'modalSlideIn 0.3s ease';
        
        if (wildcards.length === 0) {
            list.innerHTML = '<p class="empty-state">No wild cards collected yet</p>';
        } else {
            list.innerHTML = wildcards.map((card, index) => `
                <div class="wildcard-item" style="animation: slideInUp 0.3s ease ${index * 0.1}s both;">
                    <div class="wildcard-item-title">${card.title}</div>
                    <div class="wildcard-item-content">${card.content}</div>
                    <div class="wildcard-item-date">Saved: ${new Date(card.savedAt).toLocaleDateString()}</div>
                    <div class="wildcard-item-actions">
                        <button class="btn-use-now" onclick="cardDeck.useWildcardFromCollection(${playerId}, ${index})">
                            🎯 Use Now
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        modal.classList.add('active');
        modal.classList.remove('hidden');
    }

    useWildcardFromCollection(playerId, wildcardIndex) {
        // Validate that it's the player's turn or no current card
        if (this.currentCard && this.currentPlayer !== playerId) {
            this.showToast("It's not your turn!", 'error');
            return;
        }
        
        const wildcard = this.players[playerId].wildcards[wildcardIndex];
        
        // Remove wildcard from collection
        this.players[playerId].wildcards.splice(wildcardIndex, 1);
        
        // Check if this wildcard forces a dare
        const isDareForcing = this.isDareForcing(wildcard);
        
        if (isDareForcing) {
            // Set up dare for the opponent
            const opponentId = playerId === 1 ? 2 : 1;
            this.pendingDareForPlayer = opponentId;
            
            // Set the current player to the one who used the wildcard
            this.currentPlayer = playerId;
            
            this.showToast(`Using "${wildcard.title}"! ${this.players[opponentId].name} must draw a dare!`, 'warning');
            
            // Show feedback
            this.showCardActionFeedback('DARE WILDCARD ACTIVATED!', 'warning');
        } else {
            // Regular wildcard - current player continues their turn
            this.currentPlayer = playerId;
            
            this.showToast(`Using "${wildcard.title}"! Continue playing!`, 'success');
            
            // Show feedback
            this.showCardActionFeedback('WILDCARD ACTIVATED!', 'success');
        }
        
        // Add the wildcard to completed cards for tracking
        this.completedCards.push({
            ...wildcard,
            playedBy: playerId,
            action: 'wildcard-used'
        });
        
        // Close modal with animation
        const modal = document.getElementById('wildcard-collection-modal');
        modal.style.animation = 'modalSlideOut 0.3s ease';
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('active');
            modal.style.animation = '';
            this.wildcardModalPlayer = null;
        }, 300);
        
        this.updatePlayerDisplay();
        this.saveGameState();
        this.animateWildcardCount(playerId);
        this.updateUI();
    }

    switchTurns() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    addToCompletedStack(card, action) {
        const completedPile = document.getElementById('completed-cards-pile');
        const emptyState = document.getElementById('empty-completed');
        
        emptyState.classList.add('hidden');
        
        // Create face-up card for the stack with enhanced styling
        const cardFace = document.createElement('div');
        cardFace.className = 'completed-card-face';
        cardFace.style.borderTop = `3px solid ${card.color || '#4CAF50'}`;
        cardFace.style.animation = 'slideInStack 0.5s ease';
        
        let actionText = '';
        let actionClass = '';
        if (action === 'done') {
            actionText = `✅ ${card.scoreValue || 0} pts`;
            actionClass = 'action-done';
        } else if (action === 'skip') {
            actionText = '⏭️ Skipped';
            actionClass = 'action-skip';
        } else if (action === 'dare') {
            actionText = '🎯 Dare Done';
            actionClass = 'action-dare';
        } else if (action === 'wildcard' || action === 'wildcard-used') {
            actionText = '🃏 Wildcard';
            actionClass = 'action-wildcard';
        }
        
        const playerName = this.players[this.currentPlayer].name;
        
        cardFace.innerHTML = `
            <div class="completed-card-mini-title">${card.title}</div>
            <div class="completed-card-mini-content">${card.content.substring(0, 120)}${card.content.length > 120 ? '...' : ''}</div>
            <div class="completed-card-mini-footer">
                <span class="completed-card-player">${playerName}</span>
                <span class="completed-card-action ${actionClass}">${actionText}</span>
            </div>
        `;
        
        // Add to pile (limit visible cards to 5 for performance)
        if (completedPile.children.length >= 5) {
            completedPile.removeChild(completedPile.lastChild);
        }
        completedPile.insertBefore(cardFace, completedPile.firstChild);
        
        // Update count with animation
        const countElement = document.querySelector('.completed-count-large');
        countElement.textContent = this.completedCards.length;
        countElement.style.animation = 'bounce 0.5s ease';
        setTimeout(() => {
            countElement.style.animation = '';
        }, 500);
    }

    showCardActionFeedback(text, type) {
        const feedback = document.createElement('div');
        feedback.className = `card-action-feedback ${type}`;
        feedback.textContent = text;
        
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#2ecc71' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 1.5em;
            font-weight: bold;
            z-index: 3000;
            animation: feedbackPulse 1s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }

    showScoreAnimation(points) {
        const scoreElement = document.getElementById(`player-${this.currentPlayer}-score`);
        const animation = document.createElement('div');
        animation.textContent = `+${points}`;
        animation.style.cssText = `
            position: absolute;
            color: #2ecc71;
            font-size: 1.5em;
            font-weight: bold;
            pointer-events: none;
            animation: scoreFloat 2s ease-out forwards;
            z-index: 1000;
        `;
        
        scoreElement.parentNode.style.position = 'relative';
        scoreElement.parentNode.appendChild(animation);
        
        setTimeout(() => {
            if (animation.parentNode) {
                animation.parentNode.removeChild(animation);
            }
        }, 2000);
    }

    animateWildcardCount(playerId) {
        const wildcardElement = document.getElementById(`player-${playerId}-wildcard-count`);
        wildcardElement.style.animation = 'bounce 0.5s ease';
        setTimeout(() => {
            wildcardElement.style.animation = '';
        }, 500);
    }

    startNewGame() {
        if (this.completedCards.length > 0 || this.currentCard) {
            const confirmDialog = this.createCustomConfirm(
                'Start New Game?',
                'Are you sure you want to start a new game? Current progress will be lost.',
                () => this.executeNewGame()
            );
        } else {
            this.executeNewGame();
        }
    }

    executeNewGame() {
        // Switch starting player
        this.gameNumber++;
        this.startingPlayer = this.startingPlayer === 1 ? 2 : 1;
        this.currentPlayer = this.startingPlayer;
        this.pendingDareForPlayer = null;
        
        // Reset streaks but keep wildcards
        this.players[1].streak = 0;
        this.players[2].streak = 0;
        
        // Load fresh decks
        Promise.all([this.loadCards(), this.loadDareCards()]).then(() => {
            this.currentCard = null;
            this.isDareCard = false;
            this.displayCurrentCard();
            
            // Clear completed pile with animation
            const completedPile = document.getElementById('completed-cards-pile');
            Array.from(completedPile.children).forEach((child, index) => {
                child.style.animation = `slideOutDown 0.3s ease ${index * 0.1}s forwards`;
            });
            
            setTimeout(() => {
                completedPile.innerHTML = '';
                document.getElementById('empty-completed').classList.remove('hidden');
            }, 500);
            
            this.updateUI();
            this.updatePlayerDisplay();
            this.setRandomCardBackImage();
            this.saveGameState();
            
            this.showToast(`Game ${this.gameNumber} started! ${this.players[this.startingPlayer].name} goes first!`, 'success');
            
            // Celebrate with confetti effect (if you want to add this)
            this.createConfettiEffect();
        });
    }

    createConfettiEffect() {
        // Simple confetti effect using emoji
        const emojis = ['🎉', '✨', '🎊', '🏆'];
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                confetti.style.cssText = `
                    position: fixed;
                    font-size: 2em;
                    pointer-events: none;
                    z-index: 4000;
                    left: ${Math.random() * 100}vw;
                    top: -50px;
                    animation: confettiFall 3s ease-out forwards;
                `;
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 100);
        }
    }

    resetScores() {
        const confirmDialog = this.createCustomConfirm(
            'Reset All Scores?',
            'This will reset all player scores, stats, and wildcards. Are you sure?',
            () => this.executeScoreReset()
        );
    }

    executeScoreReset() {
        this.players[1].score = 0;
        this.players[1].cardsCompleted = 0;
        this.players[1].cardsSkipped = 0;
        this.players[1].daresCompleted = 0;
        this.players[1].wildcards = [];
        this.players[1].streak = 0;
        
        this.players[2].score = 0;
        this.players[2].cardsCompleted = 0;
        this.players[2].cardsSkipped = 0;
        this.players[2].daresCompleted = 0;
        this.players[2].wildcards = [];
        this.players[2].streak = 0;
        
        this.gameNumber = 1;
        this.startingPlayer = 1;
        this.currentPlayer = 1;
        this.pendingDareForPlayer = null;
        
        this.updatePlayerDisplay();
        this.saveGameState();
        this.showToast('All scores and stats reset!', 'success');
    }

    endGame() {
        // Update game stats
        this.gameStats.totalGamesPlayed++;
        
        // Determine winner
        const winner = this.players[1].score > this.players[2].score ? 1 : 
                      this.players[2].score > this.players[1].score ? 2 : 0;
        
        if (winner === 1) {
            this.gameStats.player1Wins++;
        } else if (winner === 2) {
            this.gameStats.player2Wins++;
        } else {
            this.gameStats.ties++;
        }
        
        // Show winner modal with enhanced styling
        const modal = document.getElementById('winner-modal');
        const winnerName = document.getElementById('winner-name');
        
        modal.style.animation = 'modalSlideIn 0.5s ease';
        
        if (winner === 0) {
            winnerName.textContent = "🤝 It's a Tie! 🤝";
            winnerName.style.color = '#f39c12';
        } else {
            winnerName.textContent = `🏆 ${this.players[winner].name} Wins! 🏆`;
            winnerName.style.color = winner === 1 ? '#3498db' : '#e74c3c';
            
            // Show celebration for winner
            this.createConfettiEffect();
        }
        
        // Enhanced final score display
        document.getElementById('final-player-1-name').textContent = this.players[1].name;
        document.getElementById('final-player-1-score').textContent = this.players[1].score;
        document.getElementById('final-player-2-name').textContent = this.players[2].name;
        document.getElementById('final-player-2-score').textContent = this.players[2].score;
        
        // Add game stats
        const statsHTML = `
            <div class="game-stats">
                <h3>Game Statistics</h3>
                <div class="stat-row">
                    <span>Games Played:</span> <span>${this.gameStats.totalGamesPlayed}</span>
                </div>
                <div class="stat-row">
                    <span>${this.players[1].name} Wins:</span> <span>${this.gameStats.player1Wins}</span>
                </div>
                <div class="stat-row">
                    <span>${this.players[2].name} Wins:</span> <span>${this.gameStats.player2Wins}</span>
                </div>
                <div class="stat-row">
                    <span>Ties:</span> <span>${this.gameStats.ties}</span>
                </div>
            </div>
        `;
        
        const finalScores = document.querySelector('.final-scores');
        if (!document.querySelector('.game-stats')) {
            finalScores.insertAdjacentHTML('afterend', statsHTML);
        }
        
        modal.classList.remove('hidden');
        
        // Play victory sound
        this.playSound('success');
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
        
        // Enhanced shuffle animation
        this.isAnimating = true;
        const deck = document.getElementById('card-deck');
        deck.style.animation = 'shuffleEnhanced 1s ease';
        
        // Show shuffling feedback
        this.showToast('Shuffling decks...', 'info');
        
        // Fisher-Yates shuffle with visual feedback
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
            this.showToast('Decks shuffled! Ready to play!', 'success');
            this.isAnimating = false;
        }, 1000);
    }

    updatePlayerDisplay() {
        // Update player names
        document.getElementById('player-1-name').value = this.players[1].name;
        document.getElementById('player-2-name').value = this.players[2].name;
        
        // Update scores with animation on change
        const score1 = document.getElementById('player-1-score');
        const score2 = document.getElementById('player-2-score');
        
        if (score1.textContent !== this.players[1].score.toString()) {
            score1.style.animation = 'scoreUpdate 0.5s ease';
            score1.textContent = this.players[1].score;
            setTimeout(() => score1.style.animation = '', 500);
        }
        
        if (score2.textContent !== this.players[2].score.toString()) {
            score2.style.animation = 'scoreUpdate 0.5s ease';
            score2.textContent = this.players[2].score;
            setTimeout(() => score2.style.animation = '', 500);
        }
        
        // Update wildcard counts
        document.getElementById('player-1-wildcard-count').textContent = this.players[1].wildcards.length;
        document.getElementById('player-2-wildcard-count').textContent = this.players[2].wildcards.length;
        
        // Update current turn indicator with enhanced styling
        const player1Card = document.getElementById('player-1-card');
        const player2Card = document.getElementById('player-2-card');
        
        player1Card.classList.toggle('active', this.currentPlayer === 1);
        player2Card.classList.toggle('active', this.currentPlayer === 2);
        
        // Add streak indicators
        this.updateStreakDisplay();
        
        // Update game info
        document.getElementById('current-player').textContent = this.players[this.currentPlayer].name;
        document.getElementById('game-number').textContent = this.gameNumber;
    }

    updateStreakDisplay() {
        // Add visual streak indicators
        const player1Streak = this.players[1].streak;
        const player2Streak = this.players[2].streak;
        
        // Update or create streak displays
        this.updatePlayerStreak(1, player1Streak);
        this.updatePlayerStreak(2, player2Streak);
    }

    updatePlayerStreak(playerId, streak) {
        const playerCard = document.getElementById(`player-${playerId}-card`);
        let streakElement = playerCard.querySelector('.streak-indicator');
        
        if (streak >= 3) {
            if (!streakElement) {
                streakElement = document.createElement('div');
                streakElement.className = 'streak-indicator';
                playerCard.appendChild(streakElement);
            }
            
            streakElement.textContent = `🔥 ${streak}`;
            streakElement.style.animation = 'streakPulse 1s ease infinite';
        } else if (streakElement) {
            streakElement.remove();
        }
    }

    updateUI() {
        // Update progress bar with smooth animation
        const total = this.cards.length;
        const completed = this.completedCards.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;
        
        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width = `${progress}%`;
        
        // Update deck appearance
        const deckElement = document.getElementById('card-deck');
        if (this.currentDeck.length === 0 && !this.pendingDareForPlayer) {
            deckElement.classList.add('disabled');
        } else {
            deckElement.classList.remove('disabled');
        }
        
        // Update instruction text with enhanced styling
        const instructionText = document.getElementById('instruction-text');
        if (this.pendingDareForPlayer) {
            instructionText.textContent = `🎯 ${this.players[this.pendingDareForPlayer].name} must complete a dare!`;
            instructionText.style.cssText = `
                color: #ff6b35;
                font-weight: bold;
                font-size: 1.1em;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            `;
        } else {
            instructionText.textContent = 'Click to draw a card';
            instructionText.style.cssText = '';
        }
        
        // Update empty state
        const emptyState = document.getElementById('empty-completed');
        emptyState.classList.toggle('hidden', this.completedCards.length > 0);
        
        // Update completed count
        document.querySelector('.completed-count-large').textContent = this.completedCards.length;
        
        // Update deck count display (if you want to show remaining cards)
        const deckCount = this.currentDeck.length;
        const deckCountDisplay = document.getElementById('deck-count');
        if (deckCountDisplay) {
            deckCountDisplay.textContent = `${deckCount} cards left`;
        }
    }

    // Enhanced Modal and Form Management (keeping all existing functionality)
    setupModalControls() {
        const modals = ['card-modal', 'dare-card-modal', 'manage-modal', 'manage-dare-modal', 'wildcard-collection-modal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            // Close button
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(modalId));
            }
            
            // Click outside to close (exclude wildcard modal to prevent accidental closing)
            if (modalId !== 'wildcard-collection-modal') {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modalId);
                    }
                });
            }
        });

        // Cancel buttons
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Form submissions
        document.getElementById('card-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCard();
        });

        document.getElementById('dare-card-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDareCard();
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.animation = 'modalSlideOut 0.3s ease';
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('active');
            modal.style.animation = '';
            this.editingCardId = null;
            this.editingDareCardId = null;
            this.wildcardModalPlayer = null;
        }, 300);
    }

    setupFormControls() {
        // Character counters with visual feedback
        this.setupCharacterCounter('card-content-input', 'char-current', 300);
        this.setupCharacterCounter('dare-card-content-input', 'dare-char-current', 300);

        // Color picker sync
        this.setupColorPicker('card-color-input', 'color-hex');
        this.setupColorPicker('dare-card-color-input', 'dare-color-hex');

        // Search functionality with debouncing
        this.setupSearchWithDebounce('search-cards', () => this.filterCardsList());
        this.setupSearchWithDebounce('search-dare-cards', () => this.filterDareCardsList());
        
        // Filter changes
        const filterSelect = document.getElementById('filter-type');
        const filterDifficultySelect = document.getElementById('filter-difficulty');
        
        if (filterSelect) filterSelect.addEventListener('change', () => this.filterCardsList());
        if (filterDifficultySelect) filterDifficultySelect.addEventListener('change', () => this.filterDareCardsList());
    }

    setupCharacterCounter(inputId, counterId, maxLength) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);
        
        if (!input || !counter) return;
        
        input.addEventListener('input', () => {
            const length = input.value.length;
            counter.textContent = length;
            
            // Visual feedback for character limit
            const percentage = (length / maxLength) * 100;
            if (percentage > 90) {
                counter.style.color = '#e74c3c';
            } else if (percentage > 75) {
                counter.style.color = '#f39c12';
            } else {
                counter.style.color = '#7f8c8d';
            }
        });
    }

    setupColorPicker(inputId, hexId) {
        const colorInput = document.getElementById(inputId);
        const hexDisplay = document.getElementById(hexId);
        
        if (!colorInput || !hexDisplay) return;
        
        colorInput.addEventListener('input', () => {
            hexDisplay.textContent = colorInput.value.toUpperCase();
        });
    }

    setupSearchWithDebounce(inputId, callback, delay = 300) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(callback, delay);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs or modals are open
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (document.querySelector('.modal:not(.hidden)')) return;
            
            // Prevent default for handled keys
            const handledKeys = ['d', 's', 'enter', ' '];
            if (handledKeys.includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            
            switch(e.key.toLowerCase()) {
                case 'd':
                case ' ':
                    if (!this.isAnimating) this.handleDeckClick();
                    break;
                case 's':
                    if (this.currentCard && !this.isDareCard && !this.isAnimating) {
                        this.skipCard();
                    }
                    break;
                case 'enter':
                    if (this.currentCard && !this.isAnimating) {
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
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.shuffleDeck();
                    }
                    break;
            }
        });
    }

    // Enhanced Card Management (keeping all existing functionality)
    openCardModal(cardId = null) {
        const modal = document.getElementById('card-modal');
        const form = document.getElementById('card-form');
        const modalTitle = document.getElementById('modal-title');
        const submitBtn = form.querySelector('.btn-submit');
        
        modal.style.animation = 'modalSlideIn 0.3s ease';
        
        if (cardId) {
            // Edit mode
            this.editingCardId = cardId;
            modalTitle.textContent = 'Edit Card';
            submitBtn.textContent = 'Update Card';
            
            // Load card data
            const card = this.cards.find(c => c.id === cardId);
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
        }
        
        modal.classList.remove('hidden');
    }

    openDareCardModal(cardId = null) {
        const modal = document.getElementById('dare-card-modal');
        const form = document.getElementById('dare-card-form');
        const modalTitle = document.getElementById('dare-modal-title');
        const submitBtn = form.querySelector('.btn-submit');
        
        modal.style.animation = 'modalSlideIn 0.3s ease';
        
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
        
        const scoreValue = this.scoreValues[type]?.[level] || 1;
        
        const cardData = {
            title,
            content,
            type,
            level,
            scoreValue,
            color
        };
        
        try {
            let response;
            if (this.editingCardId) {
                response = await fetch(`/api/cards/${this.editingCardId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardData)
                });
            } else {
                response = await fetch('/api/cards', {
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
                    // Add to current deck
                    this.currentDeck.push(savedCard);
                    this.showToast('Card added successfully!', 'success');
                }
                
                // Reload cards list
                await this.loadCards();
                this.updateUI();
                
                // Close modal
                this.closeModal('card-modal');
                document.getElementById('card-form').reset();
                this.editingCardId = null;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save card');
            }
        } catch (error) {
            console.error('Error saving card:', error);
            this.showToast(`Failed to save card: ${error.message}`, 'error');
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
                
                // Reload cards list
                await this.loadDareCards();
                this.updateUI();
                
                // Close modal
                this.closeModal('dare-card-modal');
                document.getElementById('dare-card-form').reset();
                this.editingDareCardId = null;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save dare card');
            }
        } catch (error) {
            console.error('Error saving dare card:', error);
            this.showToast(`Failed to save dare card: ${error.message}`, 'error');
        }
    }

    openManageModal() {
        const modal = document.getElementById('manage-modal');
        modal.style.animation = 'modalSlideIn 0.3s ease';
        modal.classList.remove('hidden');
        this.loadCardsList();
    }

    openManageDareModal() {
        const modal = document.getElementById('manage-dare-modal');
        modal.style.animation = 'modalSlideIn 0.3s ease';
        modal.classList.remove('hidden');
        this.loadDareCardsList();
    }

    async loadCardsList() {
        try {
            const response = await fetch('/api/cards');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
        
        listContainer.innerHTML = cards.map((card, index) => {
            const score = card.scoreValue || this.scoreValues[card.type]?.[card.level] || 1;
            return `
                <div class="card-item" data-card-id="${card.id}" data-type="${card.type || ''}" style="animation: slideInUp 0.3s ease ${index * 0.05}s both;">
                    <div class="card-item-info">
                        <div class="card-item-title">
                            ${card.title}
                            <span class="card-item-score" style="background: ${this.getTypeColor(card.type)}">${score} pts</span>
                        </div>
                        <div class="card-item-content">${card.content}</div>
                        <div class="card-item-meta">
                            <span class="card-type">${this.getTypeDisplayName(card.type)}</span>
                            <span class="card-level">${card.level || 'level 1'}</span>
                        </div>
                    </div>
                    <div class="card-item-actions">
                        <button class="btn-edit" onclick="cardDeck.openCardModal(${card.id})" title="Edit card">
                            ✏️ Edit
                        </button>
                        <button class="btn-delete" onclick="cardDeck.deleteCard(${card.id})" title="Delete card">
                            🗑️ Delete
                        </button>
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
        
        listContainer.innerHTML = cards.map((card, index) => `
            <div class="card-item" data-card-id="${card.id}" data-difficulty="${card.difficulty || ''}" style="animation: slideInUp 0.3s ease ${index * 0.05}s both;">
                <div class="card-item-info">
                    <div class="card-item-title">
                        ${card.title}
                        <span class="card-item-score" style="background: ${this.getDifficultyColor(card.difficulty)}">${card.difficulty || 'easy'}</span>
                    </div>
                    <div class="card-item-content">${card.content}</div>
                </div>
                <div class="card-item-actions">
                    <button class="btn-edit" onclick="cardDeck.openDareCardModal(${card.id})" title="Edit dare card">
                        ✏️ Edit
                    </button>
                    <button class="btn-delete" onclick="cardDeck.deleteDareCard(${card.id})" title="Delete dare card">
                        🗑️ Delete
                    </button>
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

    async deleteCard(cardId) {
        const confirmDialog = this.createCustomConfirm(
            'Delete Card?',
            'Are you sure you want to delete this card? This action cannot be undone.',
            async () => {
                try {
                    const response = await fetch(`/api/cards/${cardId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        // Remove from current deck
                        this.currentDeck = this.currentDeck.filter(c => c.id !== cardId);
                        
                        // Reload cards list
                        this.loadCardsList();
                        this.updateUI();
                        this.showToast('Card deleted successfully', 'success');
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete card');
                    }
                } catch (error) {
                    console.error('Error deleting card:', error);
                    this.showToast(`Failed to delete card: ${error.message}`, 'error');
                }
            }
        );
    }

    async deleteDareCard(cardId) {
        const confirmDialog = this.createCustomConfirm(
            'Delete Dare Card?',
            'Are you sure you want to delete this dare card? This action cannot be undone.',
            async () => {
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
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete dare card');
                    }
                } catch (error) {
                    console.error('Error deleting dare card:', error);
                    this.showToast(`Failed to delete dare card: ${error.message}`, 'error');
                }
            }
        );
    }

    // Utility Methods (keeping all existing functionality)
    saveGameState() {
        const gameState = {
            gameNumber: this.gameNumber,
            currentPlayer: this.currentPlayer,
            startingPlayer: this.startingPlayer,
            pendingDareForPlayer: this.pendingDareForPlayer,
            players: this.players,
            gameStats: this.gameStats,
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
            } : null
        };
        
        localStorage.setItem('cardDeckGameState', JSON.stringify(gameState));
        
        // Also save to server (non-blocking)
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
                this.gameNumber = gameState.gameNumber || 1;
                this.currentPlayer = gameState.currentPlayer || 1;
                this.startingPlayer = gameState.startingPlayer || 1;
                this.pendingDareForPlayer = gameState.pendingDareForPlayer || null;
                this.players = gameState.players || this.players;
                this.gameStats = gameState.gameStats || this.gameStats;
            } catch (error) {
                console.error('Error loading game state:', error);
                this.showToast('Error loading saved game state', 'warning');
            }
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        
        // Enhanced toast with icon
        const icon = this.getToastIcon(type);
        toastMessage.textContent = `${icon} ${message}`;
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    getToastIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    shakeElement(element) {
        element.style.animation = 'shake 0.6s ease';
        setTimeout(() => {
            element.style.animation = '';
        }, 600);
    }

    playSound(soundType) {
        // Simple sound feedback using Web Audio API (if available)
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            switch(soundType) {
                case 'cardFlip':
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
                    break;
                case 'success':
                    oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2);
                    break;
                case 'error':
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                    break;
                case 'wildcard':
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            // Silently fail if audio context is not available
        }
    }

    createCustomConfirm(title, message, onConfirm) {
        // Create a custom confirmation dialog
        const modal = document.createElement('div');
        modal.className = 'modal confirm-modal active';
        modal.innerHTML = `
            <div class="modal-content confirm-content">
                <h2>${title}</h2>
                <p>${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-cancel confirm-cancel">Cancel</button>
                    <button class="btn btn-confirm">Confirm</button>
                </div>
            </div>
        `;
        
        modal.style.animation = 'fadeIn 0.3s ease';
        document.body.appendChild(modal);
        
        const closeModal = () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        modal.querySelector('.confirm-cancel').addEventListener('click', closeModal);
        modal.querySelector('.btn-confirm').addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
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
        // Enhanced tooltips with keyboard shortcuts
        const tooltips = {
            'card-deck': 'Click to draw a card or dare (Shortcut: D or Space)',
            'skip-btn': 'Skip card and draw dare (Shortcut: S)',
            'done-btn': 'Complete and award points (Shortcut: Enter)',
            'complete-dare-btn': 'Complete dare (Required - Shortcut: Enter)',
            'use-wildcard-btn': 'Force opponent to draw dare',
            'save-wildcard-btn': 'Save wildcard for later use'
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
            
            // Enhanced mobile experience
            document.addEventListener('touchstart', () => {}, { passive: true });
            
            // Prevent zoom on input focus
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    input.style.fontSize = '16px';
                });
            });
        }
    }
}

// Enhanced CSS animations (keeping all existing animations)
const enhancedAnimations = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes deckUpdate {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes scoreUpdate {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); color: #2ecc71; }
        100% { transform: scale(1); }
    }
    
    @keyframes scoreHighlight {
        0%, 100% { background: #f0f0f0; }
        50% { background: #ffeb3b; }
    }
    
    @keyframes streakPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    @keyframes slideInStack {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideOutDown {
        to {
            opacity: 0;
            transform: translateY(30px);
        }
    }
    
    @keyframes slideOutLeft {
        to {
            opacity: 0;
            transform: translateX(-100px);
        }
    }
    
    @keyframes slideOutRight {
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes modalSlideOut {
        to {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
        }
    }
    
    @keyframes feedbackPulse {
        0% { transform: translate(-50%, -50%) scale(0); }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); }
    }
    
    @keyframes scoreFloat {
        0% { 
            opacity: 1;
            transform: translateY(0);
        }
        100% { 
            opacity: 0;
            transform: translateY(-50px);
        }
    }
    
    @keyframes confettiFall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes shuffleEnhanced {
        0% { transform: rotateY(0) scale(1); }
        25% { transform: rotateY(90deg) scale(1.1); }
        50% { transform: rotateY(180deg) scale(0.9); }
        75% { transform: rotateY(270deg) scale(1.1); }
        100% { transform: rotateY(360deg) scale(1); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes fadeOut {
        to { opacity: 0; }
    }
    
    .action-wildcard {
        background: linear-gradient(135deg, #e8d5f2, #d4a5e8);
        color: #6a1b9a;
    }
    
    .streak-indicator {
        position: absolute;
        top: 5px;
        right: 5px;
        background: linear-gradient(135deg, #ff6b35, #ff8e53);
        color: white;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(255, 107, 53, 0.4);
    }
`;

const enhancedStyle = document.createElement('style');
enhancedStyle.textContent = enhancedAnimations;
document.head.appendChild(enhancedStyle);

// Initialize the application
let cardDeck;
document.addEventListener('DOMContentLoaded', () => {
    cardDeck = new CardDeck();
});

// Enhanced Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('Service worker registered successfully');
        }).catch(() => {
            console.log('Service worker registration failed - app will work online only');
        });
    });
}
