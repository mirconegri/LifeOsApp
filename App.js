// App.js — LifeOS root component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Pressable,
  ScrollView, StatusBar, Modal, StyleSheet, Platform,
  Animated, Easing, BackHandler,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { COLORS } from './src/config/colors';
import { Icon } from './src/components/Icon';
import { TYPE } from './src/config/designSystem';
import { NAV } from './src/config/nav';
import { MODULES, DEFAULT_MODULES, normalizeModules } from './src/config/modules';
import { todayKey } from './src/data/helpers';
import { loadJSON, saveJSON } from './src/data/storage';
import { FadeSlideIn } from './src/components/FadeSlideIn';
import { DevKit } from './src/ui/DevKit';
import {
  INIT_EXAMS, INIT_FINANCES,
  INIT_GROCERIES, INIT_GOALS, INIT_NOTES, INIT_LINKS, INIT_JOURNAL,
} from './src/data/seedData';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen       from './src/screens/HomeScreen';
import UniScreen        from './src/screens/UniScreen';
import FinancesScreen   from './src/screens/FinancesScreen';
import StatsScreen      from './src/screens/StatsScreen';
import GroceriesScreen  from './src/screens/GroceriesScreen';
import GoalsScreen      from './src/screens/GoalsScreen';
import NotesScreen      from './src/screens/NotesScreen';
import LinksScreen      from './src/screens/LinksScreen';
import JournalScreen    from './src/screens/JournalScreen';
import SettingsScreen   from './src/screens/SettingsScreen';

const DRAWER_WIDTH = 240;

function usePersist(key, setter) {
  return (valOrFn) => {
    setter((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveJSON(key, next);
      return next;
    });
  };
}

