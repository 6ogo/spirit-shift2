import { ElementType } from '../config';
import Platform from '../objects/Platform';
import Enemy from '../objects/Enemy';
import Spirit from '../objects/Spirit';
import { seedRandom } from '../utils/helpers';

export default class LevelGenerator {
  private scene: Phaser.Scene;
  private levelWidth: number;
  private levelHeight: number;
  private level: number;
  private seed: number;
  
  constructor(scene: Phaser.Scene, levelWidth: number, levelHeight: number) {
    this.scene = scene;
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;
    this.level = scene.registry.get('level') || 1;
    this.seed = scene.registry.get('seed') || Date.now();
  }
  
  /**
   * Generate a tutorial level with just a floor and a few platforms
   */
  public generateTutorialLevel(): {
    platforms: Platform[],
    enemies: Enemy[],
    spirits: Spirit[]
  } {
    // Create floor
    const floor = new Platform(
      this.scene,
      this.levelWidth / 2,
      this.levelHeight - 50,
      this.levelWidth,
      50,
      ElementType.SPIRIT,
      false
    );
    
    // Create a few tutorial platforms
    const platforms: Platform[] = [floor];
    
    // Add some basic platforms
    platforms.push(
      new Platform(
        this.scene,
        300,
        this.levelHeight - 150,
        200,
        20,
        ElementType.SPIRIT,
        true
      )
    );
    
    platforms.push(
      new Platform(
        this.scene,
        600,
        this.levelHeight - 250,
        150,
        20,
        ElementType.SPIRIT,
        true
      )
    );
    
    // Add elemental spirits for collection
    const spirits: Spirit[] = [];
    
    // Position spirits on platforms
    spirits.push(
      new Spirit(this.scene, 300, this.levelHeight - 180, ElementType.FIRE)
    );
    
    spirits.push(
      new Spirit(this.scene, 600, this.levelHeight - 280, ElementType.WATER)
    );
    
    spirits.push(
      new Spirit(this.scene, 900, this.levelHeight - 100, ElementType.EARTH)
    );
    
    spirits.push(
      new Spirit(this.scene, 1200, this.levelHeight - 100, ElementType.AIR)
    );
    
    // No enemies in tutorial
    const enemies: Enemy[] = [];
    
    return { platforms, enemies, spirits };
  }
  
  /**
   * Generate a level with platforms, enemies, and collectibles
   */
  public generateLevel(): {
    platforms: Platform[],
    enemies: Enemy[],
    spirits: Spirit[]
  } {
    const platforms: Platform[] = [];
    const enemies: Enemy[] = [];
    const spirits: Spirit[] = [];
    
    // Create floor
    const floor = new Platform(
      this.scene,
      this.levelWidth / 2,
      this.levelHeight - 50,
      this.levelWidth,
      50,
      ElementType.SPIRIT,
      false
    );
    
    platforms.push(floor);
    
    // Add platforms
    this.addPlatforms(platforms);
    
    // Add enemies to some platforms
    this.addEnemies(platforms, enemies);
    
    // Add spirits to collect
    this.addSpirits(platforms, spirits);
    
    return { platforms, enemies, spirits };
  }
  
  /**
   * Add platforms to the level based on level number
   */
  private addPlatforms(platforms: Platform[]): void {
    // Determine number of platforms based on level
    const platformCount = 5 + Math.min(this.level * 3, 20);
    
    // Set vertical bounds for platform placement
    const minY = 150;
    const maxY = this.levelHeight - 150;
    
    // Determine width range based on level (smaller platforms at higher levels)
    const minWidth = Math.max(80, 200 - this.level * 5);
    const maxWidth = Math.max(120, 300 - this.level * 10);
    
    // Elements to choose from
    const elements: ElementType[] = [
      ElementType.SPIRIT,
      ElementType.FIRE,
      ElementType.WATER,
      ElementType.EARTH,
      ElementType.AIR
    ];
    
    // Create platforms in segments across the level
    const segmentWidth = this.levelWidth / platformCount;
    
    for (let i = 0; i < platformCount; i++) {
      const segmentStart = segmentWidth * i;
      
      // Use seeded random for deterministic level generation
      const xPos = segmentStart + seedRandom(this.seed + i, 20, segmentWidth - 100);
      const yPos = seedRandom(this.seed + i * 2, minY, maxY);
      const width = seedRandom(this.seed + i * 3, minWidth, maxWidth);
      
      // Choose element based on level
      let elementChoice = ElementType.SPIRIT;
      
      // Higher chance of elemental platforms at higher levels
      const useElementalPlatform = seedRandom(this.seed + i * 4, 0, 10) < (2 + this.level * 0.5);
      
      if (useElementalPlatform) {
        const elementIndex = Math.floor(seedRandom(this.seed + i * 5, 0, elements.length));
        elementChoice = elements[elementIndex];
      }
      
      // Determine if the platform should be pass-through
      const passThrough = seedRandom(this.seed + i * 6, 0, 10) < (7 + this.level * 0.5);
      
      // Check for overlaps with existing platforms
      const overlaps = platforms.some(p => {
        // Only check y overlap for platforms that are close in x
        if (Math.abs(xPos - p.x) > p.getPlatformWidth() + width) {
          return false;
        }
        
        return Math.abs(yPos - p.y) < 40;
      });
      
      // Add platform if no overlaps
      if (!overlaps) {
        platforms.push(
          new Platform(
            this.scene,
            xPos,
            yPos,
            width,
            20,
            elementChoice,
            passThrough
          )
        );
      }
    }
  }
  
