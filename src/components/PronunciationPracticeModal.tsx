/**
 * Pronunciation Practice Modal
 * Enhanced screen with AI-powered speech recognition
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SpeechButton } from './SpeechButton';
import { AccuracyMeter } from './AccuracyMeter';
import {
  speechRecognitionService,
  RecognitionResult,
  PronunciationScore,
} from '../services/speechRecognition';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants';
import { playSound } from '../utils/audio';

interface PronunciationPracticeModalProps {
  visible: boolean;
  onClose: () => void;
  letter: {
    id: string;
    letter: string;
    name: string;
    pronunciation: string;
    audioFile: string;
  } | null;
}

export const PronunciationPracticeModal: React.FC<PronunciationPracticeModalProps> = ({
  visible,
  onClose,
  letter,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [score, setScore] = useState<PronunciationScore | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState<PronunciationScore[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if voice is available
    const checkVoice = async () => {
      const available = speechRecognitionService.isVoiceAvailable();
      setIsDemoMode(!available);
    };
    checkVoice();
  }, []);

  useEffect(() => {
    // Reset state when modal opens/closes
    if (visible) {
      setScore(null);
      setShowScore(false);
      setAttemptHistory([]);
      setIsListening(false);
    } else {
      // Stop listening if modal closes
      if (isListening) {
        speechRecognitionService.stopRecognition();
        setIsListening(false);
      }
    }
  }, [visible]);

  const handleStartListening = async () => {
    if (!letter) return;

    try {
      setIsListening(true);
      setIsProcessing(true);
      setShowScore(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await speechRecognitionService.startRecognition(
        letter.letter,
        handleRecognitionResult
      );
    } catch (error) {
      console.error('Start listening error:', error);
      Alert.alert('Error', 'Failed to start speech recognition');
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const handleStopListening = async () => {
    try {
      await speechRecognitionService.stopRecognition();
      setIsListening(false);
    } catch (error) {
      console.error('Stop listening error:', error);
      setIsListening(false);
    }
  };

  const handleRecognitionResult = (result: RecognitionResult) => {
    setIsListening(false);
    setIsProcessing(false);

    if (!result.success) {
      Alert.alert('Recognition Failed', result.error || 'Please try again');
      return;
    }

    if (result.score) {
      setScore(result.score);
      setShowScore(true);
      setAttemptHistory(prev => [...prev, result.score!]);

      // Haptic feedback based on score
      if (result.score.isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // Speak feedback after 1 second
      setTimeout(() => {
        speechRecognitionService.speakFeedback(result.score!.feedback);
      }, 1000);
    }
  };

  const handlePlayPronunciation = async () => {
    if (!letter) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Play the original audio file only
      await playSound(letter.audioFile);
    } catch (error) {
      console.error('Play pronunciation error:', error);
    }
  };

  const handleTryAgain = () => {
    setShowScore(false);
    setScore(null);
  };

  const calculateAverageScore = (): number => {
    if (attemptHistory.length === 0) return 0;
    const sum = attemptHistory.reduce((acc, s) => acc + s.accuracy, 0);
    return Math.round(sum / attemptHistory.length);
  };

  const getBestScore = (): number => {
    if (attemptHistory.length === 0) return 0;
    return Math.max(...attemptHistory.map(s => s.accuracy));
  };

  if (!letter) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primaryBlue, Colors.primaryBlueDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Practice Pronunciation</Text>
          <Text style={styles.headerSubtitle}>with AI Speech Recognition</Text>
        </LinearGradient>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Letter Display */}
          <View style={styles.letterDisplay}>
            <LinearGradient
              colors={[Colors.primaryPurple, Colors.primaryPurpleDark]}
              style={styles.letterCircle}
            >
              <Text style={styles.letterText}>{letter.letter}</Text>
            </LinearGradient>
            <Text style={styles.letterName}>{letter.name}</Text>
            <Text style={styles.letterPronunciation}>"{letter.pronunciation}"</Text>
          </View>

          {/* Demo Mode Banner */}
          {isDemoMode && (
            <View style={styles.demoBanner}>
              <Text style={styles.demoIcon}>🎭</Text>
              <View style={styles.demoTextContainer}>
                <Text style={styles.demoTitle}>Demo Mode Active</Text>
                <Text style={styles.demoText}>
                  Speech recognition unavailable. The AI will simulate scoring based on the expected pronunciation.
                </Text>
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>How to practice:</Text>
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Tap "Listen" to hear the correct pronunciation
              </Text>
            </View>
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                Tap the microphone and say the letter
              </Text>
            </View>
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                AI will analyze your pronunciation accuracy
              </Text>
            </View>
          </View>

          {/* Speech Recognition Controls */}
          <View style={styles.controlsContainer}>
            <SpeechButton
              isListening={isListening}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
              onPlayPronunciation={handlePlayPronunciation}
              disabled={isProcessing && !isListening}
            />
          </View>

          {/* Processing Indicator */}
          {isProcessing && !isListening && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryBlue} />
              <Text style={styles.processingText}>
                Analyzing pronunciation with AI...
              </Text>
            </View>
          )}

          {/* Accuracy Display */}
          <AccuracyMeter score={score} show={showScore} />

          {/* Try Again Button */}
          {showScore && (
            <TouchableOpacity
              style={styles.tryAgainButton}
              onPress={handleTryAgain}
            >
              <Text style={styles.tryAgainText}>Practice Again</Text>
            </TouchableOpacity>
          )}

          {/* Statistics */}
          {attemptHistory.length > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Your Progress</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{attemptHistory.length}</Text>
                  <Text style={styles.statLabel}>Attempts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.primaryGreen }]}>
                    {getBestScore()}%
                  </Text>
                  <Text style={styles.statLabel}>Best Score</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.primaryOrange }]}>
                    {calculateAverageScore()}%
                  </Text>
                  <Text style={styles.statLabel}>Average</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Spacing.screenPadding,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: FontWeight.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
  },
  letterDisplay: {
    alignItems: 'center',
    marginVertical: 30,
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  letterText: {
    fontSize: 72,
    fontWeight: FontWeight.black,
    color: Colors.white,
  },
  letterName: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 15,
  },
  letterPronunciation: {
    fontSize: 18,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  demoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: 20,
    alignItems: 'center',
    ...Shadows.small,
  },
  demoIcon: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  demoTextContainer: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: '#856404',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  instructionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: 20,
    ...Shadows.medium,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 15,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBlue,
    color: Colors.white,
    fontSize: 14,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  controlsContainer: {
    marginVertical: 20,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  tryAgainButton: {
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: 10,
    ...Shadows.medium,
  },
  tryAgainText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  statsContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: 20,
    ...Shadows.medium,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.primaryBlue,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 5,
  },
});
