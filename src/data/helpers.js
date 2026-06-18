// src/data/helpers.js

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Formats numbers with thousand separators
export function fmt(n) {
  return Number(n || 0).toLocaleString('en-US');
}

export function diffDays(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

// Grades are stored as 18-30, with 31 representing "30L" (30 cum laude).
// For arithmetic, 30L counts as 30 — this converts the stored value to its
// numeric weight for averages.
export function gradeWeight(grade) {
  if (!grade) return 0;
  return grade === 31 ? 30 : grade;
}

// Returns true if the stored grade value represents 30L
export function isLode(grade) {
  return grade === 31;
}

// Human-readable label for a stored grade value (18-30, or 31 for 30L)
export function gradeLabel(grade) {
  if (!grade) return null;
  return grade === 31 ? '30L' : String(grade);
}

export function calculateAverages(exams) {
  const passed = exams.filter(e => e.achievedGrade);
  if (!passed.length) return { average: 0, weightedAverage: 0 };

  const sum = passed.reduce((a, e) => a + gradeWeight(e.achievedGrade), 0);
  const wp  = passed.reduce((a, e) => a + (gradeWeight(e.achievedGrade) * e.credits), 0);
  const wc  = passed.reduce((a, e) => a + e.credits, 0);

  return { average: sum / passed.length, weightedAverage: wc ? wp / wc : 0 };
}

// Italian graduation grade is based on a base of 110.
export function predictedDegreeGrade(weightedAverage) {
  if (!weightedAverage || weightedAverage < 18) return 0;
  return Math.min(110, Math.round((weightedAverage / 30) * 110 + (weightedAverage > 28 ? 1 : 0)));
}

export function padTime(n) {
  return String(n).padStart(2, '0');
}

export function fmtTimer(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${padTime(h)}:${padTime(m)}:${padTime(s)}`;
}

export function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d.toISOString().slice(0, 10);
  });
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
