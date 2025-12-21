const fs = require('fs');
const path = require('path');
const https = require('https');

const audioDir = path.join(__dirname, '..', 'assets', 'audio');

// Arabic letters with their pronunciations
const letters = [
  { letter: 'ا', name: 'alif' },
  { letter: 'ب', name: 'baa' },
  { letter: 'ت', name: 'taa' },
  { letter: 'ث', name: 'thaa' },
  { letter: 'ج', name: 'jeem' },
  { letter: 'ح', name: 'haa' },
  { letter: 'خ', name: 'khaa' },
  { letter: 'د', name: 'dal' },
  { letter: 'ذ', name: 'thal' },
  { letter: 'ر', name: 'raa' },
  { letter: 'ز', name: 'zay' },
  { letter: 'س', name: 'seen' },
  { letter: 'ش', name: 'sheen' },
  { letter: 'ص', name: 'sad' },
  { letter: 'ض', name: 'dad' },
  { letter: 'ط', name: 'tah' },
  { letter: 'ظ', name: 'zah' },
  { letter: 'ع', name: 'ain' },
  { letter: 'غ', name: 'ghain' },
  { letter: 'ف', name: 'faa' },
  { letter: 'ق', name: 'qaf' },
  { letter: 'ك', name: 'kaf' },
  { letter: 'ل', name: 'lam' },
  { letter: 'م', name: 'meem' },
  { letter: 'ن', name: 'noon' },
  { letter: 'ه', name: 'haa2' },
  { letter: 'و', name: 'waw' },
  { letter: 'ي', name: 'yaa' },
];

async function downloadAudio(text, filename) {
  return new Promise((resolve, reject) => {
    // Use Google Translate TTS with better encoding
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(text)}`;
    
    const file = fs.createWriteStream(path.join(audioDir, filename));
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(path.join(audioDir, filename), () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Re-downloading audio files with better format...\n');
  
  for (const letter of letters) {
    const filename = `${letter.name}.mp3`;
    console.log(`Downloading ${filename} for "${letter.letter}"...`);
    
    try {
      await downloadAudio(letter.letter, filename);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error.message);
    }
  }
  
  console.log('\n✓ Audio files updated!');
}

main();
