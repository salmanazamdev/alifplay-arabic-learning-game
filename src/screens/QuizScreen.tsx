import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';
import { ProgressBar, GradientButton } from '../components';
import { arabicLetters } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { addStar } from '../utils/storage';
import { 
  generateQuizQuestions, 
  calculateQuizScore, 
  getStarsForScore, 
  getScoreMessage 
} from '../utils/quizHelpers';

const QuizScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizData] = useState(() => generateQuizQuestions(arabicLetters, 10));
  const [scaleAnim] = useState(new Animated.Value(1));

  const current = quizData[currentQuestion];

  // Play audio when question changes
  useEffect(() => {
    const playQuestionAudio = async () => {
      if (current?.audioFile) {
        await playSound(current.audioFile);
      }
    };
    playQuestionAudio();
    
    // Reset animations
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [currentQuestion]);

  const handleAnswer = async (answer: string) => {
    if (answered) return;
    
    setAnswered(true);
    setSelectedOption(answer);
    const isCorrect = answer === current.correct;

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await playSound('success.mp3');
      setScore(score + 1);
      await addStar(2);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      if (currentQuestion < quizData.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setAnswered(false);
        setSelectedOption(null);
      } else {
        const finalScore = score + (isCorrect ? 1 : 0);
        const percentage = calculateQuizScore(finalScore, quizData.length);
        const stars = getStarsForScore(percentage);
        const message = getScoreMessage(percentage);
        
        Alert.alert(
          'Quiz Complete! 🎉',
          `${message}\n\nScore: ${finalScore}/${quizData.length} (${percentage}%)\nStars Earned: ${'⭐'.repeat(stars)}`
        );
      }
    }, 1500);
  };

  const progress = ((currentQuestion + 1) / quizData.length) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🎯 Quiz Time!</Text>
          <Text style={styles.subtitle}>Test your knowledge!</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} />
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {quizData.length}
        </Text>
      </View>

      {/* Question Area */}
      <View style={styles.questionContainer}>
        <Text style={styles.question}>{current.question}</Text>
        
        <TouchableOpacity 
          style={styles.audioButton}
          onPress={() => playSound(current.audioFile)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primaryPurple, Colors.primaryPurpleDark]}
            style={styles.audioButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.letter}>{current.letter}</Text>
            <View style={styles.audioHintContainer}>
              <Text style={styles.audioIcon}>🔊</Text>
              <Text style={styles.audioHint}>Tap to hear</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={styles.options}>
        {current.options.map((option, index) => {
          const isCorrectOption = option === current.correct;
          const isSelected = selectedOption === option;
          const showResult = answered;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                showResult && isCorrectOption && styles.correctOption,
                showResult && isSelected && !isCorrectOption && styles.wrongOption,
              ]}
              onPress={() => handleAnswer(option)}
              disabled={answered}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionText,
                showResult && isCorrectOption && styles.correctOptionText,
                showResult && isSelected && !isCorrectOption && styles.wrongOptionText,
              ]}>
                {option}
              </Text>
              {showResult && isCorrectOption && (
                <Text style={styles.optionIcon}>✓</Text>
              )}
              {showResult && isSelected && !isCorrectOption && (
                <Text style={styles.optionIcon}>✗</Text>
              )}
            </TouchableOpacity>
          );
        })}
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
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  scoreContainer: {
    backgroundColor: Colors.primaryPurpleLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 70,
  },
  scoreLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryPurpleDark,
    marginBottom: Spacing.xs,
  },
  scoreValue: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.black,
    color: Colors.primaryPurpleDark,
  },
  progressContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.xl,
  },
  progressText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  questionContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.xxl,
  },
  question: {
    fontSize: FontSize.h4,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  audioButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  audioButtonGradient: {
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    minWidth: 200,
  },
  letter: {
    fontSize: FontSize.arabicDisplay,
    fontWeight: FontWeight.black,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  audioHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  audioIcon: {
    fontSize: FontSize.body,
    marginRight: Spacing.xs,
  },
  audioHint: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  options: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.md,
  },
  optionButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  optionText: {
    fontSize: FontSize.h4,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    flex: 1,
  },
  optionIcon: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.black,
    marginLeft: Spacing.md,
  },
  correctOption: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  correctOptionText: {
    color: Colors.successDark,
  },
  wrongOption: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  wrongOptionText: {
    color: Colors.errorDark,
  },
});

export default QuizScreen;
