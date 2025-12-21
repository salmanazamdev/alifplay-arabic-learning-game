import { ArabicLetter } from './gameData';

interface QuizQuestion {
  question: string;
  letter: string;
  audioFile: string;
  options: string[];
  correct: string;
  correctIndex: number;
}

/**
 * Generates quiz questions with real wrong answers from other Arabic letters
 */
export const generateQuizQuestions = (
  letters: ArabicLetter[],
  numberOfQuestions: number = 5
): QuizQuestion[] => {
  // Shuffle and select random letters for quiz
  const shuffledLetters = [...letters].sort(() => Math.random() - 0.5);
  const selectedLetters = shuffledLetters.slice(0, numberOfQuestions);

  return selectedLetters.map((letter) => {
    // Get other letters for wrong answers
    const otherLetters = letters.filter((l) => l.id !== letter.id);
    
    // Pick 3 random wrong answers
    const wrongAnswers = otherLetters
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((l) => l.name);

    // Combine correct and wrong answers
    const allOptions = [letter.name, ...wrongAnswers];
    
    // Shuffle options
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    // Find the index of correct answer after shuffle
    const correctIndex = shuffledOptions.indexOf(letter.name);

    return {
      question: `What is this letter?`,
      letter: letter.letter,
      audioFile: letter.audioFile,
      options: shuffledOptions,
      correct: letter.name,
      correctIndex,
    };
  });
};

/**
 * Calculate quiz score percentage
 */
export const calculateQuizScore = (
  correctAnswers: number,
  totalQuestions: number
): number => {
  return Math.round((correctAnswers / totalQuestions) * 100);
};

/**
 * Get stars based on score percentage
 */
export const getStarsForScore = (scorePercentage: number): number => {
  if (scorePercentage >= 90) return 3;
  if (scorePercentage >= 70) return 2;
  if (scorePercentage >= 50) return 1;
  return 0;
};

/**
 * Get encouraging message based on score
 */
export const getScoreMessage = (scorePercentage: number): string => {
  if (scorePercentage === 100) return 'Perfect! Amazing! 🌟';
  if (scorePercentage >= 90) return 'Excellent Work! 🎉';
  if (scorePercentage >= 70) return 'Great Job! 👏';
  if (scorePercentage >= 50) return 'Good Try! Keep Going! 💪';
  return 'Practice More! You Can Do It! 🌱';
};
