// generateEnhancedPlaceholderAssets.js
// Enhanced version to generate all game assets including biome-specific and boss assets
// Run with Node.js: node generateEnhancedPlaceholderAssets.js

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Colors for elements
const ELEMENT_COLORS = {
  SPIRIT: '#AAAAAA',
  FIRE: '#FF6600',
  WATER: '#66CCFF',
  EARTH: '#66AA66',
  AIR: '#CCCCFF'
};

// Colors for biomes
const BIOME_COLORS = {
  NEUTRAL: '#444455',
  FIRE: '#883322',
  WATER: '#224466',
  EARTH: '#336633',
  AIR: '#555588',
  SPIRIT: '#442255'
};

// Base directory for assets
const assetsDir = 'public/assets';

// Create directories if they don't exist
const directories = [
  'sprites',
  'backgrounds',
  'ui',
  'audio',
  'fonts',
  'effects'
];

// Create biome-specific subdirectories
const biomeSubdirs = [
  'fire',
  'water',
  'earth',
  'air',
  'spirit'
];

// Create base assets directory
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create main subdirectories
directories.forEach(dir => {
  const dirPath = path.join(assetsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Create biome subdirectories inside backgrounds
  if (dir === 'backgrounds') {
    biomeSubdirs.forEach(biome => {
      const biomePath = path.join(dirPath, biome);
      if (!fs.existsSync(biomePath)) {
        fs.mkdirSync(biomePath, { recursive: true });
      }
    });
  }
});

// Function to create a placeholder image
function createPlaceholderImage(filePath, width, height, color, text = null) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Add border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, width - 4, height - 4);
  
  // Add text if provided
  if (text) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Created: ${filePath}`);
}

// Function to create a sprite sheet
function createSpriteSheet(filePath, frameWidth, frameHeight, frames, rowFrames, colors, labels = null) {
  const rows = Math.ceil(frames / rowFrames);
  const canvas = createCanvas(frameWidth * rowFrames, frameHeight * rows);
  const ctx = canvas.getContext('2d');
  
  // Fill background with transparent color
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, frameWidth * rowFrames, frameHeight * rows);
  
  // Draw frames
  for (let i = 0; i < frames; i++) {
    // Calculate frame position
    const row = Math.floor(i / rowFrames);
    const col = i % rowFrames;
    const x = col * frameWidth;
    const y = row * frameHeight;
    
    // Get color for this frame
    let color = colors;
    if (Array.isArray(colors)) {
      const colorIndex = Math.floor(i / (frames / colors.length));
      color = colors[Math.min(colorIndex, colors.length - 1)];
    }
    
    // Draw frame background
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, frameWidth - 4, frameHeight - 4);
    
    // Draw frame border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, frameWidth - 4, frameHeight - 4);
    
    // Add frame number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i}`, x + frameWidth / 2, y + frameHeight / 2 - 10);
    
    // Add label if provided
    if (labels && labels[i]) {
      ctx.font = 'bold 10px Arial';
      ctx.fillText(labels[i], x + frameWidth / 2, y + frameHeight / 2 + 10);
    }
    else if (labels && labels.default) {
      ctx.font = 'bold 10px Arial';
      ctx.fillText(labels.default, x + frameWidth / 2, y + frameHeight / 2 + 10);
    }
  }
  
  // Save the sprite sheet
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Created sprite sheet: ${filePath}`);
}

// Function to create a background with biome-specific elements
function createBiomeBackground(biomeName, width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Get biome color
  const biomeColor = BIOME_COLORS[biomeName] || BIOME_COLORS.NEUTRAL;
  
  // Fill background
  const biomeGradient = ctx.createLinearGradient(0, 0, 0, height);
  biomeGradient.addColorStop(0, biomeColor);
  biomeGradient.addColorStop(1, '#111122');
  ctx.fillStyle = biomeGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add stars for all biomes
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * (height / 2);
    const size = 1 + Math.random() * 2;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add biome-specific elements
  switch (biomeName) {
    case 'FIRE':
      // Add volcanoes and lava
      for (let i = 0; i < 3; i++) {
        const mountainX = (i + 0.5) * (width / 3);
        const mountainHeight = 150 + Math.random() * 100;
        
        // Draw mountain
        ctx.fillStyle = '#552222';
        ctx.beginPath();
        ctx.moveTo(mountainX - 100, height);
        ctx.lineTo(mountainX, height - mountainHeight);
        ctx.lineTo(mountainX + 100, height);
        ctx.fill();
        
        // Draw lava glow
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(mountainX - 30, height - mountainHeight + 40);
        ctx.lineTo(mountainX, height - mountainHeight + 20);
        ctx.lineTo(mountainX + 30, height - mountainHeight + 40);
        ctx.lineTo(mountainX + 20, height - mountainHeight + 100);
        ctx.lineTo(mountainX - 20, height - mountainHeight + 100);
        ctx.fill();
      }
      
      // Add lava pools at bottom
      for (let i = 0; i < 5; i++) {
        const poolX = Math.random() * width;
        const poolSize = 30 + Math.random() * 50;
        
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.ellipse(poolX, height - 20, poolSize, poolSize / 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case 'WATER':
      // Add underwater crystals and bubbles
      for (let i = 0; i < 15; i++) {
        const crystalX = Math.random() * width;
        const crystalY = height / 2 + Math.random() * (height / 2);
        const crystalSize = 10 + Math.random() * 30;
        
        // Draw crystal
        ctx.fillStyle = '#66CCFF';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(crystalX, crystalY - crystalSize);
        ctx.lineTo(crystalX + crystalSize / 2, crystalY);
        ctx.lineTo(crystalX, crystalY + crystalSize / 2);
        ctx.lineTo(crystalX - crystalSize / 2, crystalY);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      // Add bubbles
      for (let i = 0; i < 50; i++) {
        const bubbleX = Math.random() * width;
        const bubbleY = Math.random() * height;
        const bubbleSize = 2 + Math.random() * 8;
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      // Add water surface light rays
      ctx.fillStyle = '#66CCFF';
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 10; i++) {
        const rayX = Math.random() * width;
        ctx.beginPath();
        ctx.moveTo(rayX, 0);
        ctx.lineTo(rayX - 50, height);
        ctx.lineTo(rayX + 50, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
      
    case 'EARTH':
      // Add trees and foliage
      for (let i = 0; i < 10; i++) {
        const treeX = Math.random() * width;
        const treeHeight = 100 + Math.random() * 150;
        
        // Draw trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(treeX - 10, height - treeHeight, 20, treeHeight);
        
        // Draw foliage
        ctx.fillStyle = '#66AA66';
        ctx.beginPath();
        ctx.arc(treeX, height - treeHeight, 50, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add grass
      ctx.fillStyle = '#66AA66';
      for (let x = 0; x < width; x += 10) {
        const grassHeight = 5 + Math.random() * 15;
        ctx.fillRect(x, height - grassHeight, 5, grassHeight);
      }
      
      // Add mushrooms
      for (let i = 0; i < 15; i++) {
        const mushX = Math.random() * width;
        const mushSize = 5 + Math.random() * 15;
        
        ctx.fillStyle = '#FFAAAA';
        ctx.beginPath();
        ctx.arc(mushX, height - mushSize, mushSize, 0, Math.PI, true);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(mushX - 3, height - mushSize, 6, mushSize);
      }
      break;
      
    case 'AIR':
      // Add floating islands and clouds
      for (let i = 0; i < 8; i++) {
        const islandX = Math.random() * width;
        const islandY = 150 + Math.random() * (height - 300);
        const islandWidth = 50 + Math.random() * 100;
        const islandHeight = 20 + Math.random() * 40;
        
        // Draw island
        ctx.fillStyle = '#66AA66';
        ctx.beginPath();
        ctx.ellipse(islandX, islandY, islandWidth, islandHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw grass
        ctx.fillStyle = '#88CC88';
        ctx.beginPath();
        ctx.ellipse(islandX, islandY - islandHeight * 0.3, islandWidth, islandHeight * 0.7, 0, 0, Math.PI);
        ctx.fill();
        
        // Maybe add a tree
        if (Math.random() > 0.5) {
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(islandX - 5, islandY - islandHeight - 30, 10, 30);
          
          ctx.fillStyle = '#66AA66';
          ctx.beginPath();
          ctx.arc(islandX, islandY - islandHeight - 45, 25, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Add clouds
      for (let i = 0; i < 15; i++) {
        const cloudX = Math.random() * width;
        const cloudY = Math.random() * height;
        const cloudWidth = 30 + Math.random() * 70;
        const cloudHeight = 20 + Math.random() * 30;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        
        // Create cloud shape with multiple circles
        for (let j = 0; j < 5; j++) {
          const circleX = cloudX + (j - 2) * (cloudWidth / 5);
          const circleY = cloudY + Math.sin(j) * 10;
          const circleSize = 10 + Math.random() * 20;
          ctx.moveTo(circleX + circleSize, circleY);
          ctx.arc(circleX, circleY, circleSize, 0, Math.PI * 2);
        }
        
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      break;
      
    case 'SPIRIT':
      // Add void elements and distortions
      ctx.globalAlpha = 0.5;
      
      // Add swirls and vortexes
      for (let i = 0; i < 5; i++) {
        const vortexX = Math.random() * width;
        const vortexY = Math.random() * height;
        const vortexSize = 50 + Math.random() * 100;
        
        ctx.strokeStyle = '#CCAAFF';
        ctx.lineWidth = 2;
        
        for (let j = 0; j < 5; j++) {
          const radius = (j + 1) * (vortexSize / 5);
          ctx.beginPath();
          ctx.arc(vortexX, vortexY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      // Add floating energy orbs
      for (let i = 0; i < 20; i++) {
        const orbX = Math.random() * width;
        const orbY = Math.random() * height;
        const orbSize = 5 + Math.random() * 15;
        
        const gradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbSize);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#AA66CC');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add ghostly patterns
      ctx.strokeStyle = '#AAAAAA';
      ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        let currentX = startX;
        let currentY = startY;
        
        for (let j = 0; j < 5; j++) {
          currentX += -30 + Math.random() * 60;
          currentY += -30 + Math.random() * 60;
          ctx.lineTo(currentX, currentY);
        }
        
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;
      break;
      
    default:
      // Default neutral background with just some terrain
      ctx.fillStyle = '#555555';
      
      // Draw hills
      for (let i = 0; i < 5; i++) {
        const hillX = (i + 0.5) * (width / 5);
        const hillHeight = 50 + Math.random() * 100;
        
        ctx.beginPath();
        ctx.moveTo(hillX - 100, height);
        ctx.quadraticCurveTo(hillX, height - hillHeight, hillX + 100, height);
        ctx.fill();
      }
      
      // Add some rocks
      for (let i = 0; i < 20; i++) {
        const rockX = Math.random() * width;
        const rockY = height - 30 - Math.random() * 50;
        const rockSize = 5 + Math.random() * 15;
        
        ctx.fillStyle = '#777777';
        ctx.beginPath();
        ctx.arc(rockX, rockY, rockSize, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }
  
  // Add vignette effect
  const gradient = ctx.createRadialGradient(width/2, height/2, Math.max(width, height) * 0.3, width/2, height/2, Math.max(width, height) * 0.7);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Save the background
  const buffer = canvas.toBuffer('image/png');
  const fileName = biomeName.toLowerCase();
  fs.writeFileSync(path.join(assetsDir, 'backgrounds', `background-${fileName}.png`), buffer);
  
  console.log(`Created biome background: background-${fileName}.png`);
  
  // Create biome element too (mountan, crystal, etc.)
  createBiomeElement(biomeName, width, height);
}

// Create biome-specific decorative element
function createBiomeElement(biomeName, width, height) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  // Fill with transparent background
  ctx.clearRect(0, 0, 200, 200);
  
  // Draw biome-specific element
  switch (biomeName) {
    case 'FIRE':
      // Draw a mountain/volcano
      ctx.fillStyle = '#883322';
      ctx.beginPath();
      ctx.moveTo(20, 200);
      ctx.lineTo(100, 30);
      ctx.lineTo(180, 200);
      ctx.fill();
      
      // Draw lava
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.moveTo(70, 80);
      ctx.lineTo(100, 50);
      ctx.lineTo(130, 80);
      ctx.lineTo(120, 150);
      ctx.lineTo(80, 150);
      ctx.fill();
      break;
      
    case 'WATER':
      // Draw a crystal formation
      ctx.fillStyle = '#66CCFF';
      ctx.globalAlpha = 0.8;
      
      // Main crystal
      ctx.beginPath();
      ctx.moveTo(100, 20);
      ctx.lineTo(140, 100);
      ctx.lineTo(100, 180);
      ctx.lineTo(60, 100);
      ctx.closePath();
      ctx.fill();
      
      // Side crystals
      ctx.beginPath();
      ctx.moveTo(60, 60);
      ctx.lineTo(40, 120);
      ctx.lineTo(60, 180);
      ctx.lineTo(80, 120);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(140, 60);
      ctx.lineTo(160, 120);
      ctx.lineTo(140, 180);
      ctx.lineTo(120, 120);
      ctx.closePath();
      ctx.fill();
      
      // Highlights
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(100, 20);
      ctx.lineTo(110, 50);
      ctx.lineTo(100, 80);
      ctx.lineTo(90, 50);
      ctx.closePath();
      ctx.fill();
      
      ctx.globalAlpha = 1;
      break;
      
    case 'EARTH':
      // Draw a large tree
      // Trunk
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(80, 70, 40, 130);
      
      // Branches
      ctx.beginPath();
      ctx.moveTo(100, 70);
      ctx.lineTo(60, 100);
      ctx.lineTo(50, 90);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(100, 90);
      ctx.lineTo(150, 110);
      ctx.lineTo(160, 100);
      ctx.stroke();
      
      // Foliage
      ctx.fillStyle = '#66AA66';
      ctx.beginPath();
      ctx.arc(100, 40, 60, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(70, 70, 40, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(130, 70, 40, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'AIR':
      // Draw cloud formations
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.9;
      
      // Create cloud shape with multiple circles
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const x = 60 + i * 40;
          const y = 70 + j * 30;
          const size = 30 - Math.abs(i - 1) * 10 - Math.abs(j - 1) * 5;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.globalAlpha = 1;
      break;
      
    case 'SPIRIT':
      // Draw an energy vortex
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 80;
        
        const gradient = ctx.createLinearGradient(
          100 + Math.cos(angle) * radius, 100 + Math.sin(angle) * radius,
          100 - Math.cos(angle) * radius, 100 - Math.sin(angle) * radius
        );
        
        gradient.addColorStop(0, '#AA66CC');
        gradient.addColorStop(1, 'rgba(170, 102, 204, 0)');
        
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.lineTo(
          100 + Math.cos(angle) * radius,
          100 + Math.sin(angle) * radius
        );
        ctx.lineTo(
          100 + Math.cos(angle + 0.5) * radius * 0.7,
          100 + Math.sin(angle + 0.5) * radius * 0.7
        );
        ctx.closePath();
        ctx.fill();
      }
      
      // Add central glow
      const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 40);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(1, 'rgba(170, 102, 204, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(100, 100, 40, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    default:
      // Just a simple shape for neutral
      ctx.fillStyle = '#AAAAAA';
      ctx.beginPath();
      ctx.arc(100, 100, 70, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  // Save the element
  const buffer = canvas.toBuffer('image/png');
  const fileName = biomeName.toLowerCase();
  fs.writeFileSync(path.join(assetsDir, 'backgrounds', `${fileName}-element.png`), buffer);
  
  console.log(`Created biome element: ${fileName}-element.png`);
}

// Function to create a simple audio file (1 second of silence)
function createSilentAudio(filePath) {
  // Create a simple WAV file with silence
  const header = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // File size - 8
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6D, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // Chunk size
    0x01, 0x00,             // Format code (PCM)
    0x01, 0x00,             // Channels (mono)
    0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
    0x44, 0xAC, 0x00, 0x00, // Byte rate
    0x01, 0x00,             // Block align
    0x08, 0x00,             // Bits per sample
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00, // Data size (0 - no actual audio)
  ]);
  
  fs.writeFileSync(filePath, header);
  console.log(`Created silent audio: ${filePath}`);
}

// Create placeholder bitmap font files
function createBitmapFont() {
  const pngPath = path.join(assetsDir, 'fonts', 'pixel.png');
  const xmlPath = path.join(assetsDir, 'fonts', 'pixel.xml');
  
  // Create a simple font image (basic grid of characters)
  const charWidth = 8;
  const charHeight = 8;
  const charsPerRow = 16;
  const rows = 6;
  
  const canvas = createCanvas(charWidth * charsPerRow, charHeight * rows);
  const ctx = canvas.getContext('2d');
  
  // Fill with black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw character grid
  ctx.fillStyle = '#FFFFFF';
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < charsPerRow; col++) {
      const x = col * charWidth;
      const y = row * charHeight;
      
      // Draw a basic character shape (just a filled rectangle)
      ctx.fillRect(x + 1, y + 1, charWidth - 2, charHeight - 2);
      
      // Leave a "hole" in the middle to make it look like a character
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 3, y + 3, 2, 2);
      ctx.fillStyle = '#FFFFFF';
    }
  }
  
  // Save the font image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(pngPath, buffer);
  
  // Create a basic XML file for the font
  const xmlContent = `<?xml version="1.0"?>
