import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { calculateAverages, predictedDegreeGrade, todayKey } from '../data/helpers';

export default function StatsScreen({ exams, tasks, habits, heatmap }) {
  // ─── Computed Metrics ──────────────────────────────────────────────────────
  const completedTasks = tasks.filter(t => t.done).length;
  const passedExams     = exams.filter(e => e.achievedGrade).length;
  const maxStreak       = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const studyDays       = Object.keys(heatmap).length;
  const studyHours      = Object.values(heatmap).reduce((a, v) => a + v, 0).toFixed(1);

  const { average, weightedAverage } = calculateAverages(exams);
  const uniPct        = exams.length > 0 ? (passedExams / exams.length) * 100 : 0;
  const weightedAvgPct = weightedAverage ? (weightedAverage / 30) * 100 : 0;
  const predictedGrade = predictedDegreeGrade(weightedAverage);
  const graduationPct  = predictedGrade ? (predictedGrade / 110) * 100 : 0;

  const today = todayKey();

  // ─── Heatmap Layout Constants ──────────────────────────────────────────────
  // Generates columns representing the intensity of study hours
  const heatmapCols = useMemo(() => {
    const cols = [];
    const now = new Date();
    
    for (let c = 0; c < 15; c++) {
      const colDays = [];
      for (let r = 0; r < 7; r++) {
        const offset = (14 - c) * 7 + (6 - r);
        const d = new Date(now);
        d.setDate(d.getDate() - offset);
        const k = d.toISOString().slice(0, 10);
        colDays.push({ key: k, val: heatmap[k] || 0 });
      }
      cols.push(colDays);
    }
    return cols;
  }, [heatmap]);

  // Helper to resolve color intensity based on hours studied
  const getHeatColor = (val) => {
    if (val === 0) return COLORS.bg4;
    if (val < 2)   return '#102A45';
    if (val < 4)   return '#1A4D80';
    if (val < 6)   return COLORS.accentDim;
    return COLORS.accent;
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      
      {/* ─── General Overview ─── */}
      <Text style={styles.sectionTitle}>General Overview</Text>
      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <StatCard label="Completed Tasks" value={completedTasks} color={COLORS.green} />
        </View>
        <View style={styles.gridCol}>
          <StatCard label="Passed Exams" value={`${passedExams}/${exams.length}`} color={COLORS.accent} />
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <StatCard label="Max Streak" value={`${maxStreak}d`} color={COLORS.amber} />
        </View>
        <View style={styles.gridCol}>
          <StatCard label="Study Days" value={studyDays} sub={`${studyHours}h total`} color={COLORS.text} />
        </View>
      </View>

      {/* ─── University & Predictions ─── */}
      <Text style={styles.sectionTitle}>University & Predictions</Text>
      <Card style={styles.missionCard}>
        
        {/* Graduation Progress */}
        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>Graduation Progress</Text>
            <Text style={styles.missionVal}>{uniPct.toFixed(0)}%</Text>
          </View>
          <ProgressBar pct={uniPct} color={COLORS.accent} />
        </View>

        {/* Weighted Average */}
        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>Weighted Average</Text>
            <Text style={styles.missionVal}>{weightedAverage.toFixed(2)} / 30</Text>
          </View>
          <ProgressBar pct={weightedAvgPct} color={COLORS.amber} />
        </View>

        {/* Grade Projection */}
        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>Grade Projection</Text>
            <Text style={styles.missionVal}>{predictedGrade} / 110</Text>
          </View>
          <ProgressBar pct={graduationPct} color={COLORS.green} />
        </View>

      </Card>

      {/* ─── Study Heatmap ─── */}
      <Text style={styles.sectionTitle}>Study Heatmap</Text>
      <Card style={styles.heatmapCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.heatmapGrid}>
            {heatmapCols.map((col, cIdx) => (
              <View key={cIdx} style={styles.heatmapCol}>
                {col.map((day) => {
                  const isToday = day.key === today;
                  return (
                    <View
                      key={day.key}
                      style={[
                        styles.heatBox,
                        { backgroundColor: getHeatColor(day.val) },
                        isToday && { borderWidth: 1, borderColor: '#fff' }
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Less</Text>
          <View style={[styles.legendBox, { backgroundColor: COLORS.bg4 }]} />
          <View style={[styles.legendBox, { backgroundColor: '#102A45' }]} />
          <View style={[styles.legendBox, { backgroundColor: '#1A4D80' }]} />
          <View style={[styles.legendBox, { backgroundColor: COLORS.accentDim }]} />
          <View style={[styles.legendBox, { backgroundColor: COLORS.accent }]} />
          <Text style={styles.legendText}>More</Text>
        </View>
      </Card>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 10 },
  
  gridRow: { flexDirection: 'row', marginBottom: 10 },
  gridCol: { flex: 1, marginHorizontal: 5 },
  
  missionCard: { paddingVertical: 20, paddingHorizontal: 16, marginBottom: 16 },
  missionItem: { marginBottom: 16 },
  missionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  missionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  missionVal: { fontSize: 13, fontWeight: 'bold', color: COLORS.textMuted },
  
  heatmapCard: { padding: 16 },
  heatmapGrid: { flexDirection: 'row' },
  heatmapCol: { marginRight: 4 },
  heatBox: { width: 10, height: 10, borderRadius: 2, marginBottom: 4 },
  
  legendRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 },
  legendBox: { width: 9, height: 9, borderRadius: 1.5, marginHorizontal: 2 },
  legendText: { fontSize: 10, color: COLORS.textSub, marginHorizontal: 4 }
});