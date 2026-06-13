import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { calcMedia, prevLaurea, todayKey } from '../data/helpers';

export default function StatsScreen({ exams, tasks, habits, diario, heatmap, loggedSeconds }) {
  // ─── 1. CALCOLI PER STAT CARDS ─────────────────────────────────────────────
  const oreStudio = (loggedSeconds / 3600).toFixed(1);
  const taskCompletati = tasks.filter(t => t.done).length;
  const esamiSuperati = exams.filter(e => e.votoOttenuto).length;
  
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const giorniDiario = diario.length;
  const giorniProduttivi = Object.keys(heatmap).length;

  // ─── 2. CALCOLI PER MISSION CONTROL ────────────────────────────────────────
  const uniPct = exams.length > 0 ? (esamiSuperati / exams.length) * 100 : 0;
  
  const { mediaPonderata } = calcMedia(exams);
  const mpPct = mediaPonderata ? (mediaPonderata / 30) * 100 : 0;
  
  const votoLaurea = prevLaurea(mediaPonderata);
  const laureaPct = votoLaurea ? (votoLaurea / 110) * 100 : 0;

  const today = todayKey();
  const habitsOggi = habits.filter(h => h.history && h.history[today]).length;
  const habitsPct = habits.length > 0 ? (habitsOggi / habits.length) * 100 : 0;

  // ─── 3. GENERAZIONE HEATMAP (Ultimi 364 giorni) ────────────────────────────
  // Griglia 52 settimane (colonne) x 7 giorni (righe)
  const heatmapMatrix = useMemo(() => {
    const cols = 52;
    const rows = 7;
    const matrix = Array.from({ length: cols }, () => Array.from({ length: rows }, () => 0));
    
    const todayDate = new Date();
    for (let c = cols - 1; c >= 0; c--) {
      for (let r = rows - 1; r >= 0; r--) {
        const d = new Date(todayDate);
        const daysToSubtract = ((cols - 1 - c) * 7) + (rows - 1 - r);
        d.setDate(d.getDate() - daysToSubtract);
        const key = d.toISOString().slice(0, 10);
        matrix[c][r] = heatmap[key] || 0;
      }
    }
    return matrix;
  }, [heatmap]);

  const getHeatColor = (val) => {
    if (!val || val === 0) return COLORS.bg4;
    if (val < 1) return COLORS.accentGlow; // Meno di 1 ora
    if (val < 3) return COLORS.accentDim;  // Tra 1 e 3 ore
    return COLORS.accent;                  // Più di 3 ore
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>📈 Panoramica</Text>
      
      {/* ─── GRIGLIA STAT CARDS ─── */}
      <View style={styles.gridRow}>
        <View style={styles.gridCol}><StatCard label="Ore Studio" value={`${oreStudio}h`} color={COLORS.accent} /></View>
        <View style={styles.gridCol}><StatCard label="Task Chiusi" value={taskCompletati} color={COLORS.green} /></View>
      </View>
      <View style={styles.gridRow}>
        <View style={styles.gridCol}><StatCard label="Esami Superati" value={`${esamiSuperati}/${exams.length}`} color={COLORS.blue} /></View>
        <View style={styles.gridCol}><StatCard label="Max Streak" value={`${maxStreak} 🔥`} color={COLORS.amber} /></View>
      </View>
      <View style={styles.gridRow}>
        <View style={styles.gridCol}><StatCard label="Giorni Diario" value={giorniDiario} color={COLORS.text} /></View>
        <View style={styles.gridCol}><StatCard label="Giorni Studio" value={giorniProduttivi} color={COLORS.accent} /></View>
      </View>

      {/* ─── MISSION CONTROL ─── */}
      <Text style={styles.sectionTitle}>🚀 Mission Control</Text>
      <Card style={styles.missionCard}>
        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>🎓 Università</Text>
            <Text style={styles.missionVal}>{esamiSuperati}/{exams.length} esami</Text>
          </View>
          <ProgressBar pct={uniPct} color={COLORS.blue} />
        </View>

        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>📊 Media Ponderata</Text>
            <Text style={styles.missionVal}>{mediaPonderata ? mediaPonderata.toFixed(2) : '—'}/30</Text>
          </View>
          <ProgressBar pct={mpPct} color={COLORS.amber} />
        </View>

        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>🎯 Previsione Laurea</Text>
            <Text style={styles.missionVal}>{votoLaurea || '—'}/110</Text>
          </View>
          <ProgressBar pct={laureaPct} color={COLORS.green} />
        </View>

        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>🔥 Abitudini Oggi</Text>
            <Text style={styles.missionVal}>{habitsOggi}/{habits.length}</Text>
          </View>
          <ProgressBar pct={habitsPct} color={COLORS.accent} />
        </View>
      </Card>

      {/* ─── HEATMAP ─── */}
      <Text style={styles.sectionTitle}>🔥 Costanza Annuale (Ore di studio)</Text>
      <Card style={styles.heatmapCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.heatmapGrid}>
            {heatmapMatrix.map((col, cIdx) => (
              <View key={cIdx} style={styles.heatmapCol}>
                {col.map((val, rIdx) => (
                  <View 
                    key={rIdx} 
                    style={[styles.heatBox, { backgroundColor: getHeatColor(val) }]} 
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* Legenda */}
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Meno</Text>
          <View style={[styles.legendBox, { backgroundColor: COLORS.bg4 }]} />
          <View style={[styles.legendBox, { backgroundColor: COLORS.accentGlow }]} />
          <View style={[styles.legendBox, { backgroundColor: COLORS.accentDim }]} />
          <View style={[styles.legendBox, { backgroundColor: COLORS.accent }]} />
          <Text style={styles.legendText}>Più</Text>
        </View>
      </Card>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 10 },
  
  // Griglia StatCards
  gridRow: { flexDirection: 'row', marginBottom: 10 },
  gridCol: { flex: 1, marginRight: 5, marginLeft: 5 },
  
  // Mission Control
  missionCard: { paddingVertical: 20, paddingHorizontal: 16, marginBottom: 16 },
  missionItem: { marginBottom: 16 },
  missionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  missionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  missionVal: { fontSize: 13, fontWeight: 'bold', color: COLORS.textMuted },
  
  // Heatmap
  heatmapCard: { padding: 16 },
  heatmapGrid: { flexDirection: 'row' },
  heatmapCol: { marginRight: 4 },
  heatBox: { width: 10, height: 10, borderRadius: 2, marginBottom: 4 },
  
  // Legenda
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 },
  legendText: { fontSize: 10, color: COLORS.textMuted, marginHorizontal: 6 },
  legendBox: { width: 10, height: 10, borderRadius: 2, marginHorizontal: 2 }
});
