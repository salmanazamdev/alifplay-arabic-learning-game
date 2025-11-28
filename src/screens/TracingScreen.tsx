import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { arabicLetters } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { addStar } from '../utils/storage';

const { width } = Dimensions.get('window');

const TracingScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const currentLetter = arabicLetters[currentIndex];

  const handleComplete = async () => {
    setIsComplete(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playSound('success.mp3');
    await addStar(1);
  };

  const handleNext = () => {
    if (currentIndex < arabicLetters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsComplete(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Letter Tracing</Text>
          <Text style={styles.progress}>
            {currentIndex + 1} / {arabicLetters.length}
          </Text>
        </View>

        <View style={styles.letterContainer}>
          <Text style={styles.arabicLetter}>{currentLetter.letter}</Text>
          <Text style={styles.letterName}>{currentLetter.name}</Text>
          <Text style={styles.pronunciation}>"{currentLetter.pronunciation}"</Text>
        </View>

        <View style={styles.canvasContainer}>
          {/* Canvas for drawing would go here */}
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Draw the letter {currentLetter.letter} here
            </Text>
          </View>
        </View>

        {isComplete && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>🎉 Great Job!</Text>
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleComplete}
          >
            <Text style={styles.buttonText}>Complete</Text>
          </TouchableOpacity>
          {isComplete && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>Next Letter</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  progress: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  letterContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  arabicLetter: {
    fontSize: 120,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
  letterName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 10,
  },
  pronunciation: {
    fontSize: 18,
    color: Colors.textLight,
    marginTop: 5,
  },
  canvasContainer: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  successMessage: {
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.success,
  },
  buttons: {
    padding: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primaryBlue,
  },
  buttonSecondary: {
    backgroundColor: Colors.primaryGreen,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default TracingScreen;
