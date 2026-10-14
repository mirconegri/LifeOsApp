
// src/config/colors.js
export const COLORS = {
  // Backgrounds
  bg:        '#0b0b12',
  bg2:       '#111118',
  bg3:       '#16161f',
  bg4:       '#1e1e2a',
  bgElevated:'#1a1a24', // slightly lifted surface, used for cards that sit "above" the base layer

  // Text
  text:      '#ffffff',
  textMuted: '#b4b4c0',
  textSub:   '#6e6e7a',

  // Accent — violet (primary)
  accent:    '#7c5cff',
  accentDim: '#5a3fd6',
  accentGlow:'#7c5cff33',

  // Secondary accent — used to differentiate a second data series in
  // charts (e.g. arithmetic vs weighted average) without resorting to a
  // gradient. Cyan reads clearly against the violet primary on a dark
  // background without fighting it for attention.
  accent2:    '#5ac8fa',
  accent2Dim: '#5ac8fa22',

  // Semantic
  green:     '#22c55e',
  greenDim:  '#22c55e22',
  amber:     '#f59e0b',
  amberDim:  '#f59e0b22',
  red:       '#ef4444',
  redDim:    '#ef444422',
  blue:      '#3b82f6',

  // Surface — subtle white overlay for raised-surface top edge,
  // gives the glass/OS look a directional light source.
  surface:   '#ffffff08',

  // Borders — kept subtle and low-opacity on purpose: the pre-liquid-glass
  // Apple look relies on a faint hairline rather than a visibly "drawn"
  // border to separate flat surfaces.
  border:    '#232333',
  border2:   '#3a3a52',
  hairline:  '#ffffff14',
};
