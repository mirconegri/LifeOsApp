import { todayKey } from './helpers';

export const INIT_EXAMS = [
  { id: 1, name: 'Analisi Matematica II',      cfu: 9,  votoAtteso: 27, votoOttenuto: null, data: '2026-07-10', stato: 'in preparazione' },
  { id: 2, name: 'Algoritmi e Strutture Dati', cfu: 12, votoAtteso: 29, votoOttenuto: null, data: '2026-06-24', stato: 'da iniziare' },
  { id: 3, name: 'Programmazione',             cfu: 9,  votoAtteso: null, votoOttenuto: 28, data: '2025-03-15', stato: 'superato' },
  { id: 4, name: 'Fisica I',                   cfu: 9,  votoAtteso: null, votoOttenuto: 30, data: '2025-02-01', stato: 'superato' },
  { id: 5, name: 'Calcolo Numerico',           cfu: 6,  votoAtteso: null, votoOttenuto: 26, data: '2025-01-20', stato: 'superato' },
];

export const INIT_TASKS = [
  { id: 1, text: 'Studiare capitolo 3 Analisi',  done: false, materia: 'Analisi Matematica II',      priorita: 'alta',  data: todayKey() },
  { id: 2, text: 'Esercizi sorting algorithms',  done: false, materia: 'Algoritmi e Strutture Dati', priorita: 'alta',  data: todayKey() },
  { id: 3, text: 'Leggere paper su BFS/DFS',     done: true,  materia: 'Algoritmi e Strutture Dati', priorita: 'media', data: todayKey() },
];

export const INIT_HABITS = [
  { id: 1, name: 'Studio',      icon: '📚', streak: 5, history: {} },
  { id: 2, name: 'Lettura',     icon: '📖', streak: 3, history: {} },
  { id: 3, name: 'Allenamento', icon: '🏃', streak: 2, history: {} },
  { id: 4, name: 'Acqua 2L',    icon: '💧', streak: 7, history: {} },
];

export const INIT_FINANZE = [
  { id: 1, data: '2026-06-01', desc: 'Stipendio part-time',   importo:  400, tipo: 'entrata', cat: 'lavoro' },
  { id: 2, data: '2026-06-02', desc: 'Spesa supermercato',    importo:  -65, tipo: 'uscita',  cat: 'cibo' },
  { id: 3, data: '2026-06-05', desc: 'Abbonamento trasporti', importo:  -35, tipo: 'uscita',  cat: 'trasporti' },
  { id: 4, data: '2026-06-08', desc: 'Libri universitari',    importo:  -45, tipo: 'uscita',  cat: 'università' },
  { id: 5, data: '2026-06-10', desc: 'Borsa di studio',       importo:  250, tipo: 'entrata', cat: 'università' },
];

export const INIT_SPESA = [
  { id: 1, text: 'Pasta',          cat: 'supermercato', done: false },
  { id: 2, text: 'Acqua naturale', cat: 'supermercato', done: false },
  { id: 3, text: 'Vitamina C',     cat: 'farmacia',     done: true  },
  { id: 4, text: 'Pane integrale', cat: 'supermercato', done: false },
];

export const INIT_OBIETTIVI = [
  { id: 1, text: 'Laurea Triennale',  anno: 2026, stato: 'in corso',   priorita: 'alta'  },
  { id: 2, text: 'Certificazione B2', anno: 2025, stato: 'da fare',    priorita: 'media' },
  { id: 3, text: 'Erasmus',           anno: 2026, stato: 'da fare',    priorita: 'alta'  },
  { id: 4, text: 'Portfolio GitHub',  anno: 2025, stato: 'in corso',   priorita: 'alta'  },
  { id: 5, text: 'Maturità',         anno: 2024, stato: 'completato', priorita: 'alta'  },
];

export const INIT_NOTES = [
  { id: 1, titolo: 'Idea App Fitness',      contenuto: 'Tracker che usa il microfono per contare i rep automaticamente', tag: ['idea','app'],    data: todayKey() },
  { id: 2, titolo: 'Prompt AI per Analisi', contenuto: 'Spiega come se fossi un professore del MIT...',                  tag: ['prompt','studio'], data: todayKey() },
];

export const INIT_LINKS = [
  { id: 1, nome: 'Gmail',   url: 'https://mail.google.com',  icon: '✉️' },
  { id: 2, nome: 'GitHub',  url: 'https://github.com',       icon: '🐙' },
  { id: 3, nome: 'Drive',   url: 'https://drive.google.com', icon: '📁' },
  { id: 4, nome: 'ChatGPT', url: 'https://chat.openai.com',  icon: '🤖' },
  { id: 5, nome: 'Moodle',  url: 'https://moodle.unipd.it', icon: '🎓' },
  { id: 6, nome: 'Esse3',   url: 'https://esse3.unipd.it',  icon: '📋' },
];