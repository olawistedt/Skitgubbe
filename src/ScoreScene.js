/** @type {import("../typings")} */

class ScoreScene extends Phaser.Scene {
  constructor() {
    super({key: 'SCORE'});
  }

  init(data) {
    this.data = data;
  }

  preload() {
    this.load.image(
        'next_single_deal_button',
        'assets/buttons/button_next-single-deal.png');
    this.load.image(
        'play_again_button', 'assets/buttons/button_play-again.png');
  }

  create() {
    let tile = this.add.tileSprite(
        0, 0, this.game.renderer.width * 2, this.game.renderer.height * 2,
        'cloth');  // Add the background

    let header = 'SCORE';
    if (this.data.game.judge.getMaxPoints() >= 1001) {
      if (this.data.game.upperHandPlayer.total_points >
          this.data.game.lowerHandPlayer.total_points) {
        header = 'AI WIN';
      } else {
        header = 'YOU WIN';
      }
    }

    let titleText = this.add.text(this.game.renderer.width / 2, 100, header, {
      fontFamily: '"Arial"',
      fontSize: '100px',
    });
    titleText.setOrigin(0.5);


    let categoryText = this.add.text(
        this.game.renderer.width / 2 - 200, this.game.renderer.height / 2,
        'DEAL POINTS\n\nTOTAL POINTS', {
          fontFamily: '"Arial"',
          fontSize: '50px',
        });
    categoryText.setOrigin(0.5);

    let aiPointsX = this.game.renderer.width / 2 + 155;
    let aiPointsY = this.game.renderer.height / 2 - 25;
    let aiPoints = ' AI\n ' + this.data.game.upperHandPlayer.deal_points +
        '\n\n ' + this.data.game.upperHandPlayer.total_points;

    let aiPointsText = this.add.text(aiPointsX, aiPointsY, aiPoints, {
      fontFamily: '"Arial"',
      fontSize: '50px',
    });
    aiPointsText.setOrigin(0.5);

    let playerPointsX = this.game.renderer.width / 2 + 310;
    let playerPointsY = this.game.renderer.height / 2 - 25;
    let playerPoints = '  YOU\n   ' +
        this.data.game.lowerHandPlayer.deal_points + '\n\n   ' +
        this.data.game.lowerHandPlayer.total_points;

    let playerPointsText =
        this.add.text(playerPointsX, playerPointsY, playerPoints, {
          fontFamily: '"Arial"',
          fontSize: '50px',
        });
    playerPointsText.setOrigin(0.5);

    if (this.data.game.judge.getMaxPoints() >= 1001) {
      let play_again_button = this.add.image(
          this.game.renderer.width / 2, this.game.renderer.height - 100,
          'play_again_button');
      play_again_button.setInteractive();
      play_again_button.on('pointerdown', () => {
        this.data.game.newGame();
        this.scene.start('PLAY');
      });
      if (TEST) {
        let timer = this.time.delayedCall(2000, () => {
          play_again_button.emit('pointerdown');
        });
      }
    } else {
      let play_button = this.add.image(
          this.game.renderer.width / 2, this.game.renderer.height - 100,
          'next_single_deal_button');
      play_button.setInteractive();
      play_button.on('pointerdown', () => {
        this.data.game.dealer.nextDealer();
        this.data.game.judge.init(
            this.data.game.dealer.getDealer(),
            this.data.game.dealer.getEldest());
        this.scene.start('PLAY', {caller: 'score'});
      });
      if (TEST) {
        let timer = this.time.delayedCall(2000, () => {
          play_button.emit('pointerdown');
        });
      }
    }
  }
}
