import { todayKey, localDateKey } from './helpers';

// 'YYYY-MM-DD' that is `n` days from today (negative = past, 0 = today,
// positive = future). Always via localDateKey, never toISOString() — see
// helpers.js for why, in a UTC+ timezone.
function dateOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

export const INIT_EXAMS = [
  { id: 1,  name: 'Calculus I',                      credits: 9,  expectedGrade: null, achievedGrade: 26, date: dateOffset(-650), status: 'passed' },
  { id: 2,  name: 'Geometry and Linear Algebra',     credits: 6,  expectedGrade: null, achievedGrade: 28, date: dateOffset(-642), status: 'passed' },
  { id: 3,  name: 'Programming I',                   credits: 9,  expectedGrade: null, achievedGrade: 31, date: dateOffset(-627), status: 'passed' },
  { id: 4,  name: 'Computer Science Fundamentals',   credits: 6,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-586), status: 'passed' },
  { id: 5,  name: 'General Physics',                 credits: 9,  expectedGrade: null, achievedGrade: 24, date: dateOffset(-553), status: 'passed' },
  { id: 6,  name: 'Calculus II',                     credits: 9,  expectedGrade: null, achievedGrade: 25, date: dateOffset(-542), status: 'passed' },
  { id: 7,  name: 'Programming II',                  credits: 9,  expectedGrade: null, achievedGrade: 29, date: dateOffset(-531), status: 'passed' },
  { id: 8,  name: 'Algorithms and Data Structures',  credits: 12, expectedGrade: null, achievedGrade: 28, date: dateOffset(-432), status: 'passed' },
  { id: 9,  name: 'Databases',                       credits: 9,  expectedGrade: null, achievedGrade: 30, date: dateOffset(-417), status: 'passed' },
  { id: 10, name: 'Operating Systems',                credits: 9,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-397), status: 'passed' },
  { id: 11, name: 'Numerical Methods',                credits: 6,  expectedGrade: null, achievedGrade: 26, date: dateOffset(-356), status: 'passed' },
  { id: 12, name: 'Computer Networks',                credits: 9,  expectedGrade: null, achievedGrade: 28, date: dateOffset(-341), status: 'passed' },
  { id: 13, name: 'Probability and Statistics',       credits: 6,  expectedGrade: null, achievedGrade: 25, date: dateOffset(-321), status: 'passed' },
  { id: 14, name: 'Operations Research',              credits: 6,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-293), status: 'passed' },
  { id: 15, name: 'Software Engineering',             credits: 9,  expectedGrade: null, achievedGrade: 29, date: dateOffset(-249), status: 'passed' },
  { id: 16, name: 'Distributed Systems',              credits: 9,  expectedGrade: null, achievedGrade: 28, date: dateOffset(-227), status: 'passed' },
  { id: 17, name: 'Artificial Intelligence',          credits: 9,  expectedGrade: null, achievedGrade: 31, date: dateOffset(-213), status: 'passed' },
  { id: 18, name: 'Computer Architecture',            credits: 9,  expectedGrade: null, achievedGrade: 26, date: dateOffset(-109), status: 'passed' },
  { id: 19, name: 'Cybersecurity',                    credits: 6,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-95),  status: 'passed' },
  { id: 20, name: 'Machine Learning',                 credits: 9,  expectedGrade: null, achievedGrade: 29, date: dateOffset(-81),  status: 'passed' },
  { id: 21, name: 'Compilers',                        credits: 6,  expectedGrade: null, achievedGrade: 25, date: dateOffset(-42),  status: 'passed' },
  { id: 22, name: 'Cloud Computing',                  credits: 6,  expectedGrade: null, achievedGrade: 28, date: dateOffset(-25),  status: 'passed' },
  { id: 23, name: 'Human-Computer Interaction',       credits: 6,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-9),   status: 'passed' },
  { id: 24, name: 'Big Data Analytics',               credits: 9,  expectedGrade: 28,   achievedGrade: null, date: dateOffset(17), status: 'preparing' },
  { id: 25, name: 'Computer Vision',                  credits: 9,  expectedGrade: null, achievedGrade: null, date: dateOffset(31), status: 'to start' },
];

