import { todayKey, localDateKey } from './helpers';

// 'YYYY-MM-DD' a `n` giorni da oggi (negativo = passato, 0 = oggi,
// positivo = futuro). Sempre via localDateKey, mai toISOString() — vedi
// helpers.js per il perché in un fuso UTC+.
function dateOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

export const INIT_EXAMS = [
  { id: 1,  name: 'Analisi Matematica I',           credits: 9,  expectedGrade: null, achievedGrade: 26, date: dateOffset(-650), status: 'passed' },
  { id: 2,  name: 'Geometria e Algebra Lineare',    credits: 6,  expectedGrade: null, achievedGrade: 28, date: dateOffset(-642), status: 'passed' },
  { id: 3,  name: 'Programmazione I',               credits: 9,  expectedGrade: null, achievedGrade: 31, date: dateOffset(-627), status: 'passed' },
  { id: 4,  name: 'Fondamenti di Informatica',      credits: 6,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-586), status: 'passed' },
  { id: 5,  name: 'Fisica Generale',                credits: 9,  expectedGrade: null, achievedGrade: 24, date: dateOffset(-553), status: 'passed' },
  { id: 6,  name: 'Analisi Matematica II',          credits: 9,  expectedGrade: null, achievedGrade: 25, date: dateOffset(-542), status: 'passed' },
  { id: 7,  name: 'Programmazione II',              credits: 9,  expectedGrade: null, achievedGrade: 29, date: dateOffset(-531), status: 'passed' },
  { id: 8,  name: 'Algoritmi e Strutture Dati',     credits: 12, expectedGrade: null, achievedGrade: 28, date: dateOffset(-432), status: 'passed' },
  { id: 9,  name: 'Basi di Dati',                   credits: 9,  expectedGrade: null, achievedGrade: 30, date: dateOffset(-417), status: 'passed' },
  { id: 10, name: 'Sistemi Operativi',              credits: 9,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-397), status: 'passed' },
  { id: 11, name: 'Calcolo Numerico',                credits: 6,  expectedGrade: null, achievedGrade: 26, date: dateOffset(-356), status: 'passed' },
  { id: 12, name: 'Reti di Calcolatori',             credits: 9,  expectedGrade: null, achievedGrade: 28, date: dateOffset(-341), status: 'passed' },
  { id: 13, name: 'Probabilità e Statistica',        credits: 6,  expectedGrade: null, achievedGrade: 25, date: dateOffset(-321), status: 'passed' },
  { id: 14, name: 'Ricerca Operativa',               credits: 6,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-293), status: 'passed' },
  { id: 15, name: 'Ingegneria del Software',         credits: 9,  expectedGrade: null, achievedGrade: 29, date: dateOffset(-249), status: 'passed' },
  { id: 16, name: 'Sistemi Distribuiti',             credits: 9,  expectedGrade: null, achievedGrade: 28, date: dateOffset(-227), status: 'passed' },
  { id: 17, name: 'Intelligenza Artificiale',        credits: 9,  expectedGrade: null, achievedGrade: 31, date: dateOffset(-213), status: 'passed' },
  { id: 18, name: 'Architettura degli Elaboratori',  credits: 9,  expectedGrade: null, achievedGrade: 26, date: dateOffset(-109), status: 'passed' },
  { id: 19, name: 'Sicurezza Informatica',           credits: 6,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-95),  status: 'passed' },
  { id: 20, name: 'Machine Learning',                credits: 9,  expectedGrade: null, achievedGrade: 29, date: dateOffset(-81),  status: 'passed' },
  { id: 21, name: 'Compilatori',                     credits: 6,  expectedGrade: null, achievedGrade: 25, date: dateOffset(-42),  status: 'passed' },
  { id: 22, name: 'Cloud Computing',                 credits: 6,  expectedGrade: null, achievedGrade: 28, date: dateOffset(-25),  status: 'passed' },
  { id: 23, name: 'Human-Computer Interaction',      credits: 6,  expectedGrade: null, achievedGrade: 27, date: dateOffset(-9),   status: 'passed' },
  { id: 24, name: 'Big Data Analytics',              credits: 9,  expectedGrade: 28,   achievedGrade: null, date: dateOffset(17), status: 'preparing' },
  { id: 25, name: 'Computer Vision',                 credits: 9,  expectedGrade: null, achievedGrade: null, date: dateOffset(31), status: 'to start' },
];

