var game = new Phaser.Game(300, 700, Phaser.AUTO, 'gameDiv');

var mainState = {

  preload: function() {
    // Change the background color of the game
    game.stage.backgroundColor = '#71c5cf';

    // Load the bird sprite
    game.load.image('angel', 'assets/bird.png');

    game.load.image('platform', 'assets/pipe.png');
  },

  create: function() {
    this.velocity = 0;

    // Set the physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Display the bird on the screen
    this.angel = this.game.add.sprite(125, 650, 'angel');


    // Add gravity to the bird to make it fall
    game.physics.arcade.enable(this.angel);
    // this.bird.body.gravity.y = 100;

    // Call the 'jump' function when the spacekey is hit
    var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    spaceKey.onDown.add(this.jump, this);

    var upArrowKey = this.game.input.keyboard.addKey(38);
    upArrowKey.onDown.add(this.accelerate, this);

    var downArrowKey = this.game.input.keyboard.addKey(37);
    downArrowKey.onDown.add(this.decelerate, this);

    this.platforms = game.add.group();
    this.platforms.enableBody = true;
    this.platforms.inputEnabled = true;
    this.platforms.createMultiple(5, 'platform');
    console.log(this.platforms);

    for (var i = 0; i < 5; i++) {
      var platform = this.platforms.getFirstDead();

      platform.reset(Math.floor(Math.random()*175), i*140);

      platform.checkWorldBounds = true;
      platform.outOfBoundsKill = true;

      platform.events.onKilled.add(this.platformDied, this);
    }
  },

  update: function() {
    // If the bird is out of the world (too high or too low), call the 'restartGame' function
    if (this.angel.inWorld == false)
        this.restartGame();
  },

  // Make the bird jump
  jump: function() {
    // Add a vertical velocity to the bird
    this.angel.body.velocity.x = -100 ;
  },

// Restart the game
  restartGame: function() {
    // Start the 'main' state, which restarts the game
    game.state.start('main');
  },

  addOnePlatform: function(x, y) {
    var platform = this.platforms.getFirstDead();

    platform.reset(x, y);
    platform.body.velocity.y = this.velocity;

    platform.checkWorldBounds = true;
    platform.outOfBoundsKill = true;
  },

  accelerate: function() {
    this.velocity += 200;

    this.platforms.forEach(function(platform, i) {
      platform.body.velocity.y = this.velocity;
    }.bind(this));
  },

  decelerate: function() {
    this.velocity -= 200;
    console.log(this.velocity);

    this.platforms.forEach(function(platform, i) {
      platform.body.velocity.y = this.velocity;
    }.bind(this));
  },

  platformDied: function() {
    this.addOnePlatform(Math.floor(Math.random()*175), 0);
  },



};

game.state.add('main', mainState);
game.state.start('main');
