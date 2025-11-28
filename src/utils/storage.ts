import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProgress {
  starsEarned: number;
  levelsCompleted: string[];
  badges: string[];
  tracingCompleted: string[];
  pronunciationScore: number;
  imageMatchScore: number;
  quizScore: number;
}

const STORAGE_KEY = '@alifplay_progress';

export const saveProgress = async (progress: UserProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

export const loadProgress = async (): Promise<UserProgress | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading progress:', error);
    return null;
  }
};

export const resetProgress = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting progress:', error);
  }
};

export const addStar = async (count: number = 1): Promise<void> => {
  const progress = await loadProgress();
  if (progress) {
    progress.starsEarned += count;
    await saveProgress(progress);
  }
};

export const markLevelComplete = async (levelId: string): Promise<void> => {
  const progress = await loadProgress();
  if (progress && !progress.levelsCompleted.includes(levelId)) {
    progress.levelsCompleted.push(levelId);
    await saveProgress(progress);
  }
};
