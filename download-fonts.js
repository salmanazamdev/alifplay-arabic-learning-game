const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'assets', 'fonts');

// Ensure directory exists
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
  {
    name: 'Amiri-Regular.ttf',
    url: 'https://github.com/aliftype/amiri/raw/master/Amiri-Regular.ttf'
  },
  {
    name: 'Cairo-Regular.ttf',
    url: 'https://github.com/Gue3bara/Cairo/raw/master/fonts/ttf/Cairo-Regular.ttf'
  }
];

function downloadFont(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

console.log('📥 Downloading Arabic fonts...\n');

(async () => {
  for (const font of fonts) {
    const destPath = path.join(fontsDir, font.name);
    
    try {
      await downloadFont(font.url, destPath);
      console.log(`✅ Downloaded ${font.name}`);
    } catch (error) {
      console.log(`❌ Failed to download ${font.name}: ${error.message}`);
      console.log(`   Skipping font - app will use system fonts`);
    }
  }
  
  console.log('\n✨ Font download complete!');
})();
