import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, ElementType } from "../config";
import { SCENES, EVENTS } from "../utils/constants";
import Player from "../objects/Player";
import Platform from "../objects/Platform";
import Spirit from "../objects/Spirit";
import LevelGenerator from "../systems/LevelGenerator";

export default class TutorialScene extends Phaser.Scene {
  private player!: Player;
  private platforms: Platform[] = [];
  private spirits: Spirit[] = [];
  private tutorialTexts: Phaser.GameObjects.Text[] = [];
  private controlsPanel!: Phaser.GameObjects.Container;
  private nextButton!: Phaser.GameObjects.Text;
  private currentStep: number = 0;
  private tutorialSteps: string[] = [
    "Welcome to Spirit Shift! Use W, A, D or arrow keys to move.",
    "Press W or SPACE to jump. Try jumping onto platforms.",
    "You can collect different elemental spirits to gain their powers.",
    "Collect the Fire Spirit ahead and use its abilities.",
    "Each element has strengths and weaknesses against enemies.",
    "Fire beats Air, Water beats Fire, Earth beats Water, Air beats Earth.",
    "Press left mouse button or F key to shoot projectiles.",
    "Your energy bar (bottom left) depletes when shooting.",
    "Different spirits regenerate energy at different rates.",
    "When you're ready, move right to complete the tutorial.",
  ];
  private levelGenerator!: LevelGenerator;
  private bgMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: SCENES.TUTORIAL });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.createBackground();
    this.levelGenerator = new LevelGenerator(this, GAME_WIDTH * 2, GAME_HEIGHT);
    this.generateLevel();
    this.createPlayer();
    this.setupCollision();
    this.setupCamera();
    this.createTutorialUI();

    this.bgMusic = this.sound.add("music-game", { volume: 0.3, loop: true });
    this.bgMusic.play();

    this.scene.launch(SCENES.UI);
    this.registry.set("level", 1);
    this.registry.set("score", 0);
    this.registry.set("isTutorialLevel", true);
  }

  update(time: number, delta: number): void {
    if (this.player) this.player.update(time, delta);
    this.spirits.forEach((spirit) => spirit.update(time, delta));
    this.updateTutorialStep();
    if (this.player.x > GAME_WIDTH * 1.9) this.completeLevel();
    if (this.player.y > GAME_HEIGHT + 100) this.respawnPlayer();
  }

  private createBackground(): void {
    const bg = this.add.tileSprite(
      0,
      0,
      GAME_WIDTH * 2,
      GAME_HEIGHT,
      "background"
    );
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0.1);
    for (let i = 0; i < 100; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH * 2),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 1)
      );
      star.setScrollFactor(0.2);
    }
  }

  private generateLevel(): void {
    const { platforms, enemies, spirits } =
      this.levelGenerator.generateTutorialLevel();
    this.platforms = platforms;
    this.spirits = spirits;
  }

  private createPlayer(): void {
    this.player = new Player(this, 100, GAME_HEIGHT - 200);
  }

  private setupCollision(): void {
    this.physics.add.collider(
      this.player,
      this.platforms,
      (obj1, obj2) => {
        this.handlePlayerPlatformCollision(obj1 as Player, obj2 as Platform);
      },
      (obj1, obj2) => {
        return this.checkPlayerPlatformCollision(
          obj1 as Player,
          obj2 as Platform
        );
      },
      this
    );
    this.physics.add.overlap(
      this.player,
      this.spirits,
      this.handlePlayerSpiritCollision,
      undefined,
      this
    );
    this.physics.add.collider(
      this.player.getProjectiles(),
      this.platforms,
      this.handleProjectilePlatformCollision,
      this.checkProjectilePlatformCollision,
      this
    );
  }

  private handlePlayerPlatformCollision(
    player: Player,
    platform: Platform
  ): void {}

  private checkPlayerPlatformCollision(player: any, platform: any): boolean {
    const platformObj = platform as Platform;
    if (platformObj.getCanPassThrough())
      return (
        player.body.velocity.y <= 0 ||
        player.body.y + player.body.height <= platform.body.y + 5
      );
    return true;
  }

  private handlePlayerSpiritCollision(player: any, spirit: any): void {
    const playerObj = player as Player;
    const spiritObj = spirit as Spirit;
    if (spiritObj.isCollected()) return;
    spiritObj.collect();
    playerObj.changeElement(spiritObj.getElement());
    playerObj.heal(10);
    playerObj.addEnergy(30);
    if (spiritObj.getElement() === ElementType.FIRE) {
      this.currentStep = Math.max(this.currentStep, 4);
      this.updateTutorialText();
    }
  }

  private handleProjectilePlatformCollision(
    projectile: any,
    platform: any
  ): void {
    const projectileObj = projectile as Phaser.Physics.Arcade.Sprite;
    projectileObj.destroy();
  }

  private checkProjectilePlatformCollision(
    projectile: any,
    platform: any
  ): boolean {
    return !(platform as Platform).getCanPassThrough();
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.followOffset.set(-200, 0);
  }

  private createTutorialUI(): void {
    const panel = this.add.rectangle(
      GAME_WIDTH / 2,
      100,
      GAME_WIDTH - 200,
      100,
      0x000000,
      0.7
    );
    panel.setScrollFactor(0);
    panel.setStrokeStyle(2, 0xffffff, 0.8);

    const tutorialText = this.add.text(
      GAME_WIDTH / 2,
      100,
      this.tutorialSteps[0],
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: GAME_WIDTH - 240 },
      }
    );
    tutorialText.setOrigin(0.5, 0.5);
    tutorialText.setScrollFactor(0);
    this.tutorialTexts.push(tutorialText);

    this.nextButton = this.add.text(GAME_WIDTH / 2 + 350, 100, "Next >", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 10, y: 5 },
    });
    this.nextButton.setOrigin(0.5, 0.5);
    this.nextButton.setScrollFactor(0);
    this.nextButton.setInteractive({ useHandCursor: true });
    this.nextButton.on("pointerover", () =>
      this.nextButton.setStyle({ color: "#ffff00" })
    );
    this.nextButton.on("pointerout", () =>
      this.nextButton.setStyle({ color: "#ffffff" })
    );
    this.nextButton.on("pointerup", () => {
      this.currentStep++;
      if (this.currentStep >= this.tutorialSteps.length) this.currentStep = 0;
      this.updateTutorialText();
      this.sound.play("collect", { volume: 0.3 });
    });

    this.createControlsPanel();
  }

  private createControlsPanel(): void {
    this.controlsPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 100);
    this.controlsPanel.setScrollFactor(0);

    const controlsBg = this.add.rectangle(0, 0, 400, 120, 0x000000, 0.6);
    controlsBg.setStrokeStyle(2, 0xffffff, 0.5);
    this.controlsPanel.add(controlsBg);

    const controlsTitle = this.add.text(0, -50, "CONTROLS", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    controlsTitle.setOrigin(0.5, 0.5);
    this.controlsPanel.add(controlsTitle);

    const bindings = [
      { key: "W / ↑ / SPACE", action: "Jump" },
      { key: "A / ←", action: "Move Left" },
      { key: "D / →", action: "Move Right" },
      { key: "F / Left Click", action: "Shoot" },
      { key: "1-5", action: "Change Element" },
    ];

    let yPos = -30;
    for (const binding of bindings) {
      const keyText = this.add.text(-180, yPos, binding.key, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffff00",
      });
      keyText.setOrigin(0, 0.5);
      this.controlsPanel.add(keyText);

      const actionText = this.add.text(0, yPos, binding.action, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      });
      actionText.setOrigin(0, 0.5);
      this.controlsPanel.add(actionText);

      yPos += 25;
    }
  }

  private updateTutorialStep(): void {
    if (this.player.x > 300 && this.currentStep < 1) {
      this.currentStep = 1;
      this.updateTutorialText();
    } else if (this.player.x > 600 && this.currentStep < 2) {
      this.currentStep = 2;
      this.updateTutorialText();
    }
  }

  private updateTutorialText(): void {
    if (this.tutorialTexts.length > 0)
      this.tutorialTexts[0].setText(this.tutorialSteps[this.currentStep]);
  }

  private respawnPlayer(): void {
    this.player.setPosition(100, GAME_HEIGHT - 200);
    this.player.setVelocity(0, 0);
  }

  private completeLevel(): void {
    this.sound.play("level-complete");
    if (this.bgMusic && this.bgMusic.isPlaying) this.bgMusic.stop();

    this.registry.set("level", 2);
    this.registry.set("score", 0);
    this.registry.set("currentElement", this.player.getCurrentElement());

    this.scene.start(SCENES.GAME, { level: 2, score: 0 });
  }
}
