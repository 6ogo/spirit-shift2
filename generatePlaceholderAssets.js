// generatePlaceholderAssets.js
// This script helps generate placeholder assets for development
// Run with Node.js: node generatePlaceholderAssets.js

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Base directory for assets
const assetsDir = 'public/assets';

// Create directories if they don't exist
const directories = [
  'sprites',
  'backgrounds',
  'ui',
  'audio',
  'fonts'
];

// Create base assets directory
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create subdirectories
directories.forEach(dir => {
  const dirPath = path.join(assetsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
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
function createSpriteSheet(filePath, frameWidth, frameHeight, frames, color, label) {
  const canvas = createCanvas(frameWidth * frames, frameHeight);
  const ctx = canvas.getContext('2d');
  
  // Fill background with transparent color
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, frameWidth * frames, frameHeight);
  
  // Draw frames
  for (let i = 0; i < frames; i++) {
    // Calculate frame position
    const x = i * frameWidth;
    
    // Draw frame background
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, 2, frameWidth - 4, frameHeight - 4);
    
    // Draw frame border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, 2, frameWidth - 4, frameHeight - 4);
    
    // Add frame number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i}`, x + frameWidth / 2, frameHeight / 2 - 10);
    
    // Add label
    if (label) {
      ctx.font = 'bold 8px Arial';
      ctx.fillText(label, x + frameWidth / 2, frameHeight / 2 + 10);
    }
  }
  
  // Save the sprite sheet
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Created sprite sheet: ${filePath}`);
}

// Function to create a simple audio file (1 second of silence)
function createSilentAudio(filePath) {
  // Create a simple WAV file with silence
  // This is a minimalistic WAV header + empty data
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

// Generate placeholder assets

// Sprites
createSpriteSheet(path.join(assetsDir, 'sprites', 'player.png'), 64, 64, 16, '#5577AA', 'Player');
createSpriteSheet(path.join(assetsDir, 'sprites', 'enemy.png'), 48, 48, 12, '#AA5577', 'Enemy');
createSpriteSheet(path.join(assetsDir, 'sprites', 'spirit.png'), 32, 32, 12, '#77AA55', 'Spirit');
createSpriteSheet(path.join(assetsDir, 'sprites', 'projectile.png'), 16, 16, 8, '#AAAA55', 'Proj');
createPlaceholderImage(path.join(assetsDir, 'sprites', 'platform.png'), 64, 16, '#555555', 'Platform');
createPlaceholderImage(path.join(assetsDir, 'sprites', 'logo.png'), 200, 100, '#333333', 'LOGO');
createPlaceholderImage(path.join(assetsDir, 'sprites', 'particle.png'), 8, 8, '#FFFFFF');

// Backgrounds
createPlaceholderImage(path.join(assetsDir, 'backgrounds', 'background.png'), 800, 450, '#111122', 'Background');

// UI elements
createPlaceholderImage(path.join(assetsDir, 'ui', 'button.png'), 100, 40, '#335577', 'Button');
createPlaceholderImage(path.join(assetsDir, 'ui', 'button-hover.png'), 100, 40, '#4477AA', 'Button Hover');
createPlaceholderImage(path.join(assetsDir, 'ui', 'health-bar.png'), 200, 20, '#AA3333', 'Health');
createPlaceholderImage(path.join(assetsDir, 'ui', 'energy-bar.png'), 200, 20, '#33AAAA', 'Energy');

// Element icons
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-spirit.png'), 32, 32, '#AAAAAA', 'Spirit');
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-fire.png'), 32, 32, '#FF6600', 'Fire');
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-water.png'), 32, 32, '#66CCFF', 'Water');
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-earth.png'), 32, 32, '#66AA66', 'Earth');
createPlaceholderImage(path.join(assetsDir, 'ui', 'element-air.png'), 32, 32, '#CCCCFF', 'Air');

// Audio
createSilentAudio(path.join(assetsDir, 'audio', 'menu-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'game-music.mp3'));
createSilentAudio(path.join(assetsDir, 'audio', 'jump.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'shoot.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'hit.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'collect.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'switch-element.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'death.wav'));
createSilentAudio(path.join(assetsDir, 'audio', 'level-complete.wav'));

// Bitmap font
createBitmapFont();

console.log('Placeholder asset generation complete!');