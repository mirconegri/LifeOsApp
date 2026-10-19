// src/ui/Dialog.js
//
// Centred M3 dialog: scrim, tonal card (radius 28, surfaceContainerHigh,
// 24 padding), optional leading tonal icon and title, message, arbitrary
// children, and right-aligned text buttons.
//
// Usage:
//   <Dialog
//     visible={visible}
//     title="Delete task?"
//     message="This cannot be undone."
//     icon="trash-2"
//     tone={MODULE_TONES.goals}
//     buttons={[
//       { text: 'Cancel', style: 'cancel', onPress: close },
//       { text: 'Delete', style: 'destructive', onPress: remove },
//     ]}
//     onRequestClose={close}
//   />
//
// The button contract is CustomAlert's: { text, style: 'cancel' | 'destructive'
// | undefined, onPress }. A button does not close the dialog by itself — its
// onPress owns that. Hardware back is routed to the cancel button when one
// exists; otherwise to onRequestClose, and never to a destructive action.
//
// No blur (Android-first) and no shadow: the scrim plus tonal layering give
// the depth.

import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { M3, alpha } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { SpringPressable } from './SpringPressable';
import { TonalIcon } from './TonalIcon';
import { TEXT, TEXT_EMPHASIZED } from './type';

const CARD_MAX_WIDTH = 380;
const BUTTON_MIN_HEIGHT = 48;

function buttonInk(button) {
  if (button.style === 'destructive') return M3.error;
  if (button.style === 'cancel') return M3.onSurfaceVariant;
  return M3.primary;
}

export function Dialog({ visible, title, icon, message, children, buttons = [], onRequestClose, tone, style }) {
  if (!visible) return null;

  const handleRequestClose = () => {
    const cancel = buttons.find((button) => button.style === 'cancel');
    if (cancel) {
      if (cancel.onPress) cancel.onPress();
      return;
    }
    if (onRequestClose) onRequestClose();
  };

  const hasHeader = Boolean(icon || title);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={styles.scrim}>
        <View style={[styles.card, style]}>
          {hasHeader ? (
            <View style={styles.header}>
              {icon ? <TonalIcon icon={icon} size={40} radius={14} tone={tone} /> : null}
              {title ? (
                <Text style={[TEXT_EMPHASIZED.titleLarge, styles.title, icon && styles.titleWithIcon]}>
                  {title}
                </Text>
              ) : null}
            </View>
          ) : null}

          {message ? (
            <Text style={[TEXT.bodyMedium, styles.message, hasHeader && styles.messageAfterHeader]}>
              {message}
            </Text>
          ) : null}

          {children ? <View style={styles.children}>{children}</View> : null}

          {buttons.length > 0 ? (
            <View style={styles.buttonRow}>
              {buttons.map((button, i) => (
                <SpringPressable
                  key={`${button.text}-${i}`}
                  onPress={button.onPress}
                  haptic="selection"
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  <Text style={[TEXT.labelLarge, { color: buttonInk(button) }]} numberOfLines={1}>
                    {button.text}
                  </Text>
                </SpringPressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: alpha(M3.scrim, 0.7),
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.xxxl,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: M3.onSurface,
  },
  titleWithIcon: {
    marginLeft: 12,
  },
  message: {
    color: M3.onSurfaceVariant,
    lineHeight: 20,
  },
  messageAfterHeader: {
    marginTop: 12,
  },
  children: {
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.lg,
  },
  button: {
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
  // Inner slot: padding and height belong to the touch target itself.
  buttonContent: {
    minHeight: BUTTON_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
});
