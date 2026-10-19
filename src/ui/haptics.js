// src/ui/haptics.js
//
// One haptic entry point for the whole app.
//
// expo-haptics is a NATIVE module. On a dev client built before it was
// added, requiring it throws, so it is resolved lazily inside try/catch
// and falls back to React Native's Vibration. Taps/ticks therefore work
// on every build; the finer feedback appears after the next rebuild.
//
// `haptic(false)` is a deliberate no-op (callers pass haptic={false}).

import { Vibration } from 'react-native';

let _haptics;
let _tried = false;

function load() {
  if (_tried) return _haptics;
  _tried = true;
  try {
    // Lazy on purpose: a static import would crash on old dev clients.
    _haptics = require('expo-haptics');
  } catch {
    _haptics = null;
  }
  return _haptics;
}

/**
 * @param {'selection'|'light'|'medium'|false} kind
 */
export function haptic(kind = 'selection') {
  if (kind === false) return;
  const H = load();
  if (!H) {
    Vibration.vibrate(kind === 'medium' ? 12 : kind === 'light' ? 8 : 6);
    return;
  }
  try {
    const style = H.ImpactFeedbackStyle || {};
    const map = {
      selection: () => H.selectionAsync?.(),
      light:     () => H.impactAsync?.(style.Light ?? 'light'),
      medium:    () => H.impactAsync?.(style.Medium ?? 'medium'),
    };
    const run = map[kind] || map.selection;
    const p = run();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    Vibration.vibrate(6);
  }
}
