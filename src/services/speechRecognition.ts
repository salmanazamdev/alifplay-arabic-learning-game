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
import { Platform, PermissionsAndroid } from 'react-native';
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
  status?: VoiceRecognitionStatus;
}

export type VoiceRecognitionStatus =
  | 'initializing'
  | 'ready'
  | 'unsupported_runtime'
  | 'voice_engine_unavailable'
  | 'permission_denied'
  | 'start_failed';

export interface VoiceRecognitionState {
  status: VoiceRecognitionStatus;
  message?: string;
}

class SpeechRecognitionService {
  private isInitialized: boolean = false;
  private isListening: boolean = false;
  private currentLetter: string = '';
  private resultsCallback: ((result: RecognitionResult) => void) | null = null;
  private voiceAvailable: boolean = false;
  private voiceState: VoiceRecognitionState = {
    status: 'initializing',
    message: 'Checking speech recognition availability...',
  };
  private recognitionTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private config: SpeechRecognitionConfig = {
    language: 'en-US', // Using English recognition to capture phonetic approximations
    maxRetries: 3,
    timeoutMs: 5000,
    continuous: false,
  };

  constructor() {
    this.initializeVoice();
  }

  private setVoiceState(status: VoiceRecognitionStatus, message?: string) {
    this.voiceState = { status, message };
    this.voiceAvailable = status === 'ready';
  }

  private buildErrorResult(
    error: string,
    status: VoiceRecognitionStatus
  ): RecognitionResult {
    return {
      success: false,
      spokenText: '',
      error,
      status,
    };
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
    if (!this.hasUsableVoiceApi()) {
      this.setVoiceState(
        'unsupported_runtime',
        'Speech recognition native module is unavailable in this runtime.'
      );
      return false;
    }

    try {
      const available = await this.safeCheckVoiceAvailability();

      if (available) {
        this.setupVoiceListeners();
        this.setVoiceState('ready');
        return true;
      }

      this.setVoiceState(
        'voice_engine_unavailable',
        'Speech recognition engine is unavailable on this device.'
      );
      return false;
    } catch (error) {
      const message = String((error as any)?.message || error || 'Unknown error');
      if (this.isMissingNativeVoiceError(error)) {
        this.setVoiceState(
          'unsupported_runtime',
          'Speech recognition native module is unavailable in this runtime.'
        );
      } else {
        this.setVoiceState(
          'voice_engine_unavailable',
          `Speech recognition availability check failed: ${message}`
        );
      }
      return false;
    }
  }

  /**
   * Initialize Voice Recognition Service with error handling
   */
  private async initializeVoice() {
    try {
      if (!this.hasUsableVoiceApi()) {
        this.setVoiceState(
          'unsupported_runtime',
          'Speech recognition native module is unavailable in this runtime.'
        );
        this.isInitialized = true;
        return;
      }

      await this.refreshVoiceAvailability();
      
      this.isInitialized = true;
    } catch (error) {
      if (this.isMissingNativeVoiceError(error)) {
        this.setVoiceState(
          'unsupported_runtime',
          'Speech recognition native module is unavailable in this runtime.'
        );
      } else {
        console.error('[SpeechRecognition] Initialization error:', error);
        this.setVoiceState(
          'voice_engine_unavailable',
          'Unable to initialize speech recognition.'
        );
      }
      this.isInitialized = true;
    }
  }

