import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS } from '../config/colors';

/**
 * TipBubble – floating tooltip shown during onboarding.
 * 
 * Props:
 *   visible  – bool
 *   text     – string
 *   onDismiss – () => void
 *   position – 'top' | 'bottom' (default: 'bottom')
 */
export function TipBubble({ visible, text, onDismiss, position = 'bottom' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 12, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.bubble,
      position === 'top' ? styles.bubbleTop : styles.bubbleBottom,
      { opacity, transform: [{ translateY }] },
    ]}>
      {position === 'bottom' && <View style={styles.arrowUp} />}
      <View style={styles.inner}>
        <Text style={styles.text}>💡 {text}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>Got it</Text>
        </TouchableOpacity>
      </View>
      {position === 'top' && <View style={styles.arrowDown} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999,
  },
  bubbleBottom: { bottom: 80 },
  bubbleTop:    { top: 80 },
  inner: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    marginRight: 12,
  },
  dismissBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dismissText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  arrowUp: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.accent,
    marginBottom: -1,
  },
  arrowDown: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.accent,
    marginTop: -1,
  },
});