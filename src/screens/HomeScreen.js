// src/screens/HomeScreen.js
//
// The M3 Expressive Home: SearchPill header, Focus hero pager, smart banner,
// "Up next" tonal rail, grouped task list, quick-link tiles and the module
// grid. All data comes from props that already existed; there is no local
// state and no data-model change. The old draggable sections and the 2x2
// dashboard grid are gone (constraint 8): the layout is fixed and designed.

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Linking,
} from 'react-native';

import { M3, MODULE_TONES, alpha } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { NAV } from '../config/nav';
import { TEXT } from '../ui/type';
import { Icon } from '../components/Icon';
import { Pill } from '../components/Pill';
import { TipBubble } from '../components/TipBubble';
import { AppScrollView } from '../ui/AppScrollView';
import { SearchPill } from '../ui/SearchPill';
import { Chip } from '../ui/Chip';
import { SectionTitle } from '../ui/SectionTitle';
import { HeroPager } from '../ui/HeroPager';
import { GroupItem } from '../ui/GroupItem';
import { TonalIcon } from '../ui/TonalIcon';
import { EmptyState } from '../ui/EmptyState';
import { CtaButton } from '../ui/CtaButton';
import { SpringPressable } from '../ui/SpringPressable';
import { Reveal } from '../ui/Reveal';
import { WavyProgress } from '../ui/WavyProgress';
import { Blob } from '../ui/Blob';
import { todayKey, fmt, diffDays, calculateAverages } from '../data/helpers';

const MAX_STARRED = 6;
const HOME_TASKS_LIMIT = 6;
const UP_NEXT_LIMIT = 6;

// Tips shown during first use — one per section.
const TIPS = [
  { id: 'links',    text: 'Tap ★ in the Links screen to add your favorite sites here.' },
  { id: 'habits',   text: 'Add habits from the Tasks section: build your daily routine.' },
  { id: 'finances', text: 'Log your transactions in Finances to keep your balance under control.' },
  { id: 'exams',    text: 'Add your exams in University to see your degree grade prediction.' },
];

// Secondary modules on Home's "Browse modules" grid, each with its blob shape.
const MODULE_TILES = [
  { id: 'groceries', label: 'Groceries', blob: 'sunny' },
  { id: 'goals',     label: 'Goals',     blob: 'clover4' },
  { id: 'notes',     label: 'Notes',     blob: 'cookie6' },
  { id: 'links',     label: 'Links',     blob: 'flower' },
];

function priorityTone(priority) {
  if (priority === 'high') return 'red';
  if (priority === 'medium') return 'amber';
  return 'muted';
}

function TaskCheck({ done, onPress, label }) {
  return (
    <SpringPressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      hitSlop={12}
      style={[styles.check, done && styles.checkDone]}
      contentStyle={styles.checkContent}
    >
      {done ? (
        <Icon name="check" size={15} color={MODULE_TONES.journal.container} />
      ) : null}
    </SpringPressable>
  );
}

function SmartBanner({ count, onPress }) {
  return (
    <SpringPressable
      onPress={onPress}
      haptic="selection"
      style={styles.banner}
      contentStyle={styles.bannerContent}
      accessibilityLabel={`${count} overdue task${count === 1 ? '' : 's'}, review`}
    >
      <TonalIcon
        icon="alert-circle"
        size={48}
        radius={14}
        tone={{ container: M3.errorContainer, on: M3.onErrorContainer }}
      />
      <View style={styles.bannerText}>
        <Text style={[TEXT.titleSmall, styles.bannerTitle]}>
          {count} overdue task{count === 1 ? '' : 's'}
        </Text>
        <Text style={[TEXT.labelMedium, styles.bannerBody]}>
          Review them before they pile up
        </Text>
      </View>
      <View style={styles.bannerCta}>
        <Text style={[TEXT.labelLarge, { color: M3.onSecondaryContainer }]}>Review</Text>
      </View>
    </SpringPressable>
  );
}

