import React, { useState, useCallback, useEffect } from 'react';
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
import { PronunciationPracticeModal } from '../components/PronunciationPracticeModal';
import { arabicLetters } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { loadProgress, saveProgress } from '../utils/storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.screenPadding * 2 - Spacing.md) / 2;

const PronunciationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingAnimation] = useState(new Animated.Value(1));
  const [listenedLetters, setListenedLetters] = useState<Set<string>>(new Set());
  const [practiceModalVisible, setPracticeModalVisible] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<typeof arabicLetters[0] | null>(null);

  useEffect(() => {
    // Load listened letters from progress
    loadProgress().then(progress => {
      if (progress?.tracingCompleted) {
        setListenedLetters(new Set(progress.tracingCompleted));
      }
    });
  }, []);

  const handleLetterPress = useCallback(async (letter: typeof arabicLetters[0]) => {
    setSelectedId(letter.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Track listened letters
    const newListenedLetters = new Set(listenedLetters);
    newListenedLetters.add(letter.id);
    setListenedLetters(newListenedLetters);
    
    // Save progress
    const currentProgress = await loadProgress();
    if (currentProgress) {
      const pronunciationPercentage = (newListenedLetters.size / arabicLetters.length) * 100;
      currentProgress.pronunciationScore = Math.max(currentProgress.pronunciationScore || 0, pronunciationPercentage);
      await saveProgress(currentProgress);
    }
    
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
  }, [playingAnimation, listenedLetters]);

  const handleLetterLongPress = useCallback((letter: typeof arabicLetters[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedLetter(letter);
    setPracticeModalVisible(true);
  }, []);

  const renderLetter = useCallback(({ item, index }: { item: typeof arabicLetters[0]; index: number }) => {
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
        onLongPress={() => handleLetterLongPress(item)}
        isSelected={isSelected}
        contentStyle={styles.letterCardContent}
      >
        <View 
          style={styles.audioIconContainer}
          accessible={false}
        >
          <Text style={styles.audioIcon}>🔊</Text>
        </View>
        <Text 
          style={styles.letterText}
          accessible={true}
          accessibilityLabel={`Arabic letter ${item.name}, pronounced ${item.pronunciation}`}
        >
          {item.letter}
        </Text>
        <View style={styles.letterInfo}>
          <Text style={styles.letterLabel}>{item.name}</Text>
          <Text style={styles.letterPronunciation}>"{item.pronunciation}"</Text>
        </View>
      </GradientCard>
    );
  }, [selectedId, handleLetterPress, handleLetterLongPress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Letter Sounds</Text>
            <Text style={styles.subtitle}>Perfect your Arabic pronunciation</Text>
            <View style={styles.aiPracticeHint}>
              <Text style={styles.aiHintText}>💡 Long press any letter for AI practice</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{arabicLetters.length}</Text>
              <Text style={styles.statLabel}>Letters</Text>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>🔊</Text>
              </View>
            </View>
          </View>
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={5}
      />

      {/* AI Practice Modal */}
      <PronunciationPracticeModal
        visible={practiceModalVisible}
        onClose={() => setPracticeModalVisible(false)}
        letter={selectedLetter}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  aiPracticeHint: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  aiHintText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryBlue,
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
  headerRight: {
    alignItems: 'flex-end',
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 100,
    ...Shadows.medium,
    position: 'relative',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.primaryGreen,
    lineHeight: 36,
  },
  statLabel: {
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  iconBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  iconText: {
    fontSize: 16,
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