// ── Finances: ~6 months of activity, deterministic (no Math.random())
// so a fresh install always shows the same numbers — useful when
// debugging on-device, otherwise "why is the balance different this
// time" becomes a self-inflicted mystery.
function genFinances() {
  const months = [-5, -4, -3, -2, -1, 0].map(m => {
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const expenseTemplates = [
    { desc: 'Weekly groceries',      category: 'food',       base: -38 },
    { desc: 'Weekly groceries',      category: 'food',       base: -52 },
    { desc: 'Drinks with friends',   category: 'food',       base: -18 },
    { desc: 'Lunch out',             category: 'food',       base: -12 },
    { desc: 'Bus pass',              category: 'transport',  base: -35 },
    { desc: 'Fuel',                  category: 'transport',  base: -28 },
    { desc: 'Train home',            category: 'transport',  base: -22 },
    { desc: 'University textbooks',  category: 'university', base: -45 },
    { desc: 'University tuition',    category: 'university', base: -310 },
    { desc: 'Thesis printing',       category: 'university', base: -15 },
    { desc: 'Netflix + Spotify',     category: 'other',      base: -16 },
    { desc: 'Gym',                   category: 'other',      base: -30 },
    { desc: 'Pharmacy',              category: 'other',      base: -14 },
    { desc: 'Clothes',               category: 'other',      base: -60 },
  ];
  const incomeTemplates = [
    { desc: 'Library part-time job', category: 'work',  base: 320 },
    { desc: 'Math tutoring',         category: 'work',  base: 120 },
    { desc: 'Money from parents',    category: 'other', base: 200 },
  ];

  const out = [];
  let id = 1;
  months.forEach((m, mi) => {
    out.push({ id: id++, date: `${m}-03`, desc: incomeTemplates[0].desc, amount: incomeTemplates[0].base + (mi % 2) * 20, type: 'income', category: incomeTemplates[0].category });
    out.push({ id: id++, date: `${m}-15`, desc: incomeTemplates[1].desc, amount: incomeTemplates[1].base, type: 'income', category: incomeTemplates[1].category });
    if (mi % 2 === 0) {
      out.push({ id: id++, date: `${m}-01`, desc: incomeTemplates[2].desc, amount: incomeTemplates[2].base, type: 'income', category: incomeTemplates[2].category });
    }
    expenseTemplates.forEach((t, ti) => {
      if (t.desc === 'University tuition' && mi % 3 !== 0) return;
      if (t.desc === 'Thesis printing' && mi < 4) return;
      const day = String(2 + ((ti * 3 + mi * 2) % 26)).padStart(2, '0');
      const variance = ((ti + mi) % 5) - 2;
      out.push({ id: id++, date: `${m}-${day}`, desc: t.desc, amount: t.base + variance, type: 'expense', category: t.category });
    });
  });
  return out;
}

export const INIT_FINANCES = genFinances();

export const INIT_GROCERIES = [
  { id: 1,  text: 'Pasta',                category: 'supermarket', done: false },
  { id: 2,  text: 'Sparkling water',       category: 'supermarket', done: false },
  { id: 3,  text: 'Vitamin C',             category: 'pharmacy',    done: true  },
  { id: 4,  text: 'Wholemeal bread',       category: 'supermarket', done: false },
  { id: 5,  text: 'Eggs',                  category: 'supermarket', done: false },
  { id: 6,  text: 'Milk',                  category: 'supermarket', done: false },
  { id: 7,  text: 'Coffee',                category: 'supermarket', done: true  },
  { id: 8,  text: 'Olive oil',             category: 'supermarket', done: false },
  { id: 9,  text: 'Chicken breast',        category: 'supermarket', done: false },
  { id: 10, text: 'Bananas',               category: 'supermarket', done: false },
  { id: 11, text: 'Paracetamol',           category: 'pharmacy',    done: false },
  { id: 12, text: 'Toothpaste',            category: 'pharmacy',    done: false },
  { id: 13, text: 'Laundry detergent',     category: 'home',        done: false },
  { id: 14, text: 'Dish soap',             category: 'home',        done: false },
  { id: 15, text: 'Trash bags',            category: 'home',        done: true  },
  { id: 16, text: 'Light bulbs',           category: 'home',        done: false },
  { id: 17, text: 'Phone charger cable',   category: 'other',       done: false },
  { id: 18, text: 'Birthday card',         category: 'other',       done: false },
];

// ── Journal: one-off tasks + habits unified (recurring:true = habit).
// Dates are relative to whenever the app is actually first launched, not
// hardcoded — a fixed date would drift out of the "last 7 days" window
// the moment a day passes after this file was written, and
// streaks/heatmap would look broken on day one.
function daysAgo(n) {
  return dateOffset(-n);
}

// Mirrors the exact streak algorithm in JournalScreen.toggleEntry, so a
// seeded streak is consistent with what a real tap on today's circle
// would produce — no weird jump on the first interaction.
function computeStreak(history, today) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = localDateKey(d);
    if (history[dateStr]) { streak++; d.setDate(d.getDate() - 1); }
    else if (dateStr === today) { d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function buildHabit({ id, text, icon, hits }) {
  const history = {};
  hits.forEach(n => { history[daysAgo(n)] = 1; });
  return {
    id, text, icon, recurring: true, date: null, priority: 'medium', done: false,
    history, streak: computeStreak(history, todayKey()),
  };
}

const HABITS = [
  buildHabit({ id: 101, text: 'Study',      icon: '📚', hits: [1, 2, 3, 4, 5, 6, 7, 8, 9] }),
  buildHabit({ id: 102, text: 'Reading',    icon: '📖', hits: [0, 1, 2, 4, 5, 7] }),
  buildHabit({ id: 103, text: 'Workout',    icon: '🏃', hits: [1, 3, 5, 8, 10] }),
  buildHabit({ id: 104, text: 'Drink 2L water', icon: '💧', hits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }),
  buildHabit({ id: 105, text: 'Meditation', icon: '🧘', hits: [0] }),
];

// [day offset from today (null = no date), text, subject, priority, done]
const TASK_TEMPLATES = [
  [-30, 'Review Calculus I notes',              'Calculus I',                  'medium', true],
  [-28, 'Recursion exercises',                  'Programming I',               'high',   true],
  [-25, 'Prepare database project slides',      'Databases',                   'medium', true],
  [-22, 'Study graphs and trees',                'Algorithms and Data Structures','high', true],
  [-20, 'Read paper on TCP/IP',                  'Computer Networks',           'low',    true],
  [-18, 'Do the weekly groceries',               '',                            'low',    true],
  [-16, 'Review database normalization',         'Databases',                   'medium', true],
  [-14, 'Operating Systems practice quiz',       'Operating Systems',           'high',   true],
  [-12, 'Book a doctor appointment',             '',                            'medium', true],
  [-10, 'Summarize ch. 5 — Numerical Methods',   'Numerical Methods',           'medium', true],
  [-9,  'Pay the utility bill',                  '',                            'high',   true],
  [-8,  'Probability exercises',                 'Probability and Statistics',  'medium', true],
  [-6,  'Software Engineering project call',     'Software Engineering',        'medium', true],
  [-5,  'Update CV',                             '',                            'low',    true],
  [-4,  'Review neural networks',                'Machine Learning',            'high',   true],
  [-3,  'Back up thesis to the cloud',           '',                            'medium', true],
  [-2,  'Compilers exercises — parser',          'Compilers',                   'medium', true],
  [-1,  'Read Cloud Computing slides',           'Cloud Computing',             'low',    true],
  [0,   'Review Big Data Analytics',             'Big Data Analytics',          'high',   false],
  [0,   'Reply to thesis advisor email',         '',                            'medium', false],
  [1,   'MapReduce exercises',                   'Big Data Analytics',          'medium', false],
  [3,   'Submit lab report',                     'Computer Vision',             'high',   false],
  [5,   'Review CNN convolutions',                'Computer Vision',            'medium', false],
  [7,   'Big Data Analytics mock exam',          'Big Data Analytics',          'high',   false],
  [null,'Tidy up the desk',                      '',                            'low',    false],
  [null,'Read "Clean Code"',                     '',                            'low',    false],
];

function buildTasks() {
  let id = 1;
  return TASK_TEMPLATES.map(([offset, text, subject, priority, done]) => ({
    id: id++,
    text, subject, priority, done,
    date: offset === null ? null : dateOffset(offset),
    recurring: false,
  }));
}

export const INIT_JOURNAL = [...buildTasks(), ...HABITS];

export const INIT_NOTES = [
  { id: 1, title: 'Idea: fitness app',         content: 'Tracker that uses the microphone to automatically count reps.', tags: ['idea', 'app'],         date: dateOffset(-210) },
  { id: 2, title: 'AI prompt for studying',    content: 'Explain it to me as if you were an MIT professor, with practical examples and analogies.', tags: ['prompt', 'study'], date: dateOffset(-180) },
  { id: 3, title: 'Bug — Databases',           content: 'The 3-table join returns duplicates without DISTINCT — check the outer join case.', tags: ['bug', 'sql'], date: dateOffset(-140) },
  { id: 4, title: 'Books to read',             content: 'Clean Code, Designing Data-Intensive Applications, The Pragmatic Programmer.', tags: ['books'], date: dateOffset(-95) },
  { id: 5, title: 'Thesis project idea',       content: 'University course recommendation system using collaborative filtering.', tags: ['thesis', 'idea'], date: dateOffset(-60) },
  { id: 6, title: 'Useful Git commands',       content: 'git rebase -i HEAD~3 to squash commits, git stash to save work in progress temporarily.', tags: ['git', 'cheatsheet'], date: dateOffset(-40) },
  { id: 7, title: 'Questions for the interview', content: 'Tech stack, code review process, possibility of remote work.', tags: ['work'], date: dateOffset(-21) },
  { id: 8, title: 'ML lecture notes',          content: 'Overfitting: increase L2 regularization or use early stopping on the validation set.', tags: ['ml', 'study'], date: dateOffset(-9) },
  { id: 9, title: 'Ask the thesis advisor',    content: 'Is chapter 3 too long? Should I add a comparative benchmark against an existing baseline?', tags: ['thesis'], date: dateOffset(-2) },
];

export const INIT_LINKS = [
  { id: 1, name: 'Gmail',   url: 'https://mail.google.com',  icon: '✉️', starred: true  },
  { id: 2, name: 'GitHub',  url: 'https://github.com',       icon: '🐙', starred: true  },
  { id: 3, name: 'Drive',   url: 'https://drive.google.com', icon: '📁', starred: true  },
  { id: 4, name: 'ChatGPT', url: 'https://chat.openai.com',  icon: '🤖', starred: true  },
  { id: 5, name: 'Moodle',  url: 'https://moodle.unipd.it',  icon: '🎓', starred: false },
  { id: 6, name: 'Esse3',   url: 'https://esse3.unipd.it',   icon: '📋', starred: false },
];

// ── Goals: previously shipped empty — a brand-new install showed an
// empty Goals screen no matter what, which made the screen feel unused
// rather than just "not started yet". A handful of realistic starter
// goals across different categories gives it the same "this is already
// alive" feel the other sections have out of the box.
export const INIT_GOALS = [
  {
    id: 1, title: 'Graduate with a final grade of 100+',
    description: 'Keep the weighted average high enough that the projected degree grade clears 100/110.',
    target: 100, progress: 0, category: 'Study', priority: 'high',
    deadline: dateOffset(540), completed: false,
  },
  {
    id: 2, title: 'Save €1000 for next semester',
    description: 'Set aside money from part-time work and tutoring instead of spending it all month to month.',
    target: 1000, progress: 250, category: 'Finance', priority: 'medium',
    deadline: dateOffset(180), completed: false,
  },
  {
    id: 3, title: 'Run a 10km race',
    description: 'Train consistently and finish a 10km run without stopping.',
    target: 10, progress: 4, category: 'Sport', priority: 'medium',
    deadline: dateOffset(90), completed: false,
  },
  {
    id: 4, title: 'Read 12 books this year',
    description: 'One book a month, fiction or non-fiction — anything that isn\'t a course textbook.',
    target: 12, progress: 3, category: 'Personal', priority: 'low',
    deadline: dateOffset(300), completed: false,
  },
  {
    id: 5, title: 'Finish the Machine Learning specialization',
    description: 'Complete the online course series and the final certification project.',
    target: 5, progress: 5, category: 'Study', priority: 'high',
    deadline: dateOffset(-10), completed: true,
  },
];
