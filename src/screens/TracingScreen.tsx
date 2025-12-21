import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';
import { arabicLetters } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { addStar } from '../utils/storage';

const { width, height } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(width - Spacing.screenPadding * 2, 350);

interface PathData {
  path: string;
  color: string;
}

const TracingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const currentLetter = arabicLetters[currentIndex];

  const onTouchStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(`M${locationX},${locationY}`);
  };

  const onTouchMove = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
  };

  const onTouchEnd = () => {
    if (currentPath) {
      setPaths([...paths, { path: currentPath, color: Colors.primaryBlue }]);
      setCurrentPath('');
    }
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    setIsComplete(false);
  };

  const handleComplete = async () => {
    if (paths.length === 0) {
      Alert.alert('Draw First!', 'Please draw the letter before completing.');
      return;
    }
    
    setIsComplete(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playSound('success.mp3');
    await addStar(2);
  };

  const handleNext = () => {
    if (currentIndex < arabicLetters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsComplete(false);
      setPaths([]);
      setCurrentPath('');
    } else {
      Alert.alert(
        'Completed! 🎉',
        `You've traced all ${arabicLetters.length} letters!`,
        [{ text: 'Restart', onPress: () => {
          setCurrentIndex(0);
          setIsComplete(false);
          setPaths([]);
        }}]
      );
    }
  };

  const progress = ((currentIndex + 1) / arabicLetters.length) * 100;

  const progress = ((currentIndex + 1) / arabicLetters.length) * 100;

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>✍️ Letter Tracing</Text>
            <Text style={styles.subtitle}>Trace the letter!</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {currentIndex + 1}/{arabicLetters.length}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Letter Display */}
        <View style={styles.letterDisplay}>
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => playSound(currentLetter.audioFile)}
          >
            <LinearGradient
              colors={[Colors.primaryOrange, Colors.primaryOrangeDark]}
              style={styles.audioGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.arabicLetter}>{currentLetter.letter}</Text>
              <View style={styles.letterInfo}>
                <Text style={styles.letterName}>{currentLetter.name}</Text>
                <Text style={styles.pronunciation}>"{currentLetter.pronunciation}"</Text>
              </View>
              <Text style={styles.audioHint}>🔊 Tap to hear</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Drawing Canvas */}
        <View style={styles.canvasContainer}>
          <View style={styles.canvasWrapper}>
            {/* Background letter guide (faded) */}
            <View style={styles.guideLetterContainer}>
              <Text style={styles.guideLetter}>{currentLetter.letter}</Text>
            </View>
            
            <View
              style={styles.canvas}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <Svg height={CANVAS_SIZE} width={CANVAS_SIZE}>
                {/* Render completed paths */}
                {paths.map((pathData, index) => (
                  <Path
                    key={index}
                    d={pathData.path}
                    stroke={pathData.color}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                
                {/* Render current drawing path */}
                {currentPath && (
                  <Path
                    d={currentPath}
                    stroke={Colors.primaryBlue}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </Svg>
            </View>
            
            {paths.length === 0 && !currentPath && (
              <View style={styles.canvasHint}>
                <Text style={styles.canvasHintText}>✨ Draw here</Text>
              </View>
            )}
          </View>
        </View>

        {/* Success Message */}
        {isComplete && (
          <View style={styles.successMessage}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successText}>Excellent Work!</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={[styles.buttons, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={paths.length === 0 && !currentPath}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
          
          {!isComplete ? (
            <TouchableOpacity
              style={[styles.button, styles.completeButton]}
              onPress={handleComplete}
            >
              <LinearGradient
                colors={[Colors.primaryGreen, Colors.primaryGreenDark]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>✓ Complete</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
            >
              <LinearGradient
                colors={[Colors.primaryBlue, Colors.primaryBlueDark]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...Typography.title2,
    fontFamily: 'Cairo_700Bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  progressBadge: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  progressText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.white,
  },
  progressContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
  },
  progressBackground: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryBlue,
    borderRadius: BorderRadius.full,
  },
  letterDisplay: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
  },
  audioButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  audioGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  arabicLetter: {
    fontSize: 80,
    fontFamily: 'Cairo_700Bold',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  letterInfo: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  letterName: {
    ...Typography.title3,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.white,
  },
  pronunciation: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: Spacing.xs,
  },
  audioHint: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.sm,
  },
  canvasContainer: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  canvasWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  guideLetterContainer: {
    position: 'absolute',
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  guideLetter: {
    fontSize: 200,
    fontFamily: 'Cairo_700Bold',
    color: Colors.borderLight,
    opacity: 0.3,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
  canvasHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    pointerEvents: 'none',
  },
  canvasHintText: {
    ...Typography.title3,
    color: Colors.textTertiary,
  },
  successMessage: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryGreen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.medium,
  },
  successEmoji: {
    fontSize: 40,
  },
  successText: {
    ...Typography.title2,
    fontFamily: 'Cairo_700Bold',
    color: Colors.white,
    marginTop: Spacing.xs,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    minHeight: 56,
  },
  clearButton: {
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  completeButton: {
    ...Shadows.medium,
  },
  nextButton: {
    ...Shadows.medium,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default TracingScreen;
