import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';

interface StatBadgeProps {
  value: string | number;
  label: string;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

const StatBadge: React.FC<StatBadgeProps> = ({
  value,
  label,
  color = Colors.primaryBlue,
  backgroundColor = Colors.white,
  style,
}) => {
  return (
    <View 
      style={[styles.container, { backgroundColor }, style]}
      accessible={true}
      accessibilityLabel={`${value} ${label}`}
    >
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  value: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.black,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
});

export default StatBadge;
