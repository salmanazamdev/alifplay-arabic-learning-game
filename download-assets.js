const fs = require('fs');
const path = require('path');
const https = require('https');

const manifest = require('./assets-manifest.json');

function download(url, dest, cb) {
  if (!url) {
    console.log(`No URL for ${dest}, skipping.`);
    return cb && cb();
  }
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => file.close(cb));
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    if (cb) cb(err.message);
  });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

Object.entries(manifest).forEach(([folder, files]) => {
  const targetDir = path.join(__dirname, 'assets', folder);
  ensureDir(targetDir);
  Object.entries(files).forEach(([filename, url]) => {
    const dest = path.join(targetDir, filename);
    download(url, dest, (err) => {
      if (err) console.error(`Error downloading ${filename}: ${err}`);
      else console.log(`Downloaded ${filename} to ${targetDir}`);
    });
  });
});