// SafeAreaProvider must wrap everything so useSafeAreaInsets() inside
// AppContent (and inside GlassSheet, etc.) gets real device insets.
// Previously SafeAreaView from 'react-native' was the root, which on
// Android only accounts for the status bar — it does NOT account for the
// 3-button / gesture navigation bar at the bottom. With React Native 0.81
// and newArchEnabled the app draws edge-to-edge, so the bottom nav bar
// was visually on top of the app's own bottom tab strip.
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  // insets.top  = status bar height (Android) / notch (iOS)
  // insets.bottom = system nav bar height (Android 3-button/gesture) / home indicator (iOS)
  const insets = useSafeAreaInsets();

  // Fonts are loaded before the first frame. The storage `ready` gate below
  // is reused for this, so there is never a flash of the system font.
  // If the font module fails (unexpected asset error), `fontError` lets the
  // app render anyway instead of hanging on the blank gate forever.
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const [screen, setScreen]         = useState('home');
  const [ready, setReady]           = useState(false);
  const [isFirstUse, setIsFirstUse] = useState(false);

  // Global Data State
  const [userName,     setUserName]     = useState('');
  const [course,       setCourse]       = useState('');
  const [totalCredits, setTotalCredits] = useState(180);
  const [tipsShown,    setTipsShown]    = useState([]);
  const [exams,        setExams]        = useState([]);
  const [finances,     setFinances]     = useState([]);
  const [groceries,    setGroceries]    = useState([]);
  const [goals,        setGoals]        = useState([]);
  const [notes,        setNotes]        = useState([]);
  const [journal,      setJournal]      = useState([]);
  const [links,        setLinks]        = useState([]);
  const [heatmap,      setHeatmap]      = useState({});
  const [loggedSeconds, setLogged]      = useState(0);

  // Global Timer State
  const [timerRunning,  setTimerRunning]  = useState(false);
  const [timerSec,      setTimerSec]      = useState(0);
  const [timerSubject,  setTimerSubject]  = useState('');
  const timerRef = useRef(null);

  const [drawerMounted, setDrawerMounted] = useState(false);
  const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Settings is a modal, not a route: it is a leaf reachable from the
  // drawer and is never a navigation destination of its own.
  const [settingsVisible, setSettingsVisible] = useState(false);
  // Dev-only primitive gallery. Long-press the wordmark (the trigger moves to
  // the search-pill brand mark when the shell lands in Phase 2).
  const [devKitVisible, setDevKitVisible] = useState(false);
  // One switch per optional section. Home and Stats are not in here: they
  // are the frame, and they stay reachable whatever the user turns off.
  const [modules, setModules] = useState(DEFAULT_MODULES);

  const openDrawer = () => {
    setDrawerMounted(true);
    drawerX.setValue(-DRAWER_WIDTH);
    requestAnimationFrame(() => {
      Animated.timing(drawerX, {
        toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    });
  };
  const closeDrawer = () => {
    Animated.timing(drawerX, {
      toValue: -DRAWER_WIDTH, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true,
    }).start(() => setDrawerMounted(false));
  };

  const screenHistoryRef = useRef([]);

  const goToScreen = (id) => {
    if (id === screen) return;
    screenHistoryRef.current.push(screen);
    setScreen(id);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (drawerMounted) {
        closeDrawer();
        return true;
      }
      if (screenHistoryRef.current.length > 0) {
        const prev = screenHistoryRef.current.pop();
        setScreen(prev);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerMounted]);

  // Reads every key back into state. Runs on mount and again after an import
  // or a full wipe, so the UI never has to be restarted to show new data.
  const loadAllData = useCallback(async () => {
    const isFirst = await loadJSON('isFirstUse', true);
    setIsFirstUse(isFirst);
    setUserName(     await loadJSON('userName',      ''));
    setCourse(       await loadJSON('course',        ''));
    setTotalCredits( await loadJSON('totalCredits',  180));
    setTipsShown(    await loadJSON('tipsShown',     []));
    setExams(        await loadJSON('exams',         INIT_EXAMS));
    setFinances(     await loadJSON('finances',      INIT_FINANCES));
    setGroceries(    await loadJSON('groceries',     INIT_GROCERIES));
    setGoals(        await loadJSON('goals',         INIT_GOALS));
    setNotes(        await loadJSON('notes',         INIT_NOTES));
    setLinks(        await loadJSON('links',         INIT_LINKS));
    setHeatmap(      await loadJSON('heatmap',       {}));
    setLogged(       await loadJSON('loggedSeconds', 0));
    // First launch after this version: the old single University flag
    // becomes the university module, everything else starts on.
    const savedModules = await loadJSON('modules', null);
    if (savedModules) {
      setModules(normalizeModules(savedModules));
    } else {
      const migrated = { ...DEFAULT_MODULES, uni: await loadJSON('universityEnabled', true) };
      setModules(migrated);
      saveJSON('modules', migrated);
    }

    let loadedJournal = await loadJSON('journal', INIT_JOURNAL);

    const habitsMigrated = await loadJSON('habitsMigrated', false);
    if (!habitsMigrated) {
      const oldHabits = await loadJSON('habits', []);
      if (oldHabits.length > 0) {
        const existingIds = new Set(loadedJournal.map(j => j.id));
        let nextId = Math.max(0, ...loadedJournal.map(j => j.id || 0), ...oldHabits.map(h => h.id || 0)) + 1;
        const migrated = oldHabits.map(h => ({
          id: existingIds.has(h.id) ? nextId++ : h.id,
          text: h.name,
          icon: h.icon || '🌟',
          recurring: true,
          history: h.history || {},
          streak: h.streak || 0,
          date: null,
          priority: 'medium',
          done: false,
        }));
        loadedJournal = [...loadedJournal, ...migrated];
        saveJSON('journal', loadedJournal);
      }
      saveJSON('habitsMigrated', true);
    }
    setJournal(loadedJournal);

    setReady(true);
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const toggleTimer = () => {
    if (timerRunning) {
      const key = todayKey();
      const hrs = timerSec / 3600;
      const newHeatmap = {
        ...heatmap,
        [key]: Math.round(((heatmap[key] || 0) + hrs) * 10) / 10,
      };
      setHeatmap(newHeatmap);
      saveJSON('heatmap', newHeatmap);

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

  const handleOnboardingComplete = (data) => {
    setUserName(data.name);
    setCourse(data.course);
    setTotalCredits(data.totalCredits);
    saveJSON('userName', data.name);
    saveJSON('course', data.course);
    saveJSON('totalCredits', data.totalCredits);
    setIsFirstUse(false);
    saveJSON('isFirstUse', false);
  };

  const dismissTip = (tipId) => {
    const updated = [...tipsShown, tipId];
    setTipsShown(updated);
    saveJSON('tipsShown', updated);
  };

  // Only the flags are persisted: switching a module off never touches the
  // data it owns, so switching it back on restores everything as it was.
  const toggleModule = (id, enabled) => {
    setModules((prev) => {
      const next = { ...prev, [id]: enabled };
      saveJSON('modules', next);
      return next;
    });
  };

  // Switching a module off while its screen is open would leave the app
  // rendering a tab that no longer exists — fall back to Home.
  useEffect(() => {
    if (modules[screen] === false) setScreen('home');
  }, [modules, screen]);

  const pExams      = usePersist('exams',      setExams);
  const pFinances   = usePersist('finances',   setFinances);
  const pGroceries  = usePersist('groceries',  setGroceries);
  const pGoals      = usePersist('goals',      setGoals);
  const pNotes      = usePersist('notes',      setNotes);
  const pJournal    = usePersist('journal',    setJournal);
  const pLinks      = usePersist('links',      setLinks);

  const timerProps = {
    timerSec:       loggedSeconds + timerSec,
    timerRunning,
    timerSubject,
    onTimerToggle:  toggleTimer,
    onTimerReset:   resetTimer,
    onTimerSubject: setTimerSubject,
  };

  const navigateTo = (screenId) => goToScreen(screenId);

  const navScalesRef = useRef({});
  const getNavScale = (id) => {
    if (!navScalesRef.current[id]) navScalesRef.current[id] = new Animated.Value(1);
    return navScalesRef.current[id];
  };
  useEffect(() => {
    const scale = getNavScale(screen);
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.25, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  if (!ready || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      </View>
    );
  }

  if (isFirstUse) {
    return (
      <OnboardingScreen onComplete={handleOnboardingComplete} />
    );
  }

  const SCREENS = {
    home: (
      <HomeScreen
        exams={exams} tasks={journal}
        finances={finances} heatmap={heatmap} links={links}
        userName={userName} course={course} isFirstUse={isFirstUse}
        tipsShown={tipsShown} onDismissTip={dismissTip}
        onNavigate={navigateTo} modules={modules}
        {...timerProps}
      />
    ),
    uni:       <UniScreen       exams={exams}         setExams={pExams} totalCredits={totalCredits} />,
    finances:  <FinancesScreen  finances={finances}   setFinances={pFinances}  />,
    groceries: <GroceriesScreen groceries={groceries} setGroceries={pGroceries} />,
    goals:     <GoalsScreen     goals={goals}         setGoals={pGoals}        />,
    notes:     <NotesScreen     notes={notes}         setNotes={pNotes}        />,
    links:     <LinksScreen     links={links}         setLinks={pLinks}        />,
    journal:   <JournalScreen   journal={journal}     setJournal={pJournal}    />,
    stats:     <StatsScreen
                 exams={exams} journal={journal} heatmap={heatmap}
                 finances={finances} modules={modules}
                 loggedSeconds={loggedSeconds + timerSec}
               />,
  };

  // One place decides which sections are reachable; the drawer and the
  // bottom tab strip both read from it. Home and Stats are never in MODULES,
  // so they always survive the filter.
  const visibleNav     = NAV.filter((n) => modules[n.id] !== false);
  const bottomNavItems = visibleNav.filter((n) => n.bottomNav);
  // A single tab is not a tab strip: the drawer still reaches everything.
  const showBottomNav  = bottomNavItems.length > 1;
  const currentNav     = NAV.find((n) => n.id === screen);

  // Counts shown in the switch-off confirmation, so the user can see how
  // much data is being hidden before agreeing to it.
  const moduleData = { uni: exams, journal, finances, groceries, goals, notes, links };
  const moduleCounts = MODULES.reduce((acc, m) => {
    acc[m.id] = (moduleData[m.id] || []).length;
    return acc;
  }, {});

  return (
    // Plain View instead of SafeAreaView: we manage insets explicitly via
    // useSafeAreaInsets so we can apply them per-region (top bar, bottom
    // nav, drawer header) rather than padding the entire root uniformly.
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuBtn}>
          <Icon name="menu" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Pressable
          onLongPress={__DEV__ ? () => setDevKitVisible(true) : undefined}
          delayLongPress={400}
          accessibilityLabel="LifeOS"
        >
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.accent }}>Life</Text>OS
          </Text>
        </Pressable>
        <Text style={styles.screenLabel}>
          <Icon name={currentNav?.icon} size={16} color={COLORS.textMuted} /> {currentNav?.label}
        </Text>
      </View>

      {/* ── Drawer ── */}
      <Modal visible={drawerMounted} animationType="none" transparent onRequestClose={closeDrawer}>
        <View style={styles.drawerOverlay}>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
            {/* paddingTop uses insets.top (replaces the old StatusBar.currentHeight
                hack) so the header clears the status bar on all devices/platforms. */}
            <View style={[styles.drawerHeader, { paddingTop: 16 + insets.top }]}>
              <Text style={styles.logo}>
                <Text style={{ color: COLORS.accent }}>Life</Text>OS
              </Text>
              <Text style={styles.drawerSubtitle}>Personal Life OS</Text>
            </View>
            <ScrollView>
              {visibleNav.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => { goToScreen(n.id); closeDrawer(); }}
                  style={[styles.drawerItem, screen === n.id && styles.drawerItemActive]}
                >
                  <Icon name={n.icon} size={18} color={COLORS.text} />
                  <Text style={[styles.drawerLabel, screen === n.id && styles.drawerLabelActive]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.drawerSeparator} />

              <TouchableOpacity
                onPress={() => { setSettingsVisible(true); closeDrawer(); }}
                style={styles.drawerItem}
              >
                <Icon name="settings" size={18} color={COLORS.text} />
                <Text style={styles.drawerLabel}>Settings</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} />
        </View>
      </Modal>

      {/* ── Main Content ── */}
      <View style={styles.content}>
        <FadeSlideIn key={screen} style={{ flex: 1 }}>
          {SCREENS[screen]}
        </FadeSlideIn>
      </View>

      {/* ── Bottom Nav ──
          paddingBottom = insets.bottom (system nav bar / home indicator) + 8
          base visual padding. Without this, on Android with 3-button nav
          (e.g. Galaxy A34) the tab strip renders behind the system buttons. */}
      {showBottomNav && <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {bottomNavItems.map((n) => (
          <TouchableOpacity
            key={n.id}
            onPress={() => goToScreen(n.id)}
            style={styles.bottomNavItem}
          >
            <View style={[styles.bottomNavIconWrap, screen === n.id && styles.bottomNavIconWrapActive]}>
              <Animated.View
                style={[
                  styles.bottomNavIcon,
                  screen === n.id && styles.bottomNavIconActive,
                  { transform: [{ scale: getNavScale(n.id) }] },
                ]}
              >
                <Icon name={n.icon} size={20} color={COLORS.textMuted} />
              </Animated.View>
            </View>
            <Text style={[styles.bottomNavLabel, screen === n.id && styles.bottomNavLabelActive]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>}

      <SettingsScreen
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        modules={modules}
        moduleCounts={moduleCounts}
        onToggleModule={toggleModule}
        onDataChanged={loadAllData}
      />

      <DevKit
        visible={devKitVisible}
        onClose={() => setDevKitVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    // paddingTop removed — applied inline as insets.top so it adapts to
    // every device (Android status bar, iOS notch/dynamic island, etc.)
    // instead of relying on the platform-conditional StatusBar.currentHeight.
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 52,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg2, // slight depth separation from content
  },
  menuBtn: { padding: 8 },
  logo: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  screenLabel: { fontSize: 13, color: COLORS.textMuted },

  drawerOverlay: {
    flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: COLORS.bg2,
    borderRightWidth: 1, borderRightColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    padding: 16,
    // paddingTop removed — applied inline as 16 + insets.top so the
    // drawer header clears the status bar on both platforms without the
    // old iOS/Android conditional and the undefined-on-iOS caveat.
    borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 8,
  },
  drawerSubtitle: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  drawerItemActive: { backgroundColor: COLORS.accentGlow, borderLeftColor: COLORS.accent },
  drawerLabel:      { fontSize: 14, color: COLORS.textMuted, marginLeft: 14 },
  drawerLabelActive:{ color: COLORS.accent, fontWeight: '600' },
  drawerSeparator:  { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },

  content: { flex: 1 },

  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 8,
    // paddingBottom removed — applied inline as insets.bottom + 8 so the
    // tab strip never hides under Android's 3-button or gesture bar.
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
  bottomNavIcon: { opacity: 0.35 },
  bottomNavIconActive: { opacity: 1 },
  bottomNavLabel: { fontSize: TYPE.meta, color: COLORS.textSub, marginTop: 4 },
  bottomNavLabelActive: { color: COLORS.accent, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: COLORS.accent, paddingBottom: 2 },
});