<font>
  <info face="Pixel Font" size="8" bold="0" italic="0" charset="" unicode="1" stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="1,1" outline="0"/>
  <common lineHeight="8" base="7" scaleW="128" scaleH="48" pages="1" packed="0" alphaChnl="1" redChnl="0" greenChnl="0" blueChnl="0"/>
  <pages>
    <page id="0" file="pixel.png"/>
  </pages>
  <chars count="95">
    <!-- Basic character definitions for ASCII 32-126 -->
    <char id="32" x="0" y="0" width="8" height="8" xoffset="0" yoffset="0" xadvance="8" page="0" chnl="15" />
    <!-- More characters would be defined here... -->
  </chars>
</font>`;
  
  fs.writeFileSync(xmlPath, xmlContent);
  
  console.log(`Created bitmap font: ${pngPath} and ${xmlPath}`);
}

// Function to create effect animation sprite sheet
function createEffectSpritesheet(name, frameWidth, frameHeight, frames, color, extraEffects = false) {
  const canvas = createCanvas(frameWidth * frames, frameHeight);
  const ctx = canvas.getContext('2d');
  
  // Fill background with transparent
  ctx.clearRect(0, 0, frameWidth * frames, frameHeight);
  
  // Draw each frame
  for (let i = 0; i < frames; i++) {
    const x = i * frameWidth;
    const centerX = x + frameWidth / 2;
    const centerY = frameHeight / 2;
    
    // Calculate effect size based on frame
    let size;
    if (i < frames / 2) {
      // Growing phase
      size = (i + 1) / (frames / 2) * (frameWidth / 2) * 0.8;
    } else {
      // Fading phase
      size = (1 - (i - frames / 2) / (frames / 2)) * (frameWidth / 2) * 0.8;
    }
    
    // Draw effect circle
    ctx.fillStyle = color;
    ctx.globalAlpha = 1 - (i / frames) * 0.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add extra effects for some animations
    if (extraEffects) {
      if (name === 'explosion') {
        // Add explosion debris
        for (let j = 0; j < 5; j++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = size * 0.7;
          const debrisX = centerX + Math.cos(angle) * distance;
          const debrisY = centerY + Math.sin(angle) * distance;
          const debrisSize = size * 0.2;
          
          ctx.fillStyle = '#FFAA00';
          ctx.beginPath();
          ctx.arc(debrisX, debrisY, debrisSize, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (name === 'shield') {
        // Add shield glow
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (name === 'tornado') {
        // Create swirling effect
        ctx.globalAlpha = 0.7;
        for (let j = 0; j < 3; j++) {
          const angle = (i / frames) * Math.PI * 2 + (j * Math.PI * 2 / 3);
          const distance = size * 0.6;
          const debrisX = centerX + Math.cos(angle) * distance;
          const debrisY = centerY + Math.sin(angle) * distance;
          
          ctx.fillStyle = '#CCCCFF';
          ctx.beginPath();
          ctx.arc(debrisX, debrisY, size * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;
    
    // Add border around each frame for clarity
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, 0, frameWidth, frameHeight);
  }
  
  // Save the effect sprite sheet
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(assetsDir, 'effects', `${name}.png`);
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Created effect sprite sheet: ${filePath}`);
}

