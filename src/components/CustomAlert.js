
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../config/colors';

/**
 * CustomAlert – replaces the stock Android alert dialog.
 * Usage:
 * const [alert, setAlert] = useState(null);
 * setAlert({ title: 'Delete', message: 'Are you sure?', buttons: [
 *   { text: 'Cancel', style: 'cancel', onPress: () => setAlert(null) },
 *   { text: 'Delete', style: 'destructive', onPress: () => { doDelete(); setAlert(null); } },
 * ]});
 * <CustomAlert config={alert} />
 *
 * Hardware back button: routed to the 'cancel'-style button if one was
 * provided (so back behaves like tapping Cancel), otherwise treated as a
 * no-op rather than silently confirming a destructive action — an alert
 * with no cancel option is usually a deliberate "you must choose" dialog,
 * and back shouldn't be able to bypass that.
 *
 * Blur: iOS only, same reasoning as DatePicker.js — expo-blur on Android
 * pre-SDK55 never actually blurs, it's a flat tint, which read as cheap
 * transparency rather than glass on this device.
 */
export function CustomAlert({ config }) {
  if (!config) return null;
  const { title, message, buttons = [] } = config;

  const handleRequestClose = () => {
    const cancelBtn = buttons.find(b => b.style === 'cancel');
    if (cancelBtn) cancelBtn.onPress?.();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.androidPanelFill} />
          )}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.btnRow}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.onPress}
                style={[
                  styles.btn,
                  btn.style === 'destructive' && styles.btnDestructive,
                  btn.style === 'cancel'      && styles.btnCancel,
                  i > 0 && { marginLeft: 10 },
                ]}
              >
                <Text style={[
                  styles.btnText,
                  btn.style === 'destructive' && styles.btnTextDestructive,
                  btn.style === 'cancel'      && styles.btnTextCancel,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  box: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden', // clips the BlurView/panel to the rounded corners
  },
  // Android substitute for the non-functional blur — see file header.
  androidPanelFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  btnDestructive: {
    backgroundColor: COLORS.redDim,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  btnCancel: {
    backgroundColor: COLORS.bg4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextDestructive: {
    color: COLORS.red,
  },
  btnTextCancel: {
    color: COLORS.textMuted,
  },
});
