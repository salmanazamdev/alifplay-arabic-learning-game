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
import { Lock, Sparkles, Star } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants';
import { arabicLetters } from '../utils/gameData';
import { ProgressBar } from '../components';
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
  const [totalStars, setTotalStars] = useState(0);
  const [latestRoundStars, setLatestRoundStars] = useState(0);
  const [bestMovesByLevel, setBestMovesByLevel] = useState<Record<number, number>>({});
  const [bestStarsByLevel, setBestStarsByLevel] = useState<Record<number, number>>({});

  const pairCount = LEVELS[currentLevel].pairs;
  const matchedCount = matchedPairIds.length;
  const gameProgress = Math.round((matchedCount / pairCount) * 100);
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
        setUnlockedLevel(0);
        return;
      }

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
          isMatched ? (
            <LinearGradient
              colors={[Colors.successLight, Colors.success]}
              style={[styles.cardFace, styles.cardMatched]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.cardLetter, styles.cardMatchedText]}>{item.letter}</Text>
              <Text style={[styles.cardName, styles.cardMatchedText]}>{item.name}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.cardFace}>
              <Text style={styles.cardLetter}>{item.letter}</Text>
              <Text style={styles.cardName}>{item.name}</Text>
            </View>
          )
        ) : (
          <LinearGradient
            colors={[Colors.primaryPurple, Colors.primaryPurpleDark]}
            style={styles.cardBack}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Sparkles size={24} color={Colors.white} strokeWidth={2.4} />
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  const handleNextLevel = useCallback(async () => {
    if (currentLevel >= LEVELS.length - 1) return;
    await startLevel(currentLevel + 1);
  }, [currentLevel, startLevel]);

  const renderStars = useCallback((count: number, size: number = 18) => {
    return (
      <View style={styles.starsRow}>
        {[0, 1, 2].map(index => (
          <Star
            key={index}
            size={size}
            strokeWidth={2.2}
            color={index < count ? Colors.primaryYellowDark : Colors.textLight}
            fill={index < count ? Colors.primaryYellowDark : 'transparent'}
            style={index < count ? styles.starIconActive : styles.starIconInactive}
          />
        ))}
      </View>
    );
  }, []);

  const renderActionButton = (
    label: string,
    colors: [string, string],
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={colors} style={styles.actionGradient}>
        <Text style={styles.actionText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

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
              <View style={styles.levelStarsWrap}>{renderStars(bestStarsByLevel[index] || 0)}</View>
            </View>
            {lockedLevel ? (
              <View style={[styles.levelActionPill, styles.levelActionLocked]}>
                <Lock size={18} color={Colors.textLight} strokeWidth={2.2} />
              </View>
            ) : (
              <LinearGradient
                colors={[Colors.primaryBlue, Colors.primaryBlueDark]}
                style={styles.levelActionPill}
              >
                <Text style={styles.levelActionText}>Play</Text>
              </LinearGradient>
            )}
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
        <LinearGradient
          colors={[Colors.primaryPurpleLight, Colors.primaryPurple]}
          style={styles.completeBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Sparkles size={22} color={Colors.white} strokeWidth={2.3} style={styles.completeBadgeIcon} />
          <Text style={styles.completeBadgeTitle}>Level Complete</Text>
          <Text style={styles.completeBadgeSubtitle}>{LEVELS[currentLevel].name}</Text>
        </LinearGradient>

        <View style={styles.completeStatsRow}>
          <View style={styles.completeStatCard}>
            <Text style={styles.completeStatValue}>{moves}</Text>
            <Text style={styles.completeStatLabel}>Moves</Text>
          </View>
          <View style={styles.completeStatCard}>
            <Text style={styles.completeStatValue}>{totalStars}</Text>
            <Text style={styles.completeStatLabel}>Total Stars</Text>
          </View>
        </View>

        <View style={styles.earnedStarsBlock}>
          <Text style={styles.completeMeta}>Stars earned this level</Text>
          {renderStars(latestRoundStars)}
        </View>

        {renderActionButton(
          'Play Again',
          [Colors.primaryBlue, Colors.primaryBlueDark],
          () => startLevel(currentLevel)
        )}

        {canGoNext && (
          renderActionButton(
            'Next Level',
            [Colors.primaryGreen, Colors.primaryGreenDark],
            handleNextLevel
          )
        )}

        {renderActionButton(
          'Back to Levels',
          [Colors.primaryPurple, Colors.primaryPurpleDark],
          backToLevels
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Memory Match</Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'playing'
                ? `${LEVELS[currentLevel].name} · Match Arabic letter pairs`
                : 'Progressive levels for Arabic letter recognition'}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.badgeLabel}>{mode === 'playing' ? 'Level' : 'Stars'}</Text>
            {mode === 'playing' ? (
              <Text style={styles.badgeValue}>{currentLevel + 1}/{LEVELS.length}</Text>
            ) : (
              <View style={styles.badgeRow}>
                <Star size={16} color={Colors.primaryOrange} strokeWidth={2.4} />
                <Text style={styles.badgeValue}>{totalStars}</Text>
              </View>
            )}
          </View>
        </View>
        {mode === 'playing' && (
          <View style={styles.headerProgress}>
            <ProgressBar
              progress={gameProgress}
              color={Colors.primaryYellowDark}
              backgroundColor={Colors.borderLight}
              height={8}
            />
            <View style={styles.headerMetaRow}>
              <View style={styles.headerMetaItem}>
                <Text style={styles.headerMetaValue}>{matchedCount}/{pairCount}</Text>
                <Text style={styles.headerMetaLabel}>Pairs</Text>
              </View>
              <View style={styles.headerMetaDivider} />
              <View style={styles.headerMetaItem}>
                <Text style={styles.headerMetaValue}>{moves}</Text>
                <Text style={styles.headerMetaLabel}>Moves</Text>
              </View>
              <View style={styles.headerMetaDivider} />
              <View style={styles.headerMetaItem}>
                {renderStars(calculateStars(pairCount, Math.max(moves, 1)), 14)}
                <Text style={styles.headerMetaLabel}>Rating</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {mode === 'levels' && renderLevelSelection()}

        {mode === 'playing' && (
          <>
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

            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}> 
              {renderActionButton(
                'Levels',
                [Colors.primaryPurple, Colors.primaryPurpleDark],
                backToLevels
              )}
              {renderActionButton(
                'Restart Level',
                [Colors.primaryBlue, Colors.primaryBlueDark],
                () => startLevel(currentLevel)
              )}
            </View>
          </>
        )}

        {mode === 'complete' && (
          <View style={[styles.completeWrapper, { paddingBottom: insets.bottom + Spacing.md }]}>
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
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
  headerBadge: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minWidth: 90,
    ...Shadows.medium,
  },
  badgeLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: FontWeight.extrabold,
    color: Colors.primaryYellowDark,
  },
  headerProgress: {
    marginTop: Spacing.sm,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  headerMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerMetaDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  headerMetaValue: {
    fontSize: 16,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  },
  headerMetaLabel: {
    marginTop: 2,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
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
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.medium,
  },
  levelCardLocked: {
    backgroundColor: Colors.disabledBackground,
    borderColor: Colors.border,
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
  levelStarsWrap: {
    marginTop: Spacing.xs,
  },
  levelActionPill: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelActionText: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  levelActionLocked: {
    backgroundColor: Colors.disabledBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIconActive: {
    opacity: 1,
  },
  starIconInactive: {
    opacity: 0.35,
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
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardBack: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  cardFace: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  cardMatched: {
    borderColor: Colors.success,
  },
  cardMatchedText: {
    color: Colors.white,
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
    marginTop: 'auto',
    paddingTop: Spacing.lg,
  },
  completeWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  completeContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.large,
  },
  completeBadge: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  completeBadgeIcon: {
    marginBottom: Spacing.xs,
  },
  completeBadgeTitle: {
    fontSize: FontSize.h4,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    textAlign: 'center',
  },
  completeBadgeSubtitle: {
    marginTop: 2,
    fontSize: FontSize.bodySmall,
    color: Colors.white,
    opacity: 0.95,
    fontWeight: FontWeight.semibold,
  },
  completeStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  completeStatCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  completeStatValue: {
    fontSize: FontSize.h5,
    color: Colors.primaryBlueDark,
    fontWeight: FontWeight.extrabold,
  },
  completeStatLabel: {
    marginTop: 2,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  earnedStarsBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
  },
  completeMeta: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  actionButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    width: '100%',
    ...Shadows.small,
  },
  actionGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  actionText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default MemoryGameScreen;
