// src/config/colors.js
//
// Material 3 Expressive colour roles for LifeOS (dark scheme only).
//
// Two layers live here on purpose:
//   1. M3 — the real role palette. New code imports roles from here.
//   2. COLORS — the legacy bag that every unmigrated screen still imports.
//      Same keys as before, new values, plus all M3 roles spread in so a
//      screen can migrate one line at a time without importing M3.
//
// Legacy `surface` stays the old translucent white overlay ('#ffffff08'),
// because it is a different concept from the M3 surface role; use
// M3.surface (or COLORS.background) for the surface role.
//
// Nothing here is a component: keep it pure data + pure helpers.

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function hexToRgb(hex) {
  const h = hex.replace('#', '').slice(0, 6);
  const n = parseInt(h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb;
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  return rgb.map((v) => Math.round((v + m) * 255));
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Tonal pair for an arbitrary brand colour, dark scheme.
 *   container = hsl(h, min(s * .7, .75), .26)
 *   on        = hsl(h, min(s, .8), .82)
 * This is the single rule for every module/status colour: no raw
 * #22c55e / #ef4444 on text anywhere.
 */
export function tonal(hex) {
  const { h, s } = rgbToHsl(...Object.values(hexToRgb(hex)));
  return {
    base: hex,
    container: rgbToHex(...hslToRgb(h, Math.min(s * 0.7, 0.75), 0.26)),
    on: rgbToHex(...hslToRgb(h, Math.min(s, 0.8), 0.82)),
  };
}

/** '#rrggbb' + alpha -> '#rrggbbaa'. Handy for scrims and tints. */
export function alpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  const aa = Math.round(clamp01(a) * 255).toString(16).padStart(2, '0');
  return `${rgbToHex(r, g, b)}${aa}`;
}

// ── M3 dark roles ──────────────────────────────────────────────────────
export const M3 = {
  background: '#0E0E12',
  surface: '#0E0E12',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#131318',
  surfaceContainer: '#191920',
  surfaceContainerHigh: '#1F1F26',
  surfaceContainerHighest: '#25252E',
  surfaceBright: '#2C2B34',
  onSurface: '#E7E4F0',
  onSurfaceVariant: '#ACAAB5',
  outline: '#76747F',
  outlineVariant: '#484750',
  primary: '#cabeff',
  onPrimary: '#32285f',
  primaryContainer: '#483f77',
  onPrimaryContainer: '#e6deff',
  secondary: '#c9c3dc',
  onSecondary: '#312e41',
  secondaryContainer: '#484459',
  onSecondaryContainer: '#e6dff9',
  tertiary: '#edb8cc',
  onTertiary: '#492535',
  tertiaryContainer: '#623b4c',
  onTertiaryContainer: '#ffd8e6',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  scrim: '#000000',
};

// ── Per-module tonal pairs ─────────────────────────────────────────────
// Computed from the base colours with tonal(), so the exact same formula
// also works for user-provided colours (link accents, categories, …).
export const MODULE_TONES = {
  home: tonal('#7c5cff'),
  uni: tonal('#7c5cff'),
  journal: tonal('#22c55e'),
  finances: tonal('#f59e0b'),
  stats: tonal('#5ac8fa'),
  groceries: tonal('#fb923c'),
  goals: tonal('#f43f5e'),
  notes: tonal('#eab308'),
  links: tonal('#3b82f6'),
};

// ── Legacy bag ─────────────────────────────────────────────────────────
// Unmigrated screens keep working; a screen can be migrated in place.
export const COLORS = {
  // M3 roles (new code; `surface` is overridden below on purpose)
  ...M3,

  // Backgrounds
  bg: M3.background,
  bg2: M3.surfaceContainerLow,
  bg3: M3.surfaceContainer,
  bg4: M3.surfaceContainerHigh,
  bgElevated: M3.surfaceContainer,

  // Text
  text: M3.onSurface,
  textMuted: M3.onSurfaceVariant,
  textSub: M3.outline,

  // Accent — legacy name for the primary role
  accent: M3.primary,
  accentDim: M3.primaryContainer,
  accentGlow: '#cabeff26',

  // Secondary data series (charts)
  accent2: MODULE_TONES.stats.on,
  accent2Dim: MODULE_TONES.stats.container,

  // Semantic, tonal pairs only
  green: MODULE_TONES.journal.on,
  greenDim: MODULE_TONES.journal.container,
  amber: MODULE_TONES.finances.on,
  amberDim: MODULE_TONES.finances.container,
  red: M3.error,
  redDim: M3.errorContainer,
  blue: MODULE_TONES.links.on,

  // Legacy translucent white overlay; the M3 surface role lives on M3.surface
  surface: '#ffffff08',

  // Legacy borders (deprecated: depth now comes from tonal layering)
  border: M3.outlineVariant,
  border2: M3.outline,
  hairline: M3.outlineVariant,
};
