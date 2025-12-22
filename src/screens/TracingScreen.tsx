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
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius, TextStyles } from '../constants';
import { ProgressBar, GradientButton } from '../components';
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
  const [strokeCount, setStrokeCount] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'good' | 'try-again'>('none');
  const currentLetter = arabicLetters[currentIndex];

  const onTouchStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(`M${locationX},${locationY}`);
    setFeedback('none');
  };

  const onTouchMove = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
  };

  const onTouchEnd = () => {
    if (currentPath) {
      const pathLength = currentPath.split(' ').length;
      // Simple validation: check if user drew enough (at least 10 points)
      if (pathLength < 10) {
        setFeedback('try-again');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        setPaths([...paths, { path: currentPath, color: Colors.primaryGreen }]);
        setStrokeCount(prev => prev + 1);
        setFeedback('good');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setCurrentPath('');
    }
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    setIsComplete(false);
    setStrokeCount(0);
    setFeedback('none');
  };

  const handleComplete = async () => {
    // Validation: Must have at least 1 stroke
    if (strokeCount === 0) {
      Alert.alert('Draw the Letter!', 'Please trace the letter before completing.');
      setFeedback('try-again');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    // Check if drawing is reasonable (at least covers some area)
    if (paths.length === 0) {
      Alert.alert('Try Again!', 'Your tracing seems incomplete. Draw over the letter carefully.');
      setFeedback('try-again');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsComplete(true);
    setFeedback('good');
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
      setStrokeCount(0);
      setFeedback('none');
    } else {
      Alert.alert(
        'Completed! 🎉',
        `You've traced all ${arabicLetters.length} letters!`,
        [{ text: 'Restart', onPress: () => {
          setCurrentIndex(0);
          setIsComplete(false);
          setPaths([]);
          setStrokeCount(0);
          setFeedback('none');
        }}]
      );
    }
  };

  const progress = ((currentIndex + 1) / arabicLetters.length) * 100;

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>✍️ Letter Tracing</Text>
            <Text style={styles.subtitle}>Draw over the letter carefully</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {currentIndex + 1}/{arabicLetters.length}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color={Colors.primaryGreen} />
        </View>

        {/* Instruction Card */}
        <View style={styles.instructionCard}>
          <View style={styles.letterDisplayRow}>
            <View style={styles.letterBox}>
              <Text style={styles.arabicLetterLarge}>{currentLetter.letter}</Text>
            </View>
            <View style={styles.letterInfoBox}>
              <Text style={styles.letterName}>{currentLetter.name}</Text>
              <Text style={styles.pronunciation}>"{currentLetter.pronunciation}"</Text>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => playSound(currentLetter.audioFile)}
              >
                <Text style={styles.playButtonText}>🔊 Play Sound</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Feedback Messages */}
        {feedback === 'good' && (
          <View style={styles.feedbackGood}>
            <Text style={styles.feedbackText}>✓ Good stroke!</Text>
          </View>
        )}
        {feedback === 'try-again' && (
          <View style={styles.feedbackBad}>
            <Text style={styles.feedbackText}>✗ Draw slower and longer</Text>
          </View>
        )}

        {/* Drawing Canvas */}
        <View style={styles.canvasContainer}>
          <View style={styles.canvasWrapper}>
            {/* Background guide letter */}
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
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                
                {/* Render current drawing path */}
                {currentPath && (
                  <Path
                    d={currentPath}
                    stroke={Colors.primaryPink}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={0.8}
                  />
                )}
              </Svg>
            </View>
            
            {strokeCount === 0 && !currentPath && (
              <View style={styles.canvasHint}>
                <Text style={styles.canvasHintIcon}>👆</Text>
                <Text style={styles.canvasHintText}>Draw here with your finger</Text>
              </View>
            )}
            
            {/* Stroke counter */}
            {strokeCount > 0 && (
              <View style={styles.strokeCounter}>
                <Text style={styles.strokeCountText}>{strokeCount} stroke{strokeCount !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Success Message */}
        {isComplete && (
          <View style={styles.successMessage}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successText}>Perfect! Well done!</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={[styles.buttons, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton, (strokeCount === 0 && !currentPath) && styles.buttonDisabled]}
            onPress={handleClear}
            disabled={strokeCount === 0 && !currentPath}
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
                <Text style={styles.buttonText}>✓ Done</Text>
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
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  progressBadge: {
    backgroundColor: Colors.primaryGreen,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  progressText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  progressContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  instructionCard: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  letterDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  letterBox: {
    width: 100,
    height: 100,
    backgroundColor: Colors.primaryOrangeLight,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  arabicLetterLarge: {
    fontSize: 64,
    fontFamily: 'Cairo_700Bold',
    color: Colors.primaryOrangeDark,
  },
  letterInfoBox: {
    flex: 1,
  },
  letterName: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  pronunciation: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  playButton: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  feedbackGood: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  feedbackBad: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  feedbackText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  canvasContainer: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    minHeight: 300,
  },
  canvasWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 3,
    borderColor: Colors.primaryGreenLight,
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
    fontSize: 220,
    fontFamily: 'Cairo_700Bold',
    color: Colors.borderLight,
    opacity: 0.25,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
  canvasHint: {
    position: 'absolute',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  canvasHintIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  canvasHintText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textLight,
  },
  strokeCounter: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primaryPurple,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  strokeCountText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  successMessage: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryGreen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.large,
  },
  successEmoji: {
    fontSize: 48,
  },
  successText: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    fontFamily: 'Cairo_700Bold',
    color: Colors.white,
    marginTop: Spacing.sm,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
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
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default TracingScreen;
