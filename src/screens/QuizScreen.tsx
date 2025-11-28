import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { arabicLetters } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { addStar } from '../utils/storage';

const QuizScreen: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  const quizData = arabicLetters.slice(0, 5).map((letter) => ({
    question: `What is this letter?`,
    letter: letter.letter,
    options: [letter.name, 'Wrong 1', 'Wrong 2', 'Wrong 3']
      .sort(() => Math.random() - 0.5),
    correct: letter.name,
  }));

  const handleAnswer = async (answer: string) => {
    setAnswered(true);
    const isCorrect = answer === quizData[currentQuestion].correct;

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
      } else {
        Alert.alert(
          'Quiz Complete!',
          `You scored ${score + (isCorrect ? 1 : 0)} out of ${quizData.length}!`
        );
      }
    }, 1500);
  };

  const current = quizData[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Quiz Time!</Text>
        <Text style={styles.score}>
          {currentQuestion + 1} / {quizData.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.question}>{current.question}</Text>
        <Text style={styles.letter}>{current.letter}</Text>
      </View>

      <View style={styles.options}>
        {current.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              answered && option === current.correct && styles.correctOption,
              answered && option !== current.correct && styles.wrongOption,
            ]}
            onPress={() => !answered && handleAnswer(option)}
            disabled={answered}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryPurple,
  },
  questionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  letter: {
    fontSize: 120,
    fontWeight: '700',
    color: Colors.primaryPurple,
  },
  options: {
    padding: 20,
    gap: 12,
  },
  optionButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  correctOption: {
    backgroundColor: Colors.primaryGreen,
    borderColor: Colors.primaryGreen,
  },
  wrongOption: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
});

export default QuizScreen;
