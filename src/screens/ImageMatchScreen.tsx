import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';import { ProgressBar, GradientButton, GradientCard } from '../components';import { imageMatchData } from '../utils/gameData';
import { playSound } from '../utils/audio';
import { addStar } from '../utils/storage';

const ImageMatchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shuffledImages, setShuffledImages] = useState(imageMatchData);
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Shuffle images on mount
    setShuffledImages([...imageMatchData].sort(() => Math.random() - 0.5));
  }, []);

  const handleWordPress = useCallback(async (id: string) => {
    if (matches.includes(id)) return;
    
    setSelectedWord(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedImage) {
      await checkMatch(id, selectedImage);
    }
  }, [matches, selectedImage, checkMatch]);

  const handleImagePress = useCallback(async (id: string) => {
    if (matches.includes(id)) return;
    
    setSelectedImage(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedWord) {
      await checkMatch(selectedWord, id);
    }
  }, [matches, selectedWord, checkMatch]);

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
      setMatches([...matches, wordId]);
      setScore(score + 10);
      await addStar(1);
      
      // Check if all matched
      if (matches.length + 1 === imageMatchData.length) {
        setTimeout(() => {
          Alert.alert(
            'Amazing! 🎉',
            `You matched all ${imageMatchData.length} items!\nScore: ${score + 10}`,
            [{ text: 'Play Again', onPress: resetGame }]
          );
        }, 500);
      }
    } else {
      // Wrong match
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setSelectedWord(null);
    setSelectedImage(null);
  }, [matches, score, scaleAnim]);

  const resetGame = () => {
    setScore(0);
    setMatches([]);
    setSelectedWord(null);
    setSelectedImage(null);
    setShuffledImages([...imageMatchData].sort(() => Math.random() - 0.5));
  };

  const progress = (matches.length / imageMatchData.length) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🎴 Image Match</Text>
          <Text style={styles.subtitle}>Connect words to pictures!</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} color={Colors.primaryGreen} />
        <Text style={styles.progressText}>
          {matches.length} / {imageMatchData.length} matched
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Words Column */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>Words</Text>
              <View style={styles.columnBadge}>
                <Text style={styles.columnBadgeText}>📝</Text>
              </View>
            </View>
            {imageMatchData.map((item) => (
              <TouchableOpacity
                key={`word-${item.id}`}
                style={[
                  styles.wordCard,
                  selectedWord === item.id && styles.selectedCard,
                  matches.includes(item.id) && styles.matchedCard,
                ]}
                onPress={() => handleWordPress(item.id)}
                disabled={matches.includes(item.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    matches.includes(item.id)
                      ? [Colors.successLight, Colors.success]
                      : selectedWord === item.id
                      ? [Colors.primaryBlueLight, Colors.primaryBlue]
                      : [Colors.white, Colors.white]
                  }
                  style={styles.cardGradient}
                >
                  <Text style={[
                    styles.wordText,
                    (selectedWord === item.id || matches.includes(item.id)) && styles.whiteText,
                  ]}>
                    {item.word}
                  </Text>
                  {matches.includes(item.id) && (
                    <Text style={styles.matchIcon}>✓</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Images Column */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>Pictures</Text>
              <View style={styles.columnBadge}>
                <Text style={styles.columnBadgeText}>🖼️</Text>
              </View>
            </View>
            {shuffledImages.map((item) => (
              <TouchableOpacity
                key={`image-${item.id}`}
                style={[
                  styles.imageCard,
                  selectedImage === item.id && styles.selectedCard,
                  matches.includes(item.id) && styles.matchedCard,
                ]}
                onPress={() => handleImagePress(item.id)}
                disabled={matches.includes(item.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    matches.includes(item.id)
                      ? [Colors.successLight, Colors.success]
                      : selectedImage === item.id
                      ? [Colors.primaryPinkLight, Colors.primaryPink]
                      : [Colors.white, Colors.white]
                  }
                  style={styles.cardGradient}
                >
                  <Text style={styles.emojiImage}>{item.emoji}</Text>
                  {matches.includes(item.id) && (
                    <Text style={styles.matchIcon}>✓</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: Colors.primaryGreenLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 70,
  },
  scoreLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryGreenDark,
    marginBottom: Spacing.xs,
  },
  scoreValue: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.black,
    color: Colors.primaryGreenDark,
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.md,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  columnTitle: {
    fontSize: FontSize.h5,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  columnBadge: {
    width: 28,
    height: 28,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  columnBadgeText: {
    fontSize: FontSize.bodySmall,
  },
  wordCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  imageCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  cardGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    position: 'relative',
  },
  selectedCard: {
    ...Shadows.medium,
  },
  matchedCard: {
    opacity: 0.7,
  },
  wordText: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.black,
    color: Colors.text,
  },
  whiteText: {
    color: Colors.white,
  },
  emojiImage: {
    fontSize: 48,
  },
  matchIcon: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    fontSize: FontSize.h4,
    fontWeight: FontWeight.black,
    color: Colors.white,
  },
});

export default ImageMatchScreen;
