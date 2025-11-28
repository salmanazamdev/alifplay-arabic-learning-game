import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

// Map audio file names to static imports
const audioAssets: { [key: string]: any } = {
  'alif.mp3': require('../../assets/audio/alif.mp3'),
  'baa.mp3': require('../../assets/audio/baa.mp3'),
  'success.mp3': require('../../assets/audio/success.mp3'),
  // Add more audio files here
};

export const playSound = async (audioFile: string): Promise<void> => {
  try {
    // Stop previous sound if playing
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }

    // Use static mapping for audio assets
    const asset = audioAssets[audioFile];
    if (!asset) {
      console.warn(`Audio file not found in mapping: ${audioFile}`);
      return;
    }
    const { sound } = await Audio.Sound.createAsync(asset);
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
