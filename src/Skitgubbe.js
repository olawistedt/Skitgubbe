/**
 * This file contains the game logic for Tausendeins. There are also some
 * classes common to all trick taking games with trump.
 *
 * @author       Ola Wistedt <ola@witech.se>
 * @copyright    2021 Ola Wistedt.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

function assert(condition, message) {
  if (!condition) {
    message = message || 'Assertion failed';
    if (typeof Error !== 'undefined') {
      throw new Error(message);
    }
    throw message;  // Fallback
  }
}

// Fiftytwo cards, consisting of A-K-Q-J-10-9-8-7-6-5-4-3-2 in each suit,
const CARD_SKITGUBBE_IDS = [
  'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10', 'c11', 'c12',
  'c13', 'c14', 'd02', 'd03', 'd04', 'd05', 'd06', 'd07', 'd08', 'd09', 'd10',
  'd11', 'd12', 'd13', 'd14', 'h02', 'h03', 'h04', 'h05', 'h06', 'h07', 'h08',
  'h09', 'h10', 'h11', 'h12', 'h13', 'h14', 's02', 's03', 's04', 's05', 's06',
  's07', 's08', 's09', 's10', 's11', 's12', 's13', 's14'
];

cardValue =
  function (card) {
    return parseInt(card[1] + card[2]);
  }

cardColor =
  function (card) {
    return card[0];
  }

/**
 * @classdesc
 * A trick taking game player
 *
 * @class Player
 * @constructor
 *
 * @param {class Judge} judge - The judge of game rules:
 */
class Player {
  constructor(judge) {
    this.name = 'Unknown';
    this.hand = [];
    this.judge = judge;
    this.tricks = [];
    this.deal_points = 0;
    this.total_points = 0;
  }

  setName(n) {
    this.name = n;
  }

  getName() {
    return this.name;
  }

  /**
   * @param {string} cardId : The card id to add to this players hand.
   */
  addCard(cardId) {
    this.hand.push(cardId);
  }

  removeCard(cardId) {
    let index = this.hand.indexOf(cardId);
    this.hand.splice(index, 1);
  }

  /**
   * @returns {Array} an array of cards that this player owns.
   */
  getHand() {
    return this.hand;
  }

  sortHand() {
    let clubs = this.hand.filter(e => e[0] == 'c');
    let diamonds = this.hand.filter(e => e[0] == 'd');
    let spades = this.hand.filter(e => e[0] == 's');
    let hearts = this.hand.filter(e => e[0] == 'h');
    let jokers = this.hand.filter(e => e[0] == 'j');

    if (clubs.length > 0) {
      clubs.sort();
      clubs.reverse();
    }
    if (diamonds.length > 0) {
      diamonds.sort();
      diamonds.reverse();
    }

    if (spades.length > 0) {
      spades.sort();
      spades.reverse();
    }

    if (hearts.length > 0) {
      hearts.sort();
      hearts.reverse();
    }

    if (this.judge.getTrump() == undefined) {
      this.hand = [];
      this.hand = this.hand.concat(clubs);
      this.hand = this.hand.concat(diamonds);
      this.hand = this.hand.concat(spades);
      this.hand = this.hand.concat(hearts);
    } else {
      let result = [];
      if (this.judge.getTrump() == 'c') {
        result = result.concat(clubs);
        result = result.concat(diamonds);
        result = result.concat(spades);
        result = result.concat(hearts);
      } else if (this.judge.getTrump() == 'd') {
        result = result.concat(diamonds);
        result = result.concat(spades);
        result = result.concat(hearts);
        result = result.concat(clubs);
      } else if (this.judge.getTrump() == 's') {
        result = result.concat(spades);
        result = result.concat(hearts);
        result = result.concat(clubs);
        result = result.concat(diamonds);
      } else if (this.judge.getTrump() == 'h') {
        result = result.concat(hearts);
        result = result.concat(clubs);
        result = result.concat(diamonds);
        result = result.concat(spades);
      }
      this.hand = result;
    }
  }

