
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

export function HeaderBar({ title, onMenuPress }) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>
        <Text style={{ color: COLORS.accent }}>Life</Text>OS
      </Text>
      <Text style={styles.screenName}>{title}</Text>
    </View>
  );
} 

const styles = StyleSheet.create({
  bar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bg },
  menuBtn:    { padding: 8 },
  menuIcon:   { fontSize: 20, color: COLORS.textMuted },
  logo:       { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  screenName: { fontSize: 13, color: COLORS.textMuted },
});

