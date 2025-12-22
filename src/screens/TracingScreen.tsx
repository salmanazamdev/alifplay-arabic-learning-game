import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
      setPaths([...paths, { path: currentPath, color: Colors.primaryGreen }]);
      setCurrentPath('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    setIsComplete(false);
  };

  const handleComplete = async () => {
    if (paths.length === 0 && !currentPath) {
      Alert.alert('Draw Something!', 'Please draw on the canvas before completing.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color={Colors.primaryGreen} />
        </View>

        {/* Letter Card */}
        <View style={styles.letterCard}>
          <View style={styles.letterRow}>
            <View style={styles.letterCircle}>
              <Text style={styles.arabicLetterDisplay}>{currentLetter.letter}</Text>
            </View>
            <View style={styles.letterDetails}>
              <Text style={styles.letterName}>{currentLetter.name}</Text>
              <Text style={styles.pronunciation}>"{currentLetter.pronunciation}"</Text>
              <TouchableOpacity
                style={styles.audioButton}
                onPress={() => playSound(currentLetter.audioFile)}
              >
                <Text style={styles.audioButtonText}>🔊 Listen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Canvas */}
        <View style={styles.canvasSection}>
          <View style={styles.canvasWrapper}>
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
                {paths.map((pathData, index) => (
                  <Path
                    key={index}
                    d={pathData.path}
                    stroke={pathData.color}
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                
                {currentPath && (
                  <Path
                    d={currentPath}
                    stroke={Colors.primaryPink}
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={0.8}
                  />
                )}
              </Svg>
            </View>
            
            {paths.length === 0 && !currentPath && (
              <View style={styles.canvasHint}>
                <Text style={styles.hintEmoji}>👇</Text>
                <Text style={styles.hintText}>Draw here</Text>
              </View>
            )}
          </View>
        </View>

        {/* Success */}
        {isComplete && (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successText}>Great Job!</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.clearBtn, (paths.length === 0 && !currentPath) && styles.btnDisabled]}
            onPress={handleClear}
            disabled={paths.length === 0 && !currentPath}
          >
            <Text style={styles.clearBtnText}>🗑️ Clear</Text>
          </TouchableOpacity>
          
          {!isComplete ? (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleComplete}
            >
              <LinearGradient
                colors={[Colors.primaryGreen, Colors.primaryGreenDark]}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>✓ Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
            >
              <LinearGradient
                colors={[Colors.primaryBlue, Colors.primaryBlueDark]}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
  },
  headerLeft: {
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
  progressContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  letterCard: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  letterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryOrangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabicLetterDisplay: {
    fontSize: 48,
    fontFamily: 'Cairo_700Bold',
    color: Colors.primaryOrangeDark,
  },
  letterDetails: {
    flex: 1,
  },
  letterName: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  pronunciation: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  audioButton: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  audioButtonText: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  canvasSection: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
  },
  canvasWrapper: {
    height: CANVAS_SIZE + 40,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
    fontSize: 180,
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
    alignItems: 'center',
    pointerEvents: 'none',
  },
  hintEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  hintText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textLight,
  },
  successCard: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primaryGreen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 48,
  },
  successText: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  btnDisabled: {
    opacity: 0.5,
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
  btnGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default TracingScreen;
