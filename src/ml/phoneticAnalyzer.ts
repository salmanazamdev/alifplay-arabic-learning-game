/**
 * Phonetic Analyzer - Machine Learning Module
 * Implements phonetic matching algorithms for speech recognition accuracy scoring
 */

import { getPhoneticVariations, getPhoneticWeight } from './arabicPhonetics';

/**
 * Calculate Levenshtein Distance (Edit Distance) between two strings
 * Core ML algorithm for fuzzy string matching
 * 
 * Formula: Minimum number of single-character edits (insertions, deletions, substitutions)
 * required to transform string1 into string2
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix using dynamic programming
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j] + 1       // deletion
        );
      }
    }
  }
  
  return matrix[s1.length][s2.length];
};

/**
 * Calculate similarity percentage using Levenshtein distance
 * Returns value between 0-100
 */
const calculateLevenshteinSimilarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 100;
  
  const similarity = (1 - distance / maxLength) * 100;
  return Math.max(0, Math.min(100, similarity));
};

/**
 * Calculate phonetic similarity using Soundex-like algorithm
 * Groups similar-sounding phonemes
 */
const calculatePhoneticSimilarity = (spoken: string, target: string): number => {
  const spokenClean = spoken.toLowerCase().trim();
  const targetClean = target.toLowerCase().trim();
  
  // Phoneme grouping (consonants that sound similar)
  const phoneticGroups: { [key: string]: string } = {
    // Plosives
    'b': '1', 'p': '1',
    't': '2', 'd': '2',
    'k': '3', 'g': '3', 'q': '3',
    
    // Fricatives
    'f': '4', 'v': '4',
    's': '5', 'z': '5', 'th': '5',
    'sh': '6', 'zh': '6',
    'h': '7', 'kh': '7', 'gh': '7',
    
    // Nasals
    'm': '8', 'n': '8',
    
    // Liquids
    'l': '9', 'r': '9',
    
    // Semivowels
    'w': '0', 'y': '0',
  };
  
  const encode = (str: string): string => {
    let encoded = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const twoChar = str.substring(i, i + 2);
      
      if (phoneticGroups[twoChar]) {
        encoded += phoneticGroups[twoChar];
        i++; // Skip next character
      } else if (phoneticGroups[char]) {
        encoded += phoneticGroups[char];
      }
    }
    return encoded;
  };
  
  const spokenEncoded = encode(spokenClean);
  const targetEncoded = encode(targetClean);
  
  return calculateLevenshteinSimilarity(spokenEncoded, targetEncoded);
};

/**
 * Calculate substring matching score
 * Checks if target phoneme is contained within spoken text
 */
const calculateSubstringScore = (spoken: string, target: string): number => {
  const spokenClean = spoken.toLowerCase().trim();
  const targetClean = target.toLowerCase().trim();
  
  if (spokenClean === targetClean) return 100;
  if (spokenClean.includes(targetClean)) return 85;
  if (targetClean.includes(spokenClean)) return 80;
  
  // Check for partial matches
  for (let i = 0; i < Math.min(spokenClean.length, targetClean.length); i++) {
    if (spokenClean[i] !== targetClean[i]) {
      const matchRatio = i / Math.max(spokenClean.length, targetClean.length);
      return matchRatio * 60;
    }
  }
  
  return 0;
};

/**
 * Calculate consonant matching score
 * Focuses on consonants which are more distinctive in Arabic
 */
const calculateConsonantScore = (spoken: string, target: string): number => {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  
  const extractConsonants = (str: string): string => {
    return str
      .toLowerCase()
      .split('')
      .filter(char => !vowels.includes(char))
      .join('');
  };
  
  const spokenConsonants = extractConsonants(spoken);
  const targetConsonants = extractConsonants(target);
  
  if (!spokenConsonants || !targetConsonants) return 50;
  
  return calculateLevenshteinSimilarity(spokenConsonants, targetConsonants);
};

/**
 * Main ML Algorithm: Weighted Phonetic Matching
 * Combines multiple algorithms with weighted scoring
 * 
 * Formula:
 * Accuracy = (w1 × Levenshtein + w2 × Phonetic + w3 × Substring + w4 × Consonant) × Letter_Weight
 */
export interface PronunciationScore {
  accuracy: number;           // Overall score 0-100
  confidence: number;         // Confidence level 0-100
  feedback: string;           // User feedback message
  detailedScores: {
    levenshtein: number;
    phonetic: number;
    substring: number;
    consonant: number;
  };
  isCorrect: boolean;         // Whether pronunciation is acceptable
}

/**
 * Analyze pronunciation and return ML-based accuracy score
 */
