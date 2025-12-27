/**
 * Accuracy Meter Component
 * Visual display of pronunciation accuracy with animations and feedback
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { PronunciationScore } from '../services/speechRecognition';

interface AccuracyMeterProps {
  score: PronunciationScore | null;
  show: boolean;
}

export const AccuracyMeter: React.FC<AccuracyMeterProps> = ({ score, show }) => {
  const [fillAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (show && score) {
      // Reset animations
      fillAnim.setValue(0);
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      // Animate appearance
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fillAnim, {
          toValue: score.accuracy / 100,
          duration: 1000,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [show, score]);

  if (!show || !score) return null;

  // Determine color based on accuracy
  const getColor = (accuracy: number): string => {
    if (accuracy >= 90) return '#4CAF50'; // Green
    if (accuracy >= 75) return '#8BC34A'; // Light green
    if (accuracy >= 60) return '#FFC107'; // Yellow
    if (accuracy >= 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const color = getColor(score.accuracy);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Score Circle */}
      <View style={styles.scoreCircle}>
        <Text style={[styles.scoreText, { color }]}>
          {score.accuracy}%
        </Text>
        <Text style={styles.confidenceText}>
          {score.confidence}% confident
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: fillWidth,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <View style={styles.markerContainer}>
          <View style={[styles.marker, { left: '40%' }]}>
            <Text style={styles.markerText}>40</Text>
          </View>
          <View style={[styles.marker, { left: '60%' }]}>
            <Text style={styles.markerText}>60</Text>
          </View>
          <View style={[styles.marker, { left: '75%' }]}>
            <Text style={styles.markerText}>75</Text>
          </View>
          <View style={[styles.marker, { left: '90%' }]}>
            <Text style={styles.markerText}>90</Text>
          </View>
        </View>
      </View>

      {/* Feedback Message */}
      <View style={[styles.feedbackContainer, { backgroundColor: color + '20' }]}>
        <Text style={[styles.feedbackText, { color }]}>
          {score.feedback}
        </Text>
      </View>

      {/* Detailed Scores (Debug Mode - Optional) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>ML Scores:</Text>
          <Text style={styles.debugText}>
            Levenshtein: {score.detailedScores.levenshtein}%
          </Text>
          <Text style={styles.debugText}>
            Phonetic: {score.detailedScores.phonetic}%
          </Text>
          <Text style={styles.debugText}>
            Substring: {score.detailedScores.substring}%
          </Text>
          <Text style={styles.debugText}>
            Consonant: {score.detailedScores.consonant}%
          </Text>
        </View>
      )}

      {/* Result Badge */}
      <View
        style={[
          styles.resultBadge,
          {
            backgroundColor: score.isCorrect ? '#4CAF50' : '#FF9800',
          },
        ]}
      >
        <Text style={styles.resultText}>
          {score.isCorrect ? '✓ Correct!' : '↻ Try Again'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  markerContainer: {
    width: '100%',
    height: 20,
    position: 'relative',
    marginTop: 5,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -10 }],
  },
  markerText: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  feedbackContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  resultText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  debugText: {
    fontSize: 11,
    color: '#888',
    marginVertical: 2,
  },
});
