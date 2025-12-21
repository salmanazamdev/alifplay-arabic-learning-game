// Spacing scale based on 4px base unit
export const Spacing = {
  // Base units
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Specific use cases
  cardPadding: 20,
  screenPadding: 20,
  sectionMargin: 24,
  
  // Component spacing
  buttonPaddingVertical: 16,
  buttonPaddingHorizontal: 24,
  
  inputPaddingVertical: 12,
  inputPaddingHorizontal: 16,
  
  // Gap spacing
  gapTiny: 4,
  gapSmall: 8,
  gapMedium: 12,
  gapLarge: 16,
  gapXLarge: 24,
  
  // Icon sizes
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  iconXLarge: 48,
};

// Common margin/padding presets
export const SpacingPresets = {
  cardPadding: {
    padding: Spacing.cardPadding,
  },
  screenPadding: {
    padding: Spacing.screenPadding,
  },
  sectionMargin: {
    marginVertical: Spacing.sectionMargin,
  },
  buttonPadding: {
    paddingVertical: Spacing.buttonPaddingVertical,
    paddingHorizontal: Spacing.buttonPaddingHorizontal,
  },
  inputPadding: {
    paddingVertical: Spacing.inputPaddingVertical,
    paddingHorizontal: Spacing.inputPaddingHorizontal,
  },
};
