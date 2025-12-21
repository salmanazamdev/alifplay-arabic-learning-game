import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';

interface GradientButtonProps {
  text: string;
  onPress: () => void;
  gradientColors?: [string, string];
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'success' | 'warning' | 'secondary';
}

const GradientButton: React.FC<GradientButtonProps> = ({
  text,
  onPress,
  gradientColors,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
}) => {
  const getGradientColors = (): [string, string] => {
    if (gradientColors) return gradientColors;
    
    switch (variant) {
      case 'success':
        return [Colors.primaryGreen, Colors.primaryGreenDark];
      case 'warning':
        return [Colors.primaryOrange, Colors.primaryOrangeDark];
      case 'secondary':
        return [Colors.primaryPurple, Colors.primaryPurpleDark];
      case 'primary':
      default:
        return [Colors.primaryBlue, Colors.primaryBlueDark];
    }
  };

  const handlePress = async () => {
    if (!disabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled }}
    >
      <LinearGradient
        colors={disabled ? [Colors.borderLight, Colors.borderLight] : getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.text, disabled && styles.textDisabled, textStyle]}>
          {text}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    minHeight: 56,
    ...Shadows.medium,
  },
  disabled: {
    opacity: 0.5,
    ...Shadows.none,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  text: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  textDisabled: {
    color: Colors.textSecondary,
  },
});

export default GradientButton;
