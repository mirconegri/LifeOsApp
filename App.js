// App.js — LifeOS root component
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, StatusBar, Modal, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from './src/config/colors';
import { NAV } from './src/config/nav';
import { todayKey } from './src/data/helpers';
import {
  INIT_EXAMS, INIT_TASKS, INIT_HABITS, INIT_FINANCES,
  INIT_GROCERIES, INIT_GOALS, INIT_NOTES, INIT_LINKS,
} from './src/data/seedData';

// Screens
import HomeScreen      from './src/screens/HomeScreen';
import UniScreen       from './src/screens/UniScreen';
import StudyScreen     from './src/screens/StudyScreen';
import FinancesScreen  from './src/screens/FinancesScreen';
import HabitsScreen    from './src/screens/HabitsScreen';
import GroceriesScreen from './src/screens/GroceriesScreen';
import GoalsScreen     from './src/screens/GoalsScreen';
import NotesScreen     from './src/screens/NotesScreen';
import LinksScreen     from './src/screens/LinksScreen';
import JournalScreen   from './src/screens/JournalScreen';
import StatsScreen     from './src/screens/StatsScreen';

// ─── Storage helpers ───────────────────────────────────────────────────────────
const PREFIX = 'lifeos_';

// Fetches data from AsyncStorage, parsing it safely and returning a fallback if missing
async function loadJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Persists a given value into AsyncStorage as a JSON string
async function saveJSON(key, value) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('saveJSON error:', e);
  }
}

// ─── Persist helper ────────────────────────────────────────────────────────────
// Custom hook pattern to update React state AND save to AsyncStorage automatically
function usePersist(key, setter) {
  return (valOrFn) => {
    setter((prev) => {
      // Handles both direct value updates and functional updates
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveJSON(key, next);
      return next;
    });
  };
}