  addTrick(trick) {
    this.tricks.push(trick);
  }

  getNrOfTricks() {
    return this.tricks.length;
  }

  clearTricks() {
    this.tricks = [];
  }

  clearHand() {
    this.hand = [];
  }
}

/**
 * @classdesc
 * The artificial intelligence
 *
 * Tries to play as smart as Ola Wistedt can program it.
 *
 * @class Ai
 * @extends Player
 * @constructor
 *
 * @param {number} level - The level of the Ai:
 */
class Ai extends Player {
  /**
   * @param {number} level the level of the AI.
   */
  constructor(level, judge) {
    super(judge);
    this.level = level;

    if (this.level == 3) {
      // Setup simulation to play with two ramdom (level 1) AI's
      this.simulatejudgeSkitgubbe = new judgeSkitgubbe();
      this.simulategameSkitgubbe =
        new gameSkitgubbe(1, 1, this.simulatejudgeSkitgubbe);
    }
  }

  setAiLevel(nr) {
    this.level = nr;
  }

  getMarriage(candidates) {
    switch (this.level) {
      case 1:
        return this.getMarriage1(candidates);
      case 2:
        return this.getMarriage1(candidates);
      case 3:
        return this.getMarriage1(candidates);
      case 4:
        return this.getMarriage1(candidates);
    }
  }

  getCard() {
    switch (this.level) {
      case 1:
        return this.getCard1();
      case 2:
        return this.getCard2();
      case 3:
        return this.getCard3();
      case 4:
        return this.getCard4();
    }
  }

  getMarriage1(candidates) {
    if (candidates.includes('c')) {
      return 'c';
    } else if (candidates.includes('s')) {
      return 's';
    } else if (candidates.includes('h')) {
      return 'h';
    } else if (candidates.includes('d')) {
      return 'd';
    }
    return undefined;
  }

  // getCard1() chooses a random valid card to play
  getCard1() {
    let possible = this.judge.getPossibleCardsToPlay(this);
    let rand_card_pos = Math.floor(Math.random() * possible.length);
    let cardId = possible[rand_card_pos];
    this.removeCard(cardId);
    return cardId;
  }

  // getCard2() chooses the highest valid card to play. If it isn't the leader.
  // Play the highest card if it will win, otherwise play the lowest card.
  getCard2() {
    let cardId;
    let possible = this.judge.getPossibleCardsToPlay(this);
    if (this == this.judge.leader) {
      possible = possible.sort().reverse();
      cardId = possible[0];
    } else {
      possible = possible.sort().reverse();
      cardId = possible[0];
      if (cardValue(this.judge.leadCard) > cardValue(cardId)) {
        // Play a lower card if possible
        possible.reverse();
        cardId = possible[0];
      }

      // Play a low trump if possible.
      let trumps = [];
      possible.forEach(e => {
        if (cardColor(e) == this.judge.trump) {
          trumps.push(e);
        }
      });
      if (trumps.length != 0) {
        cardId = trumps.sort()[0];
      }
    }
    this.removeCard(cardId);
    return cardId;
  }

