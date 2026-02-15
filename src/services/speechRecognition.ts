/**
 * Speech Recognition Service
 * Core AI/ML service for capturing and analyzing Arabic pronunciation
 */

import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechRecognizedEvent,
} from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import { Platform, Alert } from 'react-native';
import { analyzePronunciation, PronunciationScore } from '../ml/phoneticAnalyzer';
import { arabicPhoneticMap } from '../ml/arabicPhonetics';

export interface SpeechRecognitionConfig {
  language: string;
  maxRetries: number;
  timeoutMs: number;
  continuous: boolean;
}

export interface RecognitionResult {
  success: boolean;
  spokenText: string;
  score?: PronunciationScore;
  error?: string;
  rawResults?: string[];
}

class SpeechRecognitionService {
  private isInitialized: boolean = false;
  private isListening: boolean = false;
  private currentLetter: string = '';
  private resultsCallback: ((result: RecognitionResult) => void) | null = null;
  private voiceAvailable: boolean = false;
  
  private config: SpeechRecognitionConfig = {
    language: 'en-US', // Using English recognition to capture phonetic approximations
    maxRetries: 3,
    timeoutMs: 5000,
    continuous: false,
  };

  constructor() {
    this.initializeVoice();
  }

  /**
   * Some Voice library versions always export a JS wrapper object,
   * even when the native module is unavailable.
   */
  private hasUsableVoiceApi(): boolean {
    return !!Voice && typeof Voice.isAvailable === 'function';
  }

  private isMissingNativeVoiceError(error: unknown): boolean {
    const message = String((error as any)?.message || error || '');
    return message.includes('isSpeechAvailable') || message.includes('of null');
  }

