// src/ui/WavyProgress.js
//
// Wavy progress indicator for both M3 Expressive progress variants.
//
// Props
//   variant      'linear' | 'circular'
//   progress     0..1, or undefined for indeterminate (arc/line at 72 %)
//   color        wave colour (default M3.primary)
//   trackColor   track colour (default M3.surfaceContainerHighest)
//   amplitude    wave height in px (default 3)
//   wavelength   px per wave (default 24; on the ring it is arc length)
//   stroke       stroke width in px (default 5)
//   animate      false renders a frozen wave and never takes a wave slot
//   width        linear width override; otherwise measured with onLayout
//   height       linear height floor; the stroke/amplitude box always wins
//   size         circular outer size (default 64)
//   style        style for the wrapper View
//
// Performance: at most MAX_ANIMATED_WAVES instances may run the phase
// animation at once. A module-level slot table is claimed in an effect and
// released on unmount; extra instances render a static, frozen wave. All
// per-frame values (progress, phase, measured width) are shared values and
// reach SVG through useAnimatedProps only — nothing continuous goes through
// React state. Under Reduce Motion the wave amplitude is 0 and the phase is
// frozen (PLAN §4).
//
// Layout note: the circular SVG canvas is padded by `amplitude` so sine
// crests are not clipped; the wrapper itself still occupies exactly `size`.

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { M3 } from '../config/colors';
import { SPRING } from '../config/designSystem';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TAU = Math.PI * 2;
const WAVE_PERIOD_MS = 900;
const INDETERMINATE_PROGRESS = 0.72;
const MAX_ANIMATED_WAVES = 3;

// ── Animated-wave budget ────────────────────────────────────────────────
// Instance ids are never reused, so a late unmount can only release its own
// slot. Ids start at 1 so "no slot" can be represented as null.
let nextWaveSlotId = 1;
const activeWaveSlots = new Set();

function claimWaveSlot() {
  if (activeWaveSlots.size >= MAX_ANIMATED_WAVES) return null;
  const id = nextWaveSlotId;
  nextWaveSlotId += 1;
  activeWaveSlots.add(id);
  return id;
}

