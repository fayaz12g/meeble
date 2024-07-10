import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

import meebleImage from './image/player/meeble.png';
import meeblePistolImage from './image/player/meeblepistol.png';
import enemyImage from './image/npc/enemy.png';
import pistolImage from './image/gun/pistol/pistol.svg';
import bulletImage from './image/gun/pistol/bullet.svg';
import bushImage from './image/environment/bush.svg';
import grassImage from './image/environment/grass.svg';
import checkerboardImage from './image/environment/checkerboard.svg';
import bubbleBlasterImage from './image/gun/bubble/bubble-blaster.svg';
import bubbleImage from './image/gun/bubble/bubble.svg';
import carrotCannonImage from './image/gun/carrot/carrot-cannon.svg';
import carrotImage from './image/gun/carrot/carrot.svg';
import rainbowGunImage from './image/gun/rainbow/rainbowgun.svg';
import rainbowRayImage from './image/gun/rainbow/rainbowray.png';
import specialBullets from './image/gun/special-bullets.svg';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

function updateEnemyHealthBar(enemy) {
  const { x, y, health, maxHealth } = enemy;
  
  // Clear previous bar
  enemy.healthBar.clear();
  
  // Draw background bar
  enemy.healthBar.fillStyle(0x000000, 0.8);
  enemy.healthBar.fillRect(x - 25, y - 40, 50, 5);
  
  // Draw health bar based on current health
  const healthPercentage = Phaser.Math.Clamp(health / maxHealth, 0, 1);
  const barWidth = Math.floor(healthPercentage * 50);
  const barColor = getColorForPercentage(healthPercentage);
  
  enemy.healthBar.fillStyle(barColor, 1);
  enemy.healthBar.fillRect(x - 25, y - 40, barWidth, 5);
}

function getColorForPercentage(percentage) {
  // Define color gradient based on percentage
  if (percentage > 0.5) {
    return 0x00ff00; // Green
  } else if (percentage > 0.2) {
    return 0xffff00; // Yellow
  } else {
    return 0xff0000; // Red
  }
}

function hitEnemy(bullet, enemy) {
  const damage = getDamageForWeapon(bullet.texture.key); // Get damage based on bullet type
  enemy.health -= damage; // Reduce enemy health
  
  if (enemy.health <= 0) {
    enemy.destroy(); // Destroy enemy if health drops to zero
  } else {
    updateEnemyHealthBar(enemy); // Update health bar if enemy is still alive
  }
  
  bullet.destroy(); // Destroy bullet after hitting enemy
}

function getDamageForWeapon(weaponType) {
  // Define damage for each weapon type
  switch (weaponType) {
    case 'rainbowray':
      return 10;
    case 'carrotcannon':
      return 15;
    case 'bubbleblaster':
      return 5;
    default:
      return 1; // Default damage for pistol or unknown types
  }
}

function preload() {
  this.load.image('meeble', meebleImage);
  this.load.image('meeblepistol', meeblePistolImage);
  this.load.image('enemy', enemyImage);
  this.load.image('pistol', pistolImage);
  this.load.image('bullet', bulletImage);
  this.load.image('bush', bushImage);
  this.load.image('grass', grassImage);
  this.load.image('checkerboard', checkerboardImage);
  this.load.image('bubbleblaster', bubbleBlasterImage);
  this.load.image('carrotcannon', carrotCannonImage);
  this.load.image('rainbowgun', rainbowGunImage);
  this.load.image('specialbullets', specialBullets);
  this.load.image('carrot', carrotImage);
  this.load.image('bubble', bubbleImage);
  this.load.image('rainbowray', rainbowRayImage);
}

