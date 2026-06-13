export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export function fmt(n) {
  return Number(n || 0).toLocaleString('it-IT');
}

export function diffDays(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export function calcMedia(exams) {
  const superati = exams.filter(e => e.votoOttenuto);
  if (!superati.length) return { media: 0, mediaPonderata: 0 };
  const sum = superati.reduce((a, e) => a + e.votoOttenuto, 0);
  const wp  = superati.reduce((a, e) => a + e.votoOttenuto * e.cfu, 0);
  const wc  = superati.reduce((a, e) => a + e.cfu, 0);
  return { media: sum / superati.length, mediaPonderata: wp / wc };
}

export function prevLaurea(mp) {
  if (mp < 18) return 0;
  return Math.min(110, Math.round((mp / 30) * 110 + (mp > 28 ? 1 : 0)));
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