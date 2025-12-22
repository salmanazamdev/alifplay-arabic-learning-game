import React, { useState, useEffect, useCallback } from 'react';
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
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';
import { ProgressBar, GradientButton } from '../components';
import { imageMatchData } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { addStar } from '../utils/storage';

const ITEMS_PER_LEVEL = 3;
const TOTAL_LEVELS = Math.ceil(imageMatchData.length / ITEMS_PER_LEVEL);

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
  const [shuffledImages, setShuffledImages] = useState(imageMatchData);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [levelStars, setLevelStars] = useState(0);
  
  // Animations
  const [scaleAnim] = useState(new Animated.Value(1));
  const [modalAnim] = useState(new Animated.Value(0));

  // Get current level items
  const getCurrentLevelItems = useCallback(() => {
    const startIdx = (currentLevel - 1) * ITEMS_PER_LEVEL;
    const endIdx = Math.min(startIdx + ITEMS_PER_LEVEL, imageMatchData.length);
    return imageMatchData.slice(startIdx, endIdx);
  }, [currentLevel]);

  const currentLevelItems = getCurrentLevelItems();

  useEffect(() => {
    // Shuffle images for current level
    const levelItems = getCurrentLevelItems();
    setShuffledImages([...levelItems].sort(() => Math.random() - 0.5));
    setLevelMatches([]);
    setMistakes(0);
  }, [currentLevel, getCurrentLevelItems]);

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
    // Animate
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

    if (wordId === imageId) {
      // Correct match!
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await playSound('success.mp3');
      
      const newMatches = [...levelMatches, wordId];
      setLevelMatches(newMatches);
      setTotalScore(totalScore + 10);
      
      // Check if level complete
      if (newMatches.length === currentLevelItems.length) {
        setTimeout(() => {
          completLevel();
        }, 500);
      }
    } else {
      // Wrong match
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMistakes(mistakes + 1);
    }
    
    setSelectedWord(null);
    setSelectedImage(null);
  }, [levelMatches, totalScore, mistakes, currentLevelItems, scaleAnim]);

  const completLevel = async () => {
    // Calculate stars (3 = perfect, 2 = 1-2 mistakes, 1 = 3+ mistakes)
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    setLevelStars(stars);
    setTotalStars(totalStars + stars);
    await addStar(stars);
    
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
  const overallProgress = (totalMatches / imageMatchData.length) * 100;

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
            <Text style={styles.statText}>{totalMatches}/{imageMatchData.length} matches</Text>
            <Text style={styles.statText}>⭐ {totalStars} stars</Text>
          </View>
        </View>
      </View>

      {/* Game Area */}
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
                    <Text style={styles.checkIcon}>✓</Text>
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
                    : selectedImage === item.id
                    ? [Colors.primaryPinkLight, Colors.primaryPink]
                    : [Colors.white, Colors.white]
                }
                style={styles.cardGradient}
              >
                <Text style={styles.emojiImage}>{item.emoji}</Text>
                {levelMatches.includes(item.id) && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
              <Text style={styles.modalEmoji}>🎉</Text>
              <Text style={styles.modalTitle}>
                {currentLevel === TOTAL_LEVELS ? 'All Complete!' : 'Level Complete!'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Level {currentLevel} of {TOTAL_LEVELS}
              </Text>
              
              {/* Stars */}
              <View style={styles.starsContainer}>
                {[1, 2, 3].map((star) => (
                  <Text 
                    key={star} 
                    style={[
                      styles.star,
                      star <= levelStars && styles.starActive
                    ]}
                  >
                    ⭐
                  </Text>
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
  statText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  gameArea: {
    flex: 1,
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
  checkIcon: {
    fontSize: 16,
    fontWeight: FontWeight.black,
    color: Colors.success,
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
  modalEmoji: {
    fontSize: 64,
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
  star: {
    fontSize: 48,
    opacity: 0.3,
  },
  starActive: {
    opacity: 1,
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
