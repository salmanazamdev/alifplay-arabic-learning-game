# Asset Generation Guide for AlifPlay

## 📝 Overview
This guide helps you set up all assets required for the AlifPlay Expo React Native app.

## 🎵 Audio Assets

### Arabic Letter Pronunciations (28 letters)
The script attempts to download from open-source repositories. If any fail:
- **Option 1**: Use Text-to-Speech services
  - Google Cloud TTS: https://cloud.google.com/text-to-speech
  - Amazon Polly (Arabic voice): https://aws.amazon.com/polly/
  
- **Option 2**: Record yourself or hire a native speaker
- **Option 3**: Use free Arabic pronunciation resources:
  - https://www.101languages.net/arabic/
  - https://www.arabicpod101.com/

### Sound Effects
- `success.mp3`: Downloaded from Mixkit (free license)
- Alternative sources: https://freesound.org/, https://mixkit.co/free-sound-effects/

## 🖼️ Image Assets

### Vocabulary Images
Using Twitter Emojis (open source, Apache 2.0 license):
- lion.png 🦁
- duck.png 🦆
- cat.png 🐈
- book.png 📖

**Need more images?**
- Use https://github.com/twitter/twemoji
- Search for: https://emojipedia.org/
- Or use royalty-free image sites:
  - https://unsplash.com/
  - https://www.pexels.com/
  - https://pixabay.com/

## 🔤 Font Assets

### Arabic Fonts (Downloaded automatically)
1. **Amiri** - Traditional Arabic typography
2. **Cairo** - Modern, clean Arabic font

### To use fonts in Expo:
```bash
npx expo install expo-font
```

Then add to App.tsx:
```typescript
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

const [fontsLoaded] = Font.useFonts({
  'Amiri-Regular': require('./assets/fonts/Amiri-Regular.ttf'),
  'Cairo-Regular': require('./assets/fonts/Cairo-Regular.ttf'),
});
```

## 📱 App Icons & Splash Screen

### Generate Icons Easily:
```bash
# Install the icon generator
npm install -g expo-generate-icons

# Create a 1024x1024 icon.png in assets/
# Then run:
npx expo-generate-icons
```

### Manual Creation:
Use design tools:
- **Figma** (free): https://www.figma.com/
- **Canva** (free): https://www.canva.com/
- **Adobe Express** (free): https://www.adobe.com/express/

**Required sizes:**
- `icon.png`: 1024x1024
- `splash.png`: 1284x2778 (iPhone 13 Pro Max size)
- `adaptive-icon.png`: 1024x1024 (for Android)
- `favicon.png`: 48x48 (for web)

### Design Guidelines:
- Use bright, playful colors (yellow, orange, blue)
- Include Arabic letter (like ا "Alif")
- Add playful mascot or child-friendly graphics
- Keep it simple and recognizable

## 🎨 Additional Assets (Optional)

### Background Images
- Create gradient backgrounds
- Use subtle patterns
- Keep file sizes small (<100KB)

### Badge/Reward Graphics
- Create star badges
- Trophy icons
- Achievement medals
- Use tools like Canva or download from:
  - https://www.flaticon.com/
  - https://iconscout.com/

## 🚀 Running the Download Script

```powershell
# Download all available assets
node download-assets.js

# Check what was downloaded
ls assets/audio
ls assets/images
ls assets/fonts
ls assets/icons
```

## ✅ Checklist

- [ ] Run `node download-assets.js`
- [ ] Verify audio files downloaded
- [ ] Check image files
- [ ] Confirm fonts downloaded
- [ ] Create app icon (1024x1024)
- [ ] Create splash screen (1284x2778)
- [ ] Generate adaptive icon
- [ ] Test audio playback in app
- [ ] Commit all assets to Git (if total size < 50MB)

## 📦 Large Asset Management

If your assets exceed 50MB:
- Use Git LFS: https://git-lfs.github.com/
- Or host on CDN and download on app startup
- Or use Expo's asset delivery system

## 🎯 Quick Start

```powershell
# 1. Download assets
node download-assets.js

# 2. Install font dependencies
npm install expo-font

# 3. Create your app icon
# (Use Canva/Figma to create icon.png)

# 4. Generate all icon variants
npx expo-generate-icons

# 5. Test the app
npx expo start
```

## 🆘 Troubleshooting

### Downloads failing?
- Check your internet connection
- Some URLs might be temporary - find alternatives
- Use VPN if blocked in your region

### Audio not playing?
- Check file format (MP3 is supported)
- Verify file paths in audio.ts
- Test with a known-working audio file

### Images not showing?
- Use PNG format (best compatibility)
- Keep file sizes reasonable (<500KB each)
- Check require() paths

## 📚 Resources

- Expo Assets: https://docs.expo.dev/guides/assets/
- React Native Image: https://reactnative.dev/docs/image
- Expo Audio: https://docs.expo.dev/versions/latest/sdk/audio/
- Expo Font: https://docs.expo.dev/versions/latest/sdk/font/
