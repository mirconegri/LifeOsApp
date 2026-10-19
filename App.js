// App.js — LifeOS root component
//
// Shell: a single flat surface. There is no top bar and no drawer anymore;
// every screen scrolls inside an AppScrollView that reserves the top safe
// area and the floating nav's height, and the nav itself is a sibling of the
// content that positions itself absolutely. Screen state, history and the
// BackHandler contract are unchanged from the pre-redesign shell.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StatusBar, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { COLORS } from './src/config/colors';
import { NAV } from './src/config/nav';
import { MODULES, DEFAULT_MODULES, normalizeModules } from './src/config/modules';
import { todayKey } from './src/data/helpers';
import { loadJSON, saveJSON } from './src/data/storage';
import { FadeSlideIn } from './src/components/FadeSlideIn';
import { ScrollProvider } from './src/ui/scrollState';
import { FloatingNav } from './src/ui/FloatingNav';
import { DevKit } from './src/ui/DevKit';
import {
  INIT_EXAMS, INIT_FINANCES,
  INIT_GROCERIES, INIT_GOALS, INIT_NOTES, INIT_LINKS, INIT_JOURNAL,
} from './src/data/seedData';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen       from './src/screens/HomeScreen';
import ModulesScreen    from './src/screens/ModulesScreen';
import UniScreen        from './src/screens/UniScreen';
import FinancesScreen   from './src/screens/FinancesScreen';
import StatsScreen      from './src/screens/StatsScreen';
import GroceriesScreen  from './src/screens/GroceriesScreen';
import GoalsScreen      from './src/screens/GoalsScreen';
import NotesScreen      from './src/screens/NotesScreen';
import LinksScreen      from './src/screens/LinksScreen';
import JournalScreen    from './src/screens/JournalScreen';
import SettingsScreen   from './src/screens/SettingsScreen';

function usePersist(key, setter) {
  return (valOrFn) => {
    setter((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveJSON(key, next);
      return next;
    });
  };
}

// SafeAreaProvider must wrap everything so every useSafeAreaInsets() gets real
// device insets. ScrollProvider owns the shell's scroll/nav shared values; it
// must sit above AppContent so AppScrollView and FloatingNav share one pair.
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ScrollProvider>
          <AppContent />
        </ScrollProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
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

  // Settings and the dev kit are modals, not routes: they are leaves with no
  // navigation destination of their own.
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [devKitVisible, setDevKitVisible] = useState(false);

  // One switch per optional section. Home and Stats are not in here: they
  // are the frame, and they stay reachable whatever the user turns off.
  // Named `enabledModules` so it cannot be confused with the `modules`
  // screen id (which is deliberately not a NAV entry).
  const [enabledModules, setEnabledModules] = useState(DEFAULT_MODULES);

  const screenHistoryRef = useRef([]);

  const goToScreen = (id) => {
    if (id === screen) return;
    screenHistoryRef.current.push(screen);
    setScreen(id);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (screenHistoryRef.current.length > 0) {
        const prev = screenHistoryRef.current.pop();
        setScreen(prev);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

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
      setEnabledModules(normalizeModules(savedModules));
    } else {
      const migrated = { ...DEFAULT_MODULES, uni: await loadJSON('universityEnabled', true) };
      setEnabledModules(migrated);
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
    setEnabledModules((prev) => {
      const next = { ...prev, [id]: enabled };
      saveJSON('modules', next);
      return next;
    });
  };

  // Switching a module off while its screen is open would leave the app
  // rendering a tab that no longer exists — fall back to Home. The `modules`
  // screen is not a module id, so it is intentionally unaffected.
  useEffect(() => {
    if (enabledModules[screen] === false) setScreen('home');
  }, [enabledModules, screen]);

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
  const openSettings = () => setSettingsVisible(true);
  const openDevKit = __DEV__ ? () => setDevKitVisible(true) : undefined;
  const toggleTask = (id) => pJournal((prev) => prev.map(
    (t) => (t.id === id ? { ...t, done: !t.done } : t),
  ));

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

  // Counts shown on Home's module grid and in the switch-off confirmation,
  // so the user can see how much data is being hidden before agreeing to it.
  const moduleData = { uni: exams, journal, finances, groceries, goals, notes, links };
  const moduleCounts = MODULES.reduce((acc, m) => {
    acc[m.id] = (moduleData[m.id] || []).length;
    return acc;
  }, {});

  const SCREENS = {
    home: (
      <HomeScreen
        exams={exams} tasks={journal}
        finances={finances} heatmap={heatmap} links={links}
        userName={userName} course={course} isFirstUse={isFirstUse}
        tipsShown={tipsShown} onDismissTip={dismissTip}
        onNavigate={navigateTo} modules={enabledModules}
        moduleCounts={moduleCounts}
        onToggleTask={toggleTask}
        onOpenModules={() => goToScreen('modules')}
        onOpenSettings={openSettings}
        onOpenDevKit={openDevKit}
        {...timerProps}
      />
    ),
    modules: (
      <ModulesScreen
        modules={enabledModules}
        moduleCounts={moduleCounts}
        onNavigate={navigateTo}
        onOpenSettings={openSettings}
        onOpenDevKit={openDevKit}
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
                 finances={finances} modules={enabledModules}
                 loggedSeconds={loggedSeconds + timerSec}
               />,
  };

  // The floating nav only shows the primary destinations; secondary modules
  // live on the `modules` screen. Home and Stats are never in MODULES, so at
  // least two items always survive the filter.
  const bottomNavItems = NAV.filter(
    (n) => n.bottomNav && enabledModules[n.id] !== false,
  );
  const showBottomNav = bottomNavItems.length > 1;

  const pendingTasks = journal.filter((t) => !t.done && !t.recurring).length;
  const navBadges = pendingTasks > 0 ? { journal: pendingTasks } : {};

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.content}>
        <FadeSlideIn key={screen} style={{ flex: 1 }}>
          {SCREENS[screen]}
        </FadeSlideIn>
      </View>

      {showBottomNav && (
        <FloatingNav
          items={bottomNavItems}
          activeId={screen}
          onSelect={goToScreen}
          badges={navBadges}
        />
      )}

      <SettingsScreen
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        modules={enabledModules}
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
  },
  content: { flex: 1 },
});
