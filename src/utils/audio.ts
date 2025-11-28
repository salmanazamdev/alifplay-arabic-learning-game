import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

export const playSound = async (audioFile: string): Promise<void> => {
  try {
    // Stop previous sound if playing
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }

    // Load and play new sound
    const { sound } = await Audio.Sound.createAsync(
      require(`../../assets/audio/${audioFile}`)
    );
    currentSound = sound;
    await sound.playAsync();
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

export const stopSound = async (): Promise<void> => {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
};
