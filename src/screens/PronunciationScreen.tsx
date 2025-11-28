import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { arabicLetters } from '../utils/gameData';
import { playSound } from '../utils/audio';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const PronunciationScreen: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleLetterPress = async (letter: typeof arabicLetters[0]) => {
    setSelectedId(letter.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playSound(letter.audioFile);
    setTimeout(() => {
      setSelectedId(null);
    }, 500);
  };

  const renderLetter = ({ item }: { item: typeof arabicLetters[0] }) => {
    const isSelected = selectedId === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.letterCard,
          isSelected && styles.letterCardSelected,
        ]}
        onPress={() => handleLetterPress(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.letterText}>{item.letter}</Text>
        <Text style={styles.letterLabel}>{item.name}</Text>
        <Text style={styles.letterPronunciation}>"{item.pronunciation}"</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔊 Pronunciation Practice</Text>
        <Text style={styles.subtitle}>Tap to hear the sound!</Text>
      </View>

      <FlatList
        data={arabicLetters}
        renderItem={renderLetter}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 8,
  },
  grid: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  letterCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  letterCardSelected: {
    backgroundColor: Colors.primaryBlue,
    transform: [{ scale: 0.95 }],
  },
  letterText: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.text,
  },
  letterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
    marginTop: 8,
  },
  letterPronunciation: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
});

export default PronunciationScreen;