function releaseWaveSlot(id) {
  if (id !== null) activeWaveSlots.delete(id);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function round2(value) {
  'worklet';
  return Math.round(value * 100) / 100;
}

/**
 * Wavy line from x=0 to x=width*p. y = mid + ampEff*sin(2πx/λ + phase),
 * where ampEff flattens the wave at 0 % and 100 %. Worklet.
 */
function linearWavePath(p, phase, width, mid, amplitude, wavelength) {
  'worklet';
  const end = width * Math.min(1, Math.max(0, p));
  if (!(end > 0)) return '';

  const ampEff = amplitude * Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
  const step = Math.max(1, wavelength / 8, end / 600);
  const yStart = mid + ampEff * Math.sin(phase);
  let d = `M 0 ${round2(yStart)}`;

  for (let x = step; x < end; x += step) {
    const y = mid + ampEff * Math.sin((TAU * x) / wavelength + phase);
    d += ` L ${round2(x)} ${round2(y)}`;
  }

  const yEnd = mid + ampEff * Math.sin((TAU * end) / wavelength + phase);
  return `${d} L ${round2(end)} ${round2(yEnd)}`;
}

/**
 * Wavy arc from -90° to -90° + 360°*p. The radius is R plus the same sine,
 * with the wavelength measured in points of arc length. p >= .999 closes the
 * ring. Point count is capped at 120. Worklet.
 */
function circularWavePath(p, phase, cx, cy, radius, amplitude, wavelength) {
  'worklet';
  const clamped = Math.min(1, Math.max(0, p));
  const sweep = TAU * clamped;
  if (!(sweep > 0.004)) return '';

  const ampEff = amplitude * Math.sin(Math.PI * clamped);
  const circumference = TAU * radius;
  const pointCount = Math.max(
    6,
    Math.min(120, Math.ceil((circumference * clamped) / (wavelength / 8))),
  );

  let d = '';
  for (let i = 0; i <= pointCount; i += 1) {
    const f = i / pointCount;
    const angle = -Math.PI / 2 + sweep * f;
    const arc = radius * sweep * f;
    const r = radius + ampEff * Math.sin((TAU * arc) / wavelength + phase);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? 'M' : 'L'} ${round2(x)} ${round2(y)} `;
  }
  return clamped >= 0.999 ? `${d}Z` : d;
}

export function WavyProgress({
  variant = 'linear',
  progress,
  color = M3.primary,
  trackColor = M3.surfaceContainerHighest,
  amplitude = 3,
  wavelength = 24,
  stroke = 5,
  animate = true,
  width,
  height,
  size = 64,
  style,
  accessibilityLabel = 'Progress',
}) {
  const reduced = useReducedMotion();
  const amp = Math.max(0, amplitude);
  const waveAmplitude = reduced ? 0 : amp;
  const waveLength = Math.max(1, wavelength);
  const strokeWidth = Math.max(1, stroke);

  const hasProgress = typeof progress === 'number' && Number.isFinite(progress);
  const targetProgress = hasProgress ? clamp01(progress) : INDETERMINATE_PROGRESS;

  const progressValue = useSharedValue(targetProgress);
  const phase = useSharedValue(0);
  const measuredWidth = useSharedValue(
    typeof width === 'number' && width > 0 ? width : 0,
  );

  // ── Wave-slot lifecycle ──────────────────────────────────────────────
  const [slotId, setSlotId] = useState(null);
  const hasSlot = slotId !== null;

  useEffect(() => {
    if (!animate || reduced) {
      setSlotId(null);
      return undefined;
    }
    const id = claimWaveSlot();
    setSlotId(id);
    return () => releaseWaveSlot(id);
  }, [animate, reduced]);

  // ── Progress spring ──────────────────────────────────────────────────
  useEffect(() => {
    progressValue.value = reduced
      ? targetProgress
      : withSpring(targetProgress, SPRING.defaultSpatial);
  }, [targetProgress, reduced, progressValue]);

  // ── Phase loop (only while this instance owns a slot) ────────────────
  useEffect(() => {
    if (!hasSlot || !animate || reduced) return undefined;
    phase.value = 0;
    phase.value = withRepeat(
      withTiming(TAU, { duration: WAVE_PERIOD_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(phase);
  }, [animate, hasSlot, phase, reduced]);

  // Keep the linear measurement in sync when the caller supplies a width.
  useEffect(() => {
    if (typeof width === 'number' && width > 0) measuredWidth.value = width;
  }, [width, measuredWidth]);

  const handleLayout = useCallback((event) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0) measuredWidth.value = nextWidth;
  }, [measuredWidth]);

  const linearHeight = Math.max(height ?? 0, strokeWidth * 2 + amp * 2 + 2);
  const linearMid = linearHeight / 2;
  const ringRadius = Math.max(1, (size - strokeWidth) / 2);
  const bleed = amp;
  const ringCanvas = size + bleed * 2;

  // ── Animated SVG props (d strings only) ──────────────────────────────
  const linearTrackProps = useAnimatedProps(() => {
    const currentWidth = measuredWidth.value;
    return {
      d: currentWidth > 0
        ? `M 0 ${round2(linearMid)} L ${round2(currentWidth)} ${round2(linearMid)}`
        : '',
    };
  });

  const linearFillProps = useAnimatedProps(() => ({
    d: linearWavePath(
      progressValue.value,
      phase.value,
      measuredWidth.value,
      linearMid,
      waveAmplitude,
      waveLength,
    ),
  }));

  const circularFillProps = useAnimatedProps(() => ({
    d: circularWavePath(
      progressValue.value,
      phase.value,
      size / 2,
      size / 2,
      ringRadius,
      waveAmplitude,
      waveLength,
    ),
  }));

  const accessibilityValue = hasProgress
    ? { min: 0, max: 100, now: Math.round(targetProgress * 100) }
    : undefined;

  if (variant === 'circular') {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={accessibilityValue}
        style={[styles.circularHost, { width: size, height: size }, style]}
      >
        <Svg
          width={ringCanvas}
          height={ringCanvas}
          viewBox={`${-bleed} ${-bleed} ${ringCanvas} ${ringCanvas}`}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={ringRadius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <AnimatedPath
            animatedProps={circularFillProps}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue}
      onLayout={handleLayout}
      style={[typeof width === 'number' && width > 0 ? { width } : null, style]}
    >
      <Svg width="100%" height={linearHeight}>
        <AnimatedPath
          animatedProps={linearTrackProps}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={linearFillProps}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  circularHost: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
