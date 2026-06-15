import React, { useState } from 'react';
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

export default function HomeScreen({
  exams, tasks, habits, finances, heatmap, links,
  userName, course, isFirstUse, tipsShown, onDismissTip,
}) {
  const today    = todayKey();
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Metrics ──
  const activeExams = exams.filter(e => e.status === 'preparing' || e.status === 'to start');
  const nextExam    = activeExams.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const { average } = calculateAverages(exams);

  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks     = tasks.length;

  const currentBalance = finances.reduce((acc, f) => acc + f.amount, 0);
  const starredLinks   = links.filter(l => l.starred).slice(0, MAX_STARRED);

  // ── Onboarding Tips Logic ──
  const tipToShow = isFirstUse ? TIPS.find(t => !tipsShown.includes(t.id)) : null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greet()}, {userName || 'Boss'}!</Text>
          <Text style={styles.dateLabel}>Today is {dateLabel}</Text>
          {/* NEW: Display the user's University Course */}
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
            <Text style={styles.sectionTitle}>Next Target</Text>
            <Card style={styles.examCard}>
              <View style={styles.examCardHeader}>
                <Text style={styles.examName}>{nextExam.name}</Text>
                <Pill color="accent">{diffDays(nextExam.date)} days left</Pill>
              </View>
              <Text style={styles.examDate}>📅 {nextExam.date}</Text>
            </Card>
          </>
        )}

        {/* Habits (Compact) */}
        {habits.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Daily Routine</Text>
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
        <Text style={styles.sectionTitle}>Quick Links</Text>
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
    backgroundColor: COLORS.bg3, // FIX: Più chiaro per staccare dal background
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    width: '48%', marginBottom: 10,
  },
  linkChipIcon:  { fontSize: 18, marginRight: 8 },
  linkChipLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1 }, // FIX: Più grande e in grassetto

  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  emptyText:    { fontSize: 13, color: COLORS.textSub, marginBottom: 12 },

  examCard:       { marginBottom: 16, paddingVertical: 16 },
  examCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  examName:       { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 10 },
  examDate:       { fontSize: 13, color: COLORS.textMuted },
});