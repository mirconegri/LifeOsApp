// src/screens/HomeScreen.js
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { StatCard } from '../components/StatCard';
import { TipBubble } from '../components/TipBubble';
import { greet, todayKey, fmt, diffDays, calculateAverages } from '../data/helpers';

const MAX_STARRED = 6;

// Tips shown during first use — one per section
const TIPS = [
  { id: 'links',    text: 'Tap ★ in the Links screen to add your favorite sites here.' },
  { id: 'habits',   text: 'Add your habits from the Habits section: build your daily routine.' },
  { id: 'finances', text: 'Log your transactions in Finances to keep your balance under control.' },
  { id: 'exams',    text: 'Add your exams in University to see your degree grade prediction.' },
];

// Small arrow-link button placed next to a section title, so the user can
// jump straight into that section from the Home screen.
function SectionLink({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.sectionLinkBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={styles.sectionLinkIcon}>›</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, onPress }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? <SectionLink onPress={onPress} /> : null}
    </View>
  );
}

export default function HomeScreen({
  exams, tasks, habits, finances, heatmap, links,
  userName, course, isFirstUse, tipsShown, onDismissTip,
  onNavigate,
}) {
  const today    = todayKey();
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Metrics ──
  const activeExams = exams.filter(e => e.status === 'preparing' || e.status === 'to start');
  const nextExam    = activeExams.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const { average } = calculateAverages(exams);

  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks     = tasks.length;

  // Today's study tasks — used both for the Mission Control counter and
  // for the dedicated "Today's Study Tasks" list below.
  const todaysTasks    = tasks.filter(t => t.date === today);

  const currentBalance = finances.reduce((acc, f) => acc + f.amount, 0);
  const starredLinks   = links.filter(l => l.starred).slice(0, MAX_STARRED);

  // ── Onboarding Tips Logic ──
  const tipToShow = isFirstUse ? TIPS.find(t => !tipsShown.includes(t.id)) : null;

  const go = (screenId) => {
    if (onNavigate) onNavigate(screenId);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greet()}, {userName || 'Boss'}!</Text>
          <Text style={styles.dateLabel}>Today is {dateLabel}</Text>
          {course ? (
            <Text style={[styles.dateLabel, {color: COLORS.accent, marginTop: 2, fontWeight: '600'}]}>
              🎓 {course}
            </Text>
          ) : null}
        </View>

        {/* Mission Control Grid */}
        <Text style={styles.sectionTitle}>Mission Control</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statGridItem}>
            <StatCard label="Tasks Done" value={`${completedTasks}/${totalTasks}`} color={COLORS.green} />
          </View>
          <View style={styles.statGridItem}>
            <StatCard label="Balance" value={`€${fmt(currentBalance)}`} color={currentBalance >= 0 ? COLORS.accent : COLORS.red} />
          </View>
          <View style={styles.statGridItem}>
            <StatCard label="Avg Grade" value={average ? average.toFixed(1) : '-'} color={COLORS.amber} />
          </View>
          <View style={styles.statGridItem}>
            <StatCard label="Study Days" value={Object.keys(heatmap).length} color={COLORS.text} />
          </View>
        </View>

        {/* Upcoming Exam */}
        {nextExam && (
          <>
            <SectionHeader title="Next Target" onPress={() => go('uni')} />
            <TouchableOpacity onPress={() => go('uni')} activeOpacity={0.8}>
              <Card style={styles.examCard}>
                <View style={styles.examCardHeader}>
                  <Text style={styles.examName}>{nextExam.name}</Text>
                  <Pill color="accent">{diffDays(nextExam.date)} days left</Pill>
                </View>
                <Text style={styles.examDate}>📅 {nextExam.date}</Text>
              </Card>
            </TouchableOpacity>
          </>
        )}

        {/* Today's Study Tasks */}
        <SectionHeader title="Today's Study Tasks" onPress={() => go('study')} />
        {todaysTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No study tasks scheduled for today.</Text>
          </Card>
        ) : (
          <Card style={styles.tasksCard}>
            {todaysTasks.map((t, idx) => (
              <View
                key={t.id}
                style={[styles.taskRow, idx < todaysTasks.length - 1 && styles.taskRowDivider]}
              >
                <View style={[styles.taskCheck, t.done && styles.taskCheckDone]}>
                  {t.done && <Text style={styles.taskCheckMark}>✓</Text>}
                </View>
                <View style={styles.taskTextWrap}>
                  <Text style={[styles.taskText, t.done && styles.taskTextDone]} numberOfLines={1}>
                    {t.text}
                  </Text>
                  {t.subject ? <Text style={styles.taskSubject}>📚 {t.subject}</Text> : null}
                </View>
                <Pill color={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'amber' : 'muted'}>
                  {t.priority}
                </Pill>
              </View>
            ))}
          </Card>
        )}

        {/* Habits (Compact) */}
        {habits.length > 0 && (
          <>
            <SectionHeader title="Daily Routine" onPress={() => go('habits')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.habitsScroll}>
              {habits.map(h => {
                const doneToday = !!(h.history && h.history[today]);
                return (
                  <View key={h.id} style={[styles.habitPill, doneToday && styles.habitPillDone]}>
                    <Text style={styles.habitIcon}>{h.icon}</Text>
                    <Text style={[styles.habitName, doneToday && styles.habitNameDone]}>{h.name}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Starred Links */}
        <SectionHeader title="Quick Links" onPress={() => go('links')} />
        <View style={styles.linkGrid}>
          {starredLinks.length === 0 ? (
            <Text style={styles.emptyText}>No starred links yet.</Text>
          ) : (
            starredLinks.map(l => (
              <TouchableOpacity key={l.id} onPress={() => Linking.openURL(l.url)} style={styles.linkChip}>
                <Text style={styles.linkChipIcon}>{l.icon}</Text>
                <Text style={styles.linkChipLabel} numberOfLines={1}>{l.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      {/* Tip Bubble */}
      <TipBubble
        visible={!!tipToShow}
        text={tipToShow?.text}
        onDismiss={() => onDismissTip(tipToShow?.id)}
        position="bottom"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 100 },

  header:    { marginBottom: 24, marginTop: 10 },
  greeting:  { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  dateLabel: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statGridItem: { width: '48%', marginBottom: 10 },

  habitsScroll: { marginBottom: 16, overflow: 'visible' },
  habitPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8,
  },
  habitPillDone: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  habitIcon:     { fontSize: 16, marginRight: 6 },
  habitName:     { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  habitNameDone: { color: COLORS.accent, fontWeight: '700' },

  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  linkChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg3,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    width: '48%', marginBottom: 10,
  },
  linkChipIcon:  { fontSize: 18, marginRight: 8 },
  linkChipLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1 },

  // Section header with the clickable arrow link next to the title
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8, marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLinkBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.bg3, alignItems: 'center', justifyContent: 'center',
  },
  sectionLinkIcon: { fontSize: 15, color: COLORS.accent, fontWeight: '700', marginTop: -1 },

  emptyText:    { fontSize: 13, color: COLORS.textSub, marginBottom: 12 },
  emptyCard:    { marginBottom: 16, paddingVertical: 18, alignItems: 'center' },

  examCard:       { marginBottom: 16, paddingVertical: 16 },
  examCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  examName:       { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 10 },
  examDate:       { fontSize: 13, color: COLORS.textMuted },

  // Today's study tasks list
  tasksCard:    { marginBottom: 16, paddingVertical: 4 },
  taskRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  taskRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  taskCheck:    { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  taskCheckDone:{ backgroundColor: COLORS.green, borderColor: COLORS.green },
  taskCheckMark:{ color: '#fff', fontSize: 10, fontWeight: 'bold' },
  taskTextWrap: { flex: 1, marginRight: 8 },
  taskText:     { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  taskTextDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskSubject:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
