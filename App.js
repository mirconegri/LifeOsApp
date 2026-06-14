import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, StatusBar, Modal, StyleSheet, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS }  from './src/config/colors';
import { NAV }     from './src/config/nav';
import {
  INIT_EXAMS, INIT_TASKS, INIT_HABITS, INIT_FINANZE,
  INIT_SPESA, INIT_NOTES, INIT_LINKS,
} from './src/data/seedData';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen       from './src/screens/HomeScreen';
import UniScreen        from './src/screens/UniScreen';
import StudioScreen     from './src/screens/StudioScreen';
import FinanzeScreen    from './src/screens/FinanzeScreen';
import HabitsScreen     from './src/screens/HabitsScreen';
import SpesaScreen      from './src/screens/SpesaScreen';
import NotesScreen      from './src/screens/NotesScreen';
import LinksScreen      from './src/screens/LinksScreen';
import StatsScreen      from './src/screens/StatsScreen';

// ─── Storage ─────────────────────────────────────────────────────────────────
const PREFIX = 'lifeos_';

async function loadJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

async function saveJSON(key, value) {
  try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); }
  catch (e) { console.warn('saveJSON error:', e); }
}

function usePersist(key, setter) {
  return (valOrFn) => {
    setter((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveJSON(key, next);
      return next;
    });
  };
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,      setScreen]      = useState('home');
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [ready,       setReady]       = useState(false);

  // ── Onboarding / user profile ──────────────────────────────────────────
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [userName,       setUserName]       = useState('');
  const [isFirstUse,     setIsFirstUse]     = useState(false);
  // Array of tip IDs the user has dismissed
  const [tipsShown,      setTipsShown]      = useState([]);

  // ── Data state ────────────────────────────────────────────────────────
  const [exams,   setExams]   = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [habits,  setHabits]  = useState([]);
  const [finanze, setFinanze] = useState([]);
  const [spesa,   setSpesa]   = useState([]);
  const [notes,   setNotes]   = useState([]);
  const [links,   setLinks]   = useState([]);
  const [heatmap, setHeatmap] = useState({});

  // ── Load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const profile = await loadJSON('profile', null);
      if (profile) {
        setOnboardingDone(true);
        setUserName(profile.nome || '');
        setIsFirstUse(profile.isFirstUse || false);
        setTipsShown(await loadJSON('tipsShown', []));
      }

      setExams(  await loadJSON('exams',   INIT_EXAMS));
      setTasks(  await loadJSON('tasks',   INIT_TASKS));
      setHabits( await loadJSON('habits',  INIT_HABITS));
      setFinanze(await loadJSON('finanze', INIT_FINANZE));
      setSpesa(  await loadJSON('spesa',   INIT_SPESA));
      setNotes(  await loadJSON('notes',   INIT_NOTES));
      setLinks(  await loadJSON('links',   INIT_LINKS));
      setHeatmap(await loadJSON('heatmap', {}));
      setReady(true);
    })();
  }, []);

  // ── Onboarding complete ────────────────────────────────────────────────
  const handleOnboardingComplete = async (profileData) => {
    const profile = { ...profileData, isFirstUse: true };
    await saveJSON('profile', profile);
    await saveJSON('tipsShown', []);
    setUserName(profileData.nome || '');
    setIsFirstUse(true);
    setTipsShown([]);
    setOnboardingDone(true);
  };

  // ── Dismiss tip ───────────────────────────────────────────────────────
  const handleDismissTip = (tipId) => {
    const updated = [...tipsShown, tipId];
    setTipsShown(updated);
    saveJSON('tipsShown', updated);
  };

  // ── Persisted setters ──────────────────────────────────────────────────
  const pExams   = usePersist('exams',   setExams);
  const pTasks   = usePersist('tasks',   setTasks);
  const pHabits  = usePersist('habits',  setHabits);
  const pFinanze = usePersist('finanze', setFinanze);
  const pSpesa   = usePersist('spesa',   setSpesa);
  const pNotes   = usePersist('notes',   setNotes);
  const pLinks   = usePersist('links',   setLinks);

  // ── Screen map ─────────────────────────────────────────────────────────
  const SCREENS = {
    home: (
      <HomeScreen
        exams={exams} tasks={tasks} habits={habits}
        finanze={finanze} heatmap={heatmap} links={links}
        userName={userName}
        isFirstUse={isFirstUse}
        tipsShown={tipsShown}
        onDismissTip={handleDismissTip}
      />
    ),
    uni:     <UniScreen     exams={exams}     setExams={pExams}       />,
    studio:  <StudioScreen  tasks={tasks}     setTasks={pTasks}       />,
    finanze: <FinanzeScreen finanze={finanze} setFinanze={pFinanze}   />,
    habits:  <HabitsScreen  habits={habits}   setHabits={pHabits}     />,
    spesa:   <SpesaScreen   spesa={spesa}     setSpesa={pSpesa}       />,
    notes:   <NotesScreen   notes={notes}     setNotes={pNotes}       />,
    links:   <LinksScreen   links={links}     setLinks={pLinks}       />,
    stats:   <StatsScreen
               exams={exams} tasks={tasks} habits={habits}
               heatmap={heatmap}
             />,
  };

  const bottomNavItems = NAV.filter(n => n.bottomNav);
  const currentNav     = NAV.find(n => n.id === screen);

  // ── Guards ─────────────────────────────────────────────────────────────
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      </View>
    );
  }

  if (!onboardingDone) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Top Bar ── */}
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

      {/* ── Drawer ── */}
      <Modal visible={drawerOpen} animationType="fade" transparent>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.logo}>
                <Text style={{ color: COLORS.accent }}>Life</Text>OS
              </Text>
              <Text style={styles.drawerUser}>{userName ? `Ciao, ${userName}` : 'Personal Life OS'}</Text>
            </View>
            <ScrollView>
              {NAV.map(n => (
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
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>

      {/* ── Content ── */}
      <View style={styles.content}>{SCREENS[screen]}</View>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        {bottomNavItems.map(n => {
          const active = screen === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              onPress={() => setScreen(n.id)}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomNavIconWrap, active && styles.bottomNavIconWrapActive]}>
                <Text style={[styles.bottomNavIcon, active && styles.bottomNavIconActive]}>
                  {n.icon}
                </Text>
              </View>
              <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}>
                {n.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 52,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  menuBtn:     { padding: 8 },
  menuIcon:    { fontSize: 20, color: COLORS.textMuted },
  logo:        { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  screenLabel: { fontSize: 13, color: COLORS.textMuted },

  // Drawer
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: {
    width: 240, backgroundColor: COLORS.bg2,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  drawerHeader: {
    padding: 20, paddingTop: 28,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  drawerUser:  { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  drawerItemActive: { backgroundColor: COLORS.accentGlow, borderLeftColor: COLORS.accent },
  drawerLabel:      { fontSize: 14, color: COLORS.textMuted, marginLeft: 14 },
  drawerLabelActive:{ color: COLORS.accent, fontWeight: '600' },

  content: { flex: 1 },

  // Bottom nav — improved visibility
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg2,
  },
  bottomNavItem: { alignItems: 'center', flex: 1 },
  bottomNavIconWrap: {
    width: 36, height: 28, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  bottomNavIconWrapActive: {
    backgroundColor: COLORS.accentGlow,
  },
  bottomNavIcon: { fontSize: 20, opacity: 0.35 },
  bottomNavIconActive: { opacity: 1 },
  bottomNavLabel:      { fontSize: 10, color: COLORS.textSub, marginTop: 3 },
  bottomNavLabelActive:{ color: COLORS.accent, fontWeight: '600' },
});