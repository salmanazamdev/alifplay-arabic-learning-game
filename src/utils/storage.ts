import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProgress {
  starsEarned: number;
  levelsCompleted: string[];
  badges: string[];
  tracingCompleted: string[];
  pronunciationCompleted: string[];
  pronunciationScore: number;
  imageMatchScore: number;
  quizScore: number;
}

const STORAGE_KEY = '@alifplay_progress';

export const DEFAULT_PROGRESS: UserProgress = {
  starsEarned: 0,
  levelsCompleted: [],
  badges: [],
  tracingCompleted: [],
  pronunciationCompleted: [],
  pronunciationScore: 0,
  imageMatchScore: 0,
  quizScore: 0,
};

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
    if (!data) return null;

    const parsed = JSON.parse(data) as Partial<UserProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      levelsCompleted: parsed.levelsCompleted || [],
      badges: parsed.badges || [],
      tracingCompleted: parsed.tracingCompleted || [],
      pronunciationCompleted: parsed.pronunciationCompleted || [],
    };
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
