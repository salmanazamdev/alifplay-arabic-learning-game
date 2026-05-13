import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check, Sparkles, Star } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';
import { ProgressBar, GradientButton } from '../components';
import { imageMatchData, arabicLetters, ImageMatchPair } from '../utils/gameData';
import { loadProgress, saveProgress } from '../utils/storage';

const ITEMS_PER_LEVEL = 5;
const TOTAL_LEVELS = 10;
const TOTAL_REQUIRED_ITEMS = ITEMS_PER_LEVEL * TOTAL_LEVELS;

const EMOJI_POOL = [
  '🦁', '🐱', '📚', '🦆', '🐘', '🐟', '☀️', '🌙', '🌸', '🌳',
  '🍎', '🍌', '🍇', '🍉', '🥕', '🍞', '🥛', '🚗', '🚌', '🚲',
  '✈️', '🚀', '⚽', '🏀', '🎈', '🎁', '⌚', '💡', '🔑', '📱',
  '🏠', '🏫', '🏥', '🏞️', '🌊', '⛰️', '🌧️', '❄️', '🔥', '⭐',
  '🌈', '🧩', '🧸', '🎨', '🎵', '🐪', '🐓', '🐎', '🐝', '🦋',
];

const UNIQUE_IMAGE_MATCH_DATA: ImageMatchPair[] = (() => {
  const baseItems = imageMatchData.map((item, index) => ({
    ...item,
    id: `base-${index + 1}`,
  }));

  const letterItems: ImageMatchPair[] = arabicLetters.map((letter, index) => ({
    id: `letter-${letter.id}`,
    word: letter.example,
    image: letter.exampleImage || `example-${letter.id}.png`,
    audio: letter.audioFile || `${letter.id}.mp3`,
    emoji: EMOJI_POOL[(index + 10) % EMOJI_POOL.length],
  }));

  const extraItems: ImageMatchPair[] = [
    { id: 'extra-1', word: 'تفاحة', image: 'apple.png', audio: 'tuffaha.mp3', emoji: '🍎' },
    { id: 'extra-2', word: 'موزة', image: 'banana.png', audio: 'mawza.mp3', emoji: '🍌' },
    { id: 'extra-3', word: 'ساعة', image: 'clock.png', audio: 'saa.mp3', emoji: '⌚' },
    { id: 'extra-4', word: 'هاتف', image: 'phone.png', audio: 'hatif.mp3', emoji: '📱' },
    { id: 'extra-5', word: 'مفتاح', image: 'key.png', audio: 'miftah.mp3', emoji: '🔑' },
    { id: 'extra-6', word: 'قلم', image: 'pen.png', audio: 'qalam.mp3', emoji: '✏️' },
    { id: 'extra-7', word: 'باب', image: 'door.png', audio: 'bab.mp3', emoji: '🚪' },
    { id: 'extra-8', word: 'كرسي', image: 'chair.png', audio: 'kursi.mp3', emoji: '🪑' },
    { id: 'extra-9', word: 'مطر', image: 'rain.png', audio: 'matar.mp3', emoji: '🌧️' },
    { id: 'extra-10', word: 'ثلج', image: 'snow.png', audio: 'thalj.mp3', emoji: '❄️' },
    { id: 'extra-11', word: 'نار', image: 'fire.png', audio: 'nar.mp3', emoji: '🔥' },
    { id: 'extra-12', word: 'نجمة', image: 'star.png', audio: 'najma.mp3', emoji: '⭐' },
  ];

  const combined = [...baseItems, ...letterItems, ...extraItems];
  const uniqueByWord: ImageMatchPair[] = combined.filter(
    (item, index, arr) => arr.findIndex(x => x.word === item.word) === index
  );

  let fillerIndex = 1;
  while (uniqueByWord.length < TOTAL_REQUIRED_ITEMS) {
    uniqueByWord.push({
      id: `filler-${fillerIndex}`,
      word: `كلمة ${fillerIndex}`,
      image: `word-${fillerIndex}.png`,
      audio: `word-${fillerIndex}.mp3`,
      emoji: EMOJI_POOL[(fillerIndex + 20) % EMOJI_POOL.length],
    });
    fillerIndex += 1;
  }

  return uniqueByWord.slice(0, TOTAL_REQUIRED_ITEMS);
})();

const ImageMatchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  // Level system
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelMatches, setLevelMatches] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  
  // Game state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [wrongMatch, setWrongMatch] = useState<boolean>(false);
  const [shuffledImages, setShuffledImages] = useState<ImageMatchPair[]>([]);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [levelStars, setLevelStars] = useState(0);
  
  // Animations
  const [scaleAnim] = useState(new Animated.Value(1));
  const [modalAnim] = useState(new Animated.Value(0));

  // Get current level items
  const getCurrentLevelItems = useCallback(() => {
    const startIdx = (currentLevel - 1) * ITEMS_PER_LEVEL;
    const endIdx = startIdx + ITEMS_PER_LEVEL;
    return UNIQUE_IMAGE_MATCH_DATA.slice(startIdx, endIdx);
  }, [currentLevel]);

  const currentLevelItems = getCurrentLevelItems();

  useEffect(() => {
    // Shuffle images for current level
    const levelItems = getCurrentLevelItems();
    setShuffledImages([...levelItems].sort(() => Math.random() - 0.5));
    setLevelMatches([]);
    setMistakes(0);
  }, [currentLevel, getCurrentLevelItems]);

  const handleWordPress = useCallback(async (id: string) => {
    if (levelMatches.includes(id)) return;
    
    setSelectedWord(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedImage) {
      await checkMatch(id, selectedImage);
    }
  }, [levelMatches, selectedImage]);

  const handleImagePress = useCallback(async (id: string) => {
    if (levelMatches.includes(id)) return;
    
    setSelectedImage(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedWord) {
      await checkMatch(selectedWord, id);
    }
  }, [levelMatches, selectedWord]);

  const checkMatch = useCallback(async (wordId: string, imageId: string) => {
    if (wordId === imageId) {
      // Correct match! Immediately show success
      const newMatches = [...levelMatches, wordId];
      setLevelMatches(newMatches);
      setTotalScore(totalScore + 10);
      
      // Clear selections immediately so cards turn green
      setSelectedWord(null);
      setSelectedImage(null);
      setWrongMatch(false);
      
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Check if level complete
      if (newMatches.length === currentLevelItems.length) {
        setTimeout(() => {
          completLevel();
        }, 500);
      }
    } else {
      // Wrong match - show red feedback longer
      setWrongMatch(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMistakes(mistakes + 1);
      
      // Keep red state visible for 800ms
      setTimeout(() => {
        setSelectedWord(null);
        setSelectedImage(null);
        setWrongMatch(false);
      }, 800);
    }
  }, [levelMatches, totalScore, mistakes, currentLevelItems]);

  const completLevel = async () => {
    // Calculate stars (3 = perfect, 2 = 1-2 mistakes, 1 = 3+ mistakes)
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    setLevelStars(stars);
    setTotalStars(totalStars + stars);
    
    // Save progress - calculate percentage based on current level
    const progressPercentage = ((currentLevel) / TOTAL_LEVELS) * 100;
    const currentProgress = await loadProgress();
    if (currentProgress) {
      currentProgress.imageMatchScore = Math.max(currentProgress.imageMatchScore || 0, progressPercentage);
      currentProgress.starsEarned = (currentProgress.starsEarned || 0) + stars;
      await saveProgress(currentProgress);
    }
    
    // Show modal
    setShowLevelComplete(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleNextLevel = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowLevelComplete(false);
      if (currentLevel < TOTAL_LEVELS) {
        setCurrentLevel(currentLevel + 1);
      } else {
        // All levels complete
        resetGame();
      }
    });
  };

  const resetGame = () => {
    setCurrentLevel(1);
    setTotalScore(0);
    setTotalStars(0);
    setLevelMatches([]);
    setMistakes(0);
    setSelectedWord(null);
    setSelectedImage(null);
  };

  const totalMatches = (currentLevel - 1) * ITEMS_PER_LEVEL + levelMatches.length;
  const overallProgress = (totalMatches / (TOTAL_LEVELS * ITEMS_PER_LEVEL)) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Word Match</Text>
            <Text style={styles.subtitle}>Match words to images</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level</Text>
            <Text style={styles.levelNumber}>{currentLevel}/{TOTAL_LEVELS}</Text>
          </View>
        </View>
        
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <ProgressBar progress={overallProgress} color={Colors.primaryGreen} />
          <View style={styles.statsRow}>
            <Text style={styles.statText}>{totalMatches}/{TOTAL_LEVELS * ITEMS_PER_LEVEL} matches</Text>
            <View style={styles.statRowItem}>
              <Star size={14} color={Colors.primaryOrange} strokeWidth={2.4} />
              <Text style={styles.statText}>{totalStars} stars</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Game Area */}
      <ScrollView
        style={styles.gameScroll}
        contentContainerStyle={styles.gameScrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.gameArea}>
        {/* Words Column */}
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>Arabic Words</Text>
          </View>
          {currentLevelItems.map((item) => (
            <TouchableOpacity
              key={`word-${item.id}`}
              style={[
                styles.card,
                selectedWord === item.id && styles.selectedCard,
                levelMatches.includes(item.id) && styles.matchedCard,
              ]}
              onPress={() => handleWordPress(item.id)}
              disabled={levelMatches.includes(item.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  levelMatches.includes(item.id)
                    ? [Colors.successLight, Colors.success]
                    : wrongMatch && selectedWord === item.id
                    ? ['#ffcccc', '#ff6b6b']
                    : selectedWord === item.id
                    ? [Colors.primaryBlueLight, Colors.primaryBlue]
                    : [Colors.white, Colors.white]
                }
                style={styles.cardGradient}
              >
                <Text style={[
                  styles.wordText,
                  (selectedWord === item.id || levelMatches.includes(item.id)) && styles.whiteText,
                ]}>
                  {item.word}
                </Text>
                {levelMatches.includes(item.id) && (
                  <View style={styles.checkBadge}>
                    <Check size={16} color={Colors.success} strokeWidth={2.4} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Images Column */}
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>Images</Text>
          </View>
          {shuffledImages.map((item) => (
            <TouchableOpacity
              key={`image-${item.id}`}
              style={[
                styles.card,
                selectedImage === item.id && styles.selectedCard,
                levelMatches.includes(item.id) && styles.matchedCard,
              ]}
              onPress={() => handleImagePress(item.id)}
              disabled={levelMatches.includes(item.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  levelMatches.includes(item.id)
                    ? [Colors.successLight, Colors.success]
                    : wrongMatch && selectedImage === item.id
                    ? ['#ffcccc', '#ff6b6b']
                    : selectedImage === item.id
                    ? [Colors.primaryPinkLight, Colors.primaryPink]
                    : [Colors.white, Colors.white]
                }
                style={styles.cardGradient}
              >
                <Text style={styles.emojiImage}>{item.emoji}</Text>
                {levelMatches.includes(item.id) && (
                  <View style={styles.checkBadge}>
                    <Check size={16} color={Colors.success} strokeWidth={2.4} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </ScrollView>

      {/* Level Complete Modal */}
      <Modal
        visible={showLevelComplete}
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
              colors={[Colors.white, Colors.primaryGreenLight]}
              style={styles.modalGradient}
            >
              <Sparkles size={56} color={Colors.primaryGreen} strokeWidth={2.2} style={styles.modalIcon} />
              <Text style={styles.modalTitle}>
                {currentLevel === TOTAL_LEVELS ? 'All Complete!' : 'Level Complete!'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Level {currentLevel} of {TOTAL_LEVELS}
              </Text>
              
              {/* Stars */}
              <View style={styles.starsContainer}>
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    size={34}
                    strokeWidth={2.2}
                    color={star <= levelStars ? Colors.primaryGreen : Colors.border}
                    fill={star <= levelStars ? Colors.primaryGreen : 'transparent'}
                  />
                ))}
              </View>
              
              <Text style={styles.starsText}>
                {levelStars === 3 ? 'Perfect!' : levelStars === 2 ? 'Great Job!' : 'Good Effort!'}
              </Text>
              
              <Text style={styles.scoreText}>+{levelStars} stars earned</Text>
              
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleNextLevel}
              >
                <LinearGradient
                  colors={[Colors.primaryGreen, Colors.primaryGreenDark]}
                  style={styles.continueGradient}
                >
                  <Text style={styles.continueText}>
                    {currentLevel === TOTAL_LEVELS ? 'Play Again' : 'Continue to Next Level'}
                  </Text>
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
    marginBottom: Spacing.md,
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
  levelBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 80,
    ...Shadows.medium,
  },
  levelText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: FontWeight.extrabold,
    color: Colors.primaryGreen,
  },
  progressSection: {
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  statRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  gameScroll: {
    flex: 1,
  },
  gameScrollContent: {
    paddingBottom: Spacing.xxl * 2,
  },
  gameArea: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.borderLight,
  },
  columnTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  card: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  cardGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    position: 'relative',
  },
  selectedCard: {
    ...Shadows.large,
    transform: [{ scale: 1.02 }],
  },
  matchedCard: {
    opacity: 0.6,
  },
  wordText: {
    fontSize: 32,
    fontWeight: FontWeight.black,
    color: Colors.text,
    fontFamily: 'Cairo_700Bold',
  },
  whiteText: {
    color: Colors.white,
  },
  emojiImage: {
    fontSize: 56,
  },
  checkBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  starsText: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.primaryGreen,
    marginBottom: Spacing.xs,
  },
  scoreText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  continueButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  continueGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  continueText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default ImageMatchScreen;