  getCard3() {
    let cardId;
    let possible = this.judge.getPossibleCardsToPlay(this);
    possible.sort((a, b) => {  // Sort with highest card first int the array
      return parseInt(b.substr(1), 10) - parseInt(a.substr(1), 10);
    });
    cardId = possible[Math.floor(Math.random() * possible.length)];

    if (this.judge.isInFirstPhase()) {
      if (this == this.judge.leader) {
        for (let e of possible) {
          // If no trump is set. Play ace and tens if possible.
          if (this.judge.getTrump() == undefined) {
            if (cardValue(e) == 14 || cardValue(e) == 13) {
              cardId = e;
              break;
            } else if (cardValue(e) < 11) {  // Don't play queen or king.
              cardId = e;
              break;
            }
          } else {  // Is leader and trump is defined.
            if (cardColor(e) == this.judge.getTrump()) {
              cardId = e;  // Play the highes trump card
              break;
            } else {  // Card color is not trump
              if (cardValue(e) == 14 || cardValue(e) == 13) {
                cardId = e;
                break;
              } else if (cardValue(e) < 11) {
                cardId = e;
                break;
              }
            }
          }
        }
      } else {  // Not leader
        let leadCard = this.judge.getLeadCard();
        for (let e of possible) {
          if (this.judge.getTrump() == undefined) {
            if (cardColor(leadCard) == cardColor(e) &&
              cardValue(leadCard) < cardValue(e) && cardValue(e) != 11 &&
              cardValue(e) != 12) {
              cardId = e;
              break;
            }
          } else {  // Trump is defined
            if (cardColor(leadCard) == this.judge.getTrump()) {
              if (cardValue(leadCard) < cardValue(e)) {
                cardId = e;
                break;
              }
            }
          }
        }
      }
    } else {  // In second phase
    }

    this.removeCard(cardId);
    return cardId;
  }

  // Simulates a bunch of games with current hands. Chooses to play the card
  // that takes the most tricks and has correct tausendeins. If correct
  // tausendeins was not discovered choose the card that leads to most tricks
  // (to minimize opponent points). Let this player be the simulator upper
  // hand player
  getCard4() {
    let possible = this.judge.getPossibleCardsToPlay(this);

    let a = [];  // Array of results for each card

    let simulator_rounds = 10;
    let points_correct_tausendeins = 55;
    let points_per_trick = 3;

    possible.forEach(current_card => {
      a.push(this.simulatePlayCard(
        current_card, simulator_rounds, points_correct_tausendeins,
        points_per_trick));
    });

    // Find the card with highest score
    let max = ['', 0];
    for (let i = 0; i < a.length; i++) {
      if (a[i][1] >= max[1]) {
        max[0] = a[i][0];
        max[1] = a[i][1];
      }
    }

    this.removeCard(max[0]);
    return max[0];
  }