// ─── App Root Component ────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]         = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setReady]           = useState(false);

  // Global Data State
  const [exams,        setExams]        = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [habits,       setHabits]       = useState([]);
  const [finances,     setFinances]     = useState([]);
  const [groceries,    setGroceries]    = useState([]);
  const [goals,        setGoals]        = useState([]);
  const [notes,        setNotes]        = useState([]);
  const [journal,      setJournal]      = useState([]);
  const [links,        setLinks]        = useState([]);
  const [heatmap,      setHeatmap]      = useState({});
  const [loggedSeconds, setLogged]      = useState(0);

  // Global Timer State (for Study Sessions)
  const [timerRunning,  setTimerRunning]  = useState(false);
  const [timerSec,      setTimerSec]      = useState(0);
  const [timerSubject,  setTimerSubject]  = useState('');
  const timerRef = useRef(null);

  // ── Load data on mount ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setExams(        await loadJSON('exams',         INIT_EXAMS));
      setTasks(        await loadJSON('tasks',         INIT_TASKS));
      setHabits(       await loadJSON('habits',        INIT_HABITS));
      setFinances(     await loadJSON('finances',      INIT_FINANCES));
      setGroceries(    await loadJSON('groceries',     INIT_GROCERIES));
      setGoals(        await loadJSON('goals',         INIT_GOALS));
      setNotes(        await loadJSON('notes',         INIT_NOTES));
      setJournal(      await loadJSON('journal',       []));
      setLinks(        await loadJSON('links',         INIT_LINKS));
      setHeatmap(      await loadJSON('heatmap',       {}));
      setLogged(       await loadJSON('loggedSeconds', 0));
      setReady(true);
    })();
  }, []);

  // ── Timer ticker logic ──────────────────────────────────────────────────
  // Runs a standard Javascript interval when the timer is toggled on
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  // ── Timer actions ───────────────────────────────────────────────────────
  const toggleTimer = () => {
    if (timerRunning) {
      // Logic to save the logged hours into the heatmap map upon stopping
      const key = todayKey();
      const hrs = timerSec / 3600;
      const newHeatmap = {
        ...heatmap,
        [key]: Math.round(((heatmap[key] || 0) + hrs) * 10) / 10,
      };
      setHeatmap(newHeatmap);
      saveJSON('heatmap', newHeatmap);

      // Cumulate total logged time
      const newLogged = loggedSeconds + timerSec;
      setLogged(newLogged);
      saveJSON('loggedSeconds', newLogged);

      setTimerSec(0);
    }
    setTimerRunning((r) => !r);
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerSec(0);
  };

  // ── Persisted setters ───────────────────────────────────────────────────
  const pExams      = usePersist('exams',      setExams);
  const pTasks      = usePersist('tasks',      setTasks);
  const pHabits     = usePersist('habits',     setHabits);
  const pFinances   = usePersist('finances',   setFinances);
  const pGroceries  = usePersist('groceries',  setGroceries);
  const pGoals      = usePersist('goals',      setGoals);
  const pNotes      = usePersist('notes',      setNotes);
  const pJournal    = usePersist('journal',    setJournal);
  const pLinks      = usePersist('links',      setLinks);

  // ── Shared timer props mapped for sub-screens ─────────────────────────
  const timerProps = {
    timerSec:       loggedSeconds + timerSec,
    timerRunning,
    timerSubject,
    onTimerToggle:  toggleTimer,
    onTimerReset:   resetTimer,
    onTimerSubject: setTimerSubject,
  };

  // ── Screen mapping ──────────────────────────────────────────────────────
  const SCREENS = {
    home: (
      <HomeScreen
        exams={exams} tasks={tasks} habits={habits}
        finances={finances} heatmap={heatmap}
        {...timerProps}
      />
    ),
    uni:       <UniScreen       exams={exams}         setExams={pExams}        />,
    study:     <StudyScreen     tasks={tasks}         setTasks={pTasks}        {...timerProps} />,
    finances:  <FinancesScreen  finances={finances}   setFinances={pFinances}  />,
    habits:    <HabitsScreen    habits={habits}       setHabits={pHabits}      />,
    groceries: <GroceriesScreen groceries={groceries} setGroceries={pGroceries} />,
    goals:     <GoalsScreen     goals={goals}         setGoals={pGoals}        />,
    notes:     <NotesScreen     notes={notes}         setNotes={pNotes}        />,
    links:     <LinksScreen     links={links}         setLinks={pLinks}        />,
    journal:   <JournalScreen   journal={journal}     setJournal={pJournal}    />,
    stats:     <StatsScreen
                 exams={exams} tasks={tasks} habits={habits}
                 journal={journal} heatmap={heatmap}
                 loggedSeconds={loggedSeconds + timerSec}
               />,
  };

  const bottomNavItems = NAV.filter((n) => n.bottomNav);
  const currentNav     = NAV.find((n) => n.id === screen);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Top Bar ───────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>
          <Text style={{ color: COLORS.accent }}>Life</Text>OS
        </Text>
        <Text style={styles.screenLabel}>
          {currentNav?.icon} {currentNav?.label}
        </Text>
      </View>

      {/* ── Drawer Navigation ──────────────────────────────────────────── */}
      <Modal visible={drawerOpen} animationType="fade" transparent>
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.logo}>
                <Text style={{ color: COLORS.accent }}>Life</Text>OS
              </Text>
              <Text style={styles.drawerSubtitle}>Personal Life OS</Text>
            </View>
            <ScrollView>
              {NAV.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => { setScreen(n.id); setDrawerOpen(false); }}
                  style={[styles.drawerItem, screen === n.id && styles.drawerItemActive]}
                >
                  <Text style={{ fontSize: 18 }}>{n.icon}</Text>
                  <Text style={[styles.drawerLabel, screen === n.id && styles.drawerLabelActive]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <View style={styles.content}>{SCREENS[screen]}</View>

      {/* ── Bottom Navigation ─────────────────────────────────────────── */}
      <View style={styles.bottomNav}>
        {bottomNavItems.map((n) => (
          <TouchableOpacity
            key={n.id}
            onPress={() => setScreen(n.id)}
            style={styles.bottomNavItem}
          >
            <Text style={{ fontSize: 22, opacity: screen === n.id ? 1 : 0.35 }}>
              {n.icon}
            </Text>
            <Text style={[styles.bottomNavLabel, screen === n.id && styles.bottomNavLabelActive]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 52,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  menuBtn: { padding: 8 },
  menuIcon: { fontSize: 20, color: COLORS.textMuted },
  logo: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  screenLabel: { fontSize: 13, color: COLORS.textMuted },

  drawerOverlay: {
    flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    width: 240, backgroundColor: COLORS.bg2,
    borderLeftWidth: 1, borderLeftColor: COLORS.border,
  },
  drawerHeader: {
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 8,
  },
  drawerSubtitle: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 16,
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  drawerItemActive: { backgroundColor: COLORS.accentGlow, borderLeftColor: COLORS.accent },
  drawerLabel: { fontSize: 13, color: COLORS.textMuted, marginLeft: 12 },
  drawerLabelActive: { color: COLORS.accent, fontWeight: '600' },

  content: { flex: 1 },

  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 10, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  bottomNavItem: { alignItems: 'center', flex: 1 },
  bottomNavLabel: { fontSize: 10, color: COLORS.textSub, marginTop: 3 },
  bottomNavLabelActive: { color: COLORS.accent, fontWeight: '600' },
});