function create() {
  // Spawn bullets and health packs
  this.time.addEvent({
    delay: Phaser.Math.Between(5000, 10000), // Spawn every 5 to 10 seconds
    loop: true,
    callback: () => {
      const spawnType = Phaser.Math.Between(0, 1); // 0 for bullets, 1 for health pack
      let spawnImage, spawnEffect;

      if (spawnType === 0) {
        const bulletTypes = ['pistol', 'bubbleblaster', 'carrotcannon', 'rainbowgun'];
        const randomBulletType = Phaser.Math.RND.pick(bulletTypes);
        spawnImage = randomBulletType;
        spawnEffect = () => {
          const numBullets = Phaser.Math.Between(20, 100);
          this.playerInventory.forEach((weapon) => {
            if (weapon.type === randomBulletType) {
              weapon.bullets += numBullets;
            }
          });
          updateInventoryUI.call(this); // Update inventory UI after adding bullets
        };
      } else {
        // Health pack settings
        spawnImage = 'healthpack'; // Assuming 'healthpack' is your image key for health packs
        spawnEffect = () => {
          this.health = Phaser.Math.Clamp(this.health + 20, 0, 100); // Increase health by 20
          updateHealthBar.call(this); // Update health bar after increasing health
        };
      }

      const spawnX = Phaser.Math.Between(400, 3000);
      const spawnY = Phaser.Math.Between(100, 500);
      
      // Create health pack sprite
      const spawnItem = this.add.sprite(spawnX, spawnY, 'healthpack');
      spawnItem.setScale(0.5);
      this.physics.add.existing(spawnItem);
      spawnItem.body.setAllowGravity(false);
      spawnItem.setInteractive();

      // Add a white box with a red + sign in the middle for health pack visual
      const whiteBox = this.add.rectangle(spawnX, spawnY, 40, 40, 0xffffff).setOrigin(0.5);
      const redCross = this.add.text(spawnX, spawnY, '+', { fontSize: '24px', fill: '#ff0000' }).setOrigin(0.5);

      // Destroy the health pack and apply effect when clicked
      spawnItem.on('pointerdown', () => {
        spawnItem.destroy();
        whiteBox.destroy();
        redCross.destroy();
        spawnEffect();
      });
    },
  });

  // Create repeating background
  this.bg = this.add.tileSprite(0, 0, config.width * 4, config.height, 'grass').setOrigin(0, 0);
  
  // Create world bounds
  this.physics.world.setBounds(0, 0, config.width * 4, config.height);
  
  // Create player
  this.player = this.physics.add.sprite(100, 300, 'meeble');
  this.player.setCollideWorldBounds(true);
  this.player.setScale(0.2); // Make Meeble even smaller
  
  // Create player's weapon sprite
  this.playerWeapon = this.add.sprite(0, 0, 'pistol');
  this.playerWeapon.setScale(0.15); // Make weapon even smaller
  this.playerWeapon.setVisible(false);
  
  // Create camera that follows the player
  this.cameras.main.setBounds(0, 0, config.width * 4, config.height);
  this.cameras.main.startFollow(this.player);
  
  // Create bushes for cover
  this.bushes = this.add.group();
  for (let i = 0; i < 10; i++) {
    const x = Phaser.Math.Between(400, 3000);
    const y = Phaser.Math.Between(100, 500);
    const bush = this.add.image(x, y, 'bush');
    bush.setScale(0.3); // Make bushes smaller
    this.bushes.add(bush);
  }
  
// Create enemies
this.enemies = this.physics.add.group();
for (let i = 0; i < 5; i++) {
  const x = Phaser.Math.Between(800, 3000);
  const y = Phaser.Math.Between(100, 500);
  
  // Create enemy sprite
  const enemy = this.enemies.create(x, y, 'enemy');
  enemy.setCollideWorldBounds(true);
  enemy.setScale(0.5); // Make enemies smaller
  
  // Initialize enemy health and maximum health
  enemy.health = 100;
  enemy.maxHealth = 100;
  
  this.enemies.children.iterate((enemy) => {
    // Ensure healthBar is initialized for each enemy
    if (!enemy.healthBar) {
      enemy.healthBar = this.add.graphics();
    }
    updateEnemyHealthBar(enemy);
  });
  
  // Set depth so health bar appears above enemy
  enemy.healthBar.setDepth(1);
}
  
  // Create weapons
  this.weapons = this.physics.add.group();
  const weaponTypes = ['pistol', 'bubbleblaster', 'carrotcannon', 'rainbowgun'];
  weaponTypes.forEach((type, index) => {
    const weapon = this.weapons.create(400 + index * 200, 300, type);
    weapon.setScale(0.3); // Make weapons smaller
  });
  
  // Create bullets group
  this.bullets = this.physics.add.group();
  
  // Set up collisions
  this.physics.add.overlap(this.player, this.weapons, collectWeapon, null, this);
  this.physics.add.collider(this.bullets, this.enemies, hitEnemy, null, this);
  
  // Set up controls
  this.cursors = this.input.keyboard.createCursorKeys();
  this.wasd = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D
  });
  this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  this.sprintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

  
  // Set up inventory
  this.playerInventory = [];
  this.currentWeaponIndex = -1;

  // Create inventory UI
  this.inventoryUI = this.add.group();
  const slotWidth = 50;
  const slotHeight = 50;
  const slotSpacing = 10; // Space between slots
  const numSlots = 4;
  const totalWidth = numSlots * slotWidth + (numSlots - 1) * slotSpacing;
  const startX = (config.width - totalWidth) / 2;
  const y = config.height - 70;

  for (let i = 0; i < numSlots; i++) {
    const x = startX + i * (slotWidth + slotSpacing);
    const slot = this.add.rectangle(x, y, slotWidth, slotHeight, 0x555555).setOrigin(0, 0);
    const icon = this.add.image(x + slotWidth / 2, y + slotHeight / 2, 'pistol').setScale(0.2);
    icon.setVisible(false);
    // Set scroll factor to 0 to make it fixed on the screen
    slot.setScrollFactor(0);
    icon.setScrollFactor(0);
    this.inventoryUI.add(slot);
    this.inventoryUI.add(icon);
  }
  
  // Create stamina bar
  this.staminaBar = this.add.rectangle(10, config.height - 20, 200, 10, 0xffffff);
  this.staminaBar.setOrigin(0, 0);
  this.stamina = 100;

  // Create health bar
  const healthBarWidth = 200;
  const healthBarHeight = 10;
  const healthBarX = config.width - healthBarWidth - 10;
  const healthBarY = config.height - healthBarHeight - 20;
  this.healthBar = this.add.rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 0x00ff00);
  this.healthBar.setOrigin(0, 0);
  this.health = 100;
  this.healthBar.setScrollFactor(0);
  
  // Create instructions text
  const instructions = 'WASD: Move | Q: Switch Weapon | SPACE/CLICK: Shoot | SHIFT: Sprint | Mouse: Aim';
  const textStyle = { fontSize: '16px', fill: '#fff' };
  this.instructionsText = this.add.text(0, 10, instructions, textStyle);
  const textWidth = this.instructionsText.width;
  this.instructionsText.setX((config.width - textWidth) / 2);
  this.instructionsText.setScrollFactor(0);


  // Win condition
  this.checkerboard = this.physics.add.staticImage(3150, 300, 'checkerboard');
  this.checkerboard.setScale(0.5); // Make checkerboard smaller
  this.physics.add.overlap(this.player, this.checkerboard, winLevel, null, this);
  
  // Switch weapon key
  this.input.keyboard.on('keydown-Q', () => {
    if (this.playerInventory.length > 0) {
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.playerInventory.length;
      updatePlayerWeapon.call(this);
    }
  });
}