  simulatePlayCard(
    current_card, times, points_correct_tausendeins, points_per_trick) {
    let trick_table = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.simulategameSkitgubbe.judge.setTrump(this.judge.trump);
    this.simulategameSkitgubbe.judge.setTausendeins(this.judge.tausendeins);
    this.simulategameSkitgubbe.upperHandPlayer.setName('Sim Upper');
    this.simulategameSkitgubbe.lowerHandPlayer.setName('Sim Lower');

    for (let i = 0; i < times; i++) {
      // Setup the simulator game to reflect the main game
      if (this == this.judge.leader) {  // this is the player with AI level 3
        this.simulategameSkitgubbe.judge.leader =
          this.simulategameSkitgubbe.lowerHandPlayer;
        this.simulategameSkitgubbe.judge.opponent =
          this.simulategameSkitgubbe.upperHandPlayer;
      } else {
        this.simulategameSkitgubbe.judge.leader =
          this.simulategameSkitgubbe.upperHandPlayer;
        this.simulategameSkitgubbe.judge.opponent =
          this.simulategameSkitgubbe.lowerHandPlayer;
      }
      this.simulategameSkitgubbe.judge.leader.hand =
        this.judge.leader.hand.slice();
      this.simulategameSkitgubbe.judge.opponent.hand =
        this.judge.opponent.hand.slice();

      this.simulategameSkitgubbe.judge.leader.tricks =
        this.judge.leader.tricks.slice();
      this.simulategameSkitgubbe.judge.opponent.tricks =
        this.judge.opponent.tricks.slice();

      if (this == this.judge.leader) {
        // No card has been played. This AI will lead into the first trick.
        // Set current card to the lead card and ask the AI simulator to play
        // the opponent card.
        this.simulategameSkitgubbe.judge.setLeadCard(current_card);
        this.simulategameSkitgubbe.lowerHandPlayer.removeCard(current_card);
        let oCard = this.simulategameSkitgubbe.judge.opponent.getCard();
        this.simulategameSkitgubbe.judge.setOpponentCard(oCard);
      } else {
        // Set simulator lead card to be the current lead card. The card has
        // already been played in this moment.
        let lCard = this.judge.getLeadCard();
        this.simulategameSkitgubbe.judge.setLeadCard(lCard);
        this.simulategameSkitgubbe.judge.setOpponentCard(current_card);
        this.simulategameSkitgubbe.lowerHandPlayer.removeCard(current_card);
      }

      let winningPlayer =
        this.simulategameSkitgubbe.judge.getWinnerOfTrick();
      //      console.log('winner of first trick is ' +
      //      winningPlayer.getName());
      winningPlayer.addTrick([
        this.simulategameSkitgubbe.judge.getLeadCard(),
        this.simulategameSkitgubbe.judge.getOpponentCard()
      ]);

      // Test play the rest of the hand with
      while (!this.simulategameSkitgubbe.judge.isEndOfSingleDeal()) {
        //        console.log(
        //            'Leader in sub game is ' +
        //            this.simulategameSkitgubbe.judge.leader.getName());
        let lCard = this.simulategameSkitgubbe.judge.leader.getCard();
        if (lCard == undefined) {
          console.log('Error');
        }
        this.simulategameSkitgubbe.judge.setLeadCard(lCard);
        let oCard = this.simulategameSkitgubbe.judge.opponent.getCard();
        this.simulategameSkitgubbe.judge.setOpponentCard(oCard);
        //        console.log('Cards played ' + lCard + ' - ' + oCard);
        let winningPlayer =
          this.simulategameSkitgubbe.judge.getWinnerOfTrick();
        //        console.log('winner of trick is ' +
        //        winningPlayer.getName());
        winningPlayer.addTrick([
          this.simulategameSkitgubbe.judge.getLeadCard(),
          this.simulategameSkitgubbe.judge.getOpponentCard()
        ]);
      }

      let won_tricks =
        this.simulategameSkitgubbe.lowerHandPlayer.getNrOfTricks();
      trick_table[won_tricks]++;
    }

    //
    // Draw conclusions about the above simulations
    //
    let max_points = 0;
    for (let i = 0; i < trick_table.length; i++) {
      let points = 0;

      // Set points for correct tausendeins
      if (i % 2 == 0 &&
        this.simulategameSkitgubbe.judge.tausendeins == EVEN) {
        points = points_correct_tausendeins;
      } else if (
        i % 2 != 0 &&
        this.simulategameSkitgubbe.judge.tausendeins == ODD) {
        points = points_correct_tausendeins;
      }

      // Set points per trick
      points += points_per_trick * i;

      // Multiplicate with the % of chance this occurs
      points *= trick_table[i] / times;

      if (points >= max_points) {
        max_points = points;
      }
    }
    return [current_card, max_points];
  }
}  // End of class Ai

/**
 * @classdesc
 * The artificial intelligence
 *
 * Tries to play as smart as Ola Wistedt can program it.
 *
 * @class Human
 * @extends Player
 * @constructor
 *
 */
class Human extends Player {
  constructor(judge) {
    super(judge);
  }

  getCard(cardId) {
    let possible = this.judge.getPossibleCardsToPlay(this);
    if (!possible.includes(cardId)) {
      return false;
    }
    this.removeCard(cardId);
    return true;
  }
}

/**
 * @classdesc
 * The judge
 *
 * @class Judge
 * @extends Nothing
 * @constructor
 *
 */
class Judge {
  constructor() {
    this.dealer;
    this.eldest;
    this.opponent;
    this.leader;
    this.trump;
    this.leadCard;
    this.opponentCard;
  }

  init(dealer, eldest) {
    this.dealer = dealer;
    this.eldest = eldest;
    this.leader = this.eldest;
    this.opponent = this.dealer;
  }

  /**
   *
   * @param {string} card : The lead card.
   */
  setLeadCard(card) {
    this.leadCard = card;
  }

  getLeadCard() {
    return this.leadCard;
  }

