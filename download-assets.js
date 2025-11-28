const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const manifest = require('./assets-manifest.json');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (url === 'PLACEHOLDER' || url === 'GENERATE_PLACEHOLDER') {
      console.log(`⚠️  Skipping ${path.basename(dest)} - requires manual addition`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });

    file.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

async function downloadAssets() {
  console.log('🚀 Starting asset download for AlifPlay...\n');

  for (const [folder, files] of Object.entries(manifest)) {
    const targetDir = path.join(__dirname, 'assets', folder);
    ensureDir(targetDir);

    console.log(`\n📦 Downloading ${folder} assets...`);
    
    for (const [filename, url] of Object.entries(files)) {
      const dest = path.join(targetDir, filename);
      
      try {
        await download(url, dest);
        console.log(`✅ ${filename}`);
      } catch (err) {
        console.error(`❌ ${filename}: ${err.message}`);
      }
    }
  }

  console.log('\n✨ Asset download complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Review assets in the assets/ folder');
  console.log('   2. Add placeholder assets manually (marked as PLACEHOLDER)');
  console.log('   3. Generate app icons using: npx expo-generate-icons');
  console.log('   4. Update gameData.ts with all 28 Arabic letters\n');
}

downloadAssets().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
