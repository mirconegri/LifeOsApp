// src/screens/StatsScreen.js
//
// Stats is the analytics surface: task completion and grade trends on the
// same tonal bar chart, university progress as wavy linear indicators, a
// study heatmap on a primary tonal ramp, 30-day spending, and the habit
// leaderboard. Metrics and module filters are unchanged from the old screen.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { M3, MODULE_TONES, alpha } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { AppScrollView } from '../ui/AppScrollView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { GroupItem } from '../ui/GroupItem';
import { WavyProgress } from '../ui/WavyProgress';
import { BarChart } from '../components/BarChart';
import { StatCard } from '../components/StatCard';
import { Icon } from '../components/Icon';
import { calculateAverages, predictedDegreeGrade, localDateKey, gradeWeight } from '../data/helpers';

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HEATMAP_WEEKS = 12;

const SPEND_TONES = {
  work:       MODULE_TONES.journal,
  university: MODULE_TONES.uni,
  food:       MODULE_TONES.groceries,
  transport:  MODULE_TONES.stats,
  other:      { container: M3.surfaceContainerHighest, on: M3.onSurfaceVariant },
};

function MissionBar({ label, value, pct, tone }) {
  return (
    <View style={styles.missionItem}>
      <View style={styles.missionLabelRow}>
        <Text style={[TEXT.labelLarge, styles.missionLabel]}>{label}</Text>
        <Text style={[TEXT.labelMedium, styles.missionValue]}>{value}</Text>
      </View>
      <WavyProgress
        progress={Math.max(0, Math.min(1, (pct || 0) / 100))}
        color={tone.on}
        trackColor={tone.container}
        stroke={5}
        amplitude={2.5}
        height={8}
        animate={false}
      />
    </View>
  );
}