function UpNextCard({ exam, onPress }) {
  const tone = MODULE_TONES.uni;
  const days = Math.max(0, diffDays(exam.date));
  return (
    <SpringPressable
      onPress={onPress}
      haptic="selection"
      style={[styles.upNextCard, { backgroundColor: tone.container }]}
      contentStyle={styles.upNextContent}
      accessibilityLabel={`${exam.name}, ${exam.credits} credits, ${days} days left`}
    >
      <View style={styles.upNextArt}>
        <Blob preset="cookie9" size={120} color={alpha(tone.on, 0.12)} />
        <View style={styles.centerOverlay} pointerEvents="none">
          <Icon name="graduation-cap" size={30} color={tone.on} />
        </View>
      </View>
      <View>
        <Text style={[TEXT.titleMedium, { color: tone.on }]} numberOfLines={2}>
          {exam.name}
        </Text>
        <Text style={[TEXT.labelMedium, styles.upNextMeta, { color: tone.on }]} numberOfLines={1}>
          {exam.credits} CFU · {days} day{days === 1 ? '' : 's'}
        </Text>
      </View>
    </SpringPressable>
  );
}

function QuickLinkTile({ link }) {
  return (
    <SpringPressable
      onPress={() => Linking.openURL(link.url)}
      haptic="selection"
      style={styles.iconTile}
      contentStyle={styles.iconTileContent}
      accessibilityLabel={`Open ${link.name}`}
    >
      <View style={styles.emojiTile}>
        <Text style={styles.emoji}>{link.icon}</Text>
      </View>
      <Text style={[TEXT.labelLarge, styles.iconTileLabel]} numberOfLines={2}>
        {link.name}
      </Text>
    </SpringPressable>
  );
}

function ModuleTile({ meta, count, onPress }) {
  const tone = MODULE_TONES[meta.id] || MODULE_TONES.home;
  const nav = NAV.find((n) => n.id === meta.id);
  const countLabel = `${count} ${count === 1 ? 'item' : 'items'}`;
  return (
    <SpringPressable
      onPress={onPress}
      haptic="selection"
      style={styles.moduleTile}
      contentStyle={styles.moduleTileContent}
      accessibilityLabel={`${meta.label}, ${countLabel}`}
    >
      <View style={styles.moduleArt}>
        <Blob preset={meta.blob} size={64} color={tone.container} />
        <View style={styles.centerOverlay} pointerEvents="none">
          <Icon name={nav?.icon || 'grid'} size={26} color={tone.on} />
        </View>
      </View>
      <Text style={[TEXT.labelLarge, styles.moduleLabel]} numberOfLines={1}>
        {meta.label}
      </Text>
      <Text style={[TEXT.labelSmall, styles.moduleCount]} numberOfLines={1}>
        {countLabel}
      </Text>
    </SpringPressable>
  );
}

