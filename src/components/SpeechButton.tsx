/**
 * Speech Button Component
 * Interactive microphone button with animation for speech recognition
 */

import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Mic, MicOff, Volume2 } from 'lucide-react-native';

interface SpeechButtonProps {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onPlayPronunciation: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  isListening,
  onStartListening,
  onStopListening,
  disabled = false,
  onPlayPronunciation,
  size = 'large',
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isListening) {
      // Pulse animation when listening
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isListening]);

  const buttonSizes = {
    small: 60,
    medium: 80,
    large: 100,
  };

  const iconSizes = {
    small: 28,
    medium: 36,
    large: 44,
  };

  const buttonSize = buttonSizes[size];
  const iconSize = iconSizes[size];

  const handlePress = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Play pronunciation button */}
      <TouchableOpacity
        style={[styles.playButton, { marginBottom: 10 }]}
        onPress={onPlayPronunciation}
        disabled={disabled || isListening}
      >
        <Volume2 size={24} color="#4A90E2" />
        <Text style={styles.playText}>Listen</Text>
      </TouchableOpacity>

      {/* Main microphone button */}
      <View style={styles.buttonWrapper}>
        {isListening && (
          <Animated.View
            style={[
              styles.glowRing,
              {
                width: buttonSize + 20,
                height: buttonSize + 20,
                borderRadius: (buttonSize + 20) / 2,
                opacity: glowOpacity,
              },
            ]}
          />
        )}
        
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.micButton,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor: isListening ? '#E74C3C' : '#4CAF50',
              },
              disabled && styles.disabledButton,
            ]}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={0.8}
          >
            {isListening ? (
              <MicOff size={iconSize} color="#FFF" />
            ) : (
              <Mic size={iconSize} color="#FFF" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Status text */}
      <Text style={styles.statusText}>
        {isListening ? 'Listening...' : 'Tap to speak'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.5,
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#E74C3C',
    backgroundColor: 'transparent',
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  playText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
});
