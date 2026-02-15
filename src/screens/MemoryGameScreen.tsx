import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants';
import { arabicLetters } from '../utils/gameData';
import { DEFAULT_PROGRESS, loadProgress, saveProgress } from '../utils/storage';

interface MemoryCard {
  id: string;
  pairId: string;
  letter: string;
  name: string;
}

const PAIR_COUNT = 6;

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildDeck = (): MemoryCard[] => {
  const base = arabicLetters.slice(0, PAIR_COUNT);
  const cards = base.flatMap(letter => [
    { id: `${letter.id}-a`, pairId: letter.id, letter: letter.letter, name: letter.name },
    { id: `${letter.id}-b`, pairId: letter.id, letter: letter.letter, name: letter.name },
  ]);
  return shuffle(cards);
};

const MemoryGameScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<MemoryCard[]>(() => buildDeck());
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [bestProgress, setBestProgress] = useState(0);

  const matchedCount = matchedPairIds.length;
  const gameProgress = Math.round((matchedCount / PAIR_COUNT) * 100);
  const isComplete = matchedCount === PAIR_COUNT;

  const restartGame = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCards(buildDeck());
    setFlippedIds([]);
    setMatchedPairIds([]);
    setMoves(0);
    setLocked(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const progress = await loadProgress();
      setBestProgress(Math.round(progress?.memoryScore || 0));
    };
    loadData();
  }, []);

  const persistProgress = useCallback(async (nextProgress: number) => {
    const progress = (await loadProgress()) || { ...DEFAULT_PROGRESS };
    progress.memoryScore = Math.max(progress.memoryScore || 0, nextProgress);
    await saveProgress(progress);
    setBestProgress(Math.round(progress.memoryScore));
  }, []);

  const handleCardPress = useCallback(async (card: MemoryCard) => {
    if (locked) return;
    if (flippedIds.includes(card.id)) return;
    if (matchedPairIds.includes(card.pairId)) return;
    if (flippedIds.length >= 2) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const nextFlipped = [...flippedIds, card.id];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstId, secondId] = nextFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (!firstCard || !secondCard) {
        setFlippedIds([]);
        return;
      }

      if (firstCard.pairId === secondCard.pairId) {
        const nextMatched = [...matchedPairIds, firstCard.pairId];
        setMatchedPairIds(nextMatched);
        setFlippedIds([]);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const nextProgress = Math.round((nextMatched.length / PAIR_COUNT) * 100);
        await persistProgress(nextProgress);

        if (nextMatched.length === PAIR_COUNT) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setLocked(true);
        setTimeout(() => {
          setFlippedIds([]);
          setLocked(false);
        }, 700);
      }
    }
  }, [cards, flippedIds, locked, matchedPairIds, persistProgress]);

  const cardWidth = useMemo(() => '31%' as const, []);

  const renderCard = ({ item }: { item: MemoryCard }) => {
    const isFlipped = flippedIds.includes(item.id);
    const isMatched = matchedPairIds.includes(item.pairId);

    return (
      <TouchableOpacity
        style={[styles.cardWrapper, { width: cardWidth }]}
        activeOpacity={0.85}
        onPress={() => handleCardPress(item)}
        disabled={isMatched || locked}
      >
        {isFlipped || isMatched ? (
          <View style={[styles.cardFace, isMatched && styles.cardMatched]}>
            <Text style={styles.cardLetter}>{item.letter}</Text>
            <Text style={styles.cardName}>{item.name}</Text>
          </View>
        ) : (
          <LinearGradient
            colors={[Colors.primaryPurple, Colors.primaryPurpleDark]}
            style={styles.cardBack}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardBackIcon}>?</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.primaryYellow, Colors.primaryYellowDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Memory Match</Text>
        <Text style={styles.headerSubtitle}>Find matching Arabic letter pairs</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{gameProgress}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{moves}</Text>
            <Text style={styles.statLabel}>Moves</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{bestProgress}%</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
        </View>

        <FlatList
          data={cards}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
          <Text style={styles.restartText}>{isComplete ? 'Play Again' : 'Restart Game'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: Spacing.xs,
    fontSize: FontSize.body,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.95,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    ...Shadows.small,
  },
  statValue: {
    fontSize: 24,
    color: Colors.primaryBlueDark,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  grid: {
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardWrapper: {
    aspectRatio: 1,
  },
  cardBack: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  cardBackIcon: {
    fontSize: 34,
    color: Colors.white,
    fontWeight: FontWeight.extrabold,
  },
  cardFace: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primaryBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  cardMatched: {
    borderColor: Colors.primaryGreen,
    backgroundColor: '#ECFDF3',
  },
  cardLetter: {
    fontSize: 42,
    color: Colors.text,
    fontWeight: FontWeight.black,
  },
  cardName: {
    marginTop: 2,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
  restartButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryBlue,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  restartText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default MemoryGameScreen;