// Generate placeholder assets

console.log("========================================");
console.log("Generating Enhanced Placeholder Assets");
console.log("========================================");

// Create directory for effects
const effectsDir = path.join(assetsDir, 'effects');
if (!fs.existsSync(effectsDir)) {
  fs.mkdirSync(effectsDir, { recursive: true });
}

// Generate Player spritesheet with all elemental forms
console.log("\nGenerating Character Sprites:");
createSpriteSheet(
  path.join(assetsDir, 'sprites', 'player.png'),
  64, 64,  // Width and height
  60, 12,  // Total frames, frames per row
  [
    ELEMENT_COLORS.SPIRIT,
    ELEMENT_COLORS.FIRE,
    ELEMENT_COLORS.WATER, 
    ELEMENT_COLORS.EARTH,
    ELEMENT_COLORS.AIR
  ],
  { default: 'Player' }
);

// Generate Enemy spritesheet with all elemental types
createSpriteSheet(
  path.join(assetsDir, 'sprites', 'enemy.png'),
  48, 48,  // Width and height
  40, 8,   // Total frames, frames per row
  [
    ELEMENT_COLORS.SPIRIT,
    ELEMENT_COLORS.FIRE,
    ELEMENT_COLORS.WATER, 
    ELEMENT_COLORS.EARTH,
    ELEMENT_COLORS.AIR
  ],
  { default: 'Enemy' }
);

