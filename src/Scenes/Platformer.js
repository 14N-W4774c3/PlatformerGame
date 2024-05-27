class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 250;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.lives = 2;
        this.pause = false;
        this.jumpTick = 0;
        this.landTick = 0;
        this.lifeTick = 0;
        this.heartBeat = 0;
    }

    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
        this.load.setPath("./assets/");
        this.load.image("buttonGraphic", "red.png");
        this.load.spritesheet('spriteList', 'tilemap_packed.png', {frameWidth: 18, frameHeight: 18});
        this.load.spritesheet('indusList', 'industrial_tilemap_packed.png', {frameWidth: 18, frameHeight: 18});
    }

    create() {
        this.gameOverText = this.add.text(-200, 200, "Game Over", {align: 'center'});
        this.continueText = this.add.text(-200, 250, "Do You Want To Continue?", {align: 'center'});
        this.yesText = this.add.text(-200, 400, "Yes", {align: 'center'});
        this.noText = this.add.text(-400, 400, "No", {align: 'center'});
        this.restartText = this.add.text(400, 200, "Restart", {align: 'center'});
        this.youWonText = this.add.text(400, 150, "You Won!", {align: 'center'});
        this.gameOverText.visible = false;
        this.continueText.visible = false;
        this.yesText.visible = false;
        this.noText.visible = false;
        this.restartText.visible = false;
        this.youWonText.visible = false;

        // Create Buttons
        this.buttonYes = this.add.nineslice(-100, -100, "buttonGraphic");
        this.buttonNo = this.add.nineslice(-100, -100, "buttonGraphic");
        this.buttonRestart = this.add.nineslice(-100, -100, "buttonGraphic");
        //this.buttonRestart.setSize(100, 50);

        // Create a new tilemap game object which uses 18x18 pixel tiles
        this.map = this.add.tilemap("platformer-level", 18, 18, 45, 20);
        
        this.industiles = this.map.addTilesetImage("Industrial2", "tilemap_indus");
        this.tileset = this.map.addTilesetImage("Neutral", "tilemap_tiles");

        // Create a layer
        this.background = this.map.createLayer("Background", this.tileset, 0, 0);
        this.indusBackground = this.map.createLayer("Indus-Background", this.industiles, 0, 0);
        this.acid = this.map.createLayer("Acid", this.industiles, 0, 0);
        this.indusGround = this.map.createLayer("Indus-Ground", this.industiles, 0, 0);
        this.groundLayer = this.map.createLayer("Natural-Ground", this.tileset, 0, 0);
        
        this.physics.world.setBounds(0, 0, game.width, game.height, true, true, true, false);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        this.indusGround.setCollisionByProperty({
            collides: true
        });
        this.acid.setCollisionByProperty({
            acid: true
        });

        // Create Objects
        this.spawnPoint = this.map.findObject("Objects", obj => obj.name === "spawn");
        this.endPoint = this.map.createFromObjects("Objects", {
            name: "endpoint",
            key: "indusList",
            frame: 58
        });
        this.hearts = this.map.createFromObjects("Objects", {
            name: "heart",
            key: "spriteList",
            frame: 44
        });

        /*
        this.acidkillzone = this.map.createFromObjects("Objects", {
            name: "acidkillzone",
            classType: Phaser.GameObjects.Zone,
        });
        this.smallacidkillzone = this.map.createFromObjects("Objects", {
            name: "smallacidkillzone",
            classType: Phaser.GameObjects.Zone,
        });
        this.physics.world.enable(this.acidkillzone, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.smallacidkillzone, Phaser.Physics.Arcade.STATIC_BODY);
        */
        // ...This formatting is used in the Phaser docs.  Why doesn't it work?!
        // The claimed error is 'sprite.setTexture is not a function' off of this.map.createFromObjects(...)
        // Why is it calling 'sprite' anything?  These are specified as Zones!
        // newdocs.phaser.io/3.80.0/Phaser.Tilemaps.Tilemap#createFromObjects
        this.smallAcidTL = this.map.findObject("Objects", obj => obj.name === "smallkillTL");
        this.smallAcidBR = this.map.findObject("Objects", obj => obj.name === "smallkillBR");
        this.smallAcidKillZone = this.add.zone(this.smallAcidTL.x, this.smallAcidTL.y).setSize(this.smallAcidBR.x - this.smallAcidTL.x, this.smallAcidBR.y - this.smallAcidTL.y);
        this.largeAcidTL = this.map.findObject("Objects", obj => obj.name === "largekillTL");
        this.largeAcidBR = this.map.findObject("Objects", obj => obj.name === "largekillBR");
        this.largeAcidKillZone = this.add.zone(this.largeAcidTL.x, this.largeAcidTL.y).setSize(this.largeAcidBR.x - this.largeAcidTL.x, this.largeAcidBR.y - this.largeAcidTL.y);
        this.physics.world.enable(this.hearts, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.endPoint, Phaser.Physics.Arcade.STATIC_BODY);
        this.heartGroup = this.add.group(this.hearts);

        // Particle VFX
        // Walking
        this.walkVFX = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_05.png'],
            random: true,
            scale: {start: 0.03, end: 0.075},
            maxAliveParticles: 5,
            lifespan: 350,
            gravityY: 100,
            alpha: {start: 1.0, end: 0.1},}
        );
        this.walkVFX.stop();
        // Jumping
        this.jumpVFX = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_09.png', 'smoke_10.png'],
            random: true,
            scale: {start: 0.03, end: 0.075},
            maxAliveParticles: 3,
            lifespan: 250,
            gravityY: 150,
            alpha: {start: 1.0, end: 0.1},});
        this.jumpVFX.stop();
        // Landing
        this.landVFX = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_07.png', 'smoke_05.png'],
            random: true,
            scale: {start: 0.03, end: 0.075},
            maxAliveParticles: 3,
            lifespan: 250,
            gravityY: 100,
            velocityY: 75,
            alpha: {start: 1.0, end: 0.1},
        });
        this.landVFX.stop();
        // Collecting Lives
        this.lifeVFX = this.add.particles(0, 0, "kenny-particles", {
            frame: ['symbol_01.png'],
            random: true,
            scale: {start: 0.03, end: 0.075},
            maxAliveParticles: 5,
            lifespan: 350,
            gravityY: -100,
            alpha: {start: 1.0, end: 0.1},
        });
        this.lifeVFX.stop();
        
        // Set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.indusGround);
        //this.physics.add.collider(true, my.sprite.player, this.acid, this.loseLife());

        this.physics.add.overlap(my.sprite.player, this.heartGroup, (obj1, obj2) => {
            this.lifeVFX.setX(obj2.x);
            this.lifeVFX.setY(obj2.y);
            this.lifeVFX.start();
            this.lifeTick = 20;
            this.sound.play("powerup");
            obj2.destroy();
            this.lives ++;
        });

        this.physics.add.overlap(my.sprite.player, this.smallAcidKillZone, (obj1, obj2) => {
            console.log("Acid collision, small");
            this.loseLife();
        });
        this.physics.add.overlap(my.sprite.player, this.largeAcidKillZone, (obj1, obj2) => {
            console.log("Acid collision, large");
            this.loseLife();
        });

        this.physics.add.overlap(my.sprite.player, this.endPoint, (obj1, obj2) => {
            this.winGame();
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        this.resetCamera();

        this.animatedTiles.init(this.map);

        /*
        // EC3-1 - Coin Animation
        this.anims.create({
            key:'coin',
            frames: this.anims.generateFrameNumbers('spriteList', {start: 151, end: 152}),
            frameRate: 8,
            repeat: -1
        });

        // EC3-2 - Coin Animation Implementation
        for (let coin of this.coins){
            coin.play("coin");
        }
        */
    }

    update() {
        if (this.pause == false){
            // Check Lives
            if (this.lives == 0){
                this.gameOver();
            }
            // Check Player Location
            if(my.sprite.player.Y > 700){
                this.loseLife();
            }
            
            // Particle Tracking
            if(this.jumpTick > 0){
                this.jumpTick--;
                if(this.jumptick == 0){
                    this.jumpVFX.stop();
                }
            }
            if(this.landTick > 0){
                this.landTick--;
                if(this.landTick == 0){
                    this.landVFX.stop();
                }
            }
            if(this.lifeTick > 0){
                this.lifeTick--;
                if(this.lifeTick == 0){
                    this.lifeVFX.stop();
                }
            }

            // Heart Animation
            // Technically not an animation code-wise, but 
            this.heartBeat++;
            if(this.heartBeat%120==0){
                for(let heart of this.hearts){
                    if (heart.scale == 1){
                        heart.scale = 1.5;
                    }
                }
            }
            if((this.heartBeat+110)%120==0){
                for(let heart of this.hearts){
                    if (heart.scale == 1.5){
                        heart.scale = 1;
                    }
                }
            }

            // Player Movement
            if(cursors.left.isDown) {
                my.sprite.player.setAccelerationX(-this.ACCELERATION);
                my.sprite.player.resetFlip();
                my.sprite.player.anims.play('walk', true);
                this.walkVFX.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
                this.walkVFX.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
                // Only play smoke effect if touching the ground
                if (my.sprite.player.body.blocked.down) {
                    this.walkVFX.start();
                }
            } else if(cursors.right.isDown) {
                my.sprite.player.setAccelerationX(this.ACCELERATION);
                my.sprite.player.setFlip(true, false);
                my.sprite.player.anims.play('walk', true);
                this.walkVFX.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
                this.walkVFX.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
                // Only play smoke effect if touching the ground
                if (my.sprite.player.body.blocked.down) {
                    this.walkVFX.start();
                }
            } else {
                // Set acceleration to 0 and have DRAG take over
                my.sprite.player.setAccelerationX(0);
                my.sprite.player.setDragX(this.DRAG);
                my.sprite.player.anims.play('idle');
                this.walkVFX.stop();
            }
    
            // player jump
            // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
            if(!my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('jump');
            }
            if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
                if (this.jumpboost){
                    my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY*1.5);
                }
                else {
                    my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                    this.jumpVFX.start();
                    this.jumpTick = 5;
                }
            }
    
            if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.scene.restart();
            }
        }
        // Button Interactions
        // Only onscreen while game is paused, so can't be in the unpaused code.
        this.buttonYes.on('pointerdown', () => {
            this.buttonYes.setPosition(-100, -100);
            this.buttonNo.setPosition(-100, -100);
            this.init_game();
        });
        this.buttonNo.on('pointerdown', () => {
            this.buttonYes.setPosition(-100, -100);
            this.buttonNo.setPosition(-100,-100);
            this.gameOver();
        });
        this.buttonRestart.on('pointerdown', () => {
            this.buttonRestart.setPosition(-100, -100);
            this.scene.restart();
        });
    }

    // Function for setting up the Level
    init_game(){
        this.lives = 2;
        // Text Displays

        my.sprite.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        return;
    }
    // Function for game overs
    // Probably doesn't work (due to using same code as End Game), 
    // but untestable due to lack of working means to lose lives
    gameOver(){
        this.pause = true;
        this.gameOverText.setX(this.cameras.main.worldView.x + 300);
        this.gameOverText.setDepth(10);
        this.gameOverText.visible = true;
        this.continueText.setX(this.cameras.main.worldView.x + 300);
        this.continueText.setDepth(10);
        this.coninueText.visible = true;
        this.yesText.setX(this.cameras.main.worldView.x + 200);
        this.yesText.setDepth(11);
        this.yesText.visible = true;
        this.buttonYes.setPosition(this.cameras.main.worldView.x + 200, 500);
        this.buttonYes.setDepth(10);
        this.buttonYes.setInteractive();
        this.noText.setX(this.cameras.main.worldView.x + 400);
        this.noText.setDepth(11);
        this.noText.visible = true;
        this.buttonNo.setPosition(this.cameras.main.worldView.x + 400, 500);
        this.buttonNo.setDepth(10);
        this.buttonNo.setInteractive();
    }
    // Function for completing the level
    // Button functions, but doesn't display?  Odd.
    winGame(){
        this.pause = true;
        this.youWonText.setX(this.cameras.main.worldView.x + 350);
        this.youWonText.setDepth(10);
        this.youWonText.visible = true;
        this.restartText.setX(this.cameras.main.worldView.x + 350);
        this.restartText.setDepth(12);
        this.restartText.visible = true;
        this.buttonRestart.setPosition(this.cameras.main.worldView.x + 350, 200);
        this.buttonRestart.setDepth(11);
        this.buttonRestart.setInteractive();
    }
    // Function for killing the player
    loseLife(){
        my.sprite.player.destroy();
        console.log("Killed Player");
        this.lives--;
        console.log("Lives remaining: "+this.lives);
        my.sprite.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        console.log("Player spawned at "+ my.sprite.player.x +", "+ my.sprite.player.x);
        this.resetCamera();
        return;
    }
    // Function for resetting the camera
    resetCamera(){
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        return;
    }
}