// download-arabic-tts.js
// Downloads Arabic letter pronunciation MP3s using Google Translate TTS (free, no API key)
// Usage: node download-arabic-tts.js

const fs = require('fs');
const path = require('path');
const https = require('https');

// List of Arabic letters and their names
const letters = [
  { file: 'alif.mp3', text: 'ا' },
  { file: 'baa.mp3', text: 'ب' },
  { file: 'taa.mp3', text: 'ت' },
  { file: 'thaa.mp3', text: 'ث' },
  { file: 'jeem.mp3', text: 'ج' },
  { file: 'haa.mp3', text: 'ح' },
  { file: 'khaa.mp3', text: 'خ' },
  { file: 'dal.mp3', text: 'د' },
  { file: 'thal.mp3', text: 'ذ' },
  { file: 'raa.mp3', text: 'ر' },
  { file: 'zay.mp3', text: 'ز' },
  { file: 'seen.mp3', text: 'س' },
  { file: 'sheen.mp3', text: 'ش' },
  { file: 'sad.mp3', text: 'ص' },
  { file: 'dad.mp3', text: 'ض' },
  { file: 'tah.mp3', text: 'ط' },
  { file: 'zah.mp3', text: 'ظ' },
  { file: 'ain.mp3', text: 'ع' },
  { file: 'ghain.mp3', text: 'غ' },
  { file: 'faa.mp3', text: 'ف' },
  { file: 'qaf.mp3', text: 'ق' },
  { file: 'kaf.mp3', text: 'ك' },
  { file: 'lam.mp3', text: 'ل' },
  { file: 'meem.mp3', text: 'م' },
  { file: 'noon.mp3', text: 'ن' },
  { file: 'haa2.mp3', text: 'ه' },
  { file: 'waw.mp3', text: 'و' },
  { file: 'yaa.mp3', text: 'ي' }
];

const audioDir = path.resolve(__dirname, '../assets/audio');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

function downloadTTS(text, filename) {
  return new Promise((resolve, reject) => {
    // Google Translate TTS endpoint
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ar&client=tw-ob`;
    const filePath = path.join(audioDir, filename);
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${filename}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
}

(async () => {
  for (const { file, text } of letters) {
    console.log(`Downloading ${file} for "${text}" ...`);
    try {
      await downloadTTS(text, file);
      console.log(`Saved: ${file}`);
    } catch (err) {
      console.error(`Error for ${file}:`, err.message);
    }
  }
  console.log('All audio files downloaded!');
})();
