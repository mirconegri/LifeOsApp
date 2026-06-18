import { todayKey } from './helpers';

export const INIT_EXAMS = [
  { id: 1, name: 'Mathematical Analysis II',     credits: 9,  expectedGrade: 27, achievedGrade: null, date: '2026-07-10', status: 'preparing' },
  { id: 2, name: 'Algorithms & Data Structures', credits: 12, expectedGrade: 29, achievedGrade: null, date: '2026-06-24', status: 'to start' },
  { id: 3, name: 'Programming',                  credits: 9,  expectedGrade: null, achievedGrade: 28, date: '2025-03-15', status: 'passed' },
  { id: 4, name: 'Physics I',                    credits: 9,  expectedGrade: null, achievedGrade: 30, date: '2025-02-01', status: 'passed' },
  { id: 5, name: 'Numerical Calculus',           credits: 6,  expectedGrade: null, achievedGrade: 26, date: '2025-01-20', status: 'passed' },
];

export const INIT_TASKS = [
  { id: 1, text: 'Study chapter 3 Analysis',     done: false, subject: 'Mathematical Analysis II',     priority: 'high',   date: todayKey() },
  { id: 2, text: 'Sorting algorithms exercises', done: false, subject: 'Algorithms & Data Structures', priority: 'high',   date: todayKey() },
  { id: 3, text: 'Read paper on BFS/DFS',        done: true,  subject: 'Algorithms & Data Structures', priority: 'medium', date: todayKey() },
];

export const INIT_HABITS = [
  { id: 1, name: 'Study',       icon: '📚', streak: 5, history: {} },
  { id: 2, name: 'Reading',     icon: '📖', streak: 3, history: {} },
  { id: 3, name: 'Workout',     icon: '🏃', streak: 2, history: {} },
  { id: 4, name: 'Water 2L',    icon: '💧', streak: 7, history: {} },
];

export const INIT_FINANCES = [
  { id: 1, date: '2026-06-01', desc: 'Part-time salary', amount:  400, type: 'income',  category: 'work' },
  { id: 2, date: '2026-06-02', desc: 'Groceries',        amount:  -65, type: 'expense', category: 'food' },
  { id: 3, date: '2026-06-05', desc: 'Transit pass',     amount:  -35, type: 'expense', category: 'transport' },
  { id: 4, date: '2026-06-08', desc: 'University books', amount:  -45, type: 'expense', category: 'university' },
  { id: 5, date: '2026-06-10', desc: 'Scholarship',      amount:  250, type: 'income',  category: 'university' },
];

export const INIT_GROCERIES = [
  { id: 1, text: 'Pasta',             category: 'supermarket', done: false },
  { id: 2, text: 'Still water',       category: 'supermarket', done: false },
  { id: 3, text: 'Vitamin C',         category: 'pharmacy',    done: true  },
  { id: 4, text: 'Whole wheat bread', category: 'supermarket', done: false },
];

export const INIT_NOTES = [
  { id: 1, title: 'Fitness App Idea',     content: 'Tracker that uses the microphone to count reps automatically', tags: ['idea','app'],    date: todayKey() },
  { id: 2, title: 'AI Prompt for Study',  content: 'Explain as if you were an MIT professor...',                 tags: ['prompt','study'], date: todayKey() },
];

// starred: bool — max 6 starred shown in Home
export const INIT_LINKS = [
  { id: 1, name: 'Gmail',   url: 'https://mail.google.com',  icon: '✉️', starred: true  },
  { id: 2, name: 'GitHub',  url: 'https://github.com',       icon: '🐙', starred: true  },
  { id: 3, name: 'Drive',   url: 'https://drive.google.com', icon: '📁', starred: true  },
  { id: 4, name: 'ChatGPT', url: 'https://chat.openai.com',  icon: '🤖', starred: true  },
  { id: 5, name: 'Moodle',  url: 'https://moodle.unipd.it',  icon: '🎓', starred: false },
  { id: 6, name: 'Esse3',   url: 'https://esse3.unipd.it',   icon: '📋', starred: false },
];

// Prevents missing import errors if imported in App.js
export const INIT_GOALS = [];
