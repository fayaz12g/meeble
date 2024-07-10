import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

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

function preload() {
  this.load.image('meeble', '/image/meeble.png');
  this.load.image('meeblepistol', '/image/meeblepistol.png');
  this.load.image('enemy', '/image/enemy.png');
  this.load.image('pistol', '/image/pistol.png');
  this.load.image('bullet', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGElEQVQYV2NkYGD4z4AFMDIwMDAw4FQAABzKAwtJJICXAAAAAElFTkSuQmCC');
  this.load.image('bush', '/image/bush.png');
  this.load.image('grass', '/image/grass.png');
  this.load.image('checkerboard', '/image/checkerboard.png');
}

function create() {
  // Create repeating background
  this.bg = this.add.tileSprite(0, 0, config.width, config.height, 'grass').setOrigin(0, 0);
  
  // Create world bounds
  this.physics.world.setBounds(0, 0, 3200, 600);
  
  // Create player
  this.player = this.physics.add.sprite(100, 300, 'meeble');
  this.player.setCollideWorldBounds(true);
  
  // Create camera that follows the player
  this.cameras.main.setBounds(0, 0, 3200, 600);
  this.cameras.main.startFollow(this.player);
  
  // Create bushes for cover
  this.bushes = this.physics.add.staticGroup();
  for (let i = 0; i < 10; i++) {
    const x = Phaser.Math.Between(400, 3000);
    const y = Phaser.Math.Between(100, 500);
    this.bushes.create(x, y, 'bush');
  }
  
  // Create enemies
  this.enemies = this.physics.add.group();
  for (let i = 0; i < 5; i++) {
    const x = Phaser.Math.Between(800, 3000);
    const y = Phaser.Math.Between(100, 500);
    const enemy = this.enemies.create(x, y, 'enemy');
    enemy.setCollideWorldBounds(true);
  }
  
  // Create weapons
  this.weapons = this.physics.add.group();
  this.weapons.create(400, 300, 'pistol');
  
  // Create bullets group
  this.bullets = this.physics.add.group();
  
  // Set up collisions
  this.physics.add.collider(this.player, this.bushes);
  this.physics.add.overlap(this.player, this.weapons, collectWeapon, null, this);
  this.physics.add.collider(this.bullets, this.enemies, hitEnemy, null, this);
  
  // Set up controls
  this.cursors = this.input.keyboard.createCursorKeys();
  this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  
  // Set up inventory
  this.playerInventory = [];
  this.currentWeaponIndex = -1;
  
  // Create inventory UI
  this.inventoryUI = this.add.group();
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 60;
    const y = config.height - 50;
    const slot = this.add.rectangle(x, y, 50, 50, 0x555555).setOrigin(0, 0);
    this.inventoryUI.add(slot);
  }
  
  // Win condition
  this.checkerboard = this.physics.add.staticImage(3150, 300, 'checkerboard');
  this.physics.add.overlap(this.player, this.checkerboard, winLevel, null, this);
  
  // Switch weapon key
  this.input.keyboard.on('keydown-Q', () => {
    if (this.playerInventory.length > 0) {
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.playerInventory.length;
      updatePlayerTexture.call(this);
    }
  });
}

function update() {
  // Player movement
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-160);
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(160);
  } else {
    this.player.setVelocityX(0);
  }
  
  if (this.cursors.up.isDown) {
    this.player.setVelocityY(-160);
  } else if (this.cursors.down.isDown) {
    this.player.setVelocityY(160);
  } else {
    this.player.setVelocityY(0);
  }
  
  // Update background
  this.bg.tilePositionX = this.cameras.main.scrollX;
  
  // Enemy movement
  this.enemies.children.entries.forEach((enemy) => {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    this.physics.velocityFromRotation(angle, 50, enemy.body.velocity);
  });
  
  // Shooting
  if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.currentWeaponIndex !== -1) {
    const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
    this.physics.moveTo(bullet, this.input.x + this.cameras.main.scrollX, this.input.y, 300);
    
    // Destroy bullet after 2 seconds
    this.time.delayedCall(2000, () => {
      bullet.destroy();
    });
  }
  
  // Update inventory UI
  updateInventoryUI.call(this);
}

function collectWeapon(player, weapon) {
  this.playerInventory.push(weapon.texture.key);
  if (this.currentWeaponIndex === -1) {
    this.currentWeaponIndex = 0;
    updatePlayerTexture.call(this);
  }
  weapon.destroy();
}

function hitEnemy(bullet, enemy) {
  bullet.destroy();
  enemy.destroy();
}

function updatePlayerTexture() {
  if (this.currentWeaponIndex !== -1) {
    this.player.setTexture('meeblepistol');
  } else {
    this.player.setTexture('meeble');
  }
}

function updateInventoryUI() {
  this.inventoryUI.children.entries.forEach((slot, index) => {
    if (index < this.playerInventory.length) {
      slot.setFillStyle(0x00ff00);
    } else {
      slot.setFillStyle(0x555555);
    }
    if (index === this.currentWeaponIndex) {
      slot.setStrokeStyle(2, 0xffff00);
    } else {
      slot.setStrokeStyle(1, 0x000000);
    }
  });
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

  return <div id="phaser-game" />;
};

export default MeebleCrossing;