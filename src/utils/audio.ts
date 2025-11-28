import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

// Static audio asset mapping for Expo (dynamic requires not supported)
const audioAssets: { [key: string]: any } = {
  'alif.mp3': require('../../assets/audio/alif.mp3'),
  'baa.mp3': require('../../assets/audio/baa.mp3'),
  'taa.mp3': require('../../assets/audio/taa.mp3'),
  'thaa.mp3': require('../../assets/audio/thaa.mp3'),
  'jeem.mp3': require('../../assets/audio/jeem.mp3'),
  'haa.mp3': require('../../assets/audio/haa.mp3'),
  'khaa.mp3': require('../../assets/audio/khaa.mp3'),
  'dal.mp3': require('../../assets/audio/dal.mp3'),
  'thal.mp3': require('../../assets/audio/thal.mp3'),
  'raa.mp3': require('../../assets/audio/raa.mp3'),
  'zay.mp3': require('../../assets/audio/zay.mp3'),
  'seen.mp3': require('../../assets/audio/seen.mp3'),
  'sheen.mp3': require('../../assets/audio/sheen.mp3'),
  'sad.mp3': require('../../assets/audio/sad.mp3'),
  'dad.mp3': require('../../assets/audio/dad.mp3'),
  'tah.mp3': require('../../assets/audio/tah.mp3'),
  'zah.mp3': require('../../assets/audio/zah.mp3'),
  'ain.mp3': require('../../assets/audio/ain.mp3'),
  'ghain.mp3': require('../../assets/audio/ghain.mp3'),
  'faa.mp3': require('../../assets/audio/faa.mp3'),
  'qaf.mp3': require('../../assets/audio/qaf.mp3'),
  'kaf.mp3': require('../../assets/audio/kaf.mp3'),
  'lam.mp3': require('../../assets/audio/lam.mp3'),
  'meem.mp3': require('../../assets/audio/meem.mp3'),
  'noon.mp3': require('../../assets/audio/noon.mp3'),
  'haa2.mp3': require('../../assets/audio/haa2.mp3'),
  'waw.mp3': require('../../assets/audio/waw.mp3'),
  'yaa.mp3': require('../../assets/audio/yaa.mp3'),
  'success.mp3': require('../../assets/audio/success.mp3'),
  'asad.mp3': require('../../assets/audio/asad.mp3'),
  'qitta.mp3': require('../../assets/audio/qitta.mp3'),
  'kitab.mp3': require('../../assets/audio/kitab.mp3'),
};

export const playSound = async (audioFile: string): Promise<void> => {
  try {
    // Stop previous sound if playing
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }

    // Get audio asset from mapping
    const audioSource = audioAssets[audioFile];
    
    if (!audioSource) {
      console.warn(`Audio file not found: ${audioFile}`);
      return;
    }

    // Load and play new sound
    const { sound } = await Audio.Sound.createAsync(audioSource);
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
