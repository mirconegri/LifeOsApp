// src/ui/type.js
//
// Ready-made Space Grotesk text styles.
//
// Android ignores `fontWeight` when a custom fontFamily is set, so each
// weight is its own family name and each role is a complete style object.
// Never set fontFamily in a screen: import TEXT and spread/array-merge.
//
// Usage:
//   <Text style={[TEXT.titleLarge, { color: M3.onSurface }]}>Today</Text>

import { StyleSheet } from 'react-native';

export const FONTS = {
  regular:  'SpaceGrotesk_400Regular',
  medium:   'SpaceGrotesk_500Medium',
  semiBold: 'SpaceGrotesk_600SemiBold',
  bold:     'SpaceGrotesk_700Bold',
};

// M3 role -> Space Grotesk weight.
// M3 "emphasized" variants are the 600/700 entry points below.
export const TEXT = StyleSheet.create({
  headlineLarge:   { fontFamily: FONTS.regular,  fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  headlineMedium:  { fontFamily: FONTS.regular,  fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  headlineSmall:   { fontFamily: FONTS.regular,  fontSize: 24, lineHeight: 32, letterSpacing: 0 },
  titleLarge:      { fontFamily: FONTS.regular,  fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  titleLargeEmphasized: { fontFamily: FONTS.medium, fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  titleMedium:     { fontFamily: FONTS.medium,   fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  titleSmall:      { fontFamily: FONTS.medium,   fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  bodyLarge:       { fontFamily: FONTS.regular,  fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
  bodyMedium:      { fontFamily: FONTS.regular,  fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall:       { fontFamily: FONTS.regular,  fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  labelLarge:      { fontFamily: FONTS.medium,   fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMedium:     { fontFamily: FONTS.medium,   fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall:      { fontFamily: FONTS.medium,   fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
});

export const TEXT_EMPHASIZED = StyleSheet.create({
  headlineLarge:  { fontFamily: FONTS.semiBold, fontSize: 32, lineHeight: 40 },
  headlineMedium: { fontFamily: FONTS.semiBold, fontSize: 28, lineHeight: 36 },
  titleLarge:     { fontFamily: FONTS.semiBold, fontSize: 22, lineHeight: 28 },
  titleMedium:    { fontFamily: FONTS.semiBold, fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  labelLarge:     { fontFamily: FONTS.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  bodyMedium:     { fontFamily: FONTS.medium,   fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
});
