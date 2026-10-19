// src/ui/Blob.js
//
// Expressive radial shapes for tiles, empty states and onboarding.
//
// The outline is a polar curve:
//   r(θ) = R * (1 + a * sign(c) * |c|^p),  c = cos(nθ)
// sampled clockwise from angle 0 and closed with an L-segment path.
//
// Exports
//   BLOB_PRESETS                          named { n, a, p } tables
//   radiiForPreset(preset, samples, R)    sampled radii (number[])
//   pathForRadii(radii, cx, cy)           SVG 'd' string (L segments)
//   Blob({ preset, size, color, style, opacity })
//   MorphBlob({ index, presets, size, color, rotate, style })
//
// MorphBlob lerps two 72-point radius tables on a slow spatial spring, all in
// a useAnimatedProps worklet: no React state changes while it animates.
// Rotation is index-derived (index * 90°) so repeated steps cannot drift.

import React, { useEffect, useMemo, useRef } from 'react';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { M3 } from '../config/colors';
import { SPRING } from '../config/designSystem';

const MORPH_SAMPLES = 72;
const DEFAULT_MORPH_PRESETS = ['circle', 'cookie9', 'cookie12', 'flower'];

export const BLOB_PRESETS = {
  circle:   { n: 1,  a: 0,    p: 1 },
  cookie6:  { n: 6,  a: 0.075, p: 1 },
  cookie9:  { n: 9,  a: 0.06,  p: 1 },
  cookie12: { n: 12, a: 0.045, p: 1 },
  clover4:  { n: 4,  a: 0.17,  p: 1 },
  flower:   { n: 8,  a: 0.13,  p: 1 },
  sunny:    { n: 8,  a: 0.11,  p: 0.55 },
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Accept a preset name or a { n, a, p } object; unknown names fall back. */
function resolvePreset(preset) {
  if (typeof preset === 'string') {
    return BLOB_PRESETS[preset] || BLOB_PRESETS.circle;
  }
  if (preset && typeof preset === 'object') return preset;
  return BLOB_PRESETS.circle;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/** Stable identity for a preset, so inline object literals do not re-morph. */
function presetKey(preset) {
  const { n, a, p } = resolvePreset(preset);
  return `${n}:${a}:${p}`;
}

/**
 * Sample a preset into `samples` radii around the circle.
 * `samples` is clamped to at least 3 points; R defaults to 50 (viewBox units).
 */
export function radiiForPreset(preset, samples = 72, R = 50) {
  const { n, a, p } = resolvePreset(preset);
  const count = Math.max(3, Math.floor(samples));
  const radii = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const theta = (Math.PI * 2 * i) / count;
    const c = Math.cos(n * theta);
    const signed = c < 0 ? -1 : 1;
    radii[i] = R * (1 + a * signed * Math.pow(Math.abs(c), p));
  }
  return radii;
}

/** Build a closed SVG path from sampled radii, using straight L segments. */
export function pathForRadii(radii, cx = 50, cy = 50) {
  const count = radii.length;
  if (!count) return '';
  let d = '';
  for (let i = 0; i < count; i += 1) {
    const theta = (Math.PI * 2 * i) / count;
    const x = cx + radii[i] * Math.cos(theta);
    const y = cy + radii[i] * Math.sin(theta);
    d += `${i === 0 ? 'M' : 'L'} ${round2(x)} ${round2(y)} `;
  }
  return `${d}Z`;
}

export function Blob({
  preset = 'cookie9',
  size = 120,
  color = M3.primary,
  style,
  opacity = 1,
}) {
  const radii = useMemo(() => radiiForPreset(resolvePreset(preset)), [preset]);
  const d = useMemo(() => pathForRadii(radii), [radii]);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Path d={d} fill={color} fillOpacity={opacity} />
    </Svg>
  );
}

/** Lerp two 72-point radius tables and emit the path. Runs on the UI thread. */
function morphPath(from, to, progress) {
  'worklet';
  const count = from.length;
  const t = Math.min(1, Math.max(0, progress));
  const step = (Math.PI * 2) / count;
  let d = '';
  for (let i = 0; i < count; i += 1) {
    const radius = from[i] + (to[i] - from[i]) * t;
    const angle = step * i;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    d += `${i === 0 ? 'M' : 'L'} ${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `;
  }
  return `${d}Z`;
}

export function MorphBlob({
  index = 0,
  presets = [],
  size = 120,
  color = M3.primary,
  rotate = true,
  style,
}) {
  const reduced = useReducedMotion();
  const list = Array.isArray(presets) && presets.length > 0
    ? presets
    : DEFAULT_MORPH_PRESETS;
  const step = Math.round(index);
  const slot = ((step % list.length) + list.length) % list.length;
  const targetPreset = resolvePreset(list[slot]);
  const targetKey = presetKey(targetPreset);

  // Recompute only when the preset actually changes; callers may pass an
  // inline `presets` array whose identity changes every render.
  const targetRadii = useMemo(
    () => radiiForPreset(targetPreset, MORPH_SAMPLES),
    [targetKey],
  );

  const fromRadii = useSharedValue(targetRadii);
  const toRadii = useSharedValue(targetRadii);
  const morph = useSharedValue(1);
  const rotation = useSharedValue(step * 90);
  const appliedRadii = useRef(targetRadii);

  const animatedProps = useAnimatedProps(() => ({
    d: morphPath(fromRadii.value, toRadii.value, morph.value),
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    const previous = appliedRadii.current;
    const changed = previous !== targetRadii;
    appliedRadii.current = targetRadii;

    if (!changed && !reduced) {
      // No shape change: leave a running morph alone.
    } else if (!changed || reduced) {
      fromRadii.value = targetRadii;
      toRadii.value = targetRadii;
      morph.value = 1;
    } else {
      fromRadii.value = previous;
      toRadii.value = targetRadii;
      morph.value = 0;
      morph.value = withSpring(1, SPRING.slowSpatial);
    }

    if (rotate) {
      rotation.value = reduced
        ? step * 90
        : withSpring(step * 90, SPRING.slowSpatial);
    }
    // `targetRadii` is stable per preset thanks to targetKey above.
  }, [targetRadii, step, rotate, reduced, fromRadii, toRadii, morph, rotation]);

  return (
    <Animated.View style={[rotate ? rotateStyle : null, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <AnimatedPath animatedProps={animatedProps} fill={color} />
      </Svg>
    </Animated.View>
  );
}
