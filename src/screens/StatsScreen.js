import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { calcMedia, prevLaurea, todayKey } from '../data/helpers';

export default function StatsScreen({ exams, tasks, habits, heatmap }) {
  // ── Computed ──────────────────────────────────────────────────────────────
  const taskCompletati = tasks.filter(t => t.done).length;
  const esamiSuperati  = exams.filter(e => e.votoOttenuto).length;
  const maxStreak      = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const giorniStudio   = Object.keys(heatmap).length;
  const oreStudio      = Object.values(heatmap).reduce((a, v) => a + v, 0).toFixed(1);

  const { media, mediaPonderata } = calcMedia(exams);
  const uniPct   = exams.length > 0 ? (esamiSuperati / exams.length) * 100 : 0;
  const mpPct    = mediaPonderata ? (mediaPonderata / 30) * 100 : 0;
  const votoL    = prevLaurea(mediaPonderata);
  const laureaPct = votoL ? (votoL / 110) * 100 : 0;

  const today        = todayKey();
  const habitsOggi   = habits.filter(h => h.history && h.history[today]).length;
  const habitsPct    = habits.length > 0 ? (habitsOggi / habits.length) * 100 : 0;

  // ── Heatmap (52 weeks × 7 days) ──────────────────────────────────────────
  const heatmapMatrix = useMemo(() => {
    const cols = 52, rows = 7;
    const matrix = Array.from({ length: cols }, () => Array(rows).fill(0));
    const todayDate = new Date();
    for (let c = cols - 1; c >= 0; c--) {
      for (let r = rows - 1; r >= 0; r--) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - ((cols - 1 - c) * 7 + (rows - 1 - r)));
        const key = d.toISOString().slice(0, 10);
        matrix[c][r] = heatmap[key] || 0;
      }
    }
    return matrix;
  }, [heatmap]);

  const getHeatColor = (val) => {
    if (!val) return COLORS.bg4;
    if (val < 1) return COLORS.accentGlow;
    if (val < 3) return COLORS.accentDim;
    return COLORS.accent;
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>📈 Panoramica</Text>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}><StatCard label="Ore Studio (tot.)" value={`${oreStudio}h`}         color={COLORS.accent} /></View>
        <View style={styles.gridCol}><StatCard label="Giorni Studio"      value={giorniStudio}           color={COLORS.accentDim} /></View>
      </View>
      <View style={styles.gridRow}>
        <View style={styles.gridCol}><StatCard label="Task Chiusi"        value={taskCompletati}         color={COLORS.green} /></View>
        <View style={styles.gridCol}><StatCard label="Max Streak"         value={`${maxStreak} 🔥`}      color={COLORS.amber} /></View>
      </View>
      <View style={styles.gridRow}>
        <View style={styles.gridCol}><StatCard label="Esami Superati"     value={`${esamiSuperati}/${exams.length}`} color={COLORS.blue} /></View>
        <View style={styles.gridCol}><StatCard label="Media Pond."        value={mediaPonderata ? mediaPonderata.toFixed(2) : '—'} sub="/30" color={COLORS.amber} /></View>
      </View>

      {/* ── Mission Control ── */}
      <Text style={styles.sectionTitle}>🚀 Mission Control</Text>
      <Card style={styles.missionCard}>
        {[
          { label: '🎓 Università',       val: `${esamiSuperati}/${exams.length} esami`, pct: uniPct,    color: COLORS.blue  },
          { label: '📊 Media Ponderata',  val: mediaPonderata ? `${mediaPonderata.toFixed(2)}/30` : '—', pct: mpPct, color: COLORS.amber },
          { label: '🎯 Previsione Laurea',val: votoL ? `${votoL}/110` : '—',             pct: laureaPct, color: COLORS.green },
          { label: '🔥 Abitudini Oggi',   val: `${habitsOggi}/${habits.length}`,          pct: habitsPct, color: COLORS.accent },
        ].map(item => (
          <View key={item.label} style={styles.missionItem}>
            <View style={styles.missionLabelRow}>
              <Text style={styles.missionLabel}>{item.label}</Text>
              <Text style={styles.missionVal}>{item.val}</Text>
            </View>
            <ProgressBar pct={item.pct} color={item.color} />
          </View>
        ))}
      </Card>

      {/* ── Heatmap ── */}
      <Text style={styles.sectionTitle}>🔥 Costanza Annuale (ore di studio)</Text>
      <Card style={styles.heatmapCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.heatmapGrid}>
            {heatmapMatrix.map((col, cIdx) => (
              <View key={cIdx} style={styles.heatmapCol}>
                {col.map((val, rIdx) => (
                  <View key={rIdx} style={[styles.heatBox, { backgroundColor: getHeatColor(val) }]} />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Meno</Text>
          {[COLORS.bg4, COLORS.accentGlow, COLORS.accentDim, COLORS.accent].map((c, i) => (
            <View key={i} style={[styles.legendBox, { backgroundColor: c }]} />
          ))}
          <Text style={styles.legendText}>Più</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 10 },
  gridRow: { flexDirection: 'row', marginBottom: 10 },
  gridCol: { flex: 1, marginHorizontal: 5 },
  missionCard:  { paddingVertical: 20, paddingHorizontal: 16, marginBottom: 16 },
  missionItem:  { marginBottom: 16 },
  missionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  missionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  missionVal:   { fontSize: 13, fontWeight: 'bold', color: COLORS.textMuted },
  heatmapCard:  { padding: 16 },
  heatmapGrid:  { flexDirection: 'row' },
  heatmapCol:   { marginRight: 4 },
  heatBox:      { width: 10, height: 10, borderRadius: 2, marginBottom: 4 },
  legendRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 },
  legendText:   { fontSize: 10, color: COLORS.textMuted, marginHorizontal: 6 },
  legendBox:    { width: 10, height: 10, borderRadius: 2, marginHorizontal: 2 },
});