  /**
   * Add enemies to the level based on level number
   */
  private addEnemies(platforms: Platform[], enemies: Enemy[]): void {
    // Skip the first few platforms to give player space
    const availablePlatforms = platforms.slice(1);
    
    // Determine number of enemies based on level
    const enemyCount = Math.min(this.level * 2, 15);
    
    // Elements to choose from
    const elements: ElementType[] = [
      ElementType.SPIRIT,
      ElementType.FIRE,
      ElementType.WATER,
      ElementType.EARTH,
      ElementType.AIR
    ];
    
    // Place enemies on platforms
    for (let i = 0; i < enemyCount; i++) {
      if (availablePlatforms.length === 0) break;
      
      // Choose a platform randomly
      const platformIndex = Math.floor(seedRandom(this.seed + i * 10, 0, availablePlatforms.length));
      const platform = availablePlatforms[platformIndex];
      
      // Choose position on platform
      const xPos = platform.x + seedRandom(this.seed + i * 11, -platform.getPlatformWidth() / 3, platform.getPlatformWidth() / 3);
      const yPos = platform.y - 20; // Place on top of platform
      
      // Choose element
      const elementIndex = Math.floor(seedRandom(this.seed + i * 12, 0, elements.length));
      const element = elements[elementIndex];
      
      // Create enemy
      enemies.push(
        new Enemy(
          this.scene,
          xPos,
          yPos,
          element,
          i
        )
      );
      
      // Remove platform from available ones to prevent crowding
      availablePlatforms.splice(platformIndex, 1);
    }
  }
  
  /**
   * Add spirit collectibles to the level
   */
  private addSpirits(platforms: Platform[], spirits: Spirit[]): void {
    // Add a few spirit collectibles
    const spiritCount = Math.floor(2 + this.level * 0.5);
    
    // Elements to choose from
    const elements: ElementType[] = [
      ElementType.SPIRIT,
      ElementType.FIRE,
      ElementType.WATER,
      ElementType.EARTH,
      ElementType.AIR
    ];
    
    // Skip the first few platforms to give player space
    const availablePlatforms = [...platforms.slice(2)];
    
    // Place spirits on platforms
    for (let i = 0; i < spiritCount; i++) {
      if (availablePlatforms.length === 0) break;
      
      // Choose a platform randomly
      const platformIndex = Math.floor(seedRandom(this.seed + i * 20, 0, availablePlatforms.length));
      const platform = availablePlatforms[platformIndex];
      
      // Choose position above platform
      const xPos = platform.x + seedRandom(this.seed + i * 21, -platform.getPlatformWidth() / 3, platform.getPlatformWidth() / 3);
      const yPos = platform.y - 50; // Float above platform
      
      // Choose element
      const elementIndex = Math.floor(seedRandom(this.seed + i * 22, 0, elements.length));
      const element = elements[elementIndex];
      
      // Create spirit
      spirits.push(
        new Spirit(
          this.scene,
          xPos,
          yPos,
          element
        )
      );
      
      // Remove platform from available ones to prevent crowding
      availablePlatforms.splice(platformIndex, 1);
    }
  }
  
  /**
   * Set new level and seed for next generation
   */
  public setLevel(level: number, seed?: number): void {
    this.level = level;
    
    if (seed) {
      this.seed = seed;
    } else {
      // Generate a new seed if none provided
      this.seed = Date.now();
    }
    
    // Update registry values
    this.scene.registry.set('level', this.level);
    this.scene.registry.set('seed', this.seed);
  }
}