export default function HomeScreen({
  exams, tasks, finances, heatmap, links,
  userName, course, isFirstUse, tipsShown, onDismissTip,
  onNavigate, onOpenModules, onOpenSettings, onOpenDevKit,
  onToggleTask, modules = {}, moduleCounts = {}, timerSec = 0,
}) {
  const on = (id) => modules[id] !== false;
  const today = todayKey();
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const go = (screenId) => { if (onNavigate) onNavigate(screenId); };

  // ── Focus data ───────────────────────────────────────────────────────
  const activeExams = exams
    .filter((e) => e.status === 'preparing' || e.status === 'to start')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextExam = activeExams[0];
  const { average } = calculateAverages(exams);

  const oneTimeTasks = tasks.filter((t) => !t.recurring);
  const completedTasks = oneTimeTasks.filter((t) => t.done).length;
  const totalTasks = oneTimeTasks.length;
  const incompleteTasks = oneTimeTasks.filter((t) => !t.done);
  const sortedIncomplete = [...incompleteTasks].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
  const homeTasks = sortedIncomplete.slice(0, HOME_TASKS_LIMIT);
  const remainingTasksCount = Math.max(0, incompleteTasks.length - homeTasks.length);
  const overdueCount = incompleteTasks.filter((t) => t.date && t.date < today).length;

  const currentBalance = finances.reduce((acc, f) => acc + f.amount, 0);
  const starredLinks = links.filter((l) => l.starred).slice(0, MAX_STARRED);
  const studyDays = Object.keys(heatmap).length;
  const studyHours = Math.round((timerSec / 3600) * 10) / 10;

  const focusItems = [];
  if (on('uni') && nextExam) {
    const days = Math.max(0, diffDays(nextExam.date));
    focusItems.push({
      key: 'exam',
      title: 'Next exam',
      subtitle: `${nextExam.name} · ${days} day${days === 1 ? '' : 's'}${average ? ` · avg ${average.toFixed(1)}` : ''}`,
      icon: 'graduation-cap',
      tone: MODULE_TONES.uni,
      onPress: () => go('uni'),
    });
  }
  if (on('journal') && totalTasks > 0) {
    focusItems.push({
      key: 'tasks',
      title: 'Tasks today',
      subtitle: `${completedTasks} of ${totalTasks} done`,
      icon: 'check-square',
      tone: MODULE_TONES.journal,
      onPress: () => go('journal'),
      accessory: (
        <WavyProgress
          variant="circular"
          progress={totalTasks ? completedTasks / totalTasks : 0}
          size={44}
          stroke={4}
          color={MODULE_TONES.journal.on}
          trackColor={alpha(MODULE_TONES.journal.on, 0.2)}
          animate={false}
          accessibilityLabel="Tasks completed"
        />
      ),
    });
  }
  if (on('finances') && finances.length > 0) {
    focusItems.push({
      key: 'balance',
      title: 'Balance',
      subtitle: `€${fmt(currentBalance)}`,
      icon: 'wallet',
      tone: MODULE_TONES.finances,
      onPress: () => go('finances'),
    });
  }
  if (studyDays > 0 || studyHours > 0) {
    focusItems.push({
      key: 'study',
      title: 'Study days',
      subtitle: `${studyDays} day${studyDays === 1 ? '' : 's'}${studyHours > 0 ? ` · ${studyHours}h` : ''} logged`,
      icon: 'bar-chart-3',
      tone: MODULE_TONES.stats,
      onPress: () => go('stats'),
    });
  }

  const tipToShow = isFirstUse ? TIPS.find((t) => !tipsShown.includes(t.id)) : null;

  return (
    <View style={styles.root}>
      <AppScrollView contentContainerStyle={styles.content}>

        {/* S1/S2 — search pill scrolls away; brand -> modules, avatar -> settings */}
        <SearchPill
          avatarLabel={userName || 'L'}
          onBrandPress={onOpenModules}
          onBrandLongPress={onOpenDevKit}
          onAvatarPress={onOpenSettings}
        />
        <View style={styles.infoRow}>
          <Text style={[TEXT.bodyMedium, styles.date]}>{dateLabel}</Text>
          {course ? <Chip label={course} /> : null}
        </View>

        {/* Focus hero pager — only cards that actually have data */}
        <Reveal index={0}>
          {focusItems.length > 0 ? (
            <HeroPager items={focusItems} style={styles.hero} />
          ) : (
            <EmptyState
              icon="sparkles"
              title="Nothing to focus on yet"
              body="Add an exam, a task or a transaction and it will show up here."
              tone={MODULE_TONES.home}
              action={(
                <CtaButton
                  label="Add a task"
                  variant="tonal"
                  onPress={() => go('journal')}
                />
              )}
            />
          )}
        </Reveal>

        {/* Smart banner — overdue tasks only */}
        {on('journal') && overdueCount > 0 ? (
          <Reveal index={1}>
            <SmartBanner count={overdueCount} onPress={() => go('journal')} />
          </Reveal>
        ) : null}

        {/* Up next — tall tonal exam cards */}
        {on('uni') ? (
          <Reveal index={2}>
            <SectionTitle
              title="Up next"
              subtitle="Your closest exams"
              onSeeAll={() => go('uni')}
            />
            {activeExams.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
              >
                {activeExams.slice(0, UP_NEXT_LIMIT).map((exam) => (
                  <UpNextCard key={exam.id} exam={exam} onPress={() => go('uni')} />
                ))}
              </ScrollView>
            ) : (
              <EmptyState
                icon="graduation-cap"
                title="No exams coming up"
                body="Add an exam in University to see it here."
                tone={MODULE_TONES.uni}
                action={(
                  <CtaButton
                    label="Open University"
                    variant="tonal"
                    onPress={() => go('uni')}
                  />
                )}
              />
            )}
          </Reveal>
        ) : null}

        {/* Tasks — grouped rows, the existing top-6 urgency logic */}
        {on('journal') ? (
          <Reveal index={3}>
            <SectionTitle title="Tasks" onSeeAll={() => go('journal')} />
            {homeTasks.length > 0 ? (
              <View style={styles.group}>
                {homeTasks.map((task, index) => {
                  const isOverdue = task.date && task.date < today;
                  const meta = [task.subject, task.date && task.date !== today ? task.date : null]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <GroupItem
                      key={task.id}
                      index={index}
                      count={homeTasks.length + (remainingTasksCount > 0 ? 1 : 0)}
                      leading={(
                        <TaskCheck
                          done={task.done}
                          label={task.done ? 'Mark task not done' : 'Mark task done'}
                          onPress={() => onToggleTask?.(task.id)}
                        />
                      )}
                      title={task.text}
                      secondary={meta || undefined}
                      status={isOverdue ? `Overdue · ${task.date}` : undefined}
                      statusIcon={isOverdue ? 'alert-circle' : undefined}
                      statusColor={isOverdue ? M3.error : undefined}
                      trailing={<Pill color={priorityTone(task.priority)}>{task.priority}</Pill>}
                      onPress={() => go('journal')}
                    />
                  );
                })}
                {remainingTasksCount > 0 ? (
                  <GroupItem
                    index={homeTasks.length}
                    count={homeTasks.length + 1}
                    icon="list"
                    tone={MODULE_TONES.journal}
                    title={`+${remainingTasksCount} more pending task${remainingTasksCount === 1 ? '' : 's'}`}
                    secondary="Open Tasks"
                    onPress={() => go('journal')}
                  />
                ) : null}
              </View>
            ) : (
              <Text style={[TEXT.bodyMedium, styles.emptyText]}>
                No pending tasks. You're clear!
              </Text>
            )}
          </Reveal>
        ) : null}

        {/* Quick links — icon-first tiles (the link icon is user emoji data) */}
        {on('links') ? (
          <Reveal index={4}>
            <SectionTitle title="Quick links" onSeeAll={() => go('links')} />
            {starredLinks.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
              >
                {starredLinks.map((link) => (
                  <QuickLinkTile key={link.id} link={link} />
                ))}
              </ScrollView>
            ) : (
              <Text style={[TEXT.bodyMedium, styles.emptyText]}>
                No starred links yet.
              </Text>
            )}
          </Reveal>
        ) : null}

        {/* Browse modules — the secondary modules live on their own screen */}
        <Reveal index={5}>
          <SectionTitle title="Browse modules" onSeeAll={onOpenModules} />
          <View style={styles.moduleGrid}>
            {MODULE_TILES.filter((m) => on(m.id)).map((meta) => (
              <ModuleTile
                key={meta.id}
                meta={meta}
                count={moduleCounts[meta.id] || 0}
                onPress={() => go(meta.id)}
              />
            ))}
          </View>
        </Reveal>

      </AppScrollView>

      <TipBubble
        visible={!!tipToShow}
        text={tipToShow?.text}
        onDismiss={() => onDismissTip?.(tipToShow?.id)}
        position="bottom"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.background },
  content: { paddingTop: 8 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  date: { color: M3.onSurfaceVariant },

  hero: { marginBottom: 4 },

  banner: { marginHorizontal: 16, marginBottom: 8 },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: SHAPE.xxl,
    backgroundColor: M3.surfaceContainerHigh,
  },
  bannerText: { flex: 1 },
  bannerTitle: { color: M3.onSurface },
  bannerBody: { color: M3.onSurfaceVariant, marginTop: 1 },
  bannerCta: {
    backgroundColor: M3.secondaryContainer,
    borderRadius: SHAPE.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  rail: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 10,
  },
  upNextCard: {
    width: 152,
    height: 222,
    borderRadius: SHAPE.xxxl,
    overflow: 'hidden',
  },
  upNextContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
  },
  upNextArt: {
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upNextMeta: { opacity: 0.7, marginTop: 2 },

  group: { paddingHorizontal: 16, gap: 2 },

  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: M3.outline,
    backgroundColor: 'transparent',
  },
  checkDone: {
    backgroundColor: MODULE_TONES.journal.on,
    borderColor: MODULE_TONES.journal.on,
  },
  checkContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  iconTile: { width: 84 },
  iconTileContent: { alignItems: 'center' },
  emojiTile: {
    width: 56,
    height: 56,
    borderRadius: SHAPE.lg,
    backgroundColor: M3.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  iconTileLabel: {
    color: M3.onSurface,
    textAlign: 'center',
    marginTop: 6,
  },

  moduleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  moduleTile: { width: 84, alignItems: 'center' },
  moduleTileContent: { alignItems: 'center' },
  moduleArt: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: {
    color: M3.onSurface,
    textAlign: 'center',
    marginTop: 6,
  },
  moduleCount: {
    color: M3.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 1,
  },

  emptyText: {
    color: M3.onSurfaceVariant,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