// ── Finanze: ~6 mesi di attività, deterministico (niente Math.random())
// così un'installazione fresh dà sempre gli stessi numeri — utile in
// debug on-device, altrimenti "perché stavolta il saldo è diverso"
// diventa un mistero auto-inflitto.
function genFinances() {
  const months = [-5, -4, -3, -2, -1, 0].map(m => {
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const expenseTemplates = [
    { desc: 'Spesa settimanale',     category: 'food',       base: -38 },
    { desc: 'Spesa settimanale',     category: 'food',       base: -52 },
    { desc: 'Aperitivo con amici',   category: 'food',       base: -18 },
    { desc: 'Pranzo fuori',          category: 'food',       base: -12 },
    { desc: 'Abbonamento bus',       category: 'transport',  base: -35 },
    { desc: 'Benzina',               category: 'transport',  base: -28 },
    { desc: 'Treno per casa',        category: 'transport',  base: -22 },
    { desc: 'Libri universitari',    category: 'university', base: -45 },
    { desc: 'Tassa universitaria',   category: 'university', base: -310 },
    { desc: 'Materiale stampa tesi', category: 'university', base: -15 },
    { desc: 'Netflix + Spotify',     category: 'other',      base: -16 },
    { desc: 'Palestra',              category: 'other',      base: -30 },
    { desc: 'Farmacia',              category: 'other',      base: -14 },
    { desc: 'Vestiti',               category: 'other',      base: -60 },
  ];
  const incomeTemplates = [
    { desc: 'Part-time biblioteca',  category: 'work',  base: 320 },
    { desc: 'Tutoraggio matematica', category: 'work',  base: 120 },
    { desc: 'Bonifico genitori',     category: 'other', base: 200 },
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
      if (t.desc === 'Tassa universitaria' && mi % 3 !== 0) return;
      if (t.desc === 'Materiale stampa tesi' && mi < 4) return;
      const day = String(2 + ((ti * 3 + mi * 2) % 26)).padStart(2, '0');
      const variance = ((ti + mi) % 5) - 2;
      out.push({ id: id++, date: `${m}-${day}`, desc: t.desc, amount: t.base + variance, type: 'expense', category: t.category });
    });
  });
  return out;
}

export const INIT_FINANCES = genFinances();

export const INIT_GROCERIES = [
  { id: 1, text: 'Pasta',           category: 'supermarket', done: false },
  { id: 2, text: 'Acqua frizzante', category: 'supermarket', done: false },
  { id: 3, text: 'Vitamina C',      category: 'pharmacy',    done: true  },
  { id: 4, text: 'Pane integrale',  category: 'supermarket', done: false },
];

// ── Journal: task one-off + habits unificati (recurring:true = habit).
// Le date sono relative a quando l'app viene effettivamente avviata per
// la prima volta, non hardcoded — una data fissa scriverebbe fuori dalla
// finestra "ultimi 7 giorni" non appena passa un giorno dalla scrittura
// di questo file, e gli streak/heatmap sembrerebbero rotti al day one.
function daysAgo(n) {
  return dateOffset(-n);
}

// Replica esattamente l'algoritmo di streak in JournalScreen.toggleEntry,
// così uno streak seedato è coerente con quello che produrrebbe un tap
// reale sul cerchio di oggi — nessun salto strano alla prima interazione.
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
  buildHabit({ id: 101, text: 'Studio',      icon: '📚', hits: [1, 2, 3, 4, 5, 6, 7, 8, 9] }),
  buildHabit({ id: 102, text: 'Lettura',     icon: '📖', hits: [0, 1, 2, 4, 5, 7] }),
  buildHabit({ id: 103, text: 'Allenamento', icon: '🏃', hits: [1, 3, 5, 8, 10] }),
  buildHabit({ id: 104, text: 'Acqua 2L',    icon: '💧', hits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }),
  buildHabit({ id: 105, text: 'Meditazione', icon: '🧘', hits: [0] }),
];