function update() {
  // Player movement
  const moveLeft = this.cursors.left.isDown || this.wasd.left.isDown;
  const moveRight = this.cursors.right.isDown || this.wasd.right.isDown;
  const moveUp = this.cursors.up.isDown || this.wasd.up.isDown;
  const moveDown = this.cursors.down.isDown || this.wasd.down.isDown;
  
  let speed = 160;
  if (this.sprintKey.isDown && this.stamina > 1) {
    speed = 320;
    this.stamina = Math.max(0, this.stamina - 1);
  } else {
    this.stamina = Math.min(100, this.stamina + 0.5);
    speed = 160;
  }
  
  if (moveLeft) {
    this.player.setVelocityX(-speed);
    this.player.flipX = true;
  } else if (moveRight) {
    this.player.setVelocityX(speed);
    this.player.flipX = false;
  } else {
    this.player.setVelocityX(0);
  }
  
  if (moveUp) {
    this.player.setVelocityY(-speed);
  } else if (moveDown) {
    this.player.setVelocityY(speed);
  } else {
    this.player.setVelocityY(0);
  }
  
  // Update stamina bar
  this.staminaBar.width = this.stamina * 2;
  this.staminaBar.setScrollFactor(0);
  
  // Update background
  this.bg.tilePositionX = this.cameras.main.scrollX * 0.5;
  
  // Update player's weapon position and rotation
  updatePlayerWeaponPosition.call(this);
  
  // Enemy movement
  this.enemies.children.entries.forEach((enemy) => {
    if (!isPlayerHidden.call(this, enemy)) {
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      this.physics.velocityFromRotation(angle, 50, enemy.body.velocity);
    } else {
      enemy.setVelocity(0);
    }
  });
  
  // Shooting 
  if (((this.input.activePointer.isDown) || Phaser.Input.Keyboard.JustDown(this.fireKey)) && this.currentWeaponIndex !== -1) {
    const currentWeapon = this.playerInventory[this.currentWeaponIndex];
    let bulletKey;
    switch(currentWeapon.type) {
      case 'rainbowgun':
        bulletKey = 'rainbowray';
        break;
      case 'carrotcannon':
        bulletKey = 'carrot';
        break;
      case 'bubbleblaster':
        bulletKey = 'bubble';
        break;
      default:
        bulletKey = 'bullet';
    }
    const bullet = this.bullets.create(this.player.x, this.player.y, bulletKey);
    bullet.setScale(0.1); // Make bullets even smaller
    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y,
      this.input.activePointer.x + this.cameras.main.scrollX,
      this.input.activePointer.y + this.cameras.main.scrollY
    );
    this.physics.velocityFromRotation(angle, currentWeapon.fireRate, bullet.body.velocity);
    
    // Destroy bullet after range is reached
    this.time.delayedCall(currentWeapon.range, () => {
      bullet.destroy();
    });
  }

   // Check for collision with enemies
   this.physics.world.overlap(this.player, this.enemies, (player, enemy) => {
    // Reduce health continuously while touching enemy
    if (!enemy.isTouching) {
      enemy.isTouching = true;
      this.time.addEvent({
        loop: true,
        delay: 100, // Adjust delay as needed
        callback: () => {
          if (enemy.isTouching) {
            this.health = Math.max(0, this.health - 1); // Decrease health
            updateHealthBar.call(this);
          }
        }
      });
    }
  });

  // Update enemies touching state
  this.enemies.children.iterate(enemy => {
    if (!this.physics.overlap(this.player, enemy)) {
      enemy.isTouching = false;
    }
  });
  
  // Update inventory UI
  updateInventoryUI.call(this);
}

