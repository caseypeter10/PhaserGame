var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y:0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
    extend: {
              player: null,
              healthpoints: null,
              reticle: null,
              moveKeys: null,
              playerBullets: null,
              enemyBullets: null,
              time: 0,
            }
  }
};

var game = new Phaser.Game(config);

var Bullet = new Phaser.Class({

  Extends: Phaser.GameObjects.Image,

  initialize:

  // Bullet Constructor
  function Bullet (scene)
  {
    Phaser.GameObjects.Image.call(this, scene, 0,0, 'bullet');
    this.speed = 1;
    this.born = 0;
    this.direction = 0;
    this.xSpeed = 0;
    this.yspeed = 0;
    this.setSize(12,12,true);
  },

  // Fires a bullet from the player to the reticle
  fire: function (shooter, target)
  {
    this.setPosition(shooter.x, shooter.y); // Initial position
    this.direction = Math.atan( (target.x-this.x) / (target.y - this.y));

    // Calculate x and y velocity of bullet to move it from shooter to target
    if (target.y >= this.y)
    {
      this.xSpeed = this.speed*Math.sin(this.direction);
      this.ySpeed = this.speed*Math.cos(this.direction);
    }
    else
    {
      this.xSpeed = -this.speed*Math.sin(this.direction);
      this.ySpeed = -this.speed*Math.cos(this.direction);
    }

    this.rotation = shooter.rotation; // angle bullet with shooters rotation
    this.born = 0; // Time since new buller spawned
  },

  // Updates the position of the buller each cycle
  update: function (time, delta)
  {
    this.x += this.xSpeed * delta;
    this.y += this.ySpeed * delta;
    this.born += delta;
    if (this.born > 1800)
    {
      this.setActive(false);
      this.setVisible(false);
    }
  }


});

function preload() {
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
  this.load.image('star', 'assets/star_gold.png');
  this.load.spritesheet('player_handgun', 'assets/player_handgun.png',
    { frameWidth: 66, frameHeight: 60 }
  );
  this.load.image('bullet', 'assets/bullet6.png');
  this.load.image('target', 'assets/ball.png');
  this.load.image('background', 'assets/underwater1.png');
}

function create() 
{
  // Set world bounds
  this.physics.world.setBounds(0, 0, 1600, 1200);

  // Add 2 groups for Bullet objects
  playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true});
  enemyBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true});

  // Add background player, enemy, reticle, healthpoint sprites
  var background = this.add.image(800, 600, 'background');
  player = this.physics.add.sprite(800, 600, 'player_handgun');
  enemy = this.physics.add.sprite(300, 600, 'player_handgun');
  reticle = this.physics.add.sprite(800,700, 'target');
  hp1 = this.add.image(-350, -250, 'target').setScrollFactor(0.5, 0.5);
  hp2 = this.add.image(-300, -250, 'target').setScrollFactor(0.5, 0.5);
  hp3 = this.add.image(-250, -250, 'target').setScrollFactor(0.5, 0.5);

  // Set image/sprite properties
  background.setOrigin(0.5, 0.5).setDisplaySize(1600,1200);
  player.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true).setDrag(500, 500);
  enemy.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true);
  reticle.setOrigin(0.5, 0.5).setDisplaySize(25,25).setCollideWorldBounds(true);
  hp1.setOrigin(0.5, 0.5).setDisplaySize(50, 50);
  hp2.setOrigin(0.5, 0.5).setDisplaySize(50, 50);
  hp3.setOrigin(0.5, 0.5).setDisplaySize(50,50);

  // Set sprite variables
  player.health = 3;
  enemy.health = 3;
  enemy.lastFired = 0;

  // Set camera properties
  this.cameras.main.zoom = 0.5;
  this.cameras.main.startFollow(player);

  // Creates object for input with WASD keys
  moveKeys = this.input.keyboard.addKeys({
    'up': Phaser.Input.keyboard.KeyCodes.W,
    'down': Phaser.Input.keyboard.KeyCodes.S,
    'left': Phaser.Input.Keyboard.KeyCodes.A,
    'right': Phaser.Input.Keyboard.KeyCodes.D
  });

  // Enables movement of player with WASD keys
  this.input.keyboard.on('keydown_W', function (event) {
    player.setAccelerationY(-800);
  });
  this.input.keyboard.on('keydown_S', function (event) {
    player.setAccelerationY(800);
  });
  this.input.keyboard.on('keydown_A', function (event) {
    player.setAccelerationX(-800);
  });

  // Stops player acceleation on uppress of WASD keys
  this.input.keyboard.on('keyup_W', function (event) {
    if (moveKeys['down'].isUp)
      player.setAccelerationY(0);
  });
  this.input.keyboard.on('keyup_S', function(event) {
    if (moveKeys['up'].isUp)
      player.setAccelerationY(0);
  });
  this.input.keyboard.on('keyup_A', function(event) {
    if (moveKeys['right'].isUp)
      player.setAccelerationX(0);
  });
  this.input.keyboard.on('keyup_D', function (event) {
    if (moveKeys['left'].isUp)
      player.setAccelerationX(0);
  });

  // Fires bullet from player on left click of mouse
  this.input.on('pointerdown', function (pointer, time, lastFired) {
    if (player.active === false);
      return;

    // Get bullet from bullets group
    var bullet = playerBullets.get().setActive(true).setVisible(true);

    if (bullet)
    {
      bullet.fire(player, reticle);
      this.physics.add.collider(enemy, bullet, enemyHitCallback);
    }
  }, this);

  // Pointer lock will only work after mousedown
  game.canvas.addEventListener('mousedown', function () {
    game.input.mouse.requestPointerLock();
  });

  // Exit pointer lock when Q or escape (by default) is pressed.
  this.input.keyboard.on('keydown_Q', function (event) {
    if (game.input.mouse.locked)
      game.input.mouse.releasePointerLock();
  }, 0, this);

  // Move reticle upon locked pointer move
  this.input.on('pointermove', function (pointer) {
    if (this.input.mouse.locked)
    {
      reticle.x += pointer.movementX;
      reticle.y += pointer.movementY;
    }
  }, this);
}
//https://labs.phaser.io/edit.html?src=src\games\topdownShooter\topdown_combatMechanics.js

