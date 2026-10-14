
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { RADIUS } from '../config/designSystem';

const PILL_COLORS = {
  green:  { bg: COLORS.greenDim,   fg: COLORS.green  },
  amber:  { bg: COLORS.amberDim,   fg: COLORS.amber  },
  red:    { bg: COLORS.redDim,     fg: COLORS.red    },
  accent: { bg: COLORS.accentGlow, fg: COLORS.accent },
  muted:  { bg: COLORS.bg4,        fg: COLORS.textMuted },
};

// Pill supports three modes:
// 1. Static display: <Pill color="green">Done</Pill>
// 2. Interactive filter chip: <Pill label="Active" selected={..} onPress={..} />
// 3. Outline: <Pill outline color="accent">Label</Pill> — transparent bg,
//    colored border + text. Good for secondary filter rows.
export function Pill({ children, color = 'muted', label, selected, onPress, outline }) {
  const { fg } = PILL_COLORS[color] || PILL_COLORS.muted;

  if (outline) {
    return (
      <View style={[styles.pillOutline, { borderColor: fg }]}>
        <Text style={[styles.text, { color: fg }]}>{label ?? children}</Text>
      </View>
    );
  }

  if (onPress) {
    const { bg } = PILL_COLORS[color] || PILL_COLORS.muted;
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.pill,
          { backgroundColor: selected ? bg : COLORS.bg4 },
          selected && styles.pillSelected,
        ]}
      >
        <Text style={[styles.text, { color: selected ? fg : COLORS.textMuted }]}>
          {label ?? children}
        </Text>
      </TouchableOpacity>
    );
  }

  const { bg, fg: fgColor } = PILL_COLORS[color] || PILL_COLORS.muted;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fgColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill },
  pillSelected: { borderWidth: 1, borderColor: COLORS.accent },
  pillOutline:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1, backgroundColor: 'transparent' },
  text:         { fontSize: 12, fontWeight: '600' },
});