export default function StatsScreen({ exams, journal, heatmap, finances = [], modules = {} }) {
  // Blocks tied to a module that is switched off are skipped, so Stats never
  // shows numbers from a section the user has hidden.
  const on = (id) => modules[id] !== false;
  const habits     = journal.filter(t => t.recurring);
  const oneTimeTasks = journal.filter(t => !t.recurring);

  // ─── Computed Metrics ──────────────────────────────────────────────────
  const completedTasks = oneTimeTasks.filter(t => t.done).length;
  const passedExams     = exams.filter(e => e.achievedGrade).length;
  const maxStreak       = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const studyDays       = Object.keys(heatmap).length;
  const studyHours      = Object.values(heatmap).reduce((a, v) => a + v, 0).toFixed(1);
  const maxHeatHours    = Math.max(1, ...Object.values(heatmap));

  const { average, weightedAverage } = calculateAverages(exams);
  const uniPct         = exams.length > 0 ? (passedExams / exams.length) * 100 : 0;
  const weightedAvgPct = weightedAverage ? (weightedAverage / 30) * 100 : 0;
  const predictedGrade = predictedDegreeGrade(weightedAverage);
  const graduationPct  = predictedGrade ? (predictedGrade / 110) * 100 : 0;

  // ─── Last 7 days task completion ────────────────────────────────────────
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

  // ─── Grade trend over time ───────────────────────────────────────────────
  const gradeTrend = useMemo(() => {
    return exams
      .filter(e => e.achievedGrade && e.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8)
      .map(e => ({
        label: e.name.slice(0, 4),
        value: gradeWeight(e.achievedGrade),
        displayValue: e.achievedGrade === 31 ? '30L' : e.achievedGrade,
        color: gradeWeight(e.achievedGrade) >= 28 ? MODULE_TONES.journal.on : MODULE_TONES.uni.on,
      }));
  }, [exams]);

  // ─── Spending by category (last 30 days) ─────────────────────────────────
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

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({
        label: cat,
        value: amt,
        displayValue: `€${Math.round(amt)}`,
        color: (SPEND_TONES[cat] || SPEND_TONES.other).on,
      }));
  }, [finances]);

  const totalSpend30d = spendByCategory.reduce((a, c) => a + c.value, 0);

  // ─── Habit leaderboard ────────────────────────────────────────────────────
  const habitLeaderboard = useMemo(() => {
    return [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 5);
  }, [habits]);

  // ─── Study heatmap: 12 columns of 7 days, ending today ───────────────────
  const heatmapWeeks = useMemo(() => {
    const keys = [];
    for (let i = HEATMAP_WEEKS * 7 - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      keys.push(localDateKey(d));
    }
    const weeks = [];
    for (let i = 0; i < keys.length; i += 7) weeks.push(keys.slice(i, i + 7));
    return weeks.map(week => week.map(key => ({
      key,
      hours: Number(heatmap[key]) || 0,
    })));
  }, [heatmap]);

  return (
    <View style={styles.root}>
      <AppScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Stats"
          subtitle="Study, tasks and money at a glance"
          style={styles.headerFlush}
        />

        {/* ─── General overview ─── */}
        <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>Overview</Text>
        <View style={styles.gridRow}>
          {on('journal') ? (
            <View style={styles.gridCol}>
              <StatCard label="Completed tasks" value={completedTasks} color={MODULE_TONES.journal.on} />
            </View>
          ) : null}
          {on('uni') ? (
            <View style={styles.gridCol}>
              <StatCard label="Passed exams" value={`${passedExams}/${exams.length}`} color={MODULE_TONES.uni.on} />
            </View>
          ) : null}
        </View>
        <View style={styles.gridRow}>
          {on('journal') ? (
            <View style={styles.gridCol}>
              <StatCard label="Best streak" value={`${maxStreak}d`} color={MODULE_TONES.finances.on} />
            </View>
          ) : null}
          <View style={styles.gridCol}>
            <StatCard
              label="Study days"
              value={studyDays}
              sub={`${studyHours}h total`}
              color={MODULE_TONES.stats.on}
            />
          </View>
        </View>

        {/* ─── Task completion, last 7 days ─── */}
        {on('journal') ? (
          <>
            <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>
              Tasks completed — last 7 days
            </Text>
            <View style={styles.panel}>
              {last7TaskData.every(d => d.value === 0) ? (
                <Text style={[TEXT.bodyMedium, styles.emptyText]}>
                  Complete a task to see your trend here.
                </Text>
              ) : (
                <BarChart
                  data={last7TaskData}
                  color={MODULE_TONES.journal.on}
                  trackColor={MODULE_TONES.journal.container}
                  height={96}
                />
              )}
            </View>
          </>
        ) : null}

        {/* ─── Grade trend ─── */}
        {on('uni') && gradeTrend.length > 0 ? (
          <>
            <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>
              Grade trend — recent exams
            </Text>
            <View style={styles.panel}>
              <BarChart data={gradeTrend} height={104} trackColor={M3.surfaceContainerHigh} />
              <Text style={[TEXT.labelSmall, styles.caption]}>
                Last {gradeTrend.length} passed exams, in order taken
              </Text>
            </View>
          </>
        ) : null}

        {/* ─── University & predictions ─── */}
        {on('uni') ? (
          <>
            <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>
              University & predictions
            </Text>
            <View style={styles.panel}>
              <MissionBar
                label="Graduation progress"
                value={`${uniPct.toFixed(0)}%`}
                pct={uniPct}
                tone={MODULE_TONES.uni}
              />
              <MissionBar
                label="Weighted average"
                value={`${weightedAverage.toFixed(2)} / 30`}
                pct={weightedAvgPct}
                tone={MODULE_TONES.finances}
              />
              <MissionBar
                label="Grade projection"
                value={`${predictedGrade} / 110`}
                pct={graduationPct}
                tone={MODULE_TONES.journal}
              />
            </View>
          </>
        ) : null}

        {/* ─── Spending by category ─── */}
        {on('finances') && spendByCategory.length > 0 ? (
          <>
            <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>
              Spending — last 30 days
            </Text>
            <View style={styles.panel}>
              <BarChart data={spendByCategory} height={80} trackColor={MODULE_TONES.finances.container} />
              <View style={styles.totalRow}>
                <Text style={[TEXT.labelLarge, styles.totalLabel]}>Total spent</Text>
                <Text style={[TEXT.titleMedium, styles.totalValue]}>€{Math.round(totalSpend30d)}</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* ─── Study heatmap ─── */}
        <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>Study heatmap</Text>
        <View style={styles.panel}>
          <View style={styles.heatmapRow}>
            {heatmapWeeks.map((week, wi) => (
              <View key={wi} style={styles.heatmapCol}>
                {week.map(cell => (
                  <View
                    key={cell.key}
                    style={[
                      styles.heatCell,
                      {
                        backgroundColor: cell.hours > 0
                          ? alpha(M3.primary, Math.min(0.85, 0.18 + 0.67 * (cell.hours / maxHeatHours)))
                          : M3.surfaceContainerHigh,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
          <Text style={[TEXT.labelSmall, styles.caption]}>
            {studyDays} study day{studyDays === 1 ? '' : 's'} · {studyHours}h total · last {HEATMAP_WEEKS} weeks
          </Text>
        </View>

        {/* ─── Habit streaks ─── */}
        {on('journal') && habitLeaderboard.length > 0 ? (
          <>
            <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>Habit streaks</Text>
            <View style={styles.group}>
              {habitLeaderboard.map((h, i) => (
                <GroupItem
                  key={h.id}
                  index={i}
                  count={habitLeaderboard.length}
                  tone={MODULE_TONES.finances}
                  leading={(
                    <View style={styles.habitIcon}>
                      <Text style={styles.habitEmoji}>{h.icon || '🌟'}</Text>
                    </View>
                  )}
                  title={h.text}
                  trailing={(
                    <View style={styles.streak}>
                      <Icon name="flame" size={12} color={MODULE_TONES.finances.on} />
                      <Text style={[TEXT.labelLarge, { color: MODULE_TONES.finances.on }]}>
                        {h.streak || 0}d
                      </Text>
                    </View>
                  )}
                />
              ))}
            </View>
          </>
        ) : null}

      </AppScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  headerFlush: { paddingHorizontal: 0 },

  sectionTitle: { color: M3.onSurface, marginTop: SPACING.lg, marginBottom: 8 },
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridCol: { flex: 1 },

  panel: {
    backgroundColor: M3.surfaceContainerLow,
    borderRadius: SHAPE.xxl,
    padding: 16,
  },
  emptyText: { color: M3.onSurfaceVariant, textAlign: 'center', paddingVertical: 20 },
  caption: { color: M3.outline, textAlign: 'center', marginTop: 10 },

  missionItem: { marginBottom: 14 },
  missionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  missionLabel: { color: M3.onSurface },
  missionValue: { color: M3.onSurfaceVariant },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
  },
  totalLabel: { color: M3.onSurfaceVariant },
  totalValue: { color: M3.onSurface },

  heatmapRow: { flexDirection: 'row', gap: 3 },
  heatmapCol: { flex: 1, gap: 3 },
  heatCell: { width: '100%', aspectRatio: 1, borderRadius: 3 },

  group: { gap: 2 },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: SHAPE.md,
    backgroundColor: MODULE_TONES.finances.container,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: { fontSize: 20 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
