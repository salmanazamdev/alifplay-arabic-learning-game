import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  PanResponder,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';
import { arabicLetters } from '../utils/gameData';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(width - Spacing.screenPadding * 2, 350);

interface PathData {
  path: string;
  color: string;
}

const TracingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  
  const currentLetter = arabicLetters[currentIndex];

  // Static audio map for React Native
  const audioMap: Record<string, any> = {
    'alif.mp3': require('../../assets/audio/alif.mp3'),
    'baa.mp3': require('../../assets/audio/baa.mp3'),
    'taa.mp3': require('../../assets/audio/taa.mp3'),
    'thaa.mp3': require('../../assets/audio/thaa.mp3'),
    'jeem.mp3': require('../../assets/audio/jeem.mp3'),
    'haa.mp3': require('../../assets/audio/haa.mp3'),
    'khaa.mp3': require('../../assets/audio/khaa.mp3'),
    'dal.mp3': require('../../assets/audio/dal.mp3'),
    'thal.mp3': require('../../assets/audio/thal.mp3'),
    'raa.mp3': require('../../assets/audio/raa.mp3'),
    'zay.mp3': require('../../assets/audio/zay.mp3'),
    'seen.mp3': require('../../assets/audio/seen.mp3'),
    'sheen.mp3': require('../../assets/audio/sheen.mp3'),
    'sad.mp3': require('../../assets/audio/sad.mp3'),
    'dad.mp3': require('../../assets/audio/dad.mp3'),
    'tah.mp3': require('../../assets/audio/tah.mp3'),
    'zah.mp3': require('../../assets/audio/zah.mp3'),
    'ain.mp3': require('../../assets/audio/ain.mp3'),
    'ghain.mp3': require('../../assets/audio/ghain.mp3'),
    'faa.mp3': require('../../assets/audio/faa.mp3'),
    'qaf.mp3': require('../../assets/audio/qaf.mp3'),
    'kaf.mp3': require('../../assets/audio/kaf.mp3'),
    'lam.mp3': require('../../assets/audio/lam.mp3'),
    'meem.mp3': require('../../assets/audio/meem.mp3'),
    'noon.mp3': require('../../assets/audio/noon.mp3'),
    'haa2.mp3': require('../../assets/audio/haa2.mp3'),
    'waw.mp3': require('../../assets/audio/waw.mp3'),
    'yaa.mp3': require('../../assets/audio/yaa.mp3'),
  };

  // PanResponder for drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      
      onPanResponderRelease: () => {
        if (currentPath) {
          setPaths((prev) => [...prev, { path: currentPath, color: Colors.primaryGreen }]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  // Audio playback
  const playAudio = async (audioFile: string) => {
    try {
      const audioSource = audioMap[audioFile];
      if (!audioSource) {
        console.warn(`No audio found for: ${audioFile}`);
        return;
      }
      const { sound } = await Audio.Sound.createAsync(audioSource);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Clear drawing
  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    setIsComplete(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Undo last stroke
  const handleUndo = () => {
    if (paths.length > 0) {
      setPaths((prev) => prev.slice(0, -1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Validate and complete
  const handleDone = async () => {
    if (paths.length === 0 && !currentPath) {
      Alert.alert('No Drawing', 'Please draw on the canvas before completing.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Simple validation: just check if they drew something
    setIsComplete(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playAudio(currentLetter.audioFile);
  };

  // Next letter
  const handleNext = () => {
    if (currentIndex < arabicLetters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsComplete(false);
      setPaths([]);
      setCurrentPath('');
      setShowGuide(true);
    } else {
      Alert.alert(
        'Completed! 🎉',
        `You've practiced all ${arabicLetters.length} letters!`,
        [
          {
            text: 'Restart',
            onPress: () => {
              setCurrentIndex(0);
              setIsComplete(false);
              setPaths([]);
              setCurrentPath('');
            },
          },
        ]
      );
    }
  };

  // Skip letter
  const handleSkip = () => {
    handleNext();
  };

  const progress = ((currentIndex + 1) / arabicLetters.length) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>✍️ Letter Tracing</Text>
          <Text style={styles.subtitle}>Draw the letter with your finger</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {currentIndex + 1}/{arabicLetters.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Letter Info */}
      <View style={styles.letterCard}>
        <View style={styles.letterCircle}>
          <Text style={styles.letterText}>{currentLetter.letter}</Text>
        </View>
        <View style={styles.letterInfo}>
          <Text style={styles.letterName}>{currentLetter.name}</Text>
          <Text style={styles.pronunciation}>"{currentLetter.pronunciation}"</Text>
        </View>
        <TouchableOpacity
          style={styles.audioBtn}
          onPress={() => playAudio(currentLetter.audioFile)}
        >
          <Text style={styles.audioBtnText}>🔊</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        {/* Guide Letter */}
        {showGuide && (
          <View style={styles.guideContainer} pointerEvents="none">
            <Text style={styles.guideLetter}>{currentLetter.letter}</Text>
          </View>
        )}

        {/* Drawing Surface */}
        <View style={styles.canvas} {...panResponder.panHandlers}>
          <Svg height={CANVAS_SIZE} width={CANVAS_SIZE}>
            {/* Completed paths */}
            {paths.map((pathData, index) => (
              <Path
                key={index}
                d={pathData.path}
                stroke={pathData.color}
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            
            {/* Current path being drawn */}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={Colors.primaryGreen}
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.8}
              />
            )}
          </Svg>
        </View>

        {/* Hint */}
        {paths.length === 0 && !currentPath && (
          <View style={styles.hintContainer} pointerEvents="none">
            <Text style={styles.hintEmoji}>👆</Text>
            <Text style={styles.hintText}>Draw here</Text>
          </View>
        )}
      </View>

      {/* Success Message */}
      {isComplete && (
        <View style={styles.successCard}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successText}>Great Job!</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Guide Toggle */}
        <TouchableOpacity
          style={[styles.smallBtn, !showGuide && styles.smallBtnInactive]}
          onPress={() => setShowGuide(!showGuide)}
        >
          <Text style={styles.smallBtnText}>{showGuide ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>

        {/* Undo */}
        <TouchableOpacity
          style={[styles.smallBtn, paths.length === 0 && styles.smallBtnDisabled]}
          onPress={handleUndo}
          disabled={paths.length === 0}
        >
          <Text style={styles.smallBtnText}>↶</Text>
        </TouchableOpacity>

        {/* Clear */}
        <TouchableOpacity
          style={[styles.smallBtn, (paths.length === 0 && !currentPath) && styles.smallBtnDisabled]}
          onPress={handleClear}
          disabled={paths.length === 0 && !currentPath}
        >
          <Text style={styles.smallBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip →</Text>
        </TouchableOpacity>

        {!isComplete ? (
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <LinearGradient
              colors={[Colors.primaryGreen, Colors.primaryGreenDark]}
              style={styles.gradientBtn}
            >
              <Text style={styles.doneBtnText}>✓ Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <LinearGradient
              colors={[Colors.primaryBlue, Colors.primaryBlueDark]}
              style={styles.gradientBtn}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressBadge: {
    backgroundColor: Colors.primaryGreen,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryGreen,
  },
  letterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  letterCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryOrangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontSize: 36,
    fontFamily: 'Cairo_700Bold',
    color: Colors.primaryOrangeDark,
  },
  letterInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  letterName: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  pronunciation: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  audioBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioBtnText: {
    fontSize: 20,
  },
  canvasContainer: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
    borderWidth: 3,
    borderColor: Colors.primaryGreenLight,
    height: CANVAS_SIZE + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    position: 'absolute',
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  guideLetter: {
    fontSize: 180,
    fontFamily: 'Cairo_700Bold',
    color: Colors.borderLight,
    opacity: 0.25,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    zIndex: 2,
  },
  hintContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  hintEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  hintText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textLight,
  },
  successCard: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryGreen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 36,
  },
  successText: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  smallBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  smallBtnInactive: {
    opacity: 0.5,
  },
  smallBtnDisabled: {
    opacity: 0.3,
  },
  smallBtnText: {
    fontSize: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  skipBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  doneBtn: {
    flex: 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  nextBtn: {
    flex: 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  gradientBtn: {
    paddingVertical: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  nextBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default TracingScreen;
