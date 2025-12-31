
alert /** @type {import("../typings")} */

'use strict';

// Use shift-F5 to reload program
const TEST = true;
const SPEED = 1;  // 350;  // Good for playing live is 400
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

    // Find leader index
    const leader = this.judgeSkitgubbe.leader;
    const leaderIndex = players.indexOf(leader);

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
      duration: SPEED * 3,
      ease: 'Linear',
      depth: this.current_depth++,
      angle: 0
    });

    playLeadCard.on('complete', () => {
      // Determine next player based on leader
      let nextPlayer;
      if (leader === this.gameSkitgubbe.lowerHandPlayer) {
        // When lower hand is leader, left hand plays next
        nextPlayer = this.gameSkitgubbe.leftHandPlayer;
      } else if (leader === this.gameSkitgubbe.leftHandPlayer) {
        // When left hand is leader, right hand plays next
        nextPlayer = this.gameSkitgubbe.rightHandPlayer;
      } else if (leader === this.gameSkitgubbe.rightHandPlayer) {
        // When right hand is leader, lower hand plays next
        nextPlayer = this.gameSkitgubbe.lowerHandPlayer;
      } else {
        // Use opponent from judge for other cases
        nextPlayer = this.judgeSkitgubbe.opponent;
      }
      
      const opponentIndex = players.indexOf(nextPlayer);
      const opponentCard = nextPlayer.getCard();
      
      if (!opponentCard) {
        console.error('Opponent has no cards');
        return;
      }
      
      this.judgeSkitgubbe.setOpponentCard(opponentCard);
      // Update the judge's opponent to match who actually played
      this.judgeSkitgubbe.opponent = nextPlayer;
      const opponentSprite = this.spritesHash[opponentCard];
      this.showFront(opponentCard);

      const playOpponentCard = this.tweens.add({
        targets: opponentSprite,
        y: positions[opponentIndex].y,
        x: positions[opponentIndex].x,
        duration: SPEED * 3,
        ease: 'Linear',
        depth: this.current_depth++,
        angle: 0
      });

      playOpponentCard.on('complete', () => {
        // Determine winner and handle trick
        this.getTrick();
      });
    });
  }

  cardIsPressed(sprite) {
    console.log('Pointer down on card ' + sprite.name);
    let success = true;
    if (!TEST) {
      success = this.gameSkitgubbe.lowerHandPlayer.getCard(sprite.name);
    }
    if (success) {
      //      this.snd_play_card.play();
      this.judgeSkitgubbe.inMarriage = false;
      if (this.judgeSkitgubbe.leader ==
        this.gameSkitgubbe.lowerHandPlayer) {
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
        if (this.judgeSkitgubbe.leader ==
          this.gameSkitgubbe.lowerHandPlayer) {
          this.playUpperHandAfterLowerHand();
        } else {
          this.getTrick();
        }
      });
    } else {  // The card pressed cannot be played.
      this.snd_wrong_card.play();
    }
  }

  playUpperHandAfterLowerHand() {
    //
    // Play upper hand to table
    //
    //    this.snd_play_upper_card.play();
    let upper_hand_card = this.judgeSkitgubbe.opponent.getCard();
    this.judgeSkitgubbe.inMarriage = false;
    this.judgeSkitgubbe.setOpponentCard(upper_hand_card);
    let ai_sprite = this.spritesHash[upper_hand_card];
    let playUpperToTable = this.tweens.add({
      targets: ai_sprite,
      y: this.game.renderer.height / 2,
      x: this.game.renderer.width / 2 + 15,  // Place slightly to the right
      duration: SPEED * 3,
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
    
    if (!this.judgeSkitgubbe.getLeadCard() || !this.judgeSkitgubbe.getOpponentCard()) {
      console.error('Missing cards for trick evaluation');
      return;
    }
    
    let winningPlayer = this.judgeSkitgubbe.getWinnerOfTrick();
    console.log('Winning player:', winningPlayer.getName());
    
    winningPlayer.addTrick([
      this.judgeSkitgubbe.getLeadCard(),
      this.judgeSkitgubbe.getOpponentCard()
    ]);
    this.showBack(this.judgeSkitgubbe.getLeadCard());
    this.showBack(this.judgeSkitgubbe.getOpponentCard());
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
    let cardsDealt = 0;
    let totalCardsToDeal = 0;

    console.log('=== DEALING NEW CARDS AFTER TRICK ===');
    console.log('Leader:', this.judgeSkitgubbe.leader.getName());
    console.log('Opponent:', this.judgeSkitgubbe.opponent.getName());
    console.log('Leader is leftHandPlayer?', this.judgeSkitgubbe.leader === this.gameSkitgubbe.leftHandPlayer);
    console.log('Leader is rightHandPlayer?', this.judgeSkitgubbe.leader === this.gameSkitgubbe.rightHandPlayer);
    console.log('Leader is lowerHandPlayer?', this.judgeSkitgubbe.leader === this.gameSkitgubbe.lowerHandPlayer);
    console.log('Opponent is leftHandPlayer?', this.judgeSkitgubbe.opponent === this.gameSkitgubbe.leftHandPlayer);
    console.log('Opponent is rightHandPlayer?', this.judgeSkitgubbe.opponent === this.gameSkitgubbe.rightHandPlayer);
    console.log('Opponent is lowerHandPlayer?', this.judgeSkitgubbe.opponent === this.gameSkitgubbe.lowerHandPlayer);

    // Count how many cards we can deal - only if deck has cards
    if (this.gameSkitgubbe.dealer.deck.length > 0) totalCardsToDeal++;
    if (this.gameSkitgubbe.dealer.deck.length > 1) totalCardsToDeal++;

    if (totalCardsToDeal === 0) {
      console.log('No cards to deal - deck is empty');
      callback();
      return;
    }

    // Deal card to leader first - only if deck has cards
    if (this.gameSkitgubbe.dealer.deck.length > 0) {
      const leaderCard = this.gameSkitgubbe.dealer.getTopCard();
      if (leaderCard) {
        console.log('Dealing card', leaderCard, 'to leader:', this.judgeSkitgubbe.leader.getName());
        this.judgeSkitgubbe.leader.addCard(leaderCard);
        
        let xPos, yPos, angle = 0;
        if (this.judgeSkitgubbe.leader === this.gameSkitgubbe.leftHandPlayer) {
          console.log('Positioning leader card for LEFT hand');
          xPos = HAND_DIST_FROM_VERTICAL_BORDERS;
          yPos = this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * (this.judgeSkitgubbe.leader.getHand().length - 1);
          angle = -90;
        } else if (this.judgeSkitgubbe.leader === this.gameSkitgubbe.rightHandPlayer) {
          console.log('Positioning leader card for RIGHT hand');
          xPos = this.game.renderer.width - HAND_DIST_FROM_VERTICAL_BORDERS;
          yPos = this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * (this.judgeSkitgubbe.leader.getHand().length - 1);
          angle = 90;
        } else {
          console.log('Positioning leader card for LOWER hand');
          xPos = this.game.renderer.width / 2 - HAND_DIST_FROM_VERTICAL_BORDERS + HAND_DIST_BETWEEN_CARDS * (this.judgeSkitgubbe.leader.getHand().length - 1);
          yPos = this.game.renderer.height - HAND_DIST_FROM_HORISONTAL_BORDERS;
        }
        console.log('Leader card position:', xPos, yPos, 'angle:', angle);

        this.tweens.add({
          targets: this.spritesHash[leaderCard],
          x: xPos,
          y: yPos,
          angle: angle,
          duration: SPEED,
          ease: 'Linear',
          onComplete: () => {
            if (this.judgeSkitgubbe.leader === this.gameSkitgubbe.lowerHandPlayer) {
              this.showFront(leaderCard);
            }
            cardsDealt++;
            if (cardsDealt === totalCardsToDeal) callback();
          }
        });
      }
    }

    // Deal card to opponent if there's another card in deck
    if (this.gameSkitgubbe.dealer.deck.length > 0) {
      const opponentCard = this.gameSkitgubbe.dealer.getTopCard();
      if (opponentCard) {
        console.log('Dealing card', opponentCard, 'to opponent:', this.judgeSkitgubbe.opponent.getName());
        this.judgeSkitgubbe.opponent.addCard(opponentCard);
        
        let xPos, yPos, angle = 0;
        if (this.judgeSkitgubbe.opponent === this.gameSkitgubbe.leftHandPlayer) {
          console.log('Positioning opponent card for LEFT hand');
          xPos = HAND_DIST_FROM_VERTICAL_BORDERS;
          yPos = this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * (this.judgeSkitgubbe.opponent.getHand().length - 1);
          angle = -90;
        } else if (this.judgeSkitgubbe.opponent === this.gameSkitgubbe.rightHandPlayer) {
          console.log('Positioning opponent card for RIGHT hand');
          xPos = this.game.renderer.width - HAND_DIST_FROM_VERTICAL_BORDERS;
          yPos = this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * (this.judgeSkitgubbe.opponent.getHand().length - 1);
          angle = 90;
        } else {
          console.log('Positioning opponent card for LOWER hand');
          xPos = this.game.renderer.width / 2 - HAND_DIST_FROM_VERTICAL_BORDERS + HAND_DIST_BETWEEN_CARDS * (this.judgeSkitgubbe.opponent.getHand().length - 1);
          yPos = this.game.renderer.height - HAND_DIST_FROM_HORISONTAL_BORDERS;
        }
        console.log('Opponent card position:', xPos, yPos, 'angle:', angle);

        this.tweens.add({
          targets: this.spritesHash[opponentCard],
          x: xPos,
          y: yPos,
          angle: angle,
          duration: SPEED,
          ease: 'Linear',
          onComplete: () => {
            if (this.judgeSkitgubbe.opponent === this.gameSkitgubbe.lowerHandPlayer) {
              this.showFront(opponentCard);
            }
            cardsDealt++;
            if (cardsDealt === totalCardsToDeal) callback();
          }
        });
      }
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
      lowerTween = this.tweens.add({
        targets: this.spritesHash[this.gameSkitgubbe.lowerHandPlayer.getHand()[i]],
        x: this.handDistFromVerticalBorder(false) + i * HAND_DIST_BETWEEN_CARDS,
        y: this.game.renderer.height - HAND_DIST_FROM_HORISONTAL_BORDERS,
        duration: SPEED / 2,
        ease: 'Linear',
        depth: i
      });
    }

    // Place left hand cards nicely
    this.gameSkitgubbe.leftHandPlayer.sortHand();
    for (let i = 0; i < this.gameSkitgubbe.leftHandPlayer.getHand().length; i++) {
      this.tweens.add({
        targets: this.spritesHash[this.gameSkitgubbe.leftHandPlayer.getHand()[i]],
        x: HAND_DIST_FROM_VERTICAL_BORDERS,
        y: this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * i,
        angle: -90,
        duration: SPEED / 2,
        ease: 'Linear',
        depth: i
      });
    }

    // Place right hand cards nicely
    this.gameSkitgubbe.rightHandPlayer.sortHand();
    for (let i = 0; i < this.gameSkitgubbe.rightHandPlayer.getHand().length; i++) {
      this.tweens.add({
        targets: this.spritesHash[this.gameSkitgubbe.rightHandPlayer.getHand()[i]],
        x: this.game.renderer.width - HAND_DIST_FROM_VERTICAL_BORDERS,
        y: this.game.renderer.height / 2 + HAND_DIST_BETWEEN_CARDS * i,
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

  shouldStartPhase2() {
    // Phase 2 starts when deck is empty and all players have no cards in hand
    const allPlayersOutOfCards = 
      this.gameSkitgubbe.leftHandPlayer.getHand().length === 0 &&
      this.gameSkitgubbe.rightHandPlayer.getHand().length === 0 &&
      this.gameSkitgubbe.lowerHandPlayer.getHand().length === 0;
    
    return this.gameSkitgubbe.dealer.deck.length === 0 && allPlayersOutOfCards;
  }

  startPhase2() {
    console.log('=== STARTING PHASE 2 ===');
    
    // Give each player their tricks as their new hand
    const players = [
      this.gameSkitgubbe.leftHandPlayer,
      this.gameSkitgubbe.rightHandPlayer,
      this.gameSkitgubbe.lowerHandPlayer
    ];
    
    players.forEach(player => {
      const tricks = player.getTricks();
      console.log(`${player.getName()} gets ${tricks.length} cards from tricks`);
      
      // Add trick cards to hand
      tricks.forEach(trickCards => {
        trickCards.forEach(card => {
          player.addCard(card);
        });
      });
      
      // Clear tricks since they're now in hand
      player.clearTricks();
    });
    
    // Set phase 2 flag
    this.judgeSkitgubbe.firstPhase = false;
    
    // Rearrange cards and continue playing
    this.placeCardsNice();
    if (this.gameSkitgubbe.lowerHandPlayer == this.judgeSkitgubbe.leader) {
      this.setLowerHandInteractive();
    }
    this.playCards();
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
