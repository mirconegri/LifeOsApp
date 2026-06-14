import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { ProgressRing } from '../components/ProgressRing';
import { StatCard } from '../components/StatCard';
import { TipBubble } from '../components/TipBubble';
import { greet, todayKey, fmt, diffDays, calcMedia } from '../data/helpers';

const MAX_STARRED = 6;

// Tips shown during first use — one per section
const TIPS = [
  { id: 'links',   text: 'Tocca ★ nella schermata Link per aggiungere i tuoi siti preferiti qui.' },
  { id: 'habits',  text: 'Aggiungi le tue abitudini dalla sezione Abitudini: costruisci la tua routine giorno per giorno.' },
  { id: 'finanze', text: 'Registra le tue transazioni in Finanze per tenere il saldo sempre sotto controllo.' },
  { id: 'esami',   text: 'Aggiungi i tuoi esami in Università per vedere la previsione del voto di laurea.' },
];

export default function HomeScreen({
  exams, tasks, habits, finanze, heatmap, links,
  userName, isFirstUse, tipsShown, onDismissTip,
}) {
  const today    = todayKey();
  const dateLabel = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  const superati  = exams.filter(e => e.votoOttenuto);
  const totali    = exams.length;
  const examPct   = totali > 0 ? Math.round((superati.length / totali) * 100) : 0;

  const oggiHabits = habits.filter(h => h.history && h.history[today]);
  const habitPct   = habits.length > 0 ? Math.round((oggiHabits.length / habits.length) * 100) : 0;

  const saldo  = finanze.reduce((a, t) => a + t.importo, 0);
  const finPct = Math.min(100, Math.round((saldo / 600) * 100));

  const taskOggi = tasks.filter(t => !t.done && t.data === today).slice(0, 3);

  const prossimo = exams
    .filter(e => !e.votoOttenuto)
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  const studyHrs = heatmap[today] || 0;
  const { mediaPonderata } = calcMedia(exams);
  const prevLaurea = mediaPonderata
    ? Math.min(110, Math.round((mediaPonderata / 30) * 110 + (mediaPonderata > 28 ? 1 : 0)))
    : '—';

  // ── Starred links ─────────────────────────────────────────────────────────
  const starredLinks = (links || []).filter(l => l.starred).slice(0, MAX_STARRED);

  const apriLink = async (url) => {
    try { await Linking.openURL(url); } catch {}
  };

  // ── Active tip ────────────────────────────────────────────────────────────
  // Show the first tip that hasn't been dismissed yet
  const activeTip = isFirstUse
    ? TIPS.find(t => !tipsShown?.includes(t.id))
    : null;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Saluto ── */}
        <Text style={styles.greeting}>{greet()}, {userName || 'studente'} 👋</Text>
        <Text style={styles.date}>{dateLabel}</Text>

        {/* ── Progress Rings ── */}
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
            <ProgressRing pct={Math.max(0, finPct)} size={72} color={saldo >= 0 ? COLORS.green : COLORS.red} />
            <Text style={styles.ringLabel}>Finanze</Text>
            <Text style={[styles.ringPct, { color: saldo >= 0 ? COLORS.green : COLORS.red }]}>
              {saldo >= 0 ? '+' : ''}{fmt(saldo)}€
            </Text>
          </View>
        </View>

        {/* ── Link in Evidenza ── */}
        {starredLinks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⭐ Link Rapidi</Text>
            <View style={styles.linksGrid}>
              {starredLinks.map(link => (
                <TouchableOpacity
                  key={link.id}
                  style={styles.linkChip}
                  onPress={() => apriLink(link.url)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkChipIcon}>{link.icon}</Text>
                  <Text style={styles.linkChipLabel} numberOfLines={1}>{link.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Task di oggi ── */}
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

        {/* ── Prossimo esame ── */}
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

        {/* ── Studio ── */}
        <Text style={styles.sectionTitle}>📚 Studio</Text>
        <View style={styles.statsRow}>
          <StatCard label="Ore oggi"    value={`${studyHrs.toFixed(1)}h`} sub="oggi"    color={COLORS.accent} />
          <StatCard label="Media Pond." value={mediaPonderata ? mediaPonderata.toFixed(1) : '—'} sub="/30" color={COLORS.amber} />
          <StatCard label="Prev. Laurea" value={prevLaurea}              sub="/110"    color={COLORS.green} />
        </View>

        {/* ── Saldo ── */}
        <Text style={styles.sectionTitle}>💶 Saldo</Text>
        <Card style={styles.saldoCard}>
          <Text style={[styles.saldoValore, { color: saldo >= 0 ? COLORS.green : COLORS.red }]}>
            {saldo >= 0 ? '+' : ''}{fmt(saldo)} €
          </Text>
          <Text style={styles.saldoLabel}>Bilancio totale</Text>
        </Card>

        {/* bottom padding for tip bubble */}
        {activeTip && <View style={{ height: 80 }} />}
      </ScrollView>

      {/* ── Floating Tip ── */}
      {activeTip && (
        <TipBubble
          visible
          text={activeTip.text}
          onDismiss={() => onDismissTip?.(activeTip.id)}
          position="bottom"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  greeting: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  date:     { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },

  ringsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  ringItem: { alignItems: 'center' },
  ringLabel:{ fontSize: 10, color: COLORS.textMuted, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  ringPct:  { fontSize: 11, color: COLORS.text, marginTop: 2, fontWeight: '600' },

  // Links grid
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '47%',
    gap: 8,
  },
  linkChipIcon:  { fontSize: 18 },
  linkChipLabel: { fontSize: 13, color: COLORS.text, fontWeight: '500', flex: 1 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  emptyText:    { fontSize: 13, color: COLORS.textSub, marginBottom: 12 },

  taskCard: { marginBottom: 8, padding: 12 },
  taskRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 4 },
  taskText: { flex: 1, fontSize: 13, color: COLORS.text },

  esameCard:   { marginBottom: 12 },
  esameNome:   { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  esameCFU:    { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  esameGiorni: { fontSize: 13, marginBottom: 8 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },

  saldoCard:   { alignItems: 'center', paddingVertical: 20 },
  saldoValore: { fontSize: 28, fontWeight: 'bold' },
  saldoLabel:  { fontSize: 11, color: COLORS.textSub, marginTop: 4 },
});