  setOpponentCard(card) {
    this.opponentCard = card;
  }

  getOpponentCard() {
    return this.opponentCard;
  }

  getPossibleCardsToPlay(player) {
    assert(false);
  }

  setTrump(color) {
    this.trump = color;
  }

  getTrump() {
    return this.trump;
  }

  /**
   * Just change the leader (two players)
   */
  switchLeader() {
    let tmp;
    tmp = this.opponent;
    this.opponent = this.leader;
    this.leader = tmp;
  }
}

/**
 * @classdesc
 * The judge that can Tausendeins game rules.
 *
 * @class judgeSkitgubbe
 * @extends Judge
 * @constructor
 *
 */
class judgeSkitgubbe extends Judge {
  constructor() {
    super();
    this.firstPhase = true;
    this.inMarriage = false;
  }

  setTrump(color) {
    super.setTrump(color);
  }

  setFirstPhase() {
    this.firstPhase = true;
    this.takenMarriages = [];
  }

  isInFirstPhase() {
    return this.firstPhase;
  }

  setSecondPhase() {
    this.firstPhase = false;
  }

  // Första fasen:
  // Spelet är fritt, vilket kort som helst får spelas och läggas
  // Om icke trump spelats ut vinner:
  //  1. högst kost i den utspelade färgen
  //  2. Ett påspelat trumpkort
  // Om trump spelas vinner högst valör
  // Innan talongen är slut:
  // Inget färgtvång
  // Högst kort i den utspelade färgen vinner, om inte trump spelats
  // Trump kan alltid läggas
  // 2 Som i Bondtolva
  getPossibleCardsToPlay(player) {
    if (this.firstPhase) {
      if (this.inMarriage) {
        return [this.trump + '11', this.trump + '12'];
      }
      return player.hand;
    }

    if (player == this.leader) {
      return player.hand;
    }

    //
    // Player is not the leader
    //

    if (this.firstPhase) {
      return player.hand;
    }

    // If in second phase

    let possible = [];

    // Same suit
    player.hand.forEach(e => {
      if (cardColor(e) == cardColor(this.leadCard)) {
        possible.push(e);
      }
    });

    if (possible.length == 0) {
      // Trump
      player.hand.forEach(e => {
        if (cardColor(e) == this.trump) {
          possible.push(e);
        }
      });
    }

    // Any card can be played
    if (possible.length == 0) {
      possible = player.hand;
    }

    return possible;
  }

  // Side effect: Sets the leader of next round.
  getWinnerOfTrick() {
    if (cardColor(this.opponentCard) == cardColor(this.leadCard) &&
      cardValue(this.opponentCard) > cardValue(this.leadCard)) {
      this.switchLeader();
    } else if (
      cardColor(this.opponentCard) == this.trump &&
      cardColor(this.leadCard) != this.trump) {
      this.switchLeader();
    }

    if (cardValue(this.opponentCard) == 14) {
      this.leader.deal_points += 11;
    }
    if (cardValue(this.leadCard) == 14) {
      this.leader.deal_points += 11;
    }
    if (cardValue(this.opponentCard) == 13) {
      this.leader.deal_points += 10;
    }
    if (cardValue(this.leadCard) == 13) {
      this.leader.deal_points += 10;
    }
    if (cardValue(this.opponentCard) == 12) {
      this.leader.deal_points += 4;
    }
    if (cardValue(this.leadCard) == 12) {
      this.leader.deal_points += 4;
    }
    if (cardValue(this.opponentCard) == 11) {
      this.leader.deal_points += 3;
    }
    if (cardValue(this.leadCard) == 11) {
      this.leader.deal_points += 3;
    }
    if (cardValue(this.opponentCard) == 10) {
      this.leader.deal_points += 2;
    }
    if (cardValue(this.leadCard) == 10) {
      this.leader.deal_points += 2;
    }

    return this.leader;
  }

  getMarriageCandidates(hand) {
    let possibilities = [];
    if (hand.includes('c11') && hand.includes('c12') &&
      !this.takenMarriages.includes('c')) {
      possibilities.push('c');
    }
    if (hand.includes('d11') && hand.includes('d12') &&
      !this.takenMarriages.includes('d')) {
      possibilities.push('d');
    }
    if (hand.includes('h11') && hand.includes('h12') &&
      !this.takenMarriages.includes('h')) {
      possibilities.push('h');
    }
    if (hand.includes('s11') && hand.includes('s12') &&
      !this.takenMarriages.includes('s')) {
      possibilities.push('s');
    }
    return possibilities;
  }

  setMarriage(color) {
    assert(
      !this.takenMarriages.includes(color),
      'Error: This marriage has already been done.');
    if (color == 'c') {
      this.leader.deal_points += 100;
    } else if (color == 's') {
      this.leader.deal_points += 80;
    } else if (color == 'h') {
      this.leader.deal_points += 60;
    } else if (color == 'd') {
      this.leader.deal_points += 40;
    }

    this.setTrump(color);
    this.takenMarriages.push(color);
  }

  isEndOfFirstPhase() {
    if (this.leader.getNrOfTricks() + this.opponent.getNrOfTricks() == 10) {
      this.setSecondPhase();
      return true;
    }
    return false;
  }

  isEndOfSecondPhase() {
    return this.leader.getNrOfTricks() + this.opponent.getNrOfTricks() == 16;
  }

  // setPoints() returns the points of the leading player.
  setTotalPoints() {
    this.leader.total_points += this.leader.deal_points;
    this.opponent.total_points += this.opponent.deal_points;
    return this.getMaxPoints();
  }

  getMaxPoints() {
    if (this.leader.total_points > this.opponent.total_points) {
      return this.leader.total_points;
    } else {
      return this.opponent.total_points;
    }
  }
}

/**
 * @classdesc
 * The dealer
 *
 * @class Dealer
 * @extends Nothing
 * @constructor
 *
 */
class Dealer {
  constructor(arrayOfPlayers) {
    this.arrayOfPlayers = arrayOfPlayers;
    this.deck = [];
    this.current_dealer = 0;
  }

  randomDealer() {
    let dealer_nr = Math.floor(Math.random() * this.arrayOfPlayers.length);
    let b = [];  // Array of the order, with dealer first.
    for (let i = 0; i < this.arrayOfPlayers.length; i++) {
      b.push(
        this.arrayOfPlayers[(dealer_nr + i) % this.arrayOfPlayers.length]);
    }
    this.current_dealer = b[0];
    return b;
  }

  nextDealer() {
    let index_current_dealer =
      this.arrayOfPlayers.indexOf(this.current_dealer);
    let next_dealer_index =
      (index_current_dealer + 1) % this.arrayOfPlayers.length;
    this.current_dealer = this.arrayOfPlayers[next_dealer_index];

    this.clearHands();
  }

  getDealer() {
    return this.current_dealer;
  }

  getEldest() {
    return this.arrayOfPlayers[(this.arrayOfPlayers.indexOf(this.current_dealer) + 1) %
      this.arrayOfPlayers.length];
  }

  clearHands() {
    this.arrayOfPlayers.forEach(p => {
      p.clearHand();
    });
  }

  /**
   *
   * @param {number} similar : How many cards to deal at a time.
   * @param {number} total : The total number of cards to deal to each
   *     player.
   */
  deal(similar, total) {
    assert(
      similar == 1, 'No support for deal more than one card at a time yet.');

    let index_current_dealer =
      this.arrayOfPlayers.indexOf(this.current_dealer);

    for (let i = 0; i < total * this.arrayOfPlayers.length; i++) {
      this.arrayOfPlayers[(i + index_current_dealer + 1) % this.arrayOfPlayers.length]
        .addCard(this.deck.pop());
    }
  }

