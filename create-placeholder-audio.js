const fs = require('fs');
const path = require('path');

// Create a minimal valid MP3 file (silent audio)
// This is a minimal MP3 frame that represents silence
const SILENT_MP3 = Buffer.from([
  0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

const audioFiles = [
  'alif.mp3', 'baa.mp3', 'taa.mp3', 'thaa.mp3', 'jeem.mp3',
  'haa.mp3', 'khaa.mp3', 'dal.mp3', 'thal.mp3', 'raa.mp3',
  'zay.mp3', 'seen.mp3', 'sheen.mp3', 'sad.mp3', 'dad.mp3',
  'tah.mp3', 'zah.mp3', 'ain.mp3', 'ghain.mp3', 'faa.mp3',
  'qaf.mp3', 'kaf.mp3', 'lam.mp3', 'meem.mp3', 'noon.mp3',
  'haa2.mp3', 'waw.mp3', 'yaa.mp3', 'success.mp3'
];

const audioDir = path.join(__dirname, 'assets', 'audio');

// Ensure directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

console.log('🎵 Creating placeholder audio files...\n');

audioFiles.forEach(filename => {
  const filePath = path.join(audioDir, filename);
  
  // Only create if doesn't exist or is very small (failed download)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 100) {
    fs.writeFileSync(filePath, SILENT_MP3);
    console.log(`✅ Created ${filename}`);
  } else {
    console.log(`⏭️  Skipped ${filename} (already exists)`);
  }
});

console.log('\n✨ All placeholder audio files created!');
console.log('💡 Tip: Replace these with real audio recordings later.');
