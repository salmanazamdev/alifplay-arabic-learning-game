import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Shadows, BorderRadius } from '../constants';

interface GradientCardProps {
  children: ReactNode;
  gradientColors: [string, string];
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  disabled?: boolean;
  isSelected?: boolean;
}

const GradientCard: React.FC<GradientCardProps> = ({
  children,
  gradientColors,
  onPress,
  style,
  contentStyle,
  disabled = false,
  isSelected = false,
}) => {
  const handlePress = async () => {
    if (onPress && !disabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : React.Fragment;
  const wrapperProps = onPress
    ? {
        style: [styles.card, isSelected && styles.cardSelected, style],
        onPress: handlePress,
        disabled,
        activeOpacity: 0.8,
        accessible: true,
        accessibilityRole: 'button' as const,
        accessibilityState: { disabled, selected: isSelected },
      }
    : {};

  return (
    <CardWrapper {...wrapperProps}>
      <LinearGradient
        colors={isSelected ? [gradientColors[1], gradientColors[0]] : gradientColors}
        style={[styles.gradient, !onPress && style, contentStyle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  cardSelected: {
    transform: [{ scale: 0.95 }],
  },
  gradient: {
    padding: Spacing.lg,
  },
});

export default GradientCard;
