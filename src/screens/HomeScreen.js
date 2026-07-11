// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { StatCard } from '../components/StatCard';
import { TipBubble } from '../components/TipBubble';
import { DraggableList } from '../components/DraggableList';
import { greet, todayKey, fmt, diffDays, calculateAverages } from '../data/helpers';

const MAX_STARRED = 6;
const HOME_TASKS_LIMIT = 6;
const SECTION_ORDER_KEY = 'lifeos_home_section_order';
// 'dailyRoutine' removed: Habits no longer gets its own Home module (it
// already lives inside Tasks, one tap away via the section's own link).
const DEFAULT_SECTION_ORDER = ['nextTarget', 'todaysTasks', 'quickLinks'];

// Tips shown during first use — one per section
const TIPS = [
  { id: 'links',    text: 'Tap ★ in the Links screen to add your favorite sites here.' },
  { id: 'habits',   text: 'Add habits from the Tasks section: build your daily routine.' },
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
  exams, tasks, finances, heatmap, links,
  userName, course, isFirstUse, tipsShown, onDismissTip,
  onNavigate,
}) {
  const today    = todayKey();
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  // Habits are entries inside the unified Tasks list (journal) flagged
  // with recurring:true. They no longer get a Home module of their own —
  // only one-off tasks are previewed here now.
  const oneTimeTasks = tasks.filter(t => !t.recurring);

  // ── Metrics ──
  const activeExams = exams.filter(e => e.status === 'preparing' || e.status === 'to start');
  const nextExam    = activeExams.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const { average } = calculateAverages(exams);

  const completedTasks = oneTimeTasks.filter(t => t.done).length;
  const totalTasks     = oneTimeTasks.length;

  // "Tasks" preview — was filtered to t.date === today only; now shows
  // ALL incomplete one-off tasks (overdue + today + future + no-date),
  // sorted by urgency (no-date last), capped at HOME_TASKS_LIMIT with a
  // "+N more" link. A dashboard preview that scrolled forever every time
  // the seed/backlog grew would push every other Home section off-screen,
  // so this is a deliberate cap rather than the literal "show everything"
  // — full uncapped list lives one tap away in Tasks itself.
  const incompleteTasks = oneTimeTasks.filter(t => !t.done);
  const sortedIncomplete = [...incompleteTasks].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
  const homeTasks = sortedIncomplete.slice(0, HOME_TASKS_LIMIT);
  const remainingTasksCount = Math.max(0, incompleteTasks.length - homeTasks.length);

  const currentBalance = finances.reduce((acc, f) => acc + f.amount, 0);
  const starredLinks   = links.filter(l => l.starred).slice(0, MAX_STARRED);

  // ── Onboarding Tips Logic ──
  const tipToShow = isFirstUse ? TIPS.find(t => !tipsShown.includes(t.id)) : null;

  const go = (screenId) => {
    if (onNavigate) onNavigate(screenId);
  };

  // ── Section reorder state ──
  // The Home page's section blocks (not their inner items — those are
  // reordered from within their own screens) can be held-and-dragged to
  // change which one shows up first. The chosen order is persisted
  // separately from the rest of the app's data, under its own storage key,
  // since it's purely a Home-screen display preference, not a data model.
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SECTION_ORDER_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // Guard against a stale saved order missing/containing unknown
          // ids (e.g. after this app update removed 'dailyRoutine') by
          // falling back to default for anything that doesn't match
          // exactly — otherwise an order saved before this change would
          // still contain 'dailyRoutine' forever and silently no-op.
          const valid = Array.isArray(saved) &&
            saved.length === DEFAULT_SECTION_ORDER.length &&
            DEFAULT_SECTION_ORDER.every(id => saved.includes(id));
          if (valid) setSectionOrder(saved);
        }
      } catch {
        // fall back to default order silently
      }
    })();
  }, []);

  const persistSectionOrder = (newOrder) => {
    setSectionOrder(newOrder);
    AsyncStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(newOrder)).catch(() => {});
  };

  // Each section is a self-contained render function, keyed by id. Only
  // sections that currently have content to show are included in the
  // draggable list — e.g. "Next Target" disappears entirely when there's
  // no upcoming exam, exactly like before, it just also participates in
  // the reordering when it IS present.
  const sectionRenderers = {
    nextTarget: nextExam ? (
      <View>
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
      </View>
    ) : null,

    todaysTasks: (
      <View>
        <SectionHeader title="Tasks" onPress={() => go('journal')} />
        {homeTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pending tasks. You're clear!</Text>
          </Card>
        ) : (
          <Card style={styles.tasksCard}>
            {homeTasks.map((t, idx) => {
              const isOverdue = t.date && t.date < today;
              return (
                <View
                  key={t.id}
                  style={[styles.taskRow, idx < homeTasks.length - 1 && styles.taskRowDivider]}
                >
                  <View style={[styles.taskCheck, t.done && styles.taskCheckDone]}>
                    {t.done && <Text style={styles.taskCheckMark}>✓</Text>}
                  </View>
                  <View style={styles.taskTextWrap}>
                    <Text style={[styles.taskText, t.done && styles.taskTextDone]} numberOfLines={1}>
                      {t.text}
                    </Text>
                    <View style={styles.taskMetaRow}>
                      {t.subject ? <Text style={styles.taskSubject}>📚 {t.subject}</Text> : null}
                      {isOverdue ? (
                        <Text style={styles.taskOverdue}>⚠ overdue · {t.date}</Text>
                      ) : (t.date && t.date !== today ? (
                        <Text style={styles.taskSubject}>📅 {t.date}</Text>
                      ) : null)}
                    </View>
                  </View>
                  <Pill color={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'amber' : 'muted'}>
                    {t.priority}
                  </Pill>
                </View>
              );
            })}
            {remainingTasksCount > 0 && (
              <TouchableOpacity onPress={() => go('journal')} style={styles.moreTasksRow}>
                <Text style={styles.moreTasksText}>
                  +{remainingTasksCount} more pending task{remainingTasksCount === 1 ? '' : 's'} →
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
      </View>
    ),

    quickLinks: (
      <View>
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
      </View>
    ),
  };

  // Build the draggable items list from the persisted order, skipping any
  // section that currently has nothing to render (e.g. no upcoming exam).
  const draggableSections = sectionOrder
    .map(id => ({ id, content: sectionRenderers[id] }))
    .filter(s => s.content !== null);

  const handleSectionReorder = (reorderedSections) => {
    // Reordering only ever touches the sections that were visible (had
    // content) at drag time. Any hidden section (e.g. "Next Target" with
    // no upcoming exam right now) keeps its relative position by being
    // re-inserted at its old slot in the full order — this avoids a
    // hidden section silently jumping to the end once it reappears later.
    const visibleIds = reorderedSections.map(s => s.id);
    const hiddenIds = sectionOrder.filter(id => !visibleIds.includes(id));
    const newOrder = [];
    let visibleIdx = 0;
    sectionOrder.forEach(id => {
      if (hiddenIds.includes(id)) {
        newOrder.push(id);
      } else {
        newOrder.push(visibleIds[visibleIdx]);
        visibleIdx++;
      }
    });
    persistSectionOrder(newOrder);
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

        {/* Mission Control Grid — fixed stats, not reorderable (these are
            a dashboard summary, not a list of swappable items) */}
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

        {/* Reorderable section blocks */}
        {draggableSections.length > 1 && (
          <Text style={styles.reorderHint}>Hold and drag a section to reorder</Text>
        )}
        <DraggableList
          items={draggableSections}
          keyExtractor={(s) => s.id}
          onReorder={handleSectionReorder}
          itemHeight={140}
          renderItem={(s) => <View style={styles.sectionBlock}>{s.content}</View>}
        />

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
    marginBottom: 16,
  },
  statGridItem: { width: '48%', marginBottom: 10 },

  reorderHint: { fontSize: 11, color: COLORS.textSub, marginBottom: 6, textAlign: 'center' },
  sectionBlock: { marginBottom: 8 },

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

  // Tasks list
  tasksCard:    { marginBottom: 16, paddingVertical: 4 },
  taskRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  taskRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  taskCheck:    { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  taskCheckDone:{ backgroundColor: COLORS.green, borderColor: COLORS.green },
  taskCheckMark:{ color: '#fff', fontSize: 10, fontWeight: 'bold' },
  taskTextWrap: { flex: 1, marginRight: 8 },
  taskText:     { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  taskTextDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskMetaRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  taskSubject:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  taskOverdue:  { fontSize: 11, color: COLORS.red, fontWeight: '600', marginTop: 2, marginLeft: 6 },
  moreTasksRow: { paddingVertical: 10, alignItems: 'center' },
  moreTasksText:{ fontSize: 12, color: COLORS.accent, fontWeight: '600' },
});