// [offset giorni da oggi (null = senza data), testo, materia, priorità, fatto]
const TASK_TEMPLATES = [
  [-30, 'Rivedere appunti Analisi I',           'Analisi Matematica I',       'medium', true],
  [-28, 'Esercizi ricorsione',                  'Programmazione I',           'high',   true],
  [-25, 'Preparare slide progetto BD',          'Basi di Dati',               'medium', true],
  [-22, 'Studiare grafi e alberi',              'Algoritmi e Strutture Dati', 'high',   true],
  [-20, 'Lettura paper su TCP/IP',                'Reti di Calcolatori',        'low',    true],
  [-18, 'Fare la spesa settimanale',            '',                           'low',    true],
  [-16, 'Ripassare normalizzazione DB',          'Basi di Dati',               'medium', true],
  [-14, 'Quiz pratica Sistemi Operativi',        'Sistemi Operativi',          'high',   true],
  [-12, 'Prenotare visita medica',               '',                           'medium', true],
  [-10, 'Riassunto cap. 5 — Calcolo Numerico',   'Calcolo Numerico',           'medium', true],
  [-9,  'Pagare bolletta',                       '',                           'high',   true],
  [-8,  'Esercizi probabilità',                  'Probabilità e Statistica',   'medium', true],
  [-6,  'Call gruppo progetto Ingegneria SW',    'Ingegneria del Software',    'medium', true],
  [-5,  'Aggiornare CV',                         '',                           'low',    true],
  [-4,  'Ripasso reti neurali',                  'Machine Learning',           'high',   true],
  [-3,  'Backup tesi su cloud',                  '',                           'medium', true],
  [-2,  'Esercizi compilatori — parser',         'Compilatori',                'medium', true],
  [-1,  'Lettura slide Cloud Computing',         'Cloud Computing',            'low',    true],
  [0,   'Ripasso Big Data Analytics',            'Big Data Analytics',         'high',   false],
  [0,   'Rispondere email relatore tesi',        '',                           'medium', false],
  [1,   'Esercizi su MapReduce',                 'Big Data Analytics',         'medium', false],
  [3,   'Consegna relazione laboratorio',        'Computer Vision',            'high',   false],
  [5,   'Ripasso convoluzioni CNN',                'Computer Vision',           'medium', false],
  [7,   'Simulazione esame Big Data Analytics',  'Big Data Analytics',         'high',   false],
  [null,'Riordinare scrivania',                  '',                           'low',    false],
  [null,'Leggere "Clean Code"',                  '',                           'low',    false],
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
  { id: 1, title: 'Idea: app fitness',       content: 'Tracker che usa il microfono per contare le ripetizioni automaticamente.', tags: ['idea', 'app'],         date: dateOffset(-210) },
  { id: 2, title: 'Prompt AI per studio',     content: 'Spiegamelo come se fossi un professore del MIT, con esempi pratici e analogie.', tags: ['prompt', 'study'], date: dateOffset(-180) },
  { id: 3, title: 'Bug — Basi di Dati',       content: 'La join su 3 tabelle restituisce duplicati senza DISTINCT, controllare il caso con outer join.', tags: ['bug', 'sql'], date: dateOffset(-140) },
  { id: 4, title: 'Libri da leggere',         content: 'Clean Code, Designing Data-Intensive Applications, The Pragmatic Programmer.', tags: ['libri'], date: dateOffset(-95) },
  { id: 5, title: 'Idea progetto tesi',       content: 'Sistema di raccomandazione corsi universitari con collaborative filtering.', tags: ['tesi', 'idea'], date: dateOffset(-60) },
  { id: 6, title: 'Comandi Git utili',        content: 'git rebase -i HEAD~3 per squashare i commit, git stash per salvare lavoro temporaneo.', tags: ['git', 'cheatsheet'], date: dateOffset(-40) },
  { id: 7, title: 'Domande per il colloquio', content: 'Stack tecnologico, processo di review del codice, possibilità di remoto.', tags: ['lavoro'], date: dateOffset(-21) },
  { id: 8, title: 'Appunti lezione ML',       content: 'Overfitting: aumentare regolarizzazione L2 o fare early stopping sul validation set.', tags: ['ml', 'study'], date: dateOffset(-9) },
  { id: 9, title: 'Da chiedere al relatore',  content: 'Capitolo 3 troppo lungo? Aggiungere benchmark comparativo con baseline esistente?', tags: ['tesi'], date: dateOffset(-2) },
];

export const INIT_LINKS = [
  { id: 1, name: 'Gmail',   url: 'https://mail.google.com',  icon: '✉️', starred: true  },
  { id: 2, name: 'GitHub',  url: 'https://github.com',       icon: '🐙', starred: true  },
  { id: 3, name: 'Drive',   url: 'https://drive.google.com', icon: '📁', starred: true  },
  { id: 4, name: 'ChatGPT', url: 'https://chat.openai.com',  icon: '🤖', starred: true  },
  { id: 5, name: 'Moodle',  url: 'https://moodle.unipd.it',  icon: '🎓', starred: false },
  { id: 6, name: 'Esse3',   url: 'https://esse3.unipd.it',   icon: '📋', starred: false },
];

export const INIT_GOALS = [];
