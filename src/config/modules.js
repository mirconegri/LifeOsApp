// src/config/modules.js
//
// Optional sections the user can switch on or off from Settings. Home and
// Stats are deliberately absent: they are the frame around the modules, not
// modules themselves, so there is nothing sensible to show with all of them
// off. Ids match src/config/nav.js, and they double as storage keys.
export const MODULES = [
  { id: 'uni',       label: 'University', desc: 'Exams, grades and degree prediction' },
  { id: 'journal',   label: 'Tasks',      desc: 'Tasks, habits and daily planning' },
  { id: 'finances',  label: 'Finances',   desc: 'Balance and transactions' },
  { id: 'groceries', label: 'Groceries',  desc: 'Shopping list' },
  { id: 'goals',     label: 'Goals',      desc: 'Personal targets' },
  { id: 'notes',     label: 'Notes',      desc: 'Free-form notes' },
  { id: 'links',     label: 'Links',      desc: 'Saved links and bookmarks' },
];

export const DEFAULT_MODULES = MODULES.reduce((acc, m) => {
  acc[m.id] = true;
  return acc;
}, {});

// Anything missing or not explicitly false counts as on, so a settings value
// written by an older build never hides a module the user did not turn off.
export function normalizeModules(saved) {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_MODULES };
  const next = {};
  MODULES.forEach((m) => { next[m.id] = saved[m.id] !== false; });
  return next;
}
