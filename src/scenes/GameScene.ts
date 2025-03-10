import Phaser from 'phaser';
import { SCENES, EVENTS } from '../utils/constants';
import Player from '../objects/Player';
import Platform from '../objects/Platform';
import Enemy from '../objects/Enemy';
import Spirit from '../objects/Spirit';
import LevelGenerator from '../systems/LevelGenerator';
import SaveSystem from '../systems/SaveSystem';
import { GAME_WIDTH, GAME_HEIGHT, ElementType } from '../config';
import { calculateElementalMultiplier } from '../utils/helpers';

export default class GameScene extends Phaser.Scene {
    private player: Player | null = null;
    private platforms: Platform[] = [];
    private enemies: Enemy[] = [];
    private spirits: Spirit[] = [];
    private levelGenerator: LevelGenerator | null = null;
    private level: number = 1;
    private score: number = 0;
    private bgMusic: Phaser.Sound.BaseSound | null = null;

    constructor() {
        super({ key: SCENES.GAME });
    }

    init(data: any): void {
        this.level = data.level || 1;
        this.score = data.score || 0;
    }

    create(): void {
        this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
        this.createBackground();
        this.levelGenerator = new LevelGenerator(this, GAME_WIDTH * 2, GAME_HEIGHT);
        const { platforms, enemies, spirits } = this.levelGenerator.generateLevel();
        this.platforms = platforms;
        this.enemies = enemies;
        this.spirits = spirits;

        this.createPlayer(data);
        this.setupCollision();
        this.setupCamera();

        this.scene.launch(SCENES.UI);
        this.bgMusic = this.sound.add('music-game', { volume: 0.3, loop: true });
        this.bgMusic.play();

        this.setupEvents();
        this.registry.set('level', this.level);
        this.registry.set('score', this.score);
    }

    update(time: number, delta: number): void {
        if (this.player) {
            this.player.update(time, delta);
            if (this.player.x > GAME_WIDTH * 1.9) this.completeLevel();
            if (this.player.y > GAME_HEIGHT + 100) this.respawnPlayer();
        }
        this.enemies.forEach(enemy => enemy.update(time, delta));
        this.spirits.forEach(spirit => spirit.update(time, delta));
    }

    private createBackground(): void {
        const bg = this.add.tileSprite(0, 0, GAME_WIDTH * 2, GAME_HEIGHT, 'background');
        bg.setOrigin(0, 0);
        bg.setScrollFactor(0.1);
    }

    private createPlayer(data: any): void {
        this.player = new Player(this, 100, GAME_HEIGHT - 200);
        if (data) {
            this.player.setHealth(data.health || PLAYER_CONFIG.MAX_HEALTH);
            this.player.setEnergy(data.energy || PLAYER_CONFIG.MAX_ENERGY);
            this.player.changeElement(data.currentElement || ElementType.SPIRIT);
        }
    }

    private setupCollision(): void {
        if (!this.player) return;
        this.physics.add.collider(this.player, this.platforms, this.handlePlayerPlatformCollision, this.checkPlayerPlatformCollision, this);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
        this.physics.add.overlap(this.player, this.spirits, this.handlePlayerSpiritCollision, undefined, this);
        this.physics.add.overlap(this.player.getProjectiles(), this.enemies, this.handleProjectileEnemyCollision, undefined, this);
        this.physics.add.collider(this.player.getProjectiles(), this.platforms, this.handleProjectilePlatformCollision, this.checkProjectilePlatformCollision, this);
    }

    private handlePlayerPlatformCollision(player: Player, platform: Platform): void {}

    private checkPlayerPlatformCollision(player: any, platform: any): boolean {
        const platformObj = platform as Platform;
        if (platformObj.getCanPassThrough()) return player.body.velocity.y <= 0 || player.body.y + player.body.height <= platform.body.y + 5;
        return true;
    }

    private handlePlayerEnemyCollision(player: any, enemy: any): void {
        const playerObj = player as Player;
        const enemyObj = enemy as Enemy;
        playerObj.takeDamage(enemyObj.getDamage());
    }

    private handlePlayerSpiritCollision(player: any, spirit: any): void {
        const playerObj = player as Player;
        const spiritObj = spirit as Spirit;
        if (!spiritObj.isCollected()) {
            spiritObj.collect();
            playerObj.changeElement(spiritObj.getElement());
            playerObj.heal(10);
            this.score += 50;
            this.registry.set('score', this.score);
            this.game.events.emit(EVENTS.SCORE_CHANGE, this.score);
        }
    }

    private handleProjectileEnemyCollision(projectile: any, enemy: any): void {
        const projectileObj = projectile as Projectile;
        const enemyObj = enemy as Enemy;
        const multiplier = calculateElementalMultiplier(projectileObj.getElement(), enemyObj.getElement());
        const damage = projectileObj.getDamage() * multiplier;
        enemyObj.takeDamage(damage, projectileObj.getElement());
        projectileObj.destroy();
        if (enemyObj.health <= 0) {
            this.score += 100;
            this.registry.set('score', this.score);
            this.game.events.emit(EVENTS.SCORE_CHANGE, this.score);
        }
    }

    private handleProjectilePlatformCollision(projectile: any, platform: any): void {
        const projectileObj = projectile as Projectile;
        projectileObj.destroy();
    }

    private checkProjectilePlatformCollision(projectile: any, platform: any): boolean {
        return !(platform as Platform).getCanPassThrough();
    }

    private setupCamera(): void {
        this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    private setupEvents(): void {
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.launch(SCENES.PAUSE);
            this.scene.pause();
        });
        this.events.on(EVENTS.GAME_OVER, () => {
            if (this.bgMusic) this.bgMusic.stop();
            this.scene.stop(SCENES.UI);
            this.scene.start(SCENES.GAME_OVER, { score: this.score });
        });
    }

    private completeLevel(): void {
        this.sound.play('level-complete');
        if (this.bgMusic) this.bgMusic.stop();

        const saveData = SaveSystem.createSaveData(
            this.level + 1,
            this.score,
            this.player!.getHealth(),
            this.player!.getEnergy(),
            this.player!.getCurrentElement(),
            [ElementType.SPIRIT, ElementType.FIRE, ElementType.WATER, ElementType.EARTH, ElementType.AIR] // All elements unlocked for simplicity
        );
        SaveSystem.saveGame(saveData);

        this.scene.stop(SCENES.UI);
        this.scene.start(SCENES.GAME, { level: this.level + 1, score: this.score });
    }

    private respawnPlayer(): void {
        this.player!.setPosition(100, GAME_HEIGHT - 200);
        this.player!.setVelocity(0, 0);
        this.player!.heal(PLAYER_CONFIG.MAX_HEALTH); // Full heal on respawn for simplicity
    }
}