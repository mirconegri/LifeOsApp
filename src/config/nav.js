
// src/config/nav.js
//
// Note: the entry below still uses id: 'journal' even though its label is
// now "Tasks". That's intentional — AsyncStorage already has user data
// saved under the key 'lifeos_journal'. Changing the id would silently
// orphan that data on next launch (App.js loads/saves by this id). Only
// the label/icon changed; the underlying screen and storage key did not.
export const NAV = [
  { id: 'home',      label: 'Home',       icon: 'home',          bottomNav: true  },
  { id: 'uni',       label: 'University', icon: 'graduation-cap', bottomNav: true  },
  { id: 'journal',   label: 'Tasks',      icon: 'check-square',   bottomNav: true  },
  { id: 'finances',  label: 'Finances',   icon: 'wallet',         bottomNav: true  },
  { id: 'stats',     label: 'Stats',      icon: 'bar-chart-3',    bottomNav: true  },
  { id: 'groceries', label: 'Groceries',  icon: 'shopping-cart',  bottomNav: false },
  { id: 'goals',     label: 'Goals',      icon: 'target',         bottomNav: false },
  { id: 'notes',     label: 'Notes',      icon: 'file-text',      bottomNav: false },
  { id: 'links',     label: 'Links',      icon: 'link',           bottomNav: false },
];
