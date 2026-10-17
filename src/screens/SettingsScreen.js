// src/screens/SettingsScreen.js
//
// Full-screen modal reachable from the drawer. Two things live here:
//
//   1. The module switches — each one hides its tab (and drawer entry)
//      without touching any stored data.
//   2. The app version, read from app.config.js at runtime via
//      expo-constants. It used to be hardcoded/absent, which is what
//      issue #1a was about: what the app reports must be the version that
//      actually shipped, not a constant someone forgot to bump.
//
// Presentation follows the other modals in the app: opaque root view so
// nothing shows through during the slide-in.
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Switch, ScrollView,
  Modal, StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Icon } from '../components/Icon';
import { CustomAlert } from '../components/CustomAlert';
import { COLORS } from '../config/colors';
import { TYPE } from '../config/designSystem';
import { MODULES } from '../config/modules';

// Never hardcode a version here again — this reads the value Expo was
// built with, so package.json and app.config.js stay the only sources.
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export default function SettingsScreen({
  visible,
  onClose,
  modules,
  moduleCounts,
  onToggleModule,
}) {
  const insets = useSafeAreaInsets();
  const [alert, setAlert] = useState(null);

  // Turning a module off only hides it. Ask first when there is something to
  // hide, so the count is never a surprise; an empty module just switches.
  const requestToggle = (id, enabled) => {
    if (enabled) {
      onToggleModule(id, true);
      return;
    }
    const count = moduleCounts?.[id] ?? 0;
    if (count === 0) {
      onToggleModule(id, false);
      return;
    }
    setAlert({
      title: 'Hide this section?',
      message: `Its ${count} item${count === 1 ? '' : 's'} stay on this device and come back if you switch it on again.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlert(null) },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: () => { onToggleModule(id, false); setAlert(null); },
        },
      ],
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg2} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close settings">
            <Icon name="x" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Modules</Text>

          <View style={styles.moduleList}>
            {MODULES.map((m, i) => {
              const on = modules[m.id] !== false;
              return (
                <View key={m.id} style={[styles.moduleRow, i < MODULES.length - 1 && styles.moduleRowDivider]}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{m.label}</Text>
                    <Text style={styles.rowDesc}>{m.desc}</Text>
                  </View>
                  <Switch
                    value={on}
                    onValueChange={(v) => requestToggle(m.id, v)}
                    trackColor={{ false: COLORS.bg4, true: COLORS.accentDim }}
                    thumbColor={on ? COLORS.accent : COLORS.textSub}
                  />
                </View>
              );
            })}
          </View>

          {/* Data is never deleted when a module is switched off — it stays
              in AsyncStorage and comes back with the tab. */}
          <Text style={styles.hint}>
            Switching a section off only hides it. Nothing is deleted — switch it
            back on and everything is exactly where you left it.
          </Text>

          <Text style={styles.sectionLabel}>Data</Text>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Cloud sync</Text>
              <Text style={styles.rowDesc}>
                Not available yet — everything stays on this device
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>About</Text>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Version</Text>
              <Text style={styles.rowDesc}>Read from the app configuration</Text>
            </View>
            <Text style={styles.versionValue}>{APP_VERSION}</Text>
          </View>
        </ScrollView>

        <CustomAlert config={alert} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 52,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg2,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  closeBtn: { padding: 8 },

  content: { padding: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: TYPE.meta, color: COLORS.textSub,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: 18, marginBottom: 10,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },

  // One card holding every switch, so the list reads as a single control.
  moduleList: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 16,
  },
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,
  },
  moduleRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.hairline },
  rowText: { flex: 1, paddingRight: 12 },
  rowTitle: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  rowDesc: { fontSize: TYPE.meta, color: COLORS.textMuted, marginTop: 3 },
  versionValue: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },

  hint: {
    fontSize: TYPE.meta, color: COLORS.textSub,
    lineHeight: 18, marginTop: 10, paddingHorizontal: 4,
  },
});
