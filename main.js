var game = new Phaser.Game(300, 625, Phaser.AUTO, 'gameDiv');
var highScore = 0;

var mainState = {

  preload: function() {
    // Change the background color of the game
    game.stage.backgroundColor = '#71c5cf';

    // Load the bird sprite
    game.load.image('angel', 'assets/bird.png');

    game.load.image('platform', 'assets/pipe.png');

    game.load.image('hook', 'assets/hook.png');
  },

  create: function() {
    this.velocity = 0;
    this.shootable = true;
    this.courseScore = 0;
    this.maxHeight = 0;

    // Set the physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0,0,300,700);
    game.camera.y = 75;

    // Display the bird on the screen
    this.angel = this.game.add.sprite(125, 650, 'angel');
    game.physics.arcade.enable(this.angel);
    this.angel.body.collideWorldBounds = true;
    // this.angel.body.checkCollision.left = true;
    // this.angel.body.checkCollision.right = true;
    this.angel.body.bounce.setTo(1,1);

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
    this.platforms.createMultiple(6, 'platform');
    // this.platforms.body.collideWorldBounds = true;
    // this.platforms.body.checkCollision.up = false;

    for (var i = 0; i < 2; i++) {
      var platform = this.platforms.getFirstDead();

      platform.reset(Math.floor(Math.random()*175), 125 + i*325);
      platform.scale.y = 0.6;
      platform.scale.x = 0.7;

      platform.checkWorldBounds = true;
      platform.outOfBoundsKill = true;

      platform.events.onKilled.add(this.platformDied, this);

    }

    this.hook = this.game.add.sprite(1000, 1000, 'hook');
    game.physics.arcade.enable(this.hook);
    this.hook.body.collideWorldBounds = true;
    this.hook.body.bounce.setTo(1,1);
    this.hook.inputEnabled = true;
    this.hook.kill();

    this.scoreText = this.game.add.text(10, 85, "" + this.score(), { font: '18px Arial', fill: '#0095DD' });
    highScoreText = this.game.add.text(160, 85, "High Score: " + highScore, { font: '18px Arial', fill: '#0095DD' });
  },

  update: function() {
    // If the bird is out of the world (too high or too low), call the 'restartGame' function
    if (this.angel.inWorld == false){
        this.restartGame();
    }

    game.input.onDown.add(this.clickHandler, this);

    this.game.physics.arcade.overlap(this.platforms, this.hook, this.collisionHandler, null, this);


    if (this.phase === "beforeFly") {
      this.maxHeight = 700 - this.angel.position.y;
      // this.angel.body.velocity.y -= this.deltaY/5;
      // this.angel.body.velocity.x -= this.deltaX/5;
      if (this.angel.position.y <= this.bottomPlatformY) {
        this.velocity = -this.angel.body.velocity.y;
        console.log(this.velocity);
        this.propogateVelocity();
        this.angel.body.velocity.y = 0;
        this.phase = "fly";
        this.maxHeight = 700 - this.bottomPlatformY;
      }
    }


    if (this.phase === "fly") {
      this.courseScore += this.velocity;
      this.shootable = true;
      this.gameStarted = true;
      this.velocity -= 25;
      this.velocity = Math.max(this.velocity, 0);
      this.propogateVelocity();
      if (this.velocity === 0) {
        this.phase = "afterFly";
      }
    }

    if (this.phase === "afterFly") {
      this.angel.body.velocity.y += 25;

    }

    if (this.gameStarted && this.angel.position.y === 650) {
      this.restartGame();
    }

    if (this.hook.position.y < 10 || this.hook.position.y > 674) {
      this.hook.kill();
      this.shootable = true;
    }

    if (this.hook.alive) {
      this.hook.body.velocity.y += 25;
      if (this.hook.body.velocity.x < 0) {
        this.hook.body.velocity.x += 4;
      } else if (this.hook.body.velocity.x > 0){
        this.hook.body.velocity.x -= 4;
      }
    }

    this.scoreText.setText(this.score());


  },

  score: function() {
    return Math.floor((this.courseScore + this.maxHeight)/1000);
  },

  clickHandler: function() {
    if (this.shootable && this.angel.position.y > this.game.input.mousePointer.y) {
      this.shoot();
    }
  },

  // Make the bird jump
  jump: function() {
    // Add a vertical velocity to the bird
    this.angel.body.velocity.x = -100 ;
  },

// Restart the game
  restartGame: function() {
    // Start the 'main' state, which restarts the game
    this.velocity = 0;
    this.angel.body.velocity.x = 0;
    this.angel.body.velocity.y = 0;
    this.gameStarted = false;
    highScore = Math.max(highScore, this.score());
    highScoreText.setText(highScore);
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
    this.propogateVelocity();
  },

  decelerate: function() {
    this.velocity -= 200;
    this.propogateVelocity();
  },

  propogateVelocity: function() {
    this.platforms.forEach(function(platform, i) {
      platform.body.velocity.y = this.velocity;
    }.bind(this));
  },

  platformDied: function() {
    this.addOnePlatform(Math.floor(Math.random()*175), 75);
  },

  shoot: function() {
    if (this.hook.alive === false) {
      this.hook.reset(this.angel.position.x + 12.5, this.angel.position.y);
      var x = this.game.input.mousePointer.x - this.angel.position.x;
      var y = this.game.input.mousePointer.y - this.angel.position.y;
      this.hookNorm = Math.sqrt(Math.pow(x, 2) +  Math.pow(y, 2));
      this.hook.body.velocity.x = x / this.hookNorm * 1700;
      this.hook.body.velocity.y = y / this.hookNorm * 1700;
      this.shootable = false;
      this.shootHeight = this.angel.position.y;
    }
  },

  collisionHandler: function() {
    if (this.hook.position.y < this.shootHeight - 10) {
      this.phase = "beforeFly";
      this.bottomPlatformY = this.hook.position.y;
      var deltaY = this.angel.position.y - this.hook.position.y
      var deltaX = this.angel.position.x - this.hook.position.x;
      var deltaY = this.angel.position.y - this.hook.position.y;
      var norm = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
      this.angel.body.velocity.x = -deltaX*4;
      this.angel.body.velocity.y = -deltaY*4;
      this.hook.kill();
    }
  }

};

game.state.add('main', mainState);
game.state.start('main');
