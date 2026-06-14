export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Formats numbers with thousand separators (switched to en-US)
export function fmt(n) {
  return Number(n || 0).toLocaleString('en-US');
}

export function diffDays(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export function calculateAverages(exams) {
  const passed = exams.filter(e => e.achievedGrade);
  if (!passed.length) return { average: 0, weightedAverage: 0 };
  
  const sum = passed.reduce((a, e) => a + e.achievedGrade, 0);
  const wp  = passed.reduce((a, e) => a + (e.achievedGrade * e.credits), 0);
  const wc  = passed.reduce((a, e) => a + e.credits, 0);
  
  return { average: sum / passed.length, weightedAverage: wp / wc };
}

// Italian graduation grade is based on 110. Let's keep the logic but translate the name
export function predictedDegreeGrade(weightedAverage) {
  if (weightedAverage < 18) return 0;
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