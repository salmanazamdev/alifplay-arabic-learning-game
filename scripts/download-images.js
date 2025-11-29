// download-images.js
// Downloads image assets for AlifPlay into assets/images/
// Usage: node scripts/download-images.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const images = [
  {
    name: 'lion.png',
    url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f981.png',
  },
  {
    name: 'duck.png',
    url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f986.png',
  },
  {
    name: 'cat.png',
    url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f408.png',
  },
  {
    name: 'book.png',
    url: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4d6.png',
  },
];

const imagesDir = path.resolve(__dirname, '../assets/images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(imagesDir, filename);
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
  for (const { name, url } of images) {
    console.log(`Downloading ${name} ...`);
    try {
      await downloadImage(url, name);
      console.log(`✅ Saved: ${name}`);
    } catch (err) {
      console.error(`❌ Error for ${name}:`, err.message);
    }
  }
  console.log('All images downloaded!');
})();