function enemyHitCallback(enemyHit, bulletHit)

{
    // Reduce health of enemy
    if (bulletHit.active === true && enemyHit.active === true)
    {
        enemyHit.health = enemyHit.health - 1;
        console.log("Enemy hp: ", enemyHit.health);

        // Kill enemy if health <= 0
        if (enemyHit.health <= 0)
        {
           enemyHit.setActive(false).setVisible(false);
        }

        // Destroy bullet
        bulletHit.setActive(false).setVisible(false);
    }
}

function enemyFire(enemy, player, time, gameObject)
{
    if (enemy.active === false)
    {
        return;
    }

    if ((time - enemy.lastFired) > 1000)
    {
        enemy.lastFired = time;

        // Get bullet from bullets group
        var bullet = enemyBullets.get().setActive(true).setVisible(true);

        if (bullet)
        {
            bullet.fire(enemy, player);

            // Add collider between bullet and player
            gameObject.physics.add.collider(player, bullet, playerHitCallback);
        }
    }
}

// Ensures reticle does not move offscreen
function constrainReticle(reticle)
{
    var distX = reticle.x-player.x; // X distance between player & reticle
    var distY = reticle.y-player.y; // Y distance between player & reticle

    // Ensures reticle cannot be moved offscreen (player follow)
    if (distX > 800)
        reticle.x = player.x+800;
    else if (distX < -800)
        reticle.x = player.x-800;

    if (distY > 600)
        reticle.y = player.y+600;
    else if (distY < -600)
        reticle.y = player.y-600;
}


  var self = this;
  this.socket = io();
  this.players = this.add.group();

  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        displayPlayers(self, players[id], 'ship');
      } else {
        displayPlayers(self, players[id], 'otherPlayer');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'otherPlayer');
  });

  this.socket.on('disconnect', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });

  this.socket.on('playerUpdates', function (players) {
    Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);
        }
      });
    });
  });

  this.socket.on('updateScore', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  this.socket.on('starLocation', function (starLocation) {
    if (!self.star) {
      self.star = self.add.image(starLocation.x, starLocation.y, 'star');
    } else {
      self.star.setPosition(starLocation.x, starLocation.y);
    }
  });




  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;

function update(time, delta) 
{
  // Rotates player to face towards reticle
  player.rotation = Phaser.Math.Angle.Between(player.x, player.y, reticle.x, reticle.y);
  enemy.rotation = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

  //Make reticle move with player
  reticle.body.velocity.x = player.body.velocity.x;
  reticle.body.velocity.y = player.body.velocity.y;

  // Constrain velocity of player
  constrainVelocity(player, 500);

  // Constrain position of constrainReticle
  constrainReticle(reticle);

  // Make enemy fire
  enemyFire(enemy, player, time, this);  

  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;

  if (this.cursors.left.isDown) {
    this.leftKeyPressed = true;
  } else if (this.cursors.right.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }

  if (this.cursors.up.isDown) {
    this.upKeyPressed = true;
  } else {
    this.upKeyPressed = false;
  }

  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') player.setTint(0x0000ff);
  else player.setTint(0xff0000);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
