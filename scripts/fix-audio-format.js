const fs = require('fs');
const path = require('path');
const https = require('https');

const audioDir = path.join(__dirname, '..', 'assets', 'audio');

// Arabic letters with their pronunciations
const letters = [
  { letter: 'ا', name: 'alif', text: 'ألِف' },
  { letter: 'ب', name: 'baa', text: 'باء' },
  { letter: 'ت', name: 'taa', text: 'تاء' },
  { letter: 'ث', name: 'thaa', text: 'ثاء' },
  { letter: 'ج', name: 'jeem', text: 'جيم' },
  { letter: 'ح', name: 'haa', text: 'حاء' },
  { letter: 'خ', name: 'khaa', text: 'خاء' },
  { letter: 'د', name: 'dal', text: 'دال' },
  { letter: 'ذ', name: 'thal', text: 'ذال' },
  { letter: 'ر', name: 'raa', text: 'راء' },
  { letter: 'ز', name: 'zay', text: 'زاي' },
  { letter: 'س', name: 'seen', text: 'سين' },
  { letter: 'ش', name: 'sheen', text: 'شين' },
  { letter: 'ص', name: 'sad', text: 'صاد' },
  { letter: 'ض', name: 'dad', text: 'ضاد' },
  { letter: 'ط', name: 'tah', text: 'طاء' },
  { letter: 'ظ', name: 'zah', text: 'ظاء' },
  { letter: 'ع', name: 'ain', text: 'عين' },
  { letter: 'غ', name: 'ghain', text: 'غين' },
  { letter: 'ف', name: 'faa', text: 'فاء' },
  { letter: 'ق', name: 'qaf', text: 'قاف' },
  { letter: 'ك', name: 'kaf', text: 'كاف' },
  { letter: 'ل', name: 'lam', text: 'لام' },
  { letter: 'م', name: 'meem', text: 'ميم' },
  { letter: 'ن', name: 'noon', text: 'نون' },
  { letter: 'ه', name: 'haa2', text: 'هاء' },
  { letter: 'و', name: 'waw', text: 'واو' },
  { letter: 'ي', name: 'yaa', text: 'ياء' },
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
    console.log(`Downloading ${filename} for "${letter.letter}" (${letter.text})...`);
    
    try {
      await downloadAudio(letter.text, filename);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error.message);
    }
  }
  
  console.log('\n✓ Audio files updated!');
}

main();