export const analyzePronunciation = (
  arabicLetter: string,
  spokenText: string
): PronunciationScore => {
  const phoneticVariations = getPhoneticVariations(arabicLetter);
  const letterWeight = getPhoneticWeight(arabicLetter);
  
  if (phoneticVariations.length === 0) {
    return {
      accuracy: 0,
      confidence: 0,
      feedback: 'Letter not recognized',
      detailedScores: { levenshtein: 0, phonetic: 0, substring: 0, consonant: 0 },
      isCorrect: false,
    };
  }
  
  const spokenClean = spokenText.toLowerCase().trim();
  
  // Calculate scores against all phonetic variations
  let maxScores = {
    levenshtein: 0,
    phonetic: 0,
    substring: 0,
    consonant: 0,
  };
  
  for (const variation of phoneticVariations) {
    const levScore = calculateLevenshteinSimilarity(spokenClean, variation);
    const phoneticScore = calculatePhoneticSimilarity(spokenClean, variation);
    const substringScore = calculateSubstringScore(spokenClean, variation);
    const consonantScore = calculateConsonantScore(spokenClean, variation);
    
    // Keep maximum scores across all variations
    maxScores.levenshtein = Math.max(maxScores.levenshtein, levScore);
    maxScores.phonetic = Math.max(maxScores.phonetic, phoneticScore);
    maxScores.substring = Math.max(maxScores.substring, substringScore);
    maxScores.consonant = Math.max(maxScores.consonant, consonantScore);
  }
  
  // Weighted combination (ML model weights optimized through testing)
  const weights = {
    levenshtein: 0.35,  // 35% weight - exact character matching
    phonetic: 0.30,     // 30% weight - sound similarity
    substring: 0.20,    // 20% weight - partial matching
    consonant: 0.15,    // 15% weight - consonant matching
  };
  
  const weightedScore = 
    (maxScores.levenshtein * weights.levenshtein) +
    (maxScores.phonetic * weights.phonetic) +
    (maxScores.substring * weights.substring) +
    (maxScores.consonant * weights.consonant);
  
  // Apply letter-specific weight (some letters are harder to pronounce)
  const finalAccuracy = Math.round(weightedScore * letterWeight);
  
  // Calculate confidence based on score consistency
  const scoreVariance = Math.abs(
    maxScores.levenshtein - maxScores.phonetic
  ) + Math.abs(maxScores.substring - maxScores.consonant);
  const confidence = Math.max(50, Math.min(100, 100 - scoreVariance / 4));
  
  // Determine if pronunciation is acceptable
  const isCorrect = finalAccuracy >= 70;
  
  // Generate feedback
  let feedback = '';
  if (finalAccuracy >= 90) {
    feedback = 'Perfect pronunciation.';
  } else if (finalAccuracy >= 75) {
    feedback = 'Great job. Almost perfect.';
  } else if (finalAccuracy >= 60) {
    feedback = 'Good try. Keep practicing.';
  } else if (finalAccuracy >= 40) {
    feedback = 'Not quite right. Listen again.';
  } else {
    feedback = "Let's try again together.";
  }
  
  return {
    accuracy: finalAccuracy,
    confidence: Math.round(confidence),
    feedback,
    detailedScores: {
      levenshtein: Math.round(maxScores.levenshtein),
      phonetic: Math.round(maxScores.phonetic),
      substring: Math.round(maxScores.substring),
      consonant: Math.round(maxScores.consonant),
    },
    isCorrect,
  };
};

/**
 * Batch analyze multiple pronunciation attempts
 * Returns average score and improvement trend
 */
export const analyzePronunciationBatch = (
  arabicLetter: string,
  attempts: string[]
): {
  averageAccuracy: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
  bestAttempt: PronunciationScore;
  attemptScores: PronunciationScore[];
} => {
  const scores = attempts.map(attempt => 
    analyzePronunciation(arabicLetter, attempt)
  );
  
  const averageAccuracy = 
    scores.reduce((sum, score) => sum + score.accuracy, 0) / scores.length;
  
  // Determine trend (compare first half vs second half)
  const midPoint = Math.floor(scores.length / 2);
  const firstHalfAvg = 
    scores.slice(0, midPoint).reduce((sum, s) => sum + s.accuracy, 0) / midPoint;
  const secondHalfAvg = 
    scores.slice(midPoint).reduce((sum, s) => sum + s.accuracy, 0) / (scores.length - midPoint);
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (secondHalfAvg > firstHalfAvg + 5) trend = 'improving';
  else if (secondHalfAvg < firstHalfAvg - 5) trend = 'declining';
  
  const bestAttempt = scores.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  );
  
  return {
    averageAccuracy: Math.round(averageAccuracy),
    improvementTrend: trend,
    bestAttempt,
    attemptScores: scores,
  };
};
