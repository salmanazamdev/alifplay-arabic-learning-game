import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
  // Add Cairo font for Arabic text
  arabic: 'Cairo',
  arabicBold: 'Cairo-Bold',
};

export const FontSize = {
  // Display sizes (Large headings)
  display1: 48,
  display2: 42,
  
  // Heading sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,
  
  // Body text
  bodyLarge: 18,
  body: 16,
  bodySmall: 14,
  
  // Utility sizes
  caption: 12,
  tiny: 10,
  
  // Button sizes
  buttonLarge: 18,
  button: 16,
  buttonSmall: 14,
  
  // Arabic letters display
  arabicDisplay: 120,
  arabicLarge: 64,
  arabicMedium: 48,
  arabicSmall: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 1.5,
};

// Common text styles for consistency
export const TextStyles = {
  display1: {
    fontSize: FontSize.display1,
    fontWeight: FontWeight.black,
    lineHeight: FontSize.display1 * LineHeight.tight,
  },
  h1: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h1 * LineHeight.tight,
  },
  h2: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h2 * LineHeight.tight,
  },
  h3: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.h3 * LineHeight.normal,
  },
  body: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  bodyBold: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  caption: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
  button: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.button * LineHeight.tight,
  },
};