  shuffle(arrayOfCards) {
    let temp_ids = arrayOfCards.slice();  // Copy by value.
    for (let i = arrayOfCards.length - 1; i > -1; i--) {
      // Pick a random card from the card_array.
      let card_nr = Math.floor(Math.random() * temp_ids.length);
      let cardId = temp_ids.splice(card_nr, 1)[0];  // Remove card from deck.
      this.deck.push(cardId);
    }
  }

  deckHasCards() {
    return this.deck.length > 0;
  }

  getTopCard() {
    assert(this.deck.length > 0, 'Tried to take a card from a empty deck');
    return this.deck.pop();
  }
}  // End of class Dealer

/**
 * @classdesc
 * The Tausendeins dealer
 *
 * @class TausendeinsDealer
 * @extends Dealer
 * @constructor
 *
 */
class TausendeinsDealer extends Dealer {
  constructor(arrayOfPlayers) {
    super(arrayOfPlayers);
  }

  shuffle() {
    super.shuffle(CARD_SKITGUBBE_IDS);
  }

  shuffleTestMarriage() {
    this.deck = [
      'c07', 'c08', 'c09', 'c10', 'c11', 'c12', 'c13', 'c14',
      'd07', 'd08', 'd09', 'd10', 'd13', 'd14', 'h07', 'h08',
      'h09', 'd12', 'h13', 'd11', 'h14', 's07', 'h10', 's08',
      'h11', 's09', 'h12', 's10', 's11', 's13', 's12', 's14'
    ];
  }

  deal() {
    super.deal(1, 6);
  }
}

/**
 * @classdesc
 * The game
 *
 * @class Game
 * @extends Nothing
 * @constructor
 *
 */
class Game {
  constructor(judge) {
    this.judge = judge;
  }

  singleDeal(similar, total) {
    this.dealer.deal(similar, total);
  }
}

/**
 * @classdesc
 * The Tausendeins game
 *
 * @class gameSkitgubbe
 * @extends Game
 * @constructor
 *
 */
class gameSkitgubbe extends Game {
  constructor(upper_hand_ai_level, lower_hand_ai_level, judge) {
    super(judge);
    if (upper_hand_ai_level == 0) {
      this.leftHandPlayer = new Human(this.judge);
    } else {
      this.leftHandPlayer = new Ai(upper_hand_ai_level, this.judge);
    }
    if (upper_hand_ai_level == 0) {
      this.rightHandPlayer = new Human(this.judge);
    } else {
      this.rightHandPlayer = new Ai(lower_hand_ai_level, this.judge);
    }
    if (lower_hand_ai_level == 0) {
      this.lowerHandPlayer = new Human(this.judge);
    } else {
      this.lowerHandPlayer = new Ai(lower_hand_ai_level, this.judge);
    }
    let a = [this.leftHandPlayer, this.rightHandPlayer, this.lowerHandPlayer];
    this.dealer = new TausendeinsDealer(a);
  }
  setAiLevel(level) {
    this.leftHandPlayer.setAiLevel(level);
  }
  newGame() {
    let dealOrder = this.dealer.randomDealer();
    this.judge.init(dealOrder[0], dealOrder[1]);
    this.judge.setFirstPhase();
    this.leftHandPlayer.clearTricks();
    this.rightHandPlayer.clearTricks();
    this.lowerHandPlayer.clearTricks();
    this.leftHandPlayer.deal_points = 0;
    this.rightHandPlayer.deal_points = 0;
    this.lowerHandPlayer.deal_points = 0;
    this.leftHandPlayer.total_points = 0;
    this.rightHandPlayer.total_points = 0;
    this.lowerHandPlayer.total_points = 0;
    this.dealer.clearHands();
  }
  newSingleDeal() {
    this.judge.setFirstPhase();
    this.judge.trump = undefined;
    this.leftHandPlayer.deal_points = 0;
    this.rightHandPlayer.deal_points = 0;
    this.lowerHandPlayer.deal_points = 0;
    this.leftHandPlayer.clearTricks();
    this.rightHandPlayer.clearTricks();
    this.lowerHandPlayer.clearTricks();
  }
}
