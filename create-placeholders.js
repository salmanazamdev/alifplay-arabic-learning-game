#!/usr/bin/env node

/**
 * Creates placeholder audio files for AlifPlay
 * Run this after downloading assets with download-assets.js
 * This ensures the app doesn't crash when audio files are missing
 */

const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, 'assets', 'audio');

// List of all required audio files
const requiredAudioFiles = [
  'alif.mp3', 'baa.mp3', 'taa.mp3', 'thaa.mp3', 'jeem.mp3',
  'haa.mp3', 'khaa.mp3', 'dal.mp3', 'thal.mp3', 'raa.mp3',
  'zay.mp3', 'seen.mp3', 'sheen.mp3', 'sad.mp3', 'dad.mp3',
  'tah.mp3', 'zah.mp3', 'ain.mp3', 'ghain.mp3', 'faa.mp3',
  'qaf.mp3', 'kaf.mp3', 'lam.mp3', 'meem.mp3', 'noon.mp3',
  'haa2.mp3', 'waw.mp3', 'yaa.mp3', 'success.mp3',
  'asad.mp3', 'qitta.mp3', 'kitab.mp3', 'batta.mp3',
  'feel.mp3', 'samaka.mp3', 'shams.mp3', 'qamar.mp3',
  'zahra.mp3', 'shajara.mp3'
];

// Ensure audio directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log('📁 Created assets/audio directory');
}

console.log('🎵 Creating placeholder audio files...\n');

let created = 0;
let existing = 0;

requiredAudioFiles.forEach((filename) => {
  const filePath = path.join(audioDir, filename);
  
  if (fs.existsSync(filePath)) {
    existing++;
    console.log(`✅ ${filename} (exists)`);
  } else {
    // Create empty placeholder file
    // Note: These won't play sound, but prevent app crashes
    // Replace with actual audio files later
    fs.writeFileSync(filePath, Buffer.alloc(0));
    created++;
    console.log(`📝 ${filename} (placeholder created)`);
  }
});

console.log(`\n✨ Done!`);
console.log(`   ${existing} files already exist`);
console.log(`   ${created} placeholder files created`);
console.log(`\n⚠️  Remember to replace placeholder files with actual audio!`);
console.log(`   Run: node download-assets.js`);
