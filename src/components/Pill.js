
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

const PILL_COLORS = {
  green:  { bg: COLORS.greenDim,   fg: COLORS.green  },
  amber:  { bg: COLORS.amberDim,   fg: COLORS.amber  },
  red:    { bg: COLORS.redDim,     fg: COLORS.red    },
  accent: { bg: COLORS.accentGlow, fg: COLORS.accent },
  muted:  { bg: COLORS.bg4,        fg: COLORS.textMuted },
};

// Pill supports two modes:
// 1. Static display: <Pill color="green">Done</Pill> — used everywhere a
//    tag/status badge is just shown, not tapped.
// 2. Interactive filter chip: <Pill label="Active" selected={..}
//    onPress={..} /> — used for filter rows like the one in GoalsScreen.
//    This mode was being called already but Pill silently ignored all
//    three of those props, so the filter chips rendered but never
//    responded to taps at all.
export function Pill({ children, color = 'muted', label, selected, onPress }) {
  const { bg, fg } = PILL_COLORS[color] || PILL_COLORS.muted;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.pill,
          { backgroundColor: selected ? COLORS.accentGlow : COLORS.bg4 },
          selected && styles.pillSelected,
        ]}
      >
        <Text style={[styles.text, { color: selected ? COLORS.accent : COLORS.textMuted }]}>
          {label ?? children}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  pillSelected: { borderWidth: 1, borderColor: COLORS.accent },
  text: { fontSize: 12, fontWeight: '600' },
});