// Generate Boss spritesheet with all elemental types
createSpriteSheet(
  path.join(assetsDir, 'sprites', 'boss.png'),
  96, 96,  // Width and height
  128, 4,  // Total frames, frames per row
  [
    ELEMENT_COLORS.SPIRIT,
    ELEMENT_COLORS.FIRE,
    ELEMENT_COLORS.WATER, 
    ELEMENT_COLORS.EARTH,
    ELEMENT_COLORS.AIR,
    '#AAAAAA'  // Death animation color
  ],
  { default: 'Boss' }
);

// Generate Spirit spritesheets for all elements
console.log("\nGenerating Spirit Sprites:");
for (const element of ['spirit', 'fire', 'water', 'earth', 'air']) {
  createSpriteSheet(
    path.join(assetsDir, 'sprites', `spirit-${element}.png`),
    32, 32,  // Width and height
    8, 4,    // Total frames, frames per row
    ELEMENT_COLORS[element.toUpperCase()],
    { default: element }
  );
}

// Generate Soul Essence sprite
createPlaceholderImage(
  path.join(assetsDir, 'sprites', 'soul-essence.png'),
  32, 32,
  '#8866FF',
  'Soul'
);

// Generate projectile sprite
createPlaceholderImage(
  path.join(assetsDir, 'sprites', 'projectile.png'),
  16, 16,
  '#FFFFFF',
  'Proj'
);