function updateHealthBar() {
  const healthPercentage = this.health / 100;

  if (healthPercentage > 0.8) {
    this.healthBar.setFillStyle(0x00ff00); // Green
  } else if (healthPercentage > 0.3) {
    this.healthBar.setFillStyle(0xffff00); // Yellow
  } else {
    this.healthBar.setFillStyle(0xff0000); // Red
  }

  this.healthBar.width = healthPercentage * 200;

  if (this.health <= 0) {
    // Handle game over logic here
    gameOver.call(this);
  }
}

function gameOver() {
  // Display "Game Over" message and pause physics
  const gameOverText = this.add.text(
    this.cameras.main.scrollX + config.width / 2,
    config.height / 2 - 50,
    'You Died',
    { fontSize: '64px', fill: '#fff' }
  ).setOrigin(0.5);
  gameOverText.setDepth(1); // Ensure it's at the front
  
  // Add "Press R to restart" text
  const restartText = this.add.text(
    this.cameras.main.scrollX + config.width / 2,
    config.height / 2 + 50,
    'Press R to restart',
    { fontSize: '32px', fill: '#fff' }
  ).setOrigin(0.5);
  restartText.setDepth(1); // Ensure it's at the front

  // Listen for restart input
  this.input.keyboard.on('keydown-R', () => {
    // Restart game logic
    this.scene.restart();
    // Clean up game over text
    gameOverText.destroy();
    restartText.destroy();
  });

  this.physics.pause();
}


