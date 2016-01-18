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

    game.load.image('leftCloud', 'assets/cloud-left.png');

    game.load.image('rightCloud', 'assets/cloud-right.png');

    game.load.image('chainlink', 'assets/chainlink.png');

  },

  create: function() {
    this.velocity = 0;
    this.shootable = true;
    this.courseScore = 0;
    this.maxHeight = 0;
    this.hookStuck = false;

    // Set the physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0,0,300,700);
    game.camera.y = 75;

    // Call the 'jump' function when the spacekey is hit
    var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    spaceKey.onDown.add(this.jump, this);

    var upArrowKey = this.game.input.keyboard.addKey(38);
    upArrowKey.onDown.add(this.accelerate, this);

    var downArrowKey = this.game.input.keyboard.addKey(37);
    downArrowKey.onDown.add(this.decelerate, this);

    this.clouds = game.add.group();
    this.clouds.enableBody = true;
    this.clouds.createMultiple(4, 'leftCloud');
    this.clouds.createMultiple(4, 'rightCloud');

    for (var i = 0; i < 8; i++) {
      var cloud = this.clouds.getFirstDead();
      cloud.scale.x = Math.random()*0.5 + 0.3;
      cloud.scale.y = cloud.scale.x;

      var x = (300 + cloud.scale.x*300) * Math.random() - cloud.scale.x;
      var y = (625 + cloud.scale.y*150) * Math.random() - cloud.scale.x;

      cloud.reset(x, y);
      cloud.body.velocity.x = Math.random() * 100 - 50;;

      cloud.checkWorldBounds = true;
      cloud.outOfBoundsKill = true;

      cloud.events.onKilled.add(this.cloudDied, this);
    }

    this.platforms = game.add.group();
    this.platforms.enableBody = true;
    this.platforms.inputEnabled = true;
    this.platforms.createMultiple(6, 'platform');
    // this.platforms.body.collideWorldBounds = true;
    // this.platforms.body.checkCollision.up = false;


    // Display the bird on the screen
    this.angel = this.game.add.sprite(125, 650, 'angel');
    game.physics.arcade.enable(this.angel);
    this.angel.body.collideWorldBounds = true;
    // this.angel.body.checkCollision.left = true;
    // this.angel.body.checkCollision.right = true;
    this.angel.body.bounce.setTo(1,1);

    this.chainlinks = game.add.group();
    this.chainlinks.enableBody = true;
    this.chainlinks.inputEnabled = true;
    this.chainlinks.createMultiple(60, 'chainlink');

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

    this.game.physics.arcade.overlap(this.platforms, this.hook, this.hookPlatformCollisionHandler, null, this);
    this.game.physics.arcade.overlap(this.hook, this.angel, this.hookAngelCollisionHandler, null, this);
    this.game.physics.arcade.overlap(this.chainlinks, this.angel, this.chainlinkAngelCollisionHandler, null, this);



    if (this.phase === "beforeFly") {
      this.hook.body.velocity.y = this.velocity;
      this.maxHeight = 700 - this.angel.position.y;
      // this.angel.body.velocity.y -= this.deltaY/5;
      // this.angel.body.velocity.x -= this.deltaX/5;
      if (this.angel.position.y <= this.bottomPlatformY) {
        this.hook.kill();
        this.velocity = -this.angel.body.velocity.y;
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
      this.hookStuck = false;
      this.shootable = true;
    }

    if (this.hook.alive && !this.hookStuck) {
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
    this.shootable = true;
    this.courseScore = 0;
    this.maxHeight = 0;
    this.hookStuck = false;
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

  platformDied: function() {
    this.addOnePlatform(Math.floor(Math.random()*175), 75);
  },

  addOneCloud: function(x, y) {
    var cloud = this.clouds.getFirstDead();
    cloud.scale.x = Math.random()*0.3 + 0.2;
    cloud.scale.y = cloud.scale.x;
    var cloudVelocity = Math.random() * 100 - 50;

    if (cloudVelocity > 0) {
      var x = -cloud.scale.x*300;
      var y = (625 + cloud.scale.x) * Math.random() - cloud.scale.x;
    } else {
      var x = 300;
      var y = (625 + cloud.scale.x) * Math.random() - cloud.scale.x;
    }

    cloud.reset(x, y);
    cloud.body.velocity.x = cloudVelocity;

    cloud.checkWorldBounds = true;
    cloud.outOfBoundsKill = true;

    cloud.events.onKilled.add(this.cloudDied, this);
  },

  cloudDied: function() {
    // this.addOneCloud(Math.floor(Math.random()*175), 75);
    this.addOneCloud();
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

  shoot: function() {
    if (this.hook.alive === false) {
      this.hook.reset(this.angel.position.x + 12.5, this.angel.position.y);
      var x = this.game.input.mousePointer.x - (this.angel.position.x + 12.5);
      var y = this.game.input.mousePointer.y - this.angel.position.y;
      this.hookNorm = Math.sqrt(Math.pow(x, 2) +  Math.pow(y, 2));
      this.hook.body.velocity.x = x / this.hookNorm * 1700;
      this.hook.body.velocity.y = y / this.hookNorm * 1700;
      this.shootable = false;
      this.shootHeight = this.angel.position.y;
      console.log(this.hook.body.velocity.x)
    }
  },

  hookPlatformCollisionHandler: function() {
    if (this.hook.position.y < this.shootHeight - 10 && !this.hookStuck) {
      this.phase = "beforeFly";
      this.bottomPlatformY = this.hook.position.y;
      var deltaX = this.angel.position.x + 25 - this.hook.position.x;
      var deltaY = this.angel.position.y - this.hook.position.y;
      var norm = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
      this.angel.body.velocity.x = -deltaX*4;
      this.angel.body.velocity.y = -deltaY*4;
      this.hook.body.velocity.x = 0;
      this.hook.body.velocity.y = 0;
      this.hookStuck = true;

      for (var i = 1; i < Math.floor(norm / 10)+1; i++) {
        var chainlink = this.chainlinks.getFirstDead();
        chainlink.scale.x = 0.15;
        chainlink.scale.y = 0.15;

        var x = 25 + -i * deltaX / Math.floor(norm / 10) + this.angel.position.x;
        var y = -(i-1) * deltaY / Math.floor(norm / 10) + this.angel.position.y;

        chainlink.reset(x, y);

      }
    }
  },

  hookAngelCollisionHandler: function() {
    this.hookStuck = false;
    this.hook.kill();
    this.chainlinks.forEach(function(chainlink) {
      chainlink.kill();
    })
  },

  chainlinkAngelCollisionHandler: function(a, b) {
    b.kill();
  }

};

game.state.add('main', mainState);
game.state.start('main');