// Generate platform sprite
createPlaceholderImage(
  path.join(assetsDir, 'sprites', 'platform.png'),
  64, 16,
  '#555555',
  'Platform'
);

// Generate effect sprites
console.log("\nGenerating Effect Sprites:");
createEffectSpritesheet('explosion', 64, 64, 8, '#FF6600', true);
createEffectSpritesheet('splash', 48, 48, 6, '#66CCFF', true);
createEffectSpritesheet('shield', 64, 64, 6, '#FFFFFF', true);
createEffectSpritesheet('tornado', 48, 96, 8, '#CCCCFF', true);
createEffectSpritesheet('earthquake', 96, 32, 6, '#AA7722', true);

// Generate particle sprite
createPlaceholderImage(
  path.join(assetsDir, 'sprites', 'particle.png'),
  8, 8,
  '#FFFFFF'
);

// Generate biome backgrounds
console.log("\nGenerating Biome Backgrounds:");
createBiomeBackground('NEUTRAL', 800, 450);
createBiomeBackground('FIRE', 800, 450);
createBiomeBackground('WATER', 800, 450);
createBiomeBackground('EARTH', 800, 450);
createBiomeBackground('AIR', 800, 450);
createBiomeBackground('SPIRIT', 800, 450);

// Generate UI elements
console.log("\nGenerating UI Elements:");
createPlaceholderImage(path.join(assetsDir, 'ui', 'button.png'), 100, 40, '#335577', 'Button');
createPlaceholderImage(path.join(assetsDir, 'ui', 'button-hover.png'), 100, 40, '#4477AA', 'Hover');
createPlaceholderImage(path.join(assetsDir, 'ui', 'health-bar.png'), 200, 20, '#AA3333', 'Health');
createPlaceholderImage(path.join(assetsDir, 'ui', 'energy-bar.png'), 200, 20, '#33AAAA', 'Energy');

