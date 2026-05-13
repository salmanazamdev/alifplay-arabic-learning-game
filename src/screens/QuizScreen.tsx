import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check, X, Star, Volume2 } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';
import { ProgressBar } from '../components';
import { arabicLetters } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { loadProgress, saveProgress } from '../utils/storage';
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
  const [showComplete, setShowComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [quizStars, setQuizStars] = useState(0);
  const [modalAnim] = useState(new Animated.Value(0));

  const current = quizData[currentQuestion];

  const handleAnswer = async (answer: string) => {
    if (answered) return;
    
    setAnswered(true);
    setSelectedOption(answer);
    const isCorrect = answer === current.correct;

    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(score + 1);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(async () => {
      if (currentQuestion < quizData.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setAnswered(false);
        setSelectedOption(null);
      } else {
        // Quiz complete
        const final = score + (isCorrect ? 1 : 0);
        const percentage = calculateQuizScore(final, quizData.length);
        const stars = getStarsForScore(percentage);
        
        setFinalScore(final);
        setQuizStars(stars);
        setShowComplete(true);
        
        // Save progress
        const currentProgress = await loadProgress();
        if (currentProgress) {
          currentProgress.quizScore = Math.max(currentProgress.quizScore || 0, percentage);
          currentProgress.starsEarned = (currentProgress.starsEarned || 0) + stars;
          await saveProgress(currentProgress);
        }
        
        Animated.spring(modalAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    }, 1200);
  };

  const handleRestart = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowComplete(false);
      setCurrentQuestion(0);
      setScore(0);
      setAnswered(false);
      setSelectedOption(null);
    });
  };

  const progress = ((currentQuestion + 1) / quizData.length) * 100;
  const percentage = calculateQuizScore(finalScore, quizData.length);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Letter Quiz</Text>
            <Text style={styles.subtitle}>Test your knowledge</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{score}/{quizData.length}</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} color={Colors.primaryPurple} />
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {quizData.length}
        </Text>
      </View>

      {/* Question Area */}
      <View style={styles.questionContainer}>
        <Text style={styles.question}>{current.question}</Text>
        
        <TouchableOpacity 
          style={styles.letterCard}
          onPress={() => playSound(current.audioFile)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primaryPurple, Colors.primaryPurpleDark]}
            style={styles.letterGradient}
          >
            <Text style={styles.letter}>{current.letter}</Text>
            <View style={styles.soundBadge}>
              <Volume2 size={16} color={Colors.white} strokeWidth={2.4} />
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
                <View style={styles.iconBadge}>
                  <Check size={16} color={Colors.white} strokeWidth={2.4} />
                </View>
              )}
              {showResult && isSelected && !isCorrectOption && (
                <View style={[styles.iconBadge, styles.wrongBadge]}>
                  <X size={16} color={Colors.white} strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Complete Modal */}
      <Modal
        visible={showComplete}
        transparent
        animationType="none"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: modalAnim,
              },
            ]}
          >
            <LinearGradient
              colors={[Colors.white, Colors.primaryPurpleLight]}
              style={styles.modalGradient}
            >
              <Star size={54} color={Colors.primaryPurple} strokeWidth={2.2} style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Quiz Complete!</Text>
              <Text style={styles.modalSubtitle}>
                {getScoreMessage(percentage)}
              </Text>
              
              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreLarge}>{finalScore}/{quizData.length}</Text>
                <Text style={styles.percentageText}>{percentage}%</Text>
              </View>
              
              {/* Stars */}
              <View style={styles.starsContainer}>
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    size={34}
                    strokeWidth={2.2}
                    color={star <= quizStars ? Colors.primaryOrange : Colors.border}
                    fill={star <= quizStars ? Colors.primaryOrange : 'transparent'}
                  />
                ))}
              </View>
              
              <Text style={styles.starsText}>
                +{quizStars} stars earned
              </Text>
              
              <TouchableOpacity
                style={styles.restartButton}
                onPress={handleRestart}
              >
                <LinearGradient
                  colors={[Colors.primaryPurple, Colors.primaryPurpleDark]}
                  style={styles.restartGradient}
                >
                  <Text style={styles.restartText}>Play Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
  scoreCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 80,
    ...Shadows.medium,
  },
  scoreLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: FontWeight.extrabold,
    color: Colors.primaryPurple,
  },
  progressContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.xl,
  },
  question: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  letterCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  letterGradient: {
    paddingHorizontal: 60,
    paddingVertical: 40,
    alignItems: 'center',
    position: 'relative',
  },
  letter: {
    fontSize: 80,
    fontWeight: FontWeight.black,
    color: Colors.white,
    fontFamily: 'Cairo_700Bold',
  },
  soundBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  options: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.md,
  },
  optionButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
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
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  wrongBadge: {
    backgroundColor: Colors.error,
  },
  correctOption: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
    borderWidth: 3,
  },
  correctOptionText: {
    color: Colors.successDark,
  },
  wrongOption: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    borderWidth: 3,
  },
  wrongOptionText: {
    color: Colors.errorDark,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  modalGradient: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreLarge: {
    fontSize: 48,
    fontWeight: FontWeight.black,
    color: Colors.primaryPurple,
  },
  percentageText: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  starsText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  restartButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  restartGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  restartText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default QuizScreen;
