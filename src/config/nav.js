
// src/config/nav.js
//
// Note: the entry below still uses id: 'journal' even though its label is
// now "Tasks". That's intentional — AsyncStorage already has user data
// saved under the key 'lifeos_journal'. Changing the id would silently
// orphan that data on next launch (App.js loads/saves by this id). Only
// the label/icon changed; the underlying screen and storage key did not.
export const NAV = [
  { id: 'home',      label: 'Home',       icon: '⌂',  bottomNav: true  },
  { id: 'uni',       label: 'University', icon: '🎓', bottomNav: true  },
  { id: 'journal',   label: 'Tasks',      icon: '✅', bottomNav: true  },
  { id: 'finances',  label: 'Finances',   icon: '💶', bottomNav: true  },
  { id: 'stats',     label: 'Stats',      icon: '📊', bottomNav: true  },
  { id: 'groceries', label: 'Groceries',  icon: '🛒', bottomNav: false },
  { id: 'goals',     label: 'Goals',      icon: '🗺', bottomNav: false },
  { id: 'notes',     label: 'Notes',      icon: '💡', bottomNav: false },
  { id: 'links',     label: 'Links',      icon: '🔗', bottomNav: false },
];
