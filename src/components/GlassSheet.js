// src/components/GlassSheet.js
//
// Bottom-sheet container shared by every screen's add/edit modal.
//
// Fix: modal content was rendering behind the Android system navigation
// bar (3-button or gesture bar) on edge-to-edge devices like the Galaxy
// A34. Modal layers are NOT children of the app's root View — they mount
// in their own native window — so the paddingBottom: 40 was a flat guess
// that worked on devices with no bottom inset, but fell short on any
// device with a navigation bar taller than ~24px.
//
// useSafeAreaInsets() works inside Modals too, as long as SafeAreaProvider
// wraps the root app (which App.js now does). insets.bottom gives the
// exact navigation bar height for the current device and nav mode (buttons
// vs gesture), so the sheet's content always clears the bar regardless of
// device or navigation style setting.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config/colors';

export function GlassSheet({ children, style, maxHeight = '88%' }) {
  const insets = useSafeAreaInsets();

  // Minimum 40px bottom padding (previous hardcoded value, preserved for
  // devices with no system nav bar). On devices with a nav bar, adds the
  // full inset on top of 16px base breathing room so content is never
  // clipped or obscured.
  const bottomPadding = Math.max(40, insets.bottom + 16);

  return (
    <View style={[styles.wrapper, { maxHeight, paddingBottom: bottomPadding }, style]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.handle} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    padding: 24,
    // paddingBottom intentionally omitted here — applied inline via
    // insets.bottom so it adapts to every device's navigation bar height.
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.bg4,
    alignSelf: 'center', marginBottom: 16,
  },
});
