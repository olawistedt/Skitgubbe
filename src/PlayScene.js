
alert /** @type {import("../typings")} */

'use strict';

// Use shift-F5 to reload program
const TEST = true;
const SPEED = 3;  // 350;  // Good for playing live is 400
const ANIMATION_SPEED_PHASE_2 = 1000;
const UPPER_HAND_IS_DEALER = -1;
const LOWER_HAND_IS_DEALER = 1;
const FRONT_FRAME = 0;
const BACK_FRAME = 1;
const HAND_DIST_FROM_HORISONTAL_BORDERS = 100;
const HAND_DIST_FROM_VERTICAL_BORDERS = 100;
const HAND_DIST_BETWEEN_CARDS = 80;
const TRICKS_FROM_HORISONTAL_BORDER = 100;
const TRICKS_FROM_VERTICAL_BORDER = 215;

class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PLAY' });

    this.spritesHash = {};  // All sprites with 3 characters as keys
    this.anims_hash = {};  // All sprites has an animation with front and back.
    this.first_time = true;
    this.judgeSkitgubbe = new judgeSkitgubbe();
    
    // Track tricks for each player
    this.playerTricks = {
      leftHand: [],
      rightHand: [],
      lowerHand: []
    };
    
    // Phase 2 state
    this.phase2State = {
      tableCards: [],
      trumpSuit: null,
      currentPlayer: null,
      turnOrder: [],
      mustPickUp: false
    };
    
    if (TEST) {
      this.gameSkitgubbe = new gameSkitgubbe(3, 3, this.judgeSkitgubbe);
    } else {
      this.gameSkitgubbe = new gameSkitgubbe(2, 0, this.judgeSkitgubbe);
    }
  }

  init(data) {
    if (data.caller == 'menu') {
      this.gameSkitgubbe.setAiLevel(data.level);
    }
  }

  preload() {
    preloadAssets(this);

    // Images
    this.load.image('cloth', 'assets/tilesets/bgslagrn.jpg');
    this.load.image('button_ok', 'assets/buttons/button_ok.png');


    // Audios
    this.load.audio('wrong_card', ['assets/sound/wrong_card.mp3']);
  }

  create() {
    this.add.tileSprite(
      0, 0, this.game.renderer.width * 2, this.game.renderer.height * 2,
      'cloth');  // Add the background

    this.snd_wrong_card = this.sound.add('wrong_card');

    this.showTrumpText =
      this.add
        .text(
          this.game.renderer.width - 230, 23, 'Trump',
          { fontFamily: '"Arial"', fontSize: '12px', depth: 100 })
        .setOrigin(0.5);


    // Talk to the game engine begins
    this.gameSkitgubbe.leftHandPlayer.setName('Left hand');
    this.gameSkitgubbe.rightHandPlayer.setName('Right hand');
    this.gameSkitgubbe.lowerHandPlayer.setName('Lower hand');

    if (this.first_time) {
      this.gameSkitgubbe.newGame();
      this.first_time = false;
    }
    this.gameSkitgubbe.newSingleDeal();
    this.gameSkitgubbe.dealer.shuffle();
    // Log dealer information
    const dealerPlayer = this.gameSkitgubbe.dealer.current_dealer;
    const players = [
      this.gameSkitgubbe.leftHandPlayer,
      this.gameSkitgubbe.middleHandPlayer,
      this.gameSkitgubbe.lowerHandPlayer
    ];
    const playerNames = ['Upper hand', 'Middle hand', 'Lower hand'];
    const dealerIndex = players.indexOf(dealerPlayer);

    console.log(`${playerNames[dealerIndex]} is dealer.`);
    if (dealerPlayer === this.judgeSkitgubbe.opponent) {
      console.log(`${playerNames[dealerIndex]} is opponent.`);
    }

    // Deck position based on dealer
    let deckX, deckY;
    if (dealerPlayer === this.gameSkitgubbe.lowerHandPlayer) {
      // Lower hand dealer - left corner
      deckX = 100;
      deckY = this.game.renderer.height - 100;
    } else if (dealerPlayer === this.gameSkitgubbe.leftHandPlayer) {
      // Left hand dealer - left middle
      deckX = 100;
      deckY = this.game.renderer.height / 2;
    } else {
      // Right hand dealer - lower right corner
      deckX = this.game.renderer.width - 100;
      deckY = this.game.renderer.height - 100;
    }
    // Talk to the game engine ends


    //
    // Place the deck
    //
    for (let i = CARD_SKITGUBBE_IDS.length - 1; i > -1; i--) {
      let card_id = this.gameSkitgubbe.dealer.deck[i];
      let left = deckX;

      this.spritesHash[card_id] = this.add.sprite(
        left + (CARD_SKITGUBBE_IDS.length - i * 2) / 3,
        deckY + (CARD_SKITGUBBE_IDS.length - i * 1) / 3,
        'back');  // Create sprites, and display them outside the screen.
      this.spritesHash[card_id].setScale(1.00);
      this.spritesHash[card_id].setDepth(i);

      this.anims.create({
        key: 'anim_key_' + card_id,
        frames: [{ key: card_id }, { key: 'back' }],
      });
      this.anims_hash[card_id] = this.anims.get('anim_key_' + card_id);
      this.spritesHash[card_id].setName(card_id);  // Sprite name
      this.spritesHash[card_id].on(
        'pointerdown', () => { this.cardIsPressed(this.spritesHash[card_id]) },
        this);
    }

    this.current_depth = CARD_SKITGUBBE_IDS.length;
    this.leftX = 0;
    this.rightX = 0;
    this.lowerX = 0;
    console.log('Deck ' + this.gameSkitgubbe.dealer.deck);
    this.dealCards(0, 0);
  }

  /////////////////////////////////////////////////////////////////////
  // Move deck to middle position
  /////////////////////////////////////////////////////////////////////
  moveDeckToMiddle(callback) {
    const middleX = 250;
    const middleY = this.game.renderer.height / 2;
    let tweensCompleted = 0;
    const totalCards = CARD_SKITGUBBE_IDS.length;

    for (let i = 0; i < totalCards; i++) {
      const cardId = this.gameSkitgubbe.dealer.deck[i];
      this.tweens.add({
        targets: this.spritesHash[cardId],
        x: middleX + (totalCards - i * 2) / 3,
        y: middleY - 200 + (totalCards - i * 1) / 3,
        duration: SPEED,
        ease: 'Linear',
        onComplete: () => {
          tweensCompleted++;
          if (tweensCompleted === totalCards) {
            callback();
          }
        }
      });
    }
  }

  /////////////////////////////////////////////////////////////////////
  // Deal the cards to the all hands.
  /////////////////////////////////////////////////////////////////////
  dealCards(playerIndex, counter) {
    const CARDS_DEALT = 1;
    const CARDS_PER_PLAYER = 3;
    const NUM_PLAYERS = 3;

    const players = [
      this.gameSkitgubbe.leftHandPlayer,
      this.gameSkitgubbe.rightHandPlayer,
      this.gameSkitgubbe.lowerHandPlayer
    ];

    const positions = [
      { y: this.game.renderer.height / 2, x: HAND_DIST_FROM_VERTICAL_BORDERS, isVertical: true, xKey: 'leftX' },
      { y: this.game.renderer.height / 2, x: this.game.renderer.width - HAND_DIST_FROM_VERTICAL_BORDERS, isVertical: true, xKey: 'rightX' },
      { y: this.game.renderer.height - HAND_DIST_FROM_HORISONTAL_BORDERS, x: this.game.renderer.width / 2 - HAND_DIST_FROM_VERTICAL_BORDERS, isVertical: false, xKey: 'lowerX' }
    ];

    // Get top card(s) from deck
    const dealtCards = [];
    for (let i = 0; i < CARDS_DEALT; i++) {
      dealtCards.push(this.gameSkitgubbe.dealer.getTopCard());
    }

    // Get current player's position info
    const player = players[playerIndex];
    const pos = positions[playerIndex];
    const yBase = pos.y;
    const xKey = pos.xKey;
    const x = this[xKey];
    this[xKey] += CARDS_DEALT;

    let tweensFinished = 0;

    // Animate each card to player's hand
    for (let i = 0; i < CARDS_DEALT; i++) {
      const cardId = dealtCards[i];
      player.addCard(cardId);

      let xPos, yPos, angle = 0;
      if (pos.isVertical) {
        // Left and right hands - vertical layout
        xPos = pos.x;
        yPos = pos.y + HAND_DIST_BETWEEN_CARDS * (i + x);
        // Rotate left hand cards -90 degrees
        if (playerIndex === 0) {
          angle = -90;
        }
        else if (playerIndex === 1) {
          angle = 90;
        }
      } else {
        // Bottom hand - horizontal layout
        xPos = pos.x + HAND_DIST_BETWEEN_CARDS * (i + x);
        yPos = pos.y;
      }

      this.tweens.add({
        targets: this.spritesHash[cardId],
        y: yPos,
        x: xPos,
        angle: angle,
        duration: SPEED,
        ease: 'Linear',
        depth: this.current_depth++,
        onComplete: () => {
          if (++tweensFinished === CARDS_DEALT) {
            counter += CARDS_DEALT;
            if (counter < CARDS_PER_PLAYER * NUM_PLAYERS) {
              // Deal to next player
              const nextPlayerIndex = (playerIndex + 1) % NUM_PLAYERS;
              this.dealCards(nextPlayerIndex, counter);
            } else {
              // All cards dealt - show human player cards
              this.gameSkitgubbe.lowerHandPlayer.getHand().forEach(cardId => {
                this.showFront(cardId);
              });
              // Move deck to middle after dealing
              this.moveDeckToMiddle(() => {
                this.playCards();
              });
            }
          }
        }
      });
    }
  }

  playCards() {
    if (!this.judgeSkitgubbe.firstPhase) {
      this.playCardsPhase2();
      return;
    }
    
    this.playCardsPhase1();
  }
  
  playCardsPhase1() {
    const players = [
      this.gameSkitgubbe.leftHandPlayer,
      this.gameSkitgubbe.rightHandPlayer,
      this.gameSkitgubbe.lowerHandPlayer
    ];
    const playerNames = ['Left hand', 'Right hand', 'Lower hand'];
    const positions = [
      { x: this.game.renderer.width / 2 - 30, y: this.game.renderer.height / 2 },
      { x: this.game.renderer.width / 2 + 30, y: this.game.renderer.height / 2 },
      { x: this.game.renderer.width / 2, y: this.game.renderer.height / 2 }
    ];

    // Log all hands
    players.forEach((player, index) => {
      console.log(`${playerNames[index]}: ${player.getHand()}`);
    });

    // Check if we should start phase 2 before trying to play
    if (this.shouldStartPhase2()) {
      console.log('Phase 1 ended - starting Phase 2');
      this.startPhase2();
      return;
    }
    
    // Check if all players have no cards (game over)
    const totalCards = players.reduce((sum, player) => sum + player.getHand().length, 0);
    if (totalCards === 0) {
      console.log('All players out of cards - game over');
      return;
    }

    // Find leader index
    const leader = this.judgeSkitgubbe.leader;
    const leaderIndex = players.indexOf(leader);

    // Check if leader has cards to play
    if (leader.getHand().length === 0) {
      console.log('Leader has no cards - phase 1 ends');
      this.startPhase2();
      return;
    }

    // Leader plays first card
    const leadCard = leader.getCard();
    if (!leadCard) {
      console.error('Leader has no cards');
      return;
    }
    this.judgeSkitgubbe.setLeadCard(leadCard);
    const leadSprite = this.spritesHash[leadCard];
    this.showFront(leadCard);

    const playLeadCard = this.tweens.add({
      targets: leadSprite,
      y: positions[leaderIndex].y,
      x: positions[leaderIndex].x,
      duration: this.judgeSkitgubbe.firstPhase ? SPEED * 3 : ANIMATION_SPEED_PHASE_2,
      ease: 'Linear',
      depth: this.current_depth++,
      angle: 0
    });

    playLeadCard.on('complete', () => {
      if (this.judgeSkitgubbe.firstPhase) {
        // Phase 1: Only 2 players per trick
        const players = [
          this.gameSkitgubbe.leftHandPlayer,
          this.gameSkitgubbe.rightHandPlayer,
          this.gameSkitgubbe.lowerHandPlayer
        ];
        
        const leaderIndex = players.indexOf(leader);
        let nextPlayer = null;
        
        // Find next player with cards who isn't the leader
        for (let i = 1; i <= players.length; i++) {
          const candidateIndex = (leaderIndex + i) % players.length;
          const candidate = players[candidateIndex];
          if (candidate !== leader && candidate.getHand().length > 0) {
            nextPlayer = candidate;
            break;
          }
        }
        
        if (!nextPlayer) {
          console.log('No opponent available - phase 1 ends');
          this.startPhase2();
          return;
        }
        
        const opponentIndex = players.indexOf(nextPlayer);
        const opponentCard = this.selectOpponentCard(nextPlayer, leadCard);
        
        if (!opponentCard) {
          console.log('Opponent has no cards - phase 1 ends');
          this.startPhase2();
          return;
        }
        
        this.judgeSkitgubbe.setOpponentCard(opponentCard);
        this.judgeSkitgubbe.opponent = nextPlayer;
        const opponentSprite = this.spritesHash[opponentCard];
        this.showFront(opponentCard);

        const playOpponentCard = this.tweens.add({
          targets: opponentSprite,
          y: positions[opponentIndex].y,
          x: positions[opponentIndex].x,
          duration: this.judgeSkitgubbe.firstPhase ? SPEED * 3 : ANIMATION_SPEED_PHASE_2,
          ease: 'Linear',
          depth: this.current_depth++,
          angle: 0
        });

        playOpponentCard.on('complete', () => {
          this.getTrick();
        });
      }
    });
  }

  cardIsPressed(sprite) {
    let success = true;
    if (!TEST) {
      success = this.gameSkitgubbe.lowerHandPlayer.getCard(sprite.name);
    }
    if (success) {
      this.judgeSkitgubbe.inMarriage = false;
      
      if (this.judgeSkitgubbe.firstPhase) {
        // Phase 1 logic
        if (this.judgeSkitgubbe.leader == this.gameSkitgubbe.lowerHandPlayer) {
          this.judgeSkitgubbe.setLeadCard(sprite.name);
        } else {
          this.judgeSkitgubbe.setOpponentCard(sprite.name);
        }
        
        let playLowerToTable = this.tweens.add({
          targets: sprite,
          y: this.game.renderer.height / 2,
          x: this.game.renderer.width / 2,
          duration: SPEED * 3,
          ease: 'Linear',
          depth: 1,
          angle: 0
        });

        this.disableLowerHandInteractive();

        playLowerToTable.on('complete', () => {
          if (this.judgeSkitgubbe.leader == this.gameSkitgubbe.lowerHandPlayer) {
            this.playUpperHandAfterLowerHand();
          } else {
            this.getTrick();
          }
        });
      } else {
        // Phase 2 logic
        if (this.phase2State.currentPlayer !== this.gameSkitgubbe.lowerHandPlayer) {
          console.log('Not your turn!');
          return;
        }
        
        // Check if card can be played
        if (this.phase2State.tableCards.length > 0) {
          const topCard = this.phase2State.tableCards[this.phase2State.tableCards.length - 1];
          if (!this.canBeatCard(sprite.name, topCard)) {
            console.log('Cannot beat top card - must pick up or play different card');
            this.snd_wrong_card.play();
            return;
          }
        }
        
        this.disableLowerHandInteractive();
        this.hidePickUpButton();
        this.playPhase2Card(this.gameSkitgubbe.lowerHandPlayer, sprite.name);
      }
    } else {
      this.snd_wrong_card.play();
    }
  }
  
  canBeatCard(cardToPlay, cardToBeat) {
    const playValue = this.getCardValue(cardToPlay);
    const playSuit = this.getCardSuit(cardToPlay);
    const beatValue = this.getCardValue(cardToBeat);
    const beatSuit = this.getCardSuit(cardToBeat);
    
    const isPlayTrump = playSuit === this.phase2State.trumpSuit;
    const isBeatTrump = beatSuit === this.phase2State.trumpSuit;
    
    if (isBeatTrump && !isPlayTrump) {
      return false; // Can't beat trump with non-trump
    }
    
    if (!isBeatTrump && isPlayTrump) {
      return true; // Trump beats non-trump
    }
    
    if (playSuit === beatSuit) {
      return playValue > beatValue; // Same suit, higher value
    }
    
    return false; // Different non-trump suits don't beat
  }

  playUpperHandAfterLowerHand() {
    //
    // Play upper hand to table
    //
    //    this.snd_play_upper_card.play();
    let upper_hand_card = this.selectOpponentCard(this.judgeSkitgubbe.opponent, this.judgeSkitgubbe.getLeadCard());
    this.judgeSkitgubbe.inMarriage = false;
    this.judgeSkitgubbe.setOpponentCard(upper_hand_card);
    let ai_sprite = this.spritesHash[upper_hand_card];
    let playUpperToTable = this.tweens.add({
      targets: ai_sprite,
      y: this.game.renderer.height / 2,
      x: this.game.renderer.width / 2 + 15,  // Place slightly to the right
      duration: this.judgeSkitgubbe.firstPhase ? SPEED * 3 : ANIMATION_SPEED_PHASE_2,
      ease: 'Linear',
      depth: this.current_depth++,  // Higher depth to appear on top
      angle: 0
    });
    playUpperToTable.on('complete', () => {
      this.getTrick();
    });
    this.showFront(ai_sprite.name)
  }

  getTrick() {
    console.log("=== GETTING TRICK ===");
    console.log('Lead card:', this.judgeSkitgubbe.getLeadCard());
    console.log('Opponent card:', this.judgeSkitgubbe.getOpponentCard());
    console.log('Phase 1:', this.judgeSkitgubbe.firstPhase);
    
    if (!this.judgeSkitgubbe.getLeadCard() || !this.judgeSkitgubbe.getOpponentCard()) {
      console.error('Missing cards for trick evaluation');
      return;
    }
    
    let winningPlayer;
    if (this.judgeSkitgubbe.firstPhase) {
      // Phase 1: Only card value matters, highest wins
      const leadValue = this.getCardValue(this.judgeSkitgubbe.getLeadCard());
      const opponentValue = this.getCardValue(this.judgeSkitgubbe.getOpponentCard());
      
      console.log('Lead card value:', leadValue, 'Opponent card value:', opponentValue);
      
      if (leadValue === opponentValue) {
        console.log('STUNSA (bounce) - equal cards!');
        // Handle stunsa - cards stay on table, same player leads again
        // For now, just continue with normal logic
      }
      
      if (leadValue > opponentValue) {
        winningPlayer = this.judgeSkitgubbe.leader;
      } else {
        winningPlayer = this.judgeSkitgubbe.opponent;
      }
    } else {
      // Phase 2: Use existing judge logic, but handle 3 players if available
      if (this.thirdPlayerCard && this.thirdPlayer) {
        // 3-player trick in Phase 2
        const leadValue = this.getCardValue(this.judgeSkitgubbe.getLeadCard());
        const opponentValue = this.getCardValue(this.judgeSkitgubbe.getOpponentCard());
        const thirdValue = this.getCardValue(this.thirdPlayerCard);
        
        console.log('3-player trick - Lead:', leadValue, 'Opponent:', opponentValue, 'Third:', thirdValue);
        
        // Find highest card
        if (leadValue >= opponentValue && leadValue >= thirdValue) {
          winningPlayer = this.judgeSkitgubbe.leader;
        } else if (opponentValue >= leadValue && opponentValue >= thirdValue) {
          winningPlayer = this.judgeSkitgubbe.opponent;
        } else {
          winningPlayer = this.thirdPlayer;
        }
      } else {
        // 2-player trick in Phase 2
        winningPlayer = this.judgeSkitgubbe.getWinnerOfTrick();
      }
    }
    
    console.log('Winning player:', winningPlayer.getName());
    
    // Store the winner to set as leader after dealing cards
    this.lastTrickWinner = winningPlayer;
    
    // Track tricks for phase 2
    const trickCards = [
      this.judgeSkitgubbe.getLeadCard(),
      this.judgeSkitgubbe.getOpponentCard()
    ];
    
    // Add third card if it exists
    if (this.thirdPlayerCard) {
      trickCards.push(this.thirdPlayerCard);
    }
    
    if (winningPlayer === this.gameSkitgubbe.leftHandPlayer) {
      this.playerTricks.leftHand.push(...trickCards);
    } else if (winningPlayer === this.gameSkitgubbe.rightHandPlayer) {
      this.playerTricks.rightHand.push(...trickCards);
    } else if (winningPlayer === this.gameSkitgubbe.lowerHandPlayer) {
      this.playerTricks.lowerHand.push(...trickCards);
    }
    
    winningPlayer.addTrick(trickCards);
    this.showBack(this.judgeSkitgubbe.getLeadCard());
    this.showBack(this.judgeSkitgubbe.getOpponentCard());
    if (this.thirdPlayerCard) {
      this.showBack(this.thirdPlayerCard);
    }
    
    // Clear third player data for next trick
    this.thirdPlayerCard = null;
    this.thirdPlayer = null;
    this.spritesHash[this.judgeSkitgubbe.getLeadCard()].setDepth(this.current_depth);
    this.current_depth++;
    this.spritesHash[this.judgeSkitgubbe.getOpponentCard()].setDepth(this.current_depth);
    this.current_depth++;
    console.log(
      'Cards played: Lead card ' + this.judgeSkitgubbe.getLeadCard() +
      ' : Opponent card ' + this.judgeSkitgubbe.getOpponentCard());
    console.log(
      'Left hand: ' + this.gameSkitgubbe.leftHandPlayer.getHand());
    console.log(
      'Lower hand: ' + this.gameSkitgubbe.lowerHandPlayer.getHand());
    let winner_y;
    if (winningPlayer == this.gameSkitgubbe.leftHandPlayer || winningPlayer == this.gameSkitgubbe.rightHandPlayer) {
      winner_y = TRICKS_FROM_HORISONTAL_BORDER +
        20 * winningPlayer.getNrOfTricks();
    } else {
      winner_y = this.game.renderer.height - TRICKS_FROM_HORISONTAL_BORDER -
        20 * this.gameSkitgubbe.lowerHandPlayer.getNrOfTricks();
    }

    let timer = this.time.delayedCall(SPEED * 4, () => {
      console.log('Moving cards to winner pile...');
      
      let trickX, trickY;
      if (winningPlayer == this.gameSkitgubbe.leftHandPlayer) {
        // Left hand player wins - place in upper left corner
        trickX = TRICKS_FROM_VERTICAL_BORDER;
        trickY = TRICKS_FROM_HORISONTAL_BORDER + 20 * winningPlayer.getNrOfTricks();
      } else if (winningPlayer == this.gameSkitgubbe.rightHandPlayer) {
        // Right hand player wins - place in upper right corner
        trickX = this.game.renderer.width - TRICKS_FROM_VERTICAL_BORDER;
        trickY = TRICKS_FROM_HORISONTAL_BORDER + 20 * winningPlayer.getNrOfTricks();
      } else {
        // Lower hand player wins - place in lower right corner
        trickX = this.game.renderer.width - TRICKS_FROM_VERTICAL_BORDER;
        trickY = this.game.renderer.height - TRICKS_FROM_HORISONTAL_BORDER - 20 * this.gameSkitgubbe.lowerHandPlayer.getNrOfTricks();
      }
      
      let twGetTrick = this.tweens.add({
        targets: [
          this.spritesHash[this.judgeSkitgubbe.leadCard],
          this.spritesHash[this.judgeSkitgubbe.opponentCard]
        ],
        x: trickX,
        y: trickY,
        duration: SPEED * 3,
        ease: 'Linear',
        angle: 90
      });
      twGetTrick.on('complete', () => {
        console.log('Cards moved to winner pile. Checking game phase...');
        console.log('First phase:', this.judgeSkitgubbe.firstPhase);
        console.log('End of second phase:', this.judgeSkitgubbe.isEndOfSecondPhase());
        console.log('Deck length:', this.gameSkitgubbe.dealer.deck.length);
        
        // Deal new cards after trick completion
        if (this.gameSkitgubbe.dealer.deck.length > 0) {
          console.log('Cards remaining in deck - dealing new cards');
          this.dealNewCardsAfterTrick(() => {
            if (this.gameSkitgubbe.lowerHandPlayer == this.judgeSkitgubbe.leader) {
              this.setLowerHandInteractive();
            }
            this.placeCardsNice();
            this.playCards();
          });
        } else {
          console.log('No cards left in deck - checking if phase 2 should begin');
          if (this.shouldStartPhase2()) {
            console.log('Starting Phase 2');
            this.startPhase2();
          } else {
            if (this.gameSkitgubbe.lowerHandPlayer == this.judgeSkitgubbe.leader) {
              this.setLowerHandInteractive();
            }
            this.placeCardsNice();
            this.playCards();
          }
        }
      });
    });
  }

  /////////////////////////////////////////////////////////////////////
  // Deal new cards after trick completion
  /////////////////////////////////////////////////////////////////////
  dealNewCardsAfterTrick(callback) {
    console.log('=== DEALING NEW CARDS AFTER TRICK ===');
    console.log('Leader:', this.judgeSkitgubbe.leader.getName());
    console.log('Opponent:', this.judgeSkitgubbe.opponent.getName());
    console.log('Deck has', this.gameSkitgubbe.dealer.deck.length, 'cards');
    
    // Get unique participants (avoid dealing to same player twice)
    const participants = [];
    if (!participants.includes(this.judgeSkitgubbe.leader)) {
      participants.push(this.judgeSkitgubbe.leader);
    }
    if (!participants.includes(this.judgeSkitgubbe.opponent)) {
      participants.push(this.judgeSkitgubbe.opponent);
    }
    
    if (this.gameSkitgubbe.dealer.deck.length === 0) {
      console.log('No cards left in deck');
      callback();
      return;
    }
    
    let cardsDealt = 0;
    const totalCardsToDeal = participants.length;
    
    // Deal exactly 1 card to each participant (never more than 1)
    participants.forEach(player => {
      const currentCards = player.getHand().length;
      console.log(`${player.getName()} has ${currentCards} cards`);
      
      if (this.gameSkitgubbe.dealer.deck.length > 0) {
        const newCard = this.gameSkitgubbe.dealer.getTopCard();
        if (newCard) {
          console.log('Dealing card', newCard, 'to', player.getName());
          player.addCard(newCard);
          
          // Position the card
          let xPos, yPos, angle = 0;
          if (player === this.gameSkitgubbe.leftHandPlayer) {
            xPos = HAND_DIST_FROM_VERTICAL_BORDERS;
            yPos = this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * (player.getHand().length - 1);
            angle = -90;
          } else if (player === this.gameSkitgubbe.rightHandPlayer) {
            xPos = this.game.renderer.width - HAND_DIST_FROM_VERTICAL_BORDERS;
            yPos = this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * (player.getHand().length - 1);
            angle = 90;
          } else {
            xPos = this.game.renderer.width / 2 - HAND_DIST_FROM_VERTICAL_BORDERS + HAND_DIST_BETWEEN_CARDS * (player.getHand().length - 1);
            yPos = this.game.renderer.height - HAND_DIST_FROM_HORISONTAL_BORDERS;
          }
          
          this.tweens.add({
            targets: this.spritesHash[newCard],
            x: xPos,
            y: yPos,
            angle: angle,
            duration: SPEED,
            ease: 'Linear',
            onComplete: () => {
              if (player === this.gameSkitgubbe.lowerHandPlayer) {
                this.showFront(newCard);
              }
              cardsDealt++;
              if (cardsDealt === totalCardsToDeal || this.gameSkitgubbe.dealer.deck.length === 0) {
                // Now set the winner as the new leader for next trick
                const winningPlayer = this.lastTrickWinner;
                this.judgeSkitgubbe.leader = winningPlayer;
                console.log('New leader for next trick:', winningPlayer.getName());
                
                callback();
              }
            }
          });
        } else {
          // No more cards in deck, finish dealing
          cardsDealt++;
          if (cardsDealt === totalCardsToDeal) {
            const winningPlayer = this.lastTrickWinner;
            this.judgeSkitgubbe.leader = winningPlayer;
            console.log('New leader for next trick:', winningPlayer.getName());
            callback();
          }
        }
      }
    });
    
    // If no cards were dealt, call callback immediately
    if (totalCardsToDeal === 0) {
      callback();
    }
  }

  handleMarriage() {
    let marriages = this.judgeSkitgubbe.getMarriageCandidates(
      this.judgeSkitgubbe.leader.getHand());
    if (marriages.length == 0) {
      this.playCards();
      return;
    }
    if (this.judgeSkitgubbe.leader == this.gameSkitgubbe.leftHandPlayer ||
        this.judgeSkitgubbe.leader == this.gameSkitgubbe.rightHandPlayer) {
      console.log('Upper hand can declare marriage in ' + marriages);
      this.disableLowerHandInteractive();
      this.judgeSkitgubbe.inMarriage = true;
      let m = this.judgeSkitgubbe.leader.getMarriage(marriages);
      this.judgeSkitgubbe.setMarriage(m);

      console.log('Upper hand declares marriage in ' + colorFullName(m));

      this.marriageText.setText('AI DECLARE MARRIAGE\nIN ' + colorFullName(m));
      this.marriageText.setVisible(true);
      let button_ok = this.add
        .image(
          this.game.renderer.width / 2,
          this.game.renderer.height / 2 + 80, 'button_ok')
        .setInteractive();
      button_ok.on('pointerdown', () => {
        this.marriageText.setVisible(false);
        button_ok.destroy();
        this.placeCardsNice();
        this.setLowerHandInteractive();
        this.playCards();
      });
      if (TEST) {
        button_ok.emit('pointerdown');
      }
    } else {  // Lower hand is leader
      console.log('Lower hand can declare marriage in ' + marriages);
      this.disableLowerHandInteractive();
      this.judgeSkitgubbe.inMarriage = true;
      this.marriageText.setText('DECLARE MARRIAGE IN');
      this.marriageText.setVisible(true);
      let yPos = this.game.renderer.height / 2 + 50;
      let xPos = HAND_DIST_FROM_VERTICAL_BORDERS + 20 - 170;
      let buttons = {};
      let button_none;
      marriages.forEach(e => {
        xPos += 170;
        let img_button = {
          'c': 'button_clubs',
          'd': 'button_diamonds',
          'h': 'button_hearts',
          's': 'button_spades'
        };
        buttons[e] = this.add.image(xPos, yPos, img_button[e])
          .setInteractive()
          .setScale(0.80);
        buttons[e].on('pointerdown', () => {
          this.judgeSkitgubbe.setMarriage(e);
          for (let key in buttons) {
            buttons[key].destroy();
          }
          button_none.destroy();
          this.marriageText.setVisible(false);
          this.placeCardsNice();
          this.setLowerHandInteractive();
          if (TEST) {
            this.playCards();
          }
        });
      });
      xPos += 170;
      button_none = this.add.image(xPos, yPos, 'button_none')
        .setInteractive()
        .setScale(0.80);
      button_none.on('pointerdown', () => {
        button_none.destroy();
        for (let key in buttons) {
          buttons[key].destroy();
          this.marriageText.setVisible(false);
        }
        this.judgeSkitgubbe.inMarriage = false;
        this.setLowerHandInteractive();
      });
      if (TEST) {
        let m = this.gameSkitgubbe.lowerHandPlayer.getMarriage(marriages);
        buttons[m].emit('pointerdown');
      }

    }  // Lower hand is leader

  }  // End of handleMarriage()

  placeCardsNice() {
    this.gameSkitgubbe.lowerHandPlayer.sortHand();

    if (this.gameSkitgubbe.lowerHandPlayer.getHand().length == 0) {
      return;
    }

    let upperTween;
    let lowerTween;
    for (let i = 0; i < this.gameSkitgubbe.lowerHandPlayer.getHand().length; i++) {
      const cardSpacing = this.judgeSkitgubbe.firstPhase ? HAND_DIST_BETWEEN_CARDS : 15;
      const baseX = this.judgeSkitgubbe.firstPhase ? this.handDistFromVerticalBorder(false) : 
        this.game.renderer.width / 2 - (this.gameSkitgubbe.lowerHandPlayer.getHand().length - 1) * cardSpacing / 2;
      
      lowerTween = this.tweens.add({
        targets: this.spritesHash[this.gameSkitgubbe.lowerHandPlayer.getHand()[i]],
        x: baseX + i * cardSpacing,
        y: this.game.renderer.height - HAND_DIST_FROM_HORISONTAL_BORDERS,
        duration: SPEED / 2,
        ease: 'Linear',
        depth: i
      });
    }

    // Place left hand cards nicely
    this.gameSkitgubbe.leftHandPlayer.sortHand();
    const leftHandSize = this.gameSkitgubbe.leftHandPlayer.getHand().length;
    for (let i = 0; i < leftHandSize; i++) {
      const cardSpacing = this.judgeSkitgubbe.firstPhase ? HAND_DIST_BETWEEN_CARDS : 15;
      const yOffset = this.judgeSkitgubbe.firstPhase ? 
        cardSpacing * i : 
        cardSpacing * (i - (leftHandSize - 1) / 2);
      
      this.tweens.add({
        targets: this.spritesHash[this.gameSkitgubbe.leftHandPlayer.getHand()[i]],
        x: HAND_DIST_FROM_VERTICAL_BORDERS,
        y: this.game.renderer.height / 2 + yOffset,
        angle: -90,
        duration: SPEED / 2,
        ease: 'Linear',
        depth: i
      });
    }

    // Place right hand cards nicely
    this.gameSkitgubbe.rightHandPlayer.sortHand();
    const rightHandSize = this.gameSkitgubbe.rightHandPlayer.getHand().length;
    for (let i = 0; i < rightHandSize; i++) {
      const cardSpacing = this.judgeSkitgubbe.firstPhase ? HAND_DIST_BETWEEN_CARDS : 15;
      const yOffset = this.judgeSkitgubbe.firstPhase ? 
        cardSpacing * i : 
        cardSpacing * (i - (rightHandSize - 1) / 2);
      
      this.tweens.add({
        targets: this.spritesHash[this.gameSkitgubbe.rightHandPlayer.getHand()[i]],
        x: this.game.renderer.width - HAND_DIST_FROM_VERTICAL_BORDERS,
        y: this.game.renderer.height / 2 + yOffset,
        angle: 90,
        duration: SPEED / 2,
        ease: 'Linear',
        depth: i
      });
    }
  }

  setLowerHandInteractive() {
    this.gameSkitgubbe.lowerHandPlayer.getHand().forEach(e => {
      let s = this.spritesHash[e];
      if (s == undefined) {
        console.log(
          'Error. The card ' + e + ' is not on lower hand ' +
          this.gameSkitgubbe.lowerHandPlayer.getHand());
      }
      s.setInteractive();
    });
  }

  disableLowerHandInteractive() {
    this.gameSkitgubbe.lowerHandPlayer.getHand().forEach(e => {
      this.spritesHash[e].disableInteractive();
    });
  }

  showFront(card_id) {
    let anim = this.anims_hash[card_id];
    let frame;
    try {
      frame = anim.getFrameAt(FRONT_FRAME);
      this.spritesHash[card_id].anims.setCurrentFrame(frame);
    } catch (err) {
      console.log('ERROR: showFront' + err);
    }
  }

  showBack(card_id) {
    let anim = this.anims_hash[card_id];
    let frame;
    try {
      frame = anim.getFrameAt(BACK_FRAME);
      this.spritesHash[card_id].anims.setCurrentFrame(frame);
    } catch (err) {
      console.log('ERROR: showBack' + err);
    }
  }

  getCardValue(cardId) {
    // Extract numeric value from card ID (e.g., 'h07' -> 7, 'c12' -> 12)
    const valueStr = cardId.substring(1);
    return parseInt(valueStr, 10);
  }

  selectOpponentCard(player, leadCard) {
    const hand = player.getHand();
    if (hand.length === 0) return null;
    
    // In phase 1, try to win if lead card value > 9
    if (this.judgeSkitgubbe.firstPhase) {
      const leadValue = this.getCardValue(leadCard);
      
      if (leadValue > 9) {
        // Try to find a card that can beat the lead card
        const winningCards = hand.filter(card => this.getCardValue(card) > leadValue);
        if (winningCards.length > 0) {
          // Play the lowest winning card
          const bestCard = winningCards.reduce((min, card) => 
            this.getCardValue(card) < this.getCardValue(min) ? card : min
          );
          return player.getCard(bestCard);
        }
      }
      
      // If lead card <= 9 or no winning card available, play lowest card
      const lowestCard = hand.reduce((min, card) => 
        this.getCardValue(card) < this.getCardValue(min) ? card : min
      );
      return player.getCard(lowestCard);
    }
    
    // Default: play any card (first available)
    return player.getCard();
  }

  shouldStartPhase2() {
    // Don't start phase 2 if we're already in it
    if (!this.judgeSkitgubbe.firstPhase) {
      return false;
    }
    
    // Phase 2 starts when deck is empty and current player has no cards to play
    if (this.gameSkitgubbe.dealer.deck.length > 0) {
      return false; // Still have cards in deck
    }
    
    // Check if current leader has no cards to play
    const leader = this.judgeSkitgubbe.leader;
    return leader.getHand().length === 0;
  }

  startPhase2() {
    console.log('=== STARTING PHASE 2 ===');
    
    const players = [
      this.gameSkitgubbe.leftHandPlayer,
      this.gameSkitgubbe.rightHandPlayer,
      this.gameSkitgubbe.lowerHandPlayer
    ];
    
    const playerTrickArrays = [
      this.playerTricks.leftHand,
      this.playerTricks.rightHand,
      this.playerTricks.lowerHand
    ];
    
    let totalAnimations = 0;
    let completedAnimations = 0;
    
    // Count total animations needed
    playerTrickArrays.forEach(tricks => {
      totalAnimations += tricks.length;
    });
    
    if (totalAnimations === 0) {
      // No animations needed, just continue
      this.finishPhase2Setup();
      return;
    }
    
    players.forEach((player, playerIndex) => {
      const remainingCards = player.getHand();
      if (remainingCards.length > 0) {
        console.log(`${player.getName()} keeps ${remainingCards.length} cards from hand`);
        // Show remaining cards (expose them)
        remainingCards.forEach(card => {
          if (player !== this.gameSkitgubbe.lowerHandPlayer) {
            this.showFront(card);
          }
        });
      }
      
      // Animate trick cards to hand
      const trickCards = playerTrickArrays[playerIndex];
      console.log(`${player.getName()} gets ${trickCards.length} trick cards`);
      
      trickCards.forEach((card, cardIndex) => {
        player.addCard(card);
        
        // Calculate target position
        let xPos, yPos, angle = 0;
        const totalCards = player.getHand().length;
        
        if (playerIndex === 0) { // Left hand
          xPos = HAND_DIST_FROM_VERTICAL_BORDERS;
          yPos = this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * (totalCards - 1);
          angle = -90;
        } else if (playerIndex === 1) { // Right hand
          xPos = this.game.renderer.width - HAND_DIST_FROM_VERTICAL_BORDERS;
          yPos = this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * (totalCards - 1);
          angle = 90;
        } else { // Lower hand
          xPos = this.game.renderer.width / 2 - HAND_DIST_FROM_VERTICAL_BORDERS + HAND_DIST_BETWEEN_CARDS * (totalCards - 1);
          yPos = this.game.renderer.height - HAND_DIST_FROM_HORISONTAL_BORDERS;
        }
        
        // Animate card from trick pile to hand
        this.tweens.add({
          targets: this.spritesHash[card],
          x: xPos,
          y: yPos,
          angle: angle,
          duration: ANIMATION_SPEED_PHASE_2,
          ease: 'Linear',
          onComplete: () => {
            if (player === this.gameSkitgubbe.lowerHandPlayer) {
              this.showFront(card);
            }
            completedAnimations++;
            if (completedAnimations === totalAnimations) {
              this.finishPhase2Setup();
            }
          }
        });
      });
    });
  }
  
  finishPhase2Setup() {
    // Set phase 2 flag
    this.judgeSkitgubbe.firstPhase = false;
    
    // Initialize Phase 2 state
    this.initializePhase2();
    
    // Rearrange cards and continue playing
    this.placeCardsNice();
    if (this.gameSkitgubbe.lowerHandPlayer == this.judgeSkitgubbe.leader) {
      this.setLowerHandInteractive();
    }
    this.playCards();
  }
  
  initializePhase2() {
    console.log('=== INITIALIZING PHASE 2 ===');
    
    // Determine trump suit (lowest card from remaining deck or random)
    const suits = ['c', 'd', 'h', 's'];
    this.phase2State.trumpSuit = suits[Math.floor(Math.random() * suits.length)];
    console.log('Trump suit:', this.phase2State.trumpSuit);
    
    // Update trump display
    const trumpNames = { 'c': 'Clubs', 'd': 'Diamonds', 'h': 'Hearts', 's': 'Spades' };
    this.showTrumpText.setText(`Trump: ${trumpNames[this.phase2State.trumpSuit]}`);
    
    // Set turn order (start with player who has most cards)
    const players = [
      this.gameSkitgubbe.leftHandPlayer,
      this.gameSkitgubbe.rightHandPlayer,
      this.gameSkitgubbe.lowerHandPlayer
    ];
    
    // Sort by hand size (most cards first)
    this.phase2State.turnOrder = [...players].sort((a, b) => b.getHand().length - a.getHand().length);
    this.phase2State.currentPlayer = this.phase2State.turnOrder[0];
    
    console.log('Turn order:', this.phase2State.turnOrder.map(p => p.getName()));
    console.log('Starting player:', this.phase2State.currentPlayer.getName());
    
    // Clear table
    this.phase2State.tableCards = [];
    this.phase2State.mustPickUp = false;
  }
  
  playCardsPhase2() {
    console.log('=== PHASE 2 TURN ===');
    console.log('Current player:', this.phase2State.currentPlayer.getName());
    console.log('Table cards:', this.phase2State.tableCards);
    console.log('Trump suit:', this.phase2State.trumpSuit);
    
    // Check if game is over
    if (this.isPhase2GameOver()) {
      this.endGame();
      return;
    }
    
    const currentPlayer = this.phase2State.currentPlayer;
    
    if (currentPlayer === this.gameSkitgubbe.lowerHandPlayer) {
      // Human player turn - enable interaction
      this.setLowerHandInteractive();
      
      // Add pick up button if there are cards on table
      if (this.phase2State.tableCards.length > 0) {
        this.showPickUpButton();
      }
      // Wait for human input
    } else {
      // AI player turn
      this.handleAIPhase2Turn(currentPlayer);
    }
  }
  
  handleAIPhase2Turn(player) {
    const hand = player.getHand();
    if (hand.length === 0) {
      this.nextPhase2Player();
      return;
    }
    
    let cardToPlay = null;
    
    if (this.phase2State.tableCards.length === 0) {
      // No cards on table - play any card
      cardToPlay = hand[0];
    } else {
      // Try to beat the top card
      const topCard = this.phase2State.tableCards[this.phase2State.tableCards.length - 1];
      cardToPlay = this.findBeatingCard(hand, topCard);
      
      if (!cardToPlay) {
        // Can't beat - must pick up all table cards
        this.pickUpTableCards(player);
        return;
      }
    }
    
    // Play the card
    this.playPhase2Card(player, cardToPlay);
  }
  
  findBeatingCard(hand, cardToBeat) {
    const beatValue = this.getCardValue(cardToBeat);
    const beatSuit = this.getCardSuit(cardToBeat);
    const isBeatTrump = beatSuit === this.phase2State.trumpSuit;
    
    // Find cards that can beat
    const beatingCards = hand.filter(card => {
      const cardValue = this.getCardValue(card);
      const cardSuit = this.getCardSuit(card);
      const isCardTrump = cardSuit === this.phase2State.trumpSuit;
      
      if (isBeatTrump && !isCardTrump) {
        return false; // Can't beat trump with non-trump
      }
      
      if (!isBeatTrump && isCardTrump) {
        return true; // Trump beats non-trump
      }
      
      if (cardSuit === beatSuit) {
        return cardValue > beatValue; // Same suit, higher value
      }
      
      return false; // Different non-trump suits don't beat
    });
    
    // Return lowest beating card if any
    if (beatingCards.length > 0) {
      return beatingCards.reduce((min, card) => 
        this.getCardValue(card) < this.getCardValue(min) ? card : min
      );
    }
    
    return null;
  }
  
  playPhase2Card(player, cardId) {
    console.log(`${player.getName()} plays ${cardId}`);
    
    // Remove card from hand
    player.getCard(cardId);
    
    // Add to table
    this.phase2State.tableCards.push(cardId);
    
    // Show card
    this.showFront(cardId);
    
    // Animate to table position
    const tableX = this.game.renderer.width / 2 + (this.phase2State.tableCards.length - 1) * 20;
    const tableY = this.game.renderer.height / 2;
    
    this.tweens.add({
      targets: this.spritesHash[cardId],
      x: tableX,
      y: tableY,
      angle: 0,
      duration: ANIMATION_SPEED_PHASE_2,
      ease: 'Linear',
      onComplete: () => {
        // Check if player is out of cards
        if (player.getHand().length === 0) {
          console.log(`${player.getName()} is out of cards!`);
          // Remove from turn order
          this.phase2State.turnOrder = this.phase2State.turnOrder.filter(p => p !== player);
        }
        
        this.nextPhase2Player();
      }
    });
  }
  
  pickUpTableCards(player) {
    console.log(`${player.getName()} picks up ${this.phase2State.tableCards.length} cards`);
    
    // Add all table cards to player's hand
    this.phase2State.tableCards.forEach(card => {
      player.addCard(card);
    });
    
    // Clear table
    this.phase2State.tableCards = [];
    
    // Animate cards to player's hand
    this.placeCardsNice();
    
    // Player who picked up becomes current player
    this.phase2State.currentPlayer = player;
    
    setTimeout(() => {
      this.playCardsPhase2();
    }, ANIMATION_SPEED_PHASE_2);
  }
  
  nextPhase2Player() {
    // Find next player in turn order
    const currentIndex = this.phase2State.turnOrder.indexOf(this.phase2State.currentPlayer);
    const nextIndex = (currentIndex + 1) % this.phase2State.turnOrder.length;
    this.phase2State.currentPlayer = this.phase2State.turnOrder[nextIndex];
    
    setTimeout(() => {
      this.playCardsPhase2();
    }, 500);
  }
  
  isPhase2GameOver() {
    // Game over when only one player has cards or all players are out
    const playersWithCards = this.phase2State.turnOrder.filter(p => p.getHand().length > 0);
    return playersWithCards.length <= 1;
  }
  
  endGame() {
    console.log('=== GAME OVER ===');
    const playersWithCards = this.phase2State.turnOrder.filter(p => p.getHand().length > 0);
    
    if (playersWithCards.length === 0) {
      console.log('All players finished!');
    } else {
      console.log(`${playersWithCards[0].getName()} is the Skitgubbe (loser)!`);
    }
  }
  
  getCardSuit(cardId) {
    return cardId.charAt(0);
  }
  
  showPickUpButton() {
    if (this.pickUpButton) {
      this.pickUpButton.destroy();
    }
    
    this.pickUpButton = this.add.text(
      this.game.renderer.width / 2,
      this.game.renderer.height - 300,
      'Pick Up Cards',
      { 
        fontFamily: 'Arial', 
        fontSize: '16px', 
        backgroundColor: '#ff6666',
        padding: { x: 10, y: 5 }
      }
    )
    .setOrigin(0.5)
    .setInteractive()
    .on('pointerdown', () => {
      this.hidePickUpButton();
      this.disableLowerHandInteractive();
      this.pickUpTableCards(this.gameSkitgubbe.lowerHandPlayer);
    });
  }
  
  hidePickUpButton() {
    if (this.pickUpButton) {
      this.pickUpButton.destroy();
      this.pickUpButton = null;
    }
  }

  handDistFromVerticalBorder(inDeal) {
    let handLength;
    if (inDeal) {
      handLength = 6;
    } else {
      handLength = this.gameSkitgubbe.lowerHandPlayer.getHand().length;
    }
    let x = this.game.renderer.width / 2 -
      handLength / 2 * HAND_DIST_BETWEEN_CARDS + HAND_DIST_BETWEEN_CARDS / 2 - HAND_DIST_BETWEEN_CARDS;
    return x;
  }
}