  private async waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const deadline = Date.now() + 2000;
    while (!this.isInitialized && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private clearRecognitionTimeout() {
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
  }

  private async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (alreadyGranted) {
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone permission',
          message: 'AlifPlay needs microphone access for pronunciation practice.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      this.setVoiceState(
        'permission_denied',
        'Microphone permission is required for pronunciation practice.'
      );
      return false;
    } catch (error) {
      console.error('[SpeechRecognition] Permission request error:', error);
      this.setVoiceState('start_failed', 'Unable to request microphone permission.');
      return false;
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
    this.clearRecognitionTimeout();
    
    if (!event.value || event.value.length === 0) {
      this.handleResult({
        success: false,
        spokenText: '',
        error: 'No speech detected',
        status: 'start_failed',
      });
      return;
    }

    if (!this.currentLetter) {
      this.handleResult(
        this.buildErrorResult('No target letter selected for analysis.', 'start_failed')
      );
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
      status: 'ready',
    });
  };

  /**
   * Event: Speech recognition error
   */
  private onSpeechError = (event: SpeechErrorEvent) => {
    console.error('[SpeechRecognition] Error:', event.error);
    this.clearRecognitionTimeout();
    
    let errorMessage = 'Recognition failed';
    let status: VoiceRecognitionStatus = 'start_failed';
    
    if (event.error?.code === '7') {
      errorMessage = 'No speech detected. Please try again.';
    } else if (event.error?.code === '9') {
      errorMessage = 'Microphone permission denied';
      status = 'permission_denied';
      this.setVoiceState('permission_denied', errorMessage);
    } else if (event.error?.message) {
      errorMessage = event.error.message;
    }
    
    this.handleResult({
      success: false,
      spokenText: '',
      error: errorMessage,
      status,
    });
  };

  /**
   * Handle recognition result and trigger callback
   */
  private handleResult(result: RecognitionResult) {
    this.isListening = false;
    if (this.resultsCallback) {
      this.resultsCallback(result);
      this.resultsCallback = null;
    }
  }

  /**
   * Start listening for pronunciation
   */
  async startRecognition(
    arabicLetter: string,
    onResult: (result: RecognitionResult) => void
  ): Promise<void> {
    this.resultsCallback = onResult;

    try {
      await this.waitForInitialization();

      const availableNow = await this.refreshVoiceAvailability();
      if (!availableNow) {
        const message =
          this.voiceState.message ||
          'Speech recognition is unavailable. Use a custom Android dev build on a real device.';
        this.handleResult(
          this.buildErrorResult(message, this.voiceState.status)
        );
        return;
      }

      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        this.handleResult(
          this.buildErrorResult(
            'Microphone permission is required for pronunciation practice.',
            'permission_denied'
          )
        );
        return;
      }

      if (this.isListening) {
        await this.stopRecognition();
      }

      this.currentLetter = arabicLetter;
      this.clearRecognitionTimeout();

      // Start recognition
      await Voice.start(this.config.language);
      this.setVoiceState('ready');
      
      // Set timeout
      this.recognitionTimeout = setTimeout(() => {
        if (this.isListening) {
          this.stopRecognition();
        }
      }, this.config.timeoutMs);
      
    } catch (error) {
      console.error('[SpeechRecognition] Start error:', error);
      this.setVoiceState('start_failed', 'Unable to start speech recognition.');
      this.handleResult(
        this.buildErrorResult(
          'Unable to start speech recognition. Please try again.',
          'start_failed'
        )
      );
    }
  }

  /**
   * Stop listening
   */
  async stopRecognition(): Promise<void> {
    try {
      this.clearRecognitionTimeout();
      if (this.hasUsableVoiceApi()) {
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
      this.clearRecognitionTimeout();
      if (this.hasUsableVoiceApi()) {
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
      this.clearRecognitionTimeout();
      if (this.hasUsableVoiceApi()) {
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
      if (Platform.OS !== 'android') {
        return true;
      }

      return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    } catch (error) {
      console.error('[SpeechRecognition] Permission check error:', error);
      return false;
    }
  }

  /**
   * Check if voice recognition is available
   */
  isVoiceAvailable(): boolean {
    return this.voiceState.status === 'ready';
  }

  getVoiceState(): VoiceRecognitionState {
    return this.voiceState;
  }
}

// Export singleton instance
export const speechRecognitionService = new SpeechRecognitionService();

// Export type definitions
export type { PronunciationScore };
