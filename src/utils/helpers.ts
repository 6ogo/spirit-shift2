// src/utils/helpers.ts
import { ElementType, ELEMENT_STRENGTHS, ELEMENT_WEAKNESSES } from '../config';

/**
 * Calculate damage multiplier based on attacking and defending elements
 */
export const calculateElementalMultiplier = (
  attackElement: ElementType,
  defendElement: ElementType
): number => {
  // Same element: reduced damage
  if (attackElement === defendElement) {
    return 0.25;
  }
  
  // Strong against: double damage
  if (ELEMENT_STRENGTHS[attackElement] === defendElement) {
    return 2;
  }
  
  // Weak against: half damage
  if (ELEMENT_WEAKNESSES[attackElement] === defendElement) {
    return 0.5;
  }
  
  // Default: normal damage
  return 1;
};

/**
 * Generate a pseudo-random number based on a seed
 */
export const seedRandom = (seed: number, min: number, max: number): number => {
  const newSeed = (seed * 9301 + 49297) % 233280;
  const random = newSeed / 233280;
  return min + random * (max - min);
};

/**
 * Check if two rectangles overlap
 */
export const checkOverlap = (
  x1: number, y1: number, width1: number, height1: number,
  x2: number, y2: number, width2: number, height2: number
): boolean => {
  return (
    x1 < x2 + width2 &&
    x1 + width1 > x2 &&
    y1 < y2 + height2 &&
    y1 + height1 > y2
  );
};

/**
 * Create a particle effect
 */
export const createParticles = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  count: number = 10,
  speed: number = 100,
  scale: number = 1,
  lifespan: number = 1000
): Phaser.GameObjects.Particles.ParticleEmitter => {
  const particles = scene.add.particles(x, y, 'particle', {
    speed: speed,
    scale: { start: scale, end: 0 },
    blendMode: 'ADD',
    lifespan: lifespan,
    tint: color
  });
  
  particles.createEmitter({
    alpha: { start: 1, end: 0 },
    scale: { start: scale, end: 0 },
    speed: { min: -speed, max: speed },
    lifespan: lifespan,
    quantity: count,
    frequency: -1 // All particles emitted at once
  });
  
  return particles;
};

/**
 * Create a save data object
 */
export const createSaveData = (
  level: number,
  score: number,
  health: number,
  energy: number,
  currentElement: ElementType,
  unlockedElements: ElementType[]
): object => {
  return {
    level,
    score,
    health,
    energy,
    currentElement,
    unlockedElements,
    timestamp: Date.now()
  };
};

/**
 * Save game data to local storage
 */
export const saveGame = (data: object, key: string): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
};

/**
 * Load game data from local storage
 */
export const loadGame = (key: string): any => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
};