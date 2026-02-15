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

type GameMode = 'levels' | 'playing' | 'complete';

const LEVELS = [
  { key: 'beginner', name: 'Beginner', pairs: 3 },
  { key: 'easy', name: 'Easy', pairs: 6 },
  { key: 'intermediate', name: 'Intermediate', pairs: 9 },
  { key: 'advanced', name: 'Advanced', pairs: 12 },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildDeck = (pairCount: number): MemoryCard[] => {
  const base = arabicLetters.slice(0, pairCount);
  const cards = base.flatMap(letter => [
    { id: `${letter.id}-a`, pairId: letter.id, letter: letter.letter, name: letter.name },
    { id: `${letter.id}-b`, pairId: letter.id, letter: letter.letter, name: letter.name },
  ]);
  return shuffle(cards);
};

const MemoryGameScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<GameMode>('levels');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [cards, setCards] = useState<MemoryCard[]>(() => buildDeck(LEVELS[0].pairs));
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [bestProgress, setBestProgress] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [latestRoundStars, setLatestRoundStars] = useState(0);
  const [bestMovesByLevel, setBestMovesByLevel] = useState<Record<number, number>>({});
  const [bestStarsByLevel, setBestStarsByLevel] = useState<Record<number, number>>({});

  const pairCount = LEVELS[currentLevel].pairs;
  const matchedCount = matchedPairIds.length;
  const gameProgress = Math.round((matchedCount / pairCount) * 100);
  const isComplete = matchedCount === pairCount;
  const gridColumns = cards.length <= 12 ? 3 : 4;

  const calculateStars = useCallback((levelPairs: number, moveCount: number) => {
    const perfectMoves = levelPairs;
    const efficiency = perfectMoves / Math.max(moveCount, 1);
    if (efficiency >= 0.85) return 3;
    if (efficiency >= 0.65) return 2;
    return 1;
  }, []);

  const resetRound = useCallback(async (levelIndex: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCards(buildDeck(LEVELS[levelIndex].pairs));
    setFlippedIds([]);
    setMatchedPairIds([]);
    setMoves(0);
    setLocked(false);
  }, []);

  const startLevel = useCallback(
    async (levelIndex: number) => {
      setCurrentLevel(levelIndex);
      await resetRound(levelIndex);
      setMode('playing');
    },
    [resetRound]
  );

  const backToLevels = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode('levels');
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const progress = await loadProgress();
      if (!progress) {
        setBestProgress(0);
        setUnlockedLevel(0);
        return;
      }

      setBestProgress(Math.round(progress.memoryScore || 0));
      setTotalStars(progress.starsEarned || 0);

      const unlockedFromLevels = progress.levelsCompleted.reduce((maxUnlocked, levelId) => {
        const match = /^memory-level-(\d+)$/.exec(levelId);
        if (!match) return maxUnlocked;
        const completedIndex = Number(match[1]) - 1;
        return Math.max(maxUnlocked, completedIndex + 1);
      }, 0);

      const parsedBestStars = progress.levelsCompleted.reduce((acc, levelId) => {
        const match = /^memory-stars-(\d+)-(\d)$/.exec(levelId);
        if (!match) return acc;
        const levelIndex = Number(match[1]) - 1;
        const stars = Number(match[2]);
        const prev = acc[levelIndex] || 0;
        acc[levelIndex] = Math.max(prev, stars);
        return acc;
      }, {} as Record<number, number>);

      setBestStarsByLevel(parsedBestStars);

      setUnlockedLevel(Math.min(LEVELS.length - 1, unlockedFromLevels));
    };
    loadData();
  }, []);

  const persistProgress = useCallback(async (nextProgress: number, completedLevelIndex: number, starsEarnedThisRound: number) => {
    const progress = (await loadProgress()) || { ...DEFAULT_PROGRESS };
    progress.memoryScore = Math.max(progress.memoryScore || 0, nextProgress);

    const completedLevelId = `memory-level-${completedLevelIndex + 1}`;
    if (!progress.levelsCompleted.includes(completedLevelId)) {
      progress.levelsCompleted.push(completedLevelId);
    }

    const starTokenPattern = new RegExp(`^memory-stars-${completedLevelIndex + 1}-\\d$`);
    const currentBestStarToken = progress.levelsCompleted.find(levelId => starTokenPattern.test(levelId));
    const currentBestStars = currentBestStarToken ? Number(currentBestStarToken.slice(-1)) : 0;
    const improvedStars = Math.max(currentBestStars, starsEarnedThisRound);

    progress.levelsCompleted = progress.levelsCompleted.filter(levelId => !starTokenPattern.test(levelId));
    progress.levelsCompleted.push(`memory-stars-${completedLevelIndex + 1}-${improvedStars}`);

    if (improvedStars > currentBestStars) {
      progress.starsEarned += improvedStars - currentBestStars;
    }

    await saveProgress(progress);

    const unlockedFromLevels = progress.levelsCompleted.reduce((maxUnlocked, levelId) => {
      const match = /^memory-level-(\d+)$/.exec(levelId);
      if (!match) return maxUnlocked;
      const completedIndex = Number(match[1]) - 1;
      return Math.max(maxUnlocked, completedIndex + 1);
    }, 0);

    setUnlockedLevel(Math.min(LEVELS.length - 1, unlockedFromLevels));
    setBestProgress(Math.round(progress.memoryScore));
    setTotalStars(progress.starsEarned || 0);
    setBestStarsByLevel(prev => ({ ...prev, [completedLevelIndex]: improvedStars }));
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

        if (nextMatched.length === pairCount) {
          const finalMoves = moves + 1;
          const earnedStars = calculateStars(pairCount, finalMoves);
          setLatestRoundStars(earnedStars);

          const levelCompletionProgress = Math.round(((currentLevel + 1) / LEVELS.length) * 100);
          await persistProgress(levelCompletionProgress, currentLevel, earnedStars);

          setBestMovesByLevel(prev => {
            const currentBest = prev[currentLevel];
            if (!currentBest || finalMoves < currentBest) {
              return { ...prev, [currentLevel]: finalMoves };
            }
            return prev;
          });
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMode('complete');
        }
      } else {
        setLocked(true);
        setTimeout(() => {
          setFlippedIds([]);
          setLocked(false);
        }, 700);
      }
    }
  }, [calculateStars, cards, currentLevel, flippedIds, locked, matchedPairIds, moves, pairCount, persistProgress]);

  const cardWidth = useMemo<'31%' | '23.5%'>(() => (gridColumns === 3 ? '31%' : '23.5%'), [gridColumns]);

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

  const handleNextLevel = useCallback(async () => {
    if (currentLevel >= LEVELS.length - 1) return;
    await startLevel(currentLevel + 1);
  }, [currentLevel, startLevel]);

  const renderLevelSelection = () => (
    <View style={styles.levelsContainer}>
      <Text style={styles.levelsTitle}>Choose Difficulty</Text>
      <Text style={styles.levelsSubtitle}>Complete each level to unlock the next one</Text>

      {LEVELS.map((level, index) => {
        const lockedLevel = index > unlockedLevel;
        const levelBest = bestMovesByLevel[index];

        return (
          <TouchableOpacity
            key={level.key}
            style={[styles.levelCard, lockedLevel && styles.levelCardLocked]}
            onPress={() => !lockedLevel && startLevel(index)}
            disabled={lockedLevel}
            activeOpacity={0.8}
          >
            <View>
              <Text style={[styles.levelName, lockedLevel && styles.levelNameLocked]}>{level.name}</Text>
              <Text style={[styles.levelMeta, lockedLevel && styles.levelMetaLocked]}>
                {level.pairs} pairs · {level.pairs * 2} cards
              </Text>
              <Text style={[styles.levelMeta, lockedLevel && styles.levelMetaLocked]}>
                Best moves: {levelBest || '—'}
              </Text>
              <Text style={[styles.levelMeta, lockedLevel && styles.levelMetaLocked]}>
                Best stars: {'⭐'.repeat(bestStarsByLevel[index] || 0) || '—'}
              </Text>
            </View>
            <Text style={styles.levelAction}>{lockedLevel ? '🔒' : 'Play'}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderGameComplete = () => {
    const isLastLevel = currentLevel === LEVELS.length - 1;
    const canGoNext = !isLastLevel && currentLevel + 1 <= unlockedLevel;

    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeTitle}>Level Complete 🎉</Text>
        <Text style={styles.completeMeta}>{LEVELS[currentLevel].name} • {moves} moves</Text>
        <Text style={styles.completeMeta}>Stars earned: {'⭐'.repeat(latestRoundStars)}</Text>
        <Text style={styles.completeMeta}>Overall progress: {bestProgress}%</Text>
        <Text style={styles.completeMeta}>Total stars: {totalStars}</Text>

        <TouchableOpacity
          style={styles.restartButton}
          onPress={() => startLevel(currentLevel)}
          activeOpacity={0.85}
        >
          <Text style={styles.restartText}>Play Again</Text>
        </TouchableOpacity>

        {canGoNext && (
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: Colors.primaryGreen }]}
            onPress={handleNextLevel}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Next Level</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={backToLevels}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Back to Levels</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerSubtitle}>
          {mode === 'playing'
            ? `${LEVELS[currentLevel].name} · Match Arabic letter pairs`
            : 'Progressive levels for Arabic letter recognition'}
        </Text>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.sm }]}> 
        {mode === 'levels' && renderLevelSelection()}

        {mode === 'playing' && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{gameProgress}%</Text>
                <Text style={styles.statLabel}>Level Progress</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{moves}</Text>
                <Text style={styles.statLabel}>Moves</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalStars}</Text>
                <Text style={styles.statLabel}>Stars</Text>
              </View>
            </View>

            <FlatList
              data={cards}
              keyExtractor={item => item.id}
              renderItem={renderCard}
              numColumns={gridColumns}
              columnWrapperStyle={styles.row}
              style={styles.gridList}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
            />

            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xs }]}> 
              <TouchableOpacity style={styles.secondaryButton} onPress={backToLevels}>
                <Text style={styles.secondaryButtonText}>Levels</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.restartButton} onPress={() => startLevel(currentLevel)}>
                <Text style={styles.restartText}>Restart Level</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {mode === 'complete' && (
          <View style={[styles.completeWrapper, { paddingBottom: insets.bottom + Spacing.sm }]}>
            {renderGameComplete()}
          </View>
        )}
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
  },
  levelsContainer: {
    gap: Spacing.md,
  },
  levelsTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  },
  levelsSubtitle: {
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  levelCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.small,
  },
  levelCardLocked: {
    backgroundColor: Colors.disabledBackground,
  },
  levelName: {
    fontSize: FontSize.h6,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  levelNameLocked: {
    color: Colors.textSecondary,
  },
  levelMeta: {
    marginTop: 2,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  levelMetaLocked: {
    color: Colors.textLight,
  },
  levelAction: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.extrabold,
    color: Colors.primaryBlueDark,
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
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  gridList: {
    flex: 1,
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
  footer: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  restartButton: {
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
  secondaryButton: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryPurple,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  secondaryButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  completeWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  completeContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  completeTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    textAlign: 'center',
  },
  completeMeta: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
});

export default MemoryGameScreen;