// Generate element icons
console.log("\nGenerating Element Icons:");
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-spirit.png'), 32, 32, ELEMENT_COLORS.SPIRIT, 'Spirit');
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-fire.png'), 32, 32, ELEMENT_COLORS.FIRE, 'Fire');
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-water.png'), 32, 32, ELEMENT_COLORS.WATER, 'Water');
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-earth.png'), 32, 32, ELEMENT_COLORS.EARTH, 'Earth');
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-air.png'), 32, 32, ELEMENT_COLORS.AIR, 'Air');

// Generate logo
createPlaceholderImage(path.join(assetsDir, 'sprites', 'logo.png'), 200, 100, '#333333', 'LOGO');

// Generate audio files
console.log("\nGenerating Audio Files:");
createSilentAudio(path.join(assetsDir, 'audio', 'menu-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'game-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'boss-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'fire-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'water-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'earth-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'air-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'spirit-music.mp3'));

createSilentAudio(path.join(assetsDir, 'audio', 'jump.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'shoot.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'hit.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'collect.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'switch-element.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'death.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'level-complete.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'boss-intro.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'dash.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'special.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'upgrade.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'unlock.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'menu-select.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'menu-click.wav'));

// Generate Bitmap font
console.log("\nGenerating Font:");
createBitmapFont();

console.log("\n=========================================");
console.log("Enhanced placeholder asset generation complete!");
console.log("=========================================");