// src/screens/StatsScreen.js
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { BarChart } from '../components/BarChart';
import { calculateAverages, predictedDegreeGrade, todayKey, localDateKey, gradeWeight } from '../data/helpers';

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StatsScreen({ exams, journal, heatmap, finances = [] }) {
  const habits     = journal.filter(t => t.recurring);
  const oneTimeTasks = journal.filter(t => !t.recurring);

  // ─── Computed Metrics ──────────────────────────────────────────────────
  const completedTasks = oneTimeTasks.filter(t => t.done).length;
  const passedExams     = exams.filter(e => e.achievedGrade).length;
  const maxStreak       = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const studyDays       = Object.keys(heatmap).length;
  const studyHours      = Object.values(heatmap).reduce((a, v) => a + v, 0).toFixed(1);

  const { average, weightedAverage } = calculateAverages(exams);
  const uniPct         = exams.length > 0 ? (passedExams / exams.length) * 100 : 0;
  const weightedAvgPct = weightedAverage ? (weightedAverage / 30) * 100 : 0;
  const predictedGrade = predictedDegreeGrade(weightedAverage);
  const graduationPct  = predictedGrade ? (predictedGrade / 110) * 100 : 0;

  const today = todayKey();

  // ─── New: last 7 days task completion ───────────────────────────────────
  // Different from the heatmap (which tracks study hours) — this tracks
  // how many one-off tasks were completed each day, a more direct "did I
  // get things done" signal than hours logged.
  const last7TaskData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      const count = oneTimeTasks.filter(t => t.date === key && t.done).length;
      days.push({ label: WEEKDAY_SHORT[d.getDay()], value: count });
    }
    return days;
  }, [oneTimeTasks]);

  // ─── New: grade trend over time ─────────────────────────────────────────
  // Each passed exam plotted in the order it was taken (by date), showing
  // whether grades are trending up or holding steady — something neither
  // the old Stats screen nor University screen showed as a sequence.
  const gradeTrend = useMemo(() => {
    return exams
      .filter(e => e.achievedGrade && e.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8) // last 8 exams keeps the chart readable
      .map(e => ({
        label: e.name.slice(0, 4),
        value: gradeWeight(e.achievedGrade),
        displayValue: e.achievedGrade === 31 ? '30L' : e.achievedGrade,
        color: gradeWeight(e.achievedGrade) >= 28 ? COLORS.green : COLORS.accent,
      }));
  }, [exams]);

  // ─── New: spending by category (last 30 days) ───────────────────────────
  const spendByCategory = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffKey = localDateKey(cutoff);

    const totals = {};
    finances
      .filter(f => f.type === 'expense' && f.date >= cutoffKey)
      .forEach(f => {
        totals[f.category] = (totals[f.category] || 0) + Math.abs(f.amount);
      });

    const CAT_COLORS = { work: COLORS.green, university: COLORS.accent, food: COLORS.amber, transport: COLORS.blue, other: COLORS.textMuted };
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({ label: cat, value: amt, displayValue: `€${Math.round(amt)}`, color: CAT_COLORS[cat] || COLORS.textMuted }));
  }, [finances]);

  const totalSpend30d = spendByCategory.reduce((a, c) => a + c.value, 0);

  // ─── New: habit leaderboard ──────────────────────────────────────────────
  const habitLeaderboard = useMemo(() => {
    return [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 5);
  }, [habits]);

  // ─── Heatmap (existing, unchanged logic) ────────────────────────────────
  const heatmapCols = useMemo(() => {
    const cols = [];
    const now = new Date();
    for (let c = 0; c < 15; c++) {
      const colDays = [];
      for (let r = 0; r < 7; r++) {
        const offset = (14 - c) * 7 + (6 - r);
        const d = new Date(now);
        d.setDate(d.getDate() - offset);
        const k = localDateKey(d);
        colDays.push({ key: k, val: heatmap[k] || 0 });
      }
      cols.push(colDays);
    }
    return cols;
  }, [heatmap]);

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
          <StatCard label="Best Streak" value={`${maxStreak}d`} color={COLORS.amber} />
        </View>
        <View style={styles.gridCol}>
          <StatCard label="Study Days" value={studyDays} sub={`${studyHours}h total`} color={COLORS.text} />
        </View>
      </View>

      {/* ─── Task completion, last 7 days ─── */}
      <Text style={styles.sectionTitle}>Tasks Completed — Last 7 Days</Text>
      <Card style={styles.chartCard}>
        {last7TaskData.every(d => d.value === 0) ? (
          <Text style={styles.emptyChartText}>Complete a task to see your trend here.</Text>
        ) : (
          <BarChart data={last7TaskData} color={COLORS.accent} height={90} />
        )}
      </Card>

      {/* ─── Grade trend ─── */}
      {gradeTrend.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Grade Trend — Recent Exams</Text>
          <Card style={styles.chartCard}>
            <BarChart data={gradeTrend} color={COLORS.accent} height={100} />
            <Text style={styles.chartFootnote}>Last {gradeTrend.length} passed exams, in order taken</Text>
          </Card>
        </>
      )}

      {/* ─── University & Predictions ─── */}
      <Text style={styles.sectionTitle}>University & Predictions</Text>
      <Card style={styles.missionCard}>
        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>Graduation Progress</Text>
            <Text style={styles.missionVal}>{uniPct.toFixed(0)}%</Text>
          </View>
          <ProgressBar pct={uniPct} color={COLORS.accent} />
        </View>

        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>Weighted Average</Text>
            <Text style={styles.missionVal}>{weightedAverage.toFixed(2)} / 30</Text>
          </View>
          <ProgressBar pct={weightedAvgPct} color={COLORS.amber} />
        </View>

        <View style={styles.missionItem}>
          <View style={styles.missionLabelRow}>
            <Text style={styles.missionLabel}>Grade Projection</Text>
            <Text style={styles.missionVal}>{predictedGrade} / 110</Text>
          </View>
          <ProgressBar pct={graduationPct} color={COLORS.green} />
        </View>
      </Card>

      {/* ─── Spending by category ─── */}
      {spendByCategory.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Spending — Last 30 Days</Text>
          <Card style={styles.chartCard}>
            <BarChart data={spendByCategory} height={80} />
            <View style={styles.spendTotalRow}>
              <Text style={styles.spendTotalLabel}>Total spent</Text>
              <Text style={styles.spendTotalVal}>€{Math.round(totalSpend30d)}</Text>
            </View>
          </Card>
        </>
      )}

      {/* ─── Habit leaderboard ─── */}
      {habitLeaderboard.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Habit Streaks</Text>
          <Card style={styles.leaderboardCard}>
            {habitLeaderboard.map((h, i) => (
              <View key={h.id} style={[styles.leaderRow, i < habitLeaderboard.length - 1 && styles.leaderRowDivider]}>
                <Text style={styles.leaderIcon}>{h.icon || '🌟'}</Text>
                <Text style={styles.leaderName}>{h.text}</Text>
                <Text style={styles.leaderStreak}>🔥 {h.streak || 0}d</Text>
              </View>
            ))}
          </Card>
        </>
      )}

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
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 14 },

  gridRow: { flexDirection: 'row', marginBottom: 10 },
  gridCol: { flex: 1, marginHorizontal: 5 },

  chartCard: { paddingVertical: 16, paddingHorizontal: 14, marginBottom: 4 },
  emptyChartText: { color: COLORS.textSub, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  chartFootnote: { color: COLORS.textSub, fontSize: 11, textAlign: 'center', marginTop: 8 },

  missionCard: { paddingVertical: 20, paddingHorizontal: 16, marginBottom: 4 },
  missionItem: { marginBottom: 16 },
  missionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  missionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  missionVal: { fontSize: 13, fontWeight: 'bold', color: COLORS.textMuted },

  spendTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.hairline },
  spendTotalLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  spendTotalVal: { fontSize: 14, color: COLORS.text, fontWeight: '700' },

  leaderboardCard: { paddingVertical: 6, paddingHorizontal: 16, marginBottom: 4 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  leaderRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.hairline },
  leaderIcon: { fontSize: 18, marginRight: 12 },
  leaderName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  leaderStreak: { fontSize: 13, color: COLORS.amber, fontWeight: '700' },

  heatmapCard: { padding: 16, marginBottom: 4 },
  heatmapGrid: { flexDirection: 'row' },
  heatmapCol: { marginRight: 4 },
  heatBox: { width: 10, height: 10, borderRadius: 2, marginBottom: 4 },

  legendRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 },
  legendBox: { width: 9, height: 9, borderRadius: 1.5, marginHorizontal: 2 },
  legendText: { fontSize: 10, color: COLORS.textSub, marginHorizontal: 4 },
});