  private async safeCheckVoiceAvailability(): Promise<boolean> {
    if (!this.hasUsableVoiceApi()) {
      return false;
    }

    try {
      const available = await Voice.isAvailable();
      return available === 1 || available === true;
    } catch (error) {
      if (this.isMissingNativeVoiceError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Refresh voice availability at runtime
   */
  async refreshVoiceAvailability(): Promise<boolean> {
    try {
      this.voiceAvailable = await this.safeCheckVoiceAvailability();

      if (this.voiceAvailable) {
        this.setupVoiceListeners();
      }

      return this.voiceAvailable;
    } catch (error) {
      console.warn('[SpeechRecognition] Refresh availability check failed; using demo mode');
      this.voiceAvailable = false;
      return false;
    }
  }

  /**
   * Initialize Voice Recognition Service with error handling
   */
  private async initializeVoice() {
    try {
      if (!this.hasUsableVoiceApi()) {
        console.warn('[SpeechRecognition] Voice module not found - using demo mode');
        this.voiceAvailable = false;
        this.isInitialized = true;
        return;
      }

      this.voiceAvailable = await this.safeCheckVoiceAvailability();

      if (this.voiceAvailable) {
        this.setupVoiceListeners();
        console.log('[SpeechRecognition] Voice API initialized successfully');
      } else {
        console.warn('[SpeechRecognition] Voice API unavailable - demo mode');
      }
      
      this.isInitialized = true;
    } catch (error) {
      if (this.isMissingNativeVoiceError(error)) {
        console.warn('[SpeechRecognition] Native Voice module unavailable - demo mode');
      } else {
        console.error('[SpeechRecognition] Initialization error:', error);
      }
      this.voiceAvailable = false;
      this.isInitialized = true; // Mark as initialized anyway
    }
  }

  /**
   * Setup Voice Recognition listeners
   */
  private setupVoiceListeners() {
    try {
      if (!this.hasUsableVoiceApi()) {
        console.warn('[SpeechRecognition] Cannot setup listeners - Voice is null');
        return;
      }
      
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechError = this.onSpeechError;
      Voice.onSpeechRecognized = this.onSpeechRecognized;
    } catch (error) {
      console.error('[SpeechRecognition] Listener setup error:', error);
    }
  }

  /**
   * Event: Speech recognition started
   */
  private onSpeechStart = (event: any) => {
    console.log('[SpeechRecognition] Started listening...');
    this.isListening = true;
  };

  /**
   * Event: Speech recognition ended
   */
  private onSpeechEnd = (event: any) => {
    console.log('[SpeechRecognition] Stopped listening');
    this.isListening = false;
  };

  /**
   * Event: Speech recognized (partial results)
   */
  private onSpeechRecognized = (event: SpeechRecognizedEvent) => {
    console.log('[SpeechRecognition] Speech recognized');
  };

  /**
   * Event: Speech recognition results ready
   * Core ML processing happens here
   */
  private onSpeechResults = (event: SpeechResultsEvent) => {
    console.log('[SpeechRecognition] Results:', event.value);
    
    if (!event.value || event.value.length === 0) {
      this.handleResult({
        success: false,
        spokenText: '',
        error: 'No speech detected',
      });
      return;
    }

    // Get the most confident result
    const spokenText = event.value[0];
    
    // Run ML analysis
    const score = analyzePronunciation(this.currentLetter, spokenText);
    
    this.handleResult({
      success: true,
      spokenText,
      score,
      rawResults: event.value,
    });
  };

  /**
   * Event: Speech recognition error
   */
  private onSpeechError = (event: SpeechErrorEvent) => {
    console.error('[SpeechRecognition] Error:', event.error);
    
    let errorMessage = 'Recognition failed';
    
    if (event.error?.code === '7') {
      errorMessage = 'No speech detected. Please try again.';
    } else if (event.error?.code === '9') {
      errorMessage = 'Microphone permission denied';
    } else if (event.error?.message) {
      errorMessage = event.error.message;
    }
    
    this.handleResult({
      success: false,
      spokenText: '',
      error: errorMessage,
    });
  };

  /**
   * Handle recognition result and trigger callback
   */
  private handleResult(result: RecognitionResult) {
    if (this.resultsCallback) {
      this.resultsCallback(result);
    }
  }

  /**
   * Start listening for pronunciation
   */
  async startRecognition(
    arabicLetter: string,
    onResult: (result: RecognitionResult) => void
  ): Promise<void> {
    try {
      // Wait for initialization if needed
      if (!this.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Check if Voice API is available
      const availableNow = await this.refreshVoiceAvailability();
      if (!availableNow) {
        // Fallback: Use demo mode with simulated result
        this.showDemoModeAlert();
        this.simulateRecognition(arabicLetter, onResult);
        return;
      }

      if (this.isListening) {
        await this.stopRecognition();
      }

      this.currentLetter = arabicLetter;
      this.resultsCallback = onResult;

      // Check if Voice is available
      const available = await this.safeCheckVoiceAvailability();
      if (!available) {
        onResult({
          success: false,
          spokenText: '',
          error: 'Speech recognition not available. Using demo mode.',
        });
        this.simulateRecognition(arabicLetter, onResult);
        return;
      }

      // Start recognition
      await Voice.start(this.config.language);
      
      // Set timeout
      setTimeout(() => {
        if (this.isListening) {
          this.stopRecognition();
        }
      }, this.config.timeoutMs);
      
    } catch (error) {
      console.error('[SpeechRecognition] Start error:', error);
      
      // Fallback to demo mode
      this.simulateRecognition(arabicLetter, onResult);
    }
  }

  /**
   * Simulate recognition for demo/testing purposes
   */
  private simulateRecognition(
    arabicLetter: string,
    onResult: (result: RecognitionResult) => void
  ) {
    console.log('[SpeechRecognition] Running in DEMO mode');
    
    // Wait 2 seconds to simulate listening
    setTimeout(() => {
      const phonetic = arabicPhoneticMap[arabicLetter];
      if (!phonetic) {
        onResult({
          success: false,
          spokenText: '',
          error: 'Letter not found',
        });
        return;
      }

      // Simulate a good pronunciation (80% accuracy)
      const score = analyzePronunciation(arabicLetter, phonetic.primary);
      
      onResult({
        success: true,
        spokenText: phonetic.primary,
        score: {
          ...score,
          accuracy: Math.max(75, score.accuracy - 10), // Slightly reduce for demo
          feedback: '🎭 Demo Mode: Try saying "' + phonetic.primary + '"',
        },
      });
    }, 2000);
  }

  /**
   * Show alert about demo mode
   */
  private showDemoModeAlert() {
    if (Platform.OS === 'web') {
      console.log('Running in demo mode - speech recognition not available on web');
    }
  }

  /**
   * Stop listening
   */
  async stopRecognition(): Promise<void> {
    try {
      if (this.voiceAvailable && Voice) {
        await Voice.stop();
      }
      this.isListening = false;
    } catch (error) {
      console.error('[SpeechRecognition] Stop error:', error);
      this.isListening = false;
    }
  }

  /**
   * Cancel recognition
   */
  async cancelRecognition(): Promise<void> {
    try {
      if (this.voiceAvailable && Voice) {
        await Voice.cancel();
      }
      this.isListening = false;
    } catch (error) {
      console.error('[SpeechRecognition] Cancel error:', error);
      this.isListening = false;
    }
  }

  /**
   * Play the correct pronunciation using text-to-speech
   * Helps children learn the correct sound
   */
  async playCorrectPronunciation(arabicLetter: string): Promise<void> {
    try {
      const phonetic = arabicPhoneticMap[arabicLetter];
      if (!phonetic) {
        console.error('[SpeechRecognition] Letter not found:', arabicLetter);
        return;
      }

      // Speak the primary pronunciation
      const textToSpeak = phonetic.primary;
      
      await Speech.speak(textToSpeak, {
        language: 'ar', // Arabic language
        pitch: 1.0,
        rate: 0.75, // Slower for children
        volume: 1.0,
      });
      
      console.log('[SpeechRecognition] Playing pronunciation:', textToSpeak);
    } catch (error) {
      console.error('[SpeechRecognition] TTS error:', error);
    }
  }

  /**
   * Speak feedback message
   */
  async speakFeedback(message: string): Promise<void> {
    try {
      await Speech.speak(message, {
        language: 'en-US',
        pitch: 1.2,
        rate: 0.9,
        volume: 1.0,
      });
    } catch (error) {
      console.error('[SpeechRecognition] Feedback TTS error:', error);
    }
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Cleanup service
   */
  async destroy(): Promise<void> {
    try {
      if (this.voiceAvailable && Voice) {
        await Voice.destroy();
        Voice.removeAllListeners();
      }
      this.isInitialized = false;
      this.isListening = false;
    } catch (error) {
      console.error('[SpeechRecognition] Destroy error:', error);
    }
  }

  /**
   * Check microphone permissions
   */
  async checkPermissions(): Promise<boolean> {
    try {
      // Voice library handles permissions automatically
      return this.voiceAvailable;
    } catch (error) {
      console.error('[SpeechRecognition] Permission check error:', error);
      return false;
    }
  }

  /**
   * Check if voice recognition is available
   */
  isVoiceAvailable(): boolean {
    return this.voiceAvailable;
  }
}

// Export singleton instance
export const speechRecognitionService = new SpeechRecognitionService();

// Export type definitions
export type { PronunciationScore };
