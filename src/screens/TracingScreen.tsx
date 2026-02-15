import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants';
import { arabicLetters } from '../utils/gameData';
import { getArabicTemplate } from '../utils/tracing/arabicTemplates';
import { validateArabicTrace } from '../utils/tracing/validator';
import { TracePoint } from '../utils/tracing/types';
import { loadProgress, saveProgress, UserProgress, DEFAULT_PROGRESS } from '../utils/storage';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = width - Spacing.screenPadding * 2;
const CANVAS_HEIGHT = 320;

const TracingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [strokes, setStrokes] = useState<TracePoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<TracePoint[]>([]);
  const [feedback, setFeedback] = useState('Trace the letter and tap Check.');
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [attemptsByLetter, setAttemptsByLetter] = useState<Record<string, number>>({});
  const [bestScoreByLetter, setBestScoreByLetter] = useState<Record<string, number>>({});

  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<TracePoint[]>([]);

  const currentLetter = arabicLetters[currentLetterIndex];
  const template = getArabicTemplate(currentLetter.letter);

  useEffect(() => {
    const loadTracingProgress = async () => {
      const progress = await loadProgress();
      setCompletedCount(progress?.tracingCompleted?.length || 0);
      setAttemptsByLetter(progress?.tracingAttemptsByLetter || {});
      setBestScoreByLetter(progress?.tracingBestScoreByLetter || {});
    };

    loadTracingProgress();
  }, []);

  const pointsToPath = (points: TracePoint[]) => {
    if (points.length === 0) return '';
    const [first, ...rest] = points;
    return `M ${first.x} ${first.y} ${rest.map(p => `L ${p.x} ${p.y}`).join(' ')}`;
  };

  const normalizedTemplateToCanvas = template.points.map(point => ({
    x: point.x * CANVAS_WIDTH,
    y: point.y * CANVAS_HEIGHT,
  }));

  const templatePath = pointsToPath(normalizedTemplateToCanvas);
  const templateStart = normalizedTemplateToCanvas[0];
  const templateEnd = normalizedTemplateToCanvas[normalizedTemplateToCanvas.length - 1];

  const directionHint =
    template.expectedDirection === 'rtl'
      ? 'Trace from right to left'
      : template.expectedDirection === 'ltr'
      ? 'Trace from left to right'
      : template.expectedDirection === 'down'
      ? 'Start from top and move down'
      : 'Follow the curved stroke smoothly';

  const getEventPoint = (evt: GestureResponderEvent): TracePoint => ({
    x: Math.max(0, Math.min(CANVAS_WIDTH, evt.nativeEvent.locationX)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT, evt.nativeEvent.locationY)),
  });

  const handleStart = (evt: GestureResponderEvent) => {
    const point = getEventPoint(evt);
    drawingRef.current = true;
    currentStrokeRef.current = [point];
    setCurrentStroke([point]);
    setLastScore(null);
    setFeedback('');
  };

  const handleMove = (evt: GestureResponderEvent, _gesture: PanResponderGestureState) => {
    if (!drawingRef.current) return;
    const point = getEventPoint(evt);
    currentStrokeRef.current = [...currentStrokeRef.current, point];
    setCurrentStroke(currentStrokeRef.current);
  };

  const handleEnd = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (currentStrokeRef.current.length > 1) {
      setStrokes(prev => [...prev, currentStrokeRef.current]);
    }

    currentStrokeRef.current = [];
    setCurrentStroke([]);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handleStart,
        onPanResponderMove: handleMove,
        onPanResponderRelease: handleEnd,
        onPanResponderTerminate: handleEnd,
      }),
    []
  );

  const handleClear = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStrokes([]);
    currentStrokeRef.current = [];
    setCurrentStroke([]);
    setLastScore(null);
    setFeedback('Canvas cleared. Trace again.');
  };

  const handleCheck = async () => {
    const allStrokes = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;
    const totalPoints = allStrokes.reduce((sum, stroke) => sum + stroke.length, 0);

    if (totalPoints < 20) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFeedback('Too short. Trace more of the Arabic letter.');
      return;
    }

    const result = validateArabicTrace(allStrokes, currentLetter.letter, CANVAS_WIDTH, CANVAS_HEIGHT);
    setLastScore(result.score);

    const progress = (await loadProgress()) || { ...DEFAULT_PROGRESS };

    const currentAttempts = progress.tracingAttemptsByLetter[currentLetter.id] || 0;
    const updatedAttempts = currentAttempts + 1;
    progress.tracingAttemptsByLetter[currentLetter.id] = updatedAttempts;

    const previousBest = progress.tracingBestScoreByLetter[currentLetter.id] || 0;
    if (result.score > previousBest) {
      progress.tracingBestScoreByLetter[currentLetter.id] = result.score;
    }

    if (result.accepted) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (!progress.tracingCompleted.includes(currentLetter.id)) {
        progress.tracingCompleted.push(currentLetter.id);
      }

      if (result.band === 'great') {
        setFeedback(
          `Great! (${result.score}%) Excellent trace. Shape ${result.breakdown.shape}% • Coverage ${result.breakdown.coverage}%`
        );
      } else {
        setFeedback(
          `Good pass (${result.score}%). Accepted with improvement room.`
        );
      }
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFeedback(
        `Try again (${result.score}%). Follow direction and cover full Arabic shape.`
      );
    }

    await saveProgress(progress);
    setCompletedCount(progress.tracingCompleted.length);
    setAttemptsByLetter({ ...progress.tracingAttemptsByLetter });
    setBestScoreByLetter({ ...progress.tracingBestScoreByLetter });
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentLetterIndex(prev => (prev + 1) % arabicLetters.length);
    setStrokes([]);
    currentStrokeRef.current = [];
    setCurrentStroke([]);
    setLastScore(null);
    setFeedback('Trace the next Arabic letter.');
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
        <Text style={styles.headerTitle}>Letter Tracing</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.letterCard}>
          <Text style={styles.letterGlyph}>{currentLetter.letter}</Text>
          <View style={styles.letterMetaRow}>
            <Text style={styles.letterName}>{currentLetter.name}</Text>
            <Text style={styles.letterCounter}>
              {currentLetterIndex + 1}/{arabicLetters.length}
            </Text>
          </View>
          <Text style={styles.progressText}>Completed: {completedCount}/{arabicLetters.length}</Text>
          <Text style={styles.metricsText}>
            Attempts: {attemptsByLetter[currentLetter.id] || 0} • Best: {bestScoreByLetter[currentLetter.id] || 0}%
          </Text>
          <Text style={styles.directionHintText}>{directionHint}</Text>
        </View>

        <View style={styles.canvasContainer}>
          <Text style={styles.guideLetter}>{currentLetter.letter}</Text>

          <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={styles.svgLayer}>
            <Path
              d={templatePath}
              stroke={Colors.primaryPurple}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.35}
              fill="none"
            />

            {templateStart && (
              <Circle cx={templateStart.x} cy={templateStart.y} r={6} fill={Colors.primaryGreenDark} />
            )}
            {templateEnd && (
              <Circle cx={templateEnd.x} cy={templateEnd.y} r={6} fill={Colors.primaryOrangeDark} />
            )}

            {strokes.map((stroke, idx) => (
              <Path
                key={`stroke-${idx}`}
                d={pointsToPath(stroke)}
                stroke={Colors.primaryBlueDark}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}

            {currentStroke.length > 0 && (
              <Path
                d={pointsToPath(currentStroke)}
                stroke={Colors.primaryBlue}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>

          <View style={styles.touchOverlay} {...panResponder.panHandlers} />
        </View>

        <Text style={styles.feedbackText}>{feedback}</Text>
        {lastScore !== null && (
          <Text style={styles.scoreText}>Trace Score: {lastScore}%</Text>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={handleClear}>
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.checkButton]} onPress={handleCheck}>
            <Text style={styles.actionButtonText}>Check</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.nextButton]} onPress={handleNext}>
            <Text style={styles.actionButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
  },
  letterCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  letterGlyph: {
    fontSize: 74,
    color: Colors.text,
    fontWeight: FontWeight.black,
  },
  letterMetaRow: {
    marginTop: Spacing.sm,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  letterName: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  letterCounter: {
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.bodySmall,
    color: Colors.primaryGreenDark,
    fontWeight: FontWeight.bold,
  },
  metricsText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  directionHintText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.caption,
    color: Colors.primaryBlueDark,
    fontWeight: FontWeight.bold,
  },
  canvasContainer: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  guideLetter: {
    position: 'absolute',
    fontSize: 180,
    fontWeight: FontWeight.black,
    color: 'rgba(99, 110, 114, 0.17)',
  },
  svgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  feedbackText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    minHeight: 24,
  },
  scoreText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontSize: FontSize.body,
    color: Colors.primaryBlueDark,
    fontWeight: FontWeight.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  clearButton: {
    backgroundColor: Colors.primaryOrange,
  },
  checkButton: {
    backgroundColor: Colors.primaryBlue,
  },
  nextButton: {
    backgroundColor: Colors.primaryGreen,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});

export default TracingScreen;
