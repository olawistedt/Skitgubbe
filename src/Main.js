//   _____ _  _______ _______ _____ _    _ ____  ____  ______ 
//  / ____| |/ /_   _|__   __/ ____| |  | |  _ \|  _ \|  ____|
// | (___ | ' /  | |    | | | |  __| |  | | |_) | |_) | |__   
//  \___ \|  <   | |    | | | | |_ | |  | |  _ <|  _ <|  __|  
//  ____) | . \ _| |_   | | | |__| | |__| | |_) | |_) | |____ 
// |_____/|_|\_\_____|  |_|  \_____|\____/|____/|____/|______|
//                                                            
// A classical swedish card game implemented by Ola Wistedt
//

// This is for auto completion
/** @type {import("../../../phaser")} */

const CST = {
  SCENES: {
    PLAY: 'PLAY',
    scene: [PlayScene],
  }
}

let game = new Phaser.Game({
  width: 819,
  height: 1093,
  audio: { disableWebAudio: true },
  transparent: true,
  render: {
    type: Phaser.CANVAS,
  },
  callbacks: {
    preBoot: (game) => {
      if (game.canvas) {
        game.canvas.getContext('2d', { willReadFrequently: true });
      }
    },
  },
  scene: [
    PlayScene,
    ScoreScene,
  ],
})
