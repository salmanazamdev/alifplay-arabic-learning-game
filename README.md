# AlifPlay - Arabic Alphabet Learning App for Kids 🎓

A beautiful, interactive mobile application built with React Native Expo to help children learn the Arabic alphabet through engaging games and activities.

## ✨ Features

### 🎮 Four Interactive Games
1. **Pronunciation Practice** - Learn letter sounds with audio playback
2. **Quiz Game** - Test knowledge with interactive questions
3. **Image Match** - Match Arabic words with corresponding images
4. **Memory Match** - Match pairs of Arabic letters to improve recognition

### 🎨 Modern Design System
- **60+ Design Tokens** - Consistent colors, typography, spacing across the app
- **Gradient Cards** - Beautiful visual hierarchy with 6 color variations
- **Smooth Animations** - Haptic feedback and delightful micro-interactions
- **Responsive Layout** - Adapts to different screen sizes and orientations

### ♿ Accessibility
- Screen reader support with proper labels and hints
- High contrast colors for better readability
- Semantic accessibility roles for all interactive elements
- Progress indicators with ARIA values

### 🚀 Performance
- Optimized FlatList rendering for smooth scrolling
- React.memo and useCallback for efficient re-renders
- Lazy loading and code splitting
- Minimal bundle size with tree shaking

## 📁 Project Structure

```
AlifPlay/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── GradientButton.tsx
│   │   ├── GradientCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StatBadge.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts
│   ├── constants/           # Design system tokens
│   │   ├── Colors.ts        # 60+ color tokens
│   │   ├── Typography.ts    # Font sizes, weights, styles
│   │   ├── Spacing.ts       # 4px-based spacing scale
│   │   ├── Shadows.ts       # Elevation system
│   │   ├── BorderRadius.ts  # Radius scale
│   │   ├── Animation.ts     # Timing and easing
│   │   └── index.ts
│   ├── screens/             # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── PronunciationScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   ├── ImageMatchScreen.tsx
│   │   ├── MemoryGameScreen.tsx
│   │   └── SplashScreen.tsx
│   ├── navigation/          # React Navigation setup
│   │   └── AppNavigator.tsx
│   ├── utils/               # Helper functions
│   │   ├── gameData.ts      # Arabic letters data
│   │   ├── quizHelpers.ts   # Quiz generation logic
│   │   ├── audio.ts         # Audio playback
│   │   └── storage.ts       # AsyncStorage wrapper
│   └── assets/              # Images, fonts, audio files
├── App.tsx                  # App entry point
├── app.json                 # Expo configuration
└── package.json             # Dependencies

```

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo SDK ~54** - Development platform and build tools
- **TypeScript** - Type safety and better DX
- **React Navigation** - Screen navigation
- **Expo Google Fonts (Cairo)** - Arabic typography
- **expo-av** - Audio playback
- **expo-haptics** - Tactile feedback
- **@react-native-async-storage/async-storage** - Local data persistence

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd AlifPlay

# Install dependencies
npm install

# Start the development server
npx expo start
```

## 🎯 Development Commands

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Build and run a clean Android dev build
npx expo run:android --clear

# Run on iOS
npm run ios

# Run on web (limited support)
npm run web

# Type check
npx tsc --noEmit

# Build with EAS
eas build --platform android --profile development
eas build --platform android --profile production
```

## 🎤 Pronunciation AI Setup (Real Mode)

Pronunciation scoring uses native speech recognition and does not simulate demo scoring.

### Required runtime

- Use a custom Android dev build (`expo run:android` or EAS dev build)
- Use a real Android device for best results
- Grant microphone permission when prompted

### Not supported for pronunciation AI

- Expo Go runtime for native voice recognition

### Quick verification checklist

```bash
# 1) Confirm device is connected
adb devices

# 2) Build/run native Android app
npx expo run:android --clear

# 3) Open Pronunciation screen and tap AI Practice
#    If unavailable, app shows actionable error (no simulated scoring)
```

### Troubleshooting

- If you see `Microphone permission is required`, enable microphone in Android app settings.
- If you see `native module is unavailable`, rebuild as a custom dev client (`expo run:android`).
- If you see `speech engine unavailable`, test on a physical Android phone with Google speech services enabled.

## 🎨 Design System Usage

```typescript
// Import design tokens
import { Colors, FontSize, Spacing, Shadows, BorderRadius } from './src/constants';

// Use in styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
});
```

## 🧩 Component Usage

```typescript
// GradientButton
<GradientButton
  text="Start Game"
  onPress={handleStart}
  variant="success"
/>

// ProgressBar
<ProgressBar progress={75} color={Colors.primaryBlue} />

// StatBadge
<StatBadge value={28} label="Letters" />

// GradientCard
<GradientCard
  gradientColors={[Colors.primaryBlue, Colors.primaryBlueDark]}
  onPress={handlePress}
  isSelected={isSelected}
>
  <Text>Card Content</Text>
</GradientCard>
```

## 🎮 Game Features

### Pronunciation Practice
- 28 Arabic letters with audio pronunciation
- Gradient cards with 6 color variations
- Haptic feedback on interaction
- Audio playback with visual feedback

### Quiz Game
- 10 randomized questions
- Real wrong answers from other letters
- Progress tracking with percentage
- Star-based scoring (1-3 stars)
- Encouraging messages based on performance

### Image Match
- 10 Arabic words with emoji representations
- Shuffle logic for variety
- Match detection with animations
- Reset functionality
- Success celebrations

### Memory Match
- 12-card matching board (6 Arabic letter pairs)
- Shuffle logic for replay variety
- Move counting and completion tracking
- Haptic feedback on flips and matches
- Best-score persistence across sessions

## 📱 Screens Overview

1. **Home Screen** - Main menu with game selection
2. **Pronunciation Screen** - Audio practice for all letters
3. **Quiz Screen** - Multiple choice questions
4. **Image Match Screen** - Word-image matching game
5. **Memory Game Screen** - Arabic letter pair matching
6. **Splash Screen** - App loading screen

## 🔧 Configuration

### app.json
```json
{
  "expo": {
    "name": "AlifPlay",
    "slug": "alifplay",
    "version": "1.0.0",
    "orientation": "portrait",
    "splash": {
      "image": "./assets/branding/splash-icon.png",
      "backgroundColor": "#FFD93D"
    }
  }
}
```

## 🌍 Localization
Currently supports:
- Arabic (primary language)
- English (UI labels and navigation)

## 📊 Performance Metrics

- **FlatList Optimization**: `removeClippedSubviews`, batch rendering
- **React.memo**: Memoized card components
- **useCallback**: Stable function references
- **Initial Render**: < 10 items per batch
- **Window Size**: 5 screens for optimal memory usage

## 🐛 Error Handling

- **ErrorBoundary** component catches React errors
- Graceful fallback UI with retry option
- Console logging for debugging
- User-friendly error messages

## 🎯 Future Enhancements

- [ ] More mini-games (word building, listening exercises)
- [ ] Achievement system with badges
- [ ] Parent dashboard with progress tracking
- [ ] Offline mode support
- [ ] Multiple difficulty levels
- [ ] Social features (leaderboards, sharing)
- [ ] More languages support

## 📄 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

## 🙏 Acknowledgments

- Google TTS API for audio generation
- Expo team for amazing development tools
- React Native community for comprehensive libraries

---

Built with ❤️ for children learning Arabic
