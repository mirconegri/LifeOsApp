// src/config/designSystem.js
//
// Design tokens: spacing, typography scale, shape, elevation, motion.
// Single source of truth — every screen imports from here.
//
// Legacy keys are kept as aliases so unmigrated screens inherit the new
// look without breaking. New code should prefer SHAPE / SPRING /
// motionConst and the ready-made text styles in src/ui/type.js.

export const SPACING = {
  xxs: 2,
  xs:  6,
  sm:  10,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ── Legacy type scale ──────────────────────────────────────────────────
// Numeric font sizes used by unmigrated screens (`fontSize: TYPE.body`).
// Do not turn these into objects: the screens index them as numbers.
// The M3 role styles live in src/ui/type.js.
export const TYPE = {
  micro:   10,
  caption: 12,
  meta:    11,
  label:   12,
  body:    15,
  title:   18,
  heading: 24,
  display: 32,
};

// ── Shape ──────────────────────────────────────────────────────────────
export const SHAPE = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 28,
  full: 999,
};

// ── Motion constants ───────────────────────────────────────────────────
export const motionConst = {
  pressScale:      0.94,
  revealDistance:  28,
  revealStagger:   45,
  revealMaxIndex:  8,
  heroIntervalMs:  5500,
  navHideOffset:   120,
  navIconPop:      0.7,
  dotInactive:     6,
  dotActive:       22,
  rowCorner:       20,
  rowCornerPressed: 4,
};

// M3E MotionScheme.expressive(), converted to Reanimated springs
// (mass 1, damping = 2 * zeta * sqrt(stiffness)). Starting values: tune
// on the phone, never in a screen.
export const SPRING = {
  fastSpatial:    { mass: 1, stiffness: 800,  damping: 34  },  // press squash, shape morph, nav pop, dot width
  defaultSpatial: { mass: 1, stiffness: 380,  damping: 31  },  // nav expand/hide, dialogs, sheets
  slowSpatial:    { mass: 1, stiffness: 200,  damping: 23  },  // hero glide, reveal, blob morph
  fastEffects:    { mass: 1, stiffness: 3800, damping: 123 },  // colour / alpha (critically damped)
  defaultEffects: { mass: 1, stiffness: 1600, damping: 80  },
  slowEffects:    { mass: 1, stiffness: 800,  damping: 57  },
};

// ── Legacy elevation (deprecated) ──────────────────────────────────────
// Depth now comes from tonal layering. The only shadow in the app is the
// floating nav pill. Kept so old imports do not crash.
export const ELEVATION = {
  canvas:      { bg: 'bg',         borderOpacity: 0 },
  raised:      { bg: 'bgElevated', borderOpacity: 0.04, borderRadius: 18 },
  interactive: { bg: 'accentGlow', borderOpacity: 1,    borderRadius: 18 },
  overlay:     { bg: 'bg2',        borderOpacity: 0.09, borderRadius: 24 },
  modal:       { bg: 'bg2',        borderOpacity: 0.12, borderRadius: 24 },
};

// ── Legacy motion (deprecated: Reanimated springs replace these) ───────
export const MOTION = {
  fast:     150,
  normal:   260,
  slow:     400,
  spring:   { speed: 16, bounciness: 8 },
  easing:   'outCubic',
};

// ── Legacy radii (deprecated: prefer SHAPE) ────────────────────────────
export const RADIUS = {
  pill:   999,
  card:   28,
  sheet:  28,
  button: 14,
  chip:   12,
  check:  11,
};
