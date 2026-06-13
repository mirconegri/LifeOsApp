import React from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { ProgressRing } from '../components/ProgressRing';
import { StatCard } from '../components/StatCard';
import { greet, todayKey, fmt, diffDays, calcMedia } from '../data/helpers';

export default function HomeScreen({
  exams, tasks, habits, finanze, heatmap,
  timerSec, timerRunning, timerMateria,
  onTimerToggle, onTimerReset, onTimerMateria,
}) {
  const today = todayKey();
  const dateLabel = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const superati = exams.filter(e => e.votoOttenuto);
  const totali  = exams.length;
  const examPct = totali > 0 ? Math.round((superati.length / totali) * 100) : 0;

  const oggiHabits = habits.filter(h => h.history && h.history[today]);
  const habitPct   = habits.length > 0 ? Math.round((oggiHabits.length / habits.length) * 100) : 0;

  const saldo = finanze.reduce((a, t) => a + t.importo, 0);
  const finPct = Math.min(100, Math.round((saldo / 600) * 100));

  const taskOggi = tasks
    .filter(t => !t.done && t.data === today)
    .slice(0, 3);

  const prossimo = exams
    .filter(e => !e.votoOttenuto)
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  const studyHrs = heatmap[today] || 0;
  const { mediaPonderata } = calcMedia(exams);
  const prevLaurea = mediaPonderata
    ? Math.min(110, Math.round((mediaPonderata / 30) * 110 + (mediaPonderata > 28 ? 1 : 0)))
    : '—';

  const padTime = n => String(n || 0).padStart(2, '0');
  const fmtTimer = s => `${padTime(Math.floor(s / 3600))}:${padTime(Math.floor((s % 3600) / 60))}:${padTime(s % 60)}`;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Saluto */}
      <Text style={styles.greeting}>{greet()}, Mirco</Text>
      <Text style={styles.date}>{dateLabel}</Text>

      {/* Progress Ring */}
      <View style={styles.ringsRow}>
        <View style={styles.ringItem}>
          <ProgressRing pct={examPct} size={72} color={COLORS.accent} />
          <Text style={styles.ringLabel}>Esami</Text>
          <Text style={styles.ringPct}>{examPct}%</Text>
        </View>
        <View style={styles.ringItem}>
          <ProgressRing pct={habitPct} size={72} color={COLORS.green} />
          <Text style={styles.ringLabel}>Abitudini</Text>
          <Text style={styles.ringPct}>{habitPct}%</Text>
        </View>
        <View style={styles.ringItem}>
          <ProgressRing pct={finPct} size={72} color={saldo >= 0 ? COLORS.green : COLORS.red} />
          <Text style={styles.ringLabel}>Finanze</Text>
          <Text style={[styles.ringPct, { color: saldo >= 0 ? COLORS.green : COLORS.red }]}>
            {saldo >= 0 ? '+' : ''}{fmt(saldo)}€
          </Text>
        </View>
      </View>

      {/* Timer Widget */}
      <Card style={styles.timerCard}>
        <Text style={styles.timerTitle}>⏱️ Timer Studio</Text>
        <TextInput
          style={styles.materiaInput}
          placeholder="Materia (opzionale)"
          placeholderTextColor={COLORS.textSub}
          value={timerMateria}
          onChangeText={onTimerMateria}
        />
        <Text style={styles.timerDisplay}>{fmtTimer(timerSec)}</Text>
        <View style={styles.timerBtns}>
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: timerRunning ? COLORS.red : COLORS.green }]}
            onPress={onTimerToggle}
          >
            <Text style={styles.timerBtnText}>{timerRunning ? '⏸ Pausa' : '▶ Avvia'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.timerBtn, styles.timerBtnReset]} onPress={onTimerReset}>
            <Text style={styles.timerBtnText}>↺ Reset</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Task di oggi */}
      <Text style={styles.sectionTitle}>📋 Task di oggi</Text>
      {taskOggi.length === 0 ? (
        <Text style={styles.emptyText}>Nessun task per oggi 🎉</Text>
      ) : (
        taskOggi.map(t => (
          <Card key={t.id} style={styles.taskCard}>
            <View style={styles.taskRow}>
              <View style={[styles.checkbox, { borderColor: COLORS.border2 }]} />
              <Text style={styles.taskText}>{t.text}</Text>
              <Pill color={t.priorita === 'alta' ? 'red' : t.priorita === 'media' ? 'amber' : 'muted'}>
                {t.priorita}
              </Pill>
            </View>
          </Card>
        ))
      )}

      {/* Prossimo esame */}
      {prossimo && (
        <>
          <Text style={styles.sectionTitle}>📅 Prossimo esame</Text>
          <Card style={styles.esameCard}>
            <Text style={styles.esameNome}>{prossimo.name}</Text>
            <Text style={styles.esameCFU}>{prossimo.cfu} CFU</Text>
            <Text style={[
              styles.esameGiorni,
              { color: diffDays(prossimo.data) <= 14 ? COLORS.red : COLORS.textMuted },
            ]}>
              Tra {diffDays(prossimo.data)} giorni — {prossimo.data}
            </Text>
            <Pill color={prossimo.stato === 'in preparazione' ? 'accent' : 'muted'}>
              {prossimo.stato}
            </Pill>
          </Card>
        </>
      )}

      {/* Studio oggi */}
      <Text style={styles.sectionTitle}>📚 Studio</Text>
      <View style={styles.statsRow}>
        <StatCard label="Ore oggi" value={`${studyHrs.toFixed(1)}h`} sub="sessione attuale" color={COLORS.accent} />
        <StatCard label="Media Pond." value={mediaPonderata ? mediaPonderata.toFixed(1) : '—'} sub="/30" color={COLORS.amber} />
        <StatCard label="Prev. Laurea" value={prevLaurea} sub="/110" color={COLORS.green} />
      </View>

      {/* Saldo finanziario */}
      <Text style={styles.sectionTitle}>💶 Saldo</Text>
      <Card style={styles.saldoCard}>
        <Text style={[styles.saldoValore, { color: saldo >= 0 ? COLORS.green : COLORS.red }]}>
          {saldo >= 0 ? '+' : ''}{fmt(saldo)} €
        </Text>
        <Text style={styles.saldoLabel}>Bilancio totale</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: COLORS.bg },
  content:    { padding: 16, paddingBottom: 32 },
  greeting:   { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  date:       { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  ringsRow:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  ringItem:   { alignItems: 'center' },
  ringLabel:  { fontSize: 10, color: COLORS.textMuted, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  ringPct:    { fontSize: 11, color: COLORS.text, marginTop: 2, fontWeight: '600' },
  timerCard:  { marginBottom: 20, alignItems: 'center' },
  timerTitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  materiaInput: { width: '100%', backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: COLORS.text, fontSize: 13, marginBottom: 10 },
  timerDisplay:{ fontSize: 40, fontWeight: 'bold', color: COLORS.accent, fontVariant: ['tabular-nums'], marginBottom: 12 },
  timerBtns:  { flexDirection: 'row', gap: 10 },
  timerBtn:   { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  timerBtnReset:{ backgroundColor: COLORS.bg4 },
  timerBtnText:{ color: '#fff', fontSize: 13, fontWeight: '600' },
  sectionTitle:{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 6 },
  emptyText:  { fontSize: 13, color: COLORS.textSub, marginBottom: 12 },
  taskCard:   { marginBottom: 8, padding: 12 },
  taskRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:   { width: 18, height: 18, borderWidth: 1.5, borderRadius: 4 },
  taskText:   { flex: 1, fontSize: 13, color: COLORS.text },
  esameCard:  { marginBottom: 12 },
  esameNome:  { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  esameCFU:   { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  esameGiorni:{ fontSize: 13, marginBottom: 8 },
  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 12 },
  saldoCard:  { alignItems: 'center', paddingVertical: 20 },
  saldoValore:{ fontSize: 28, fontWeight: 'bold' },
  saldoLabel: { fontSize: 11, color: COLORS.textSub, marginTop: 4 },
});