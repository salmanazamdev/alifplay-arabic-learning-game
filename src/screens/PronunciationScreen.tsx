import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';
import { StatBadge, GradientCard } from '../components';
import { arabicLetters } from '../utils/gameData';
import { playSound } from '../utils/audio';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.screenPadding * 2 - Spacing.md) / 2;

const PronunciationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingAnimation] = useState(new Animated.Value(1));

  const handleLetterPress = async (letter: typeof arabicLetters[0]) => {
    setSelectedId(letter.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Audio wave animation
    Animated.sequence([
      Animated.timing(playingAnimation, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(playingAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    await playSound(letter.audioFile);
    
    setTimeout(() => {
      setSelectedId(null);
    }, 600);
  };

  const renderLetter = ({ item, index }: { item: typeof arabicLetters[0]; index: number }) => {
    const isSelected = selectedId === item.id;
    
    // Different gradient colors for variety
    const gradients: [string, string][] = [
      [Colors.primaryBlue, Colors.primaryBlueDark],
      [Colors.primaryPink, Colors.primaryPinkDark],
      [Colors.primaryPurple, Colors.primaryPurpleDark],
      [Colors.primaryOrange, Colors.primaryOrangeDark],
      [Colors.primaryGreen, Colors.primaryGreenDark],
      [Colors.primaryYellow, Colors.primaryYellowDark],
    ];
    const gradient = gradients[index % gradients.length];
    
    return (
      <GradientCard
        style={styles.letterCard}
        gradientColors={gradient}
        onPress={() => handleLetterPress(item)}
        isSelected={isSelected}
        contentStyle={styles.letterCardContent}
      >
        <View style={styles.audioIconContainer}>
          <Text style={styles.audioIcon}>🔊</Text>
        </View>
        <Text style={styles.letterText}>{item.letter}</Text>
        <View style={styles.letterInfo}>
          <Text style={styles.letterLabel}>{item.name}</Text>
          <Text style={styles.letterPronunciation}>"{item.pronunciation}"</Text>
        </View>
      </GradientCard>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔊 Pronunciation Practice</Text>
        <Text style={styles.subtitle}>Tap any letter to hear its sound!</Text>
        <View style={styles.statsContainer}>
          <StatBadge
            value={arabicLetters.length}
            label="Letters"
          />
        </View>
      </View>

      <FlatList
        data={arabicLetters}
        renderItem={renderLetter}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + Spacing.xl }
        ]}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
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
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  grid: {
    paddingHorizontal: Spacing.screenPadding,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  letterCard: {
    width: CARD_WIDTH,
  },
  letterCardContent: {
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'space-between',
  },
  audioIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  audioIcon: {
    fontSize: FontSize.body,
  },
  letterText: {
    fontSize: FontSize.arabicLarge,
    fontWeight: FontWeight.black,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  letterInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '100%',
  },
  letterLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  letterPronunciation: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default PronunciationScreen;
