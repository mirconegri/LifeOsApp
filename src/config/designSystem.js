// src/config/designSystem.js
//
// Design tokens: spacing, typography, elevation, motion.
// Single source of truth — every screen imports from here.

export const SPACING = {
  xxs: 2,
  xs:  6,
  sm:  10,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// Typographic scale — applied via fontSize across the app.
// The scale steps from caption to display so every text role
// maps to one slot rather than ad-hoc sizes.
export const TYPE = {
  micro:   10,  // chart labels, tiny stats
  caption: 12,  // StatCard label, chart values
  meta:    11,  // subtitles, secondary info
  label:   12,  // section titles (uppercase), button labels
  body:    15,  // main content, descriptions
  title:   18,  // screen titles, modal titles
  heading: 24,  // StatCard values, large numbers
  display: 32,  // greeting, page header
};

// Elevation system — surface depth is communicated through
// background color, border opacity, and shadow/elevation.
// Higher index = closer to the viewer.
export const ELEVATION = {
  canvas: {
    bg: 'bg',
    borderOpacity: 0,
  },
  raised: {
    bg: 'bgElevated',
    borderOpacity: 0.04,
    borderRadius: 18,
  },
  interactive: {
    bg: 'accentGlow',
    borderOpacity: 1,
    borderRadius: 18,
  },
  overlay: {
    bg: 'bg2',
    borderOpacity: 0.09,
    borderRadius: 24,
  },
  modal: {
    bg: 'bg2',
    borderOpacity: 0.12,
    borderRadius: 24,
  },
};

// Motion tokens — single source for all animation timing
// so every entrance, feedback, and transition feels consistent.
export const MOTION = {
  fast:     150,
  normal:   260,
  slow:     400,
  spring:   { speed: 16, bounciness: 8 },
  easing:   'outCubic',
};

// Border radii — consistent corner radii across the app
export const RADIUS = {
  pill:   999,
  card:   20,
  sheet:  28,
  button: 14,
  chip:   12,
  check:  11,
};