function getFireRate(weaponType) {
  switch(weaponType) {
    case 'pistol': return 600;
    case 'bubbleblaster': return 200;
    case 'carrotcannon': return 900;
    case 'rainbowgun': return 2000;
    default: return 300;
  }
}

function getRange(weaponType) {
  switch(weaponType) {
    case 'pistol': return 500;
    case 'bubbleblaster': return 250;
    case 'carrotcannon': return 600;
    case 'rainbowgun': return 999;
    default: return 300;
  }
}

function collectWeapon(player, weapon) {
  this.playerInventory.push({
    type: weapon.texture.key,
    fireRate: getFireRate(weapon.texture.key),
    range: getRange(weapon.texture.key)
  });
  if (this.currentWeaponIndex === -1) {
    this.currentWeaponIndex = 0;
    updatePlayerWeapon.call(this);
  }
  weapon.destroy();
}

function updatePlayerWeapon() {
  if (this.currentWeaponIndex !== -1) {
    const weaponType = this.playerInventory[this.currentWeaponIndex].type;
    this.playerWeapon.setTexture(weaponType);
    this.playerWeapon.setVisible(true);
  } else {
    this.playerWeapon.setVisible(false);
  }
}

function updatePlayerWeaponPosition() {
  const offsetX = this.player.flipX ? -10 : 10;
  this.playerWeapon.setPosition(this.player.x + offsetX, this.player.y);
  this.playerWeapon.flipX = this.player.flipX;
  
  // Rotate weapon based on mouse position
  const angle = Phaser.Math.Angle.Between(
    this.player.x, this.player.y,
    this.input.activePointer.x + this.cameras.main.scrollX,
    this.input.activePointer.y + this.cameras.main.scrollY
  );
  this.playerWeapon.setRotation(angle);
}

function updateInventoryUI() {
  this.inventoryUI.children.entries.forEach((item, index) => {
    if (index % 2 === 0) { // This is a slot
      if (index / 2 < this.playerInventory.length) {
        item.setFillStyle(0x00ff00);
      } else {
        item.setFillStyle(0x555555);
      }
      if (index / 2 === this.currentWeaponIndex) {
        item.setStrokeStyle(2, 0xffff00);
      } else {
        item.setStrokeStyle(1, 0x000000);
      }
    } else { // This is an icon
      const inventoryIndex = Math.floor(index / 2);
      if (inventoryIndex < this.playerInventory.length) {
        item.setTexture(this.playerInventory[inventoryIndex].type);
        item.setVisible(true);
      } else {
        item.setVisible(false);
      }
    }
  });
}

function isPlayerHidden(enemy) {
  return this.bushes.children.entries.some(bush => 
    Phaser.Geom.Intersects.LineToRectangle(
      new Phaser.Geom.Line(enemy.x, enemy.y, this.player.x, this.player.y),
      bush.getBounds()
    )
  );
}

function winLevel(player, checkerboard) {
  this.add.text(config.width / 2, config.height / 2, 'You Win!', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
  this.physics.pause();
}

const MeebleCrossing = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div className="game-container" id="phaser-game" />;
};

export default MeebleCrossing;