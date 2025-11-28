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
import { imageMatchData } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { addStar } from '../utils/storage';

const ImageMatchScreen: React.FC = () => {
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleWordPress = (id: string) => {
    setSelectedWord(id);
    if (selectedImage) {
      checkMatch(id, selectedImage);
    }
  };

  const handleImagePress = (id: string) => {
    setSelectedImage(id);
    if (selectedWord) {
      checkMatch(selectedWord, id);
    }
  };

  const checkMatch = async (wordId: string, imageId: string) => {
    if (wordId === imageId) {
      // Correct match!
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await playSound('success.mp3');
      setMatches([...matches, wordId]);
      setScore(score + 10);
      await addStar(1);
    } else {
      // Wrong match
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Try Again!', "That's not the right match.");
    }
    setSelectedWord(null);
    setSelectedImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎴 Image Match</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <Text style={styles.instruction}>
        Match the Arabic words with their pictures!
      </Text>

      <View style={styles.content}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Words</Text>
          {imageMatchData.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.wordCard,
                selectedWord === item.id && styles.selected,
                matches.includes(item.id) && styles.matched,
              ]}
              onPress={() => !matches.includes(item.id) && handleWordPress(item.id)}
              disabled={matches.includes(item.id)}
            >
              <Text style={styles.wordText}>{item.word}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Pictures</Text>
          {imageMatchData.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.imageCard,
                selectedImage === item.id && styles.selected,
                matches.includes(item.id) && styles.matched,
              ]}
              onPress={() => !matches.includes(item.id) && handleImagePress(item.id)}
              disabled={matches.includes(item.id)}
            >
              <Text style={styles.imagePlaceholder}>🖼️</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primaryGreen,
  },
  instruction: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: Colors.primaryBlue,
    backgroundColor: '#E8F5F5',
  },
  matched: {
    backgroundColor: Colors.primaryGreen,
    opacity: 0.5,
  },
  wordText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  imagePlaceholder: {
    fontSize: 48,
  },
});

export default ImageMatchScreen;
