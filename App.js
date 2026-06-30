// App.js — LifeOS root component
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, StatusBar, Modal, StyleSheet, Platform,
  Animated, Easing, BackHandler,
} from 'react-native';

import { COLORS } from './src/config/colors';
import { NAV } from './src/config/nav';
import { todayKey } from './src/data/helpers';
import { loadJSON, saveJSON } from './src/data/storage';
import { FadeSlideIn } from './src/components/FadeSlideIn';
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

export default function App() {
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

  // ── Drawer: now a solid sliding panel instead of a faded-in BlurView ──
  // (see drawer styles/JSX below for why BlurView was dropped entirely).
  // `drawerMounted` controls whether the Modal exists at all; `drawerX`
  // drives the slide. Kept as two pieces of state/ref so closing can
  // finish its slide-out animation BEFORE the Modal unmounts, instead of
  // the panel just vanishing mid-slide.
  const [drawerMounted, setDrawerMounted] = useState(false);
  const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

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

  // ── Android hardware back button ──────────────────────────────────────
  // Previously unhandled entirely, so back always fell through to the OS
  // default of exiting the app. This adds: (1) close the drawer if it's
  // open, (2) otherwise pop a real navigation history stack back to
  // whatever screen the user was actually on before, rather than just
  // jumping to Home. Each screen's own Modals (add/edit forms, date
  // picker, alerts) handle back via their own `onRequestClose`, so this
  // only needs to care about drawer + screen-level navigation.
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
      return false; // nothing left in history — let the OS handle it (exit/minimize)
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerMounted]);

  useEffect(() => {
    (async () => {
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

      // Fixed: this used to fall back to [] for a brand-new install, so
      // INIT_JOURNAL (seed tasks + habits) was dead data that nothing ever
      // loaded — a fresh install always opened to an empty Tasks screen
      // no matter how much seed data existed in seedData.js. Existing
      // installs are unaffected: loadJSON only falls back when the
      // 'lifeos_journal' key doesn't exist yet in AsyncStorage at all.
      let loadedJournal = await loadJSON('journal', INIT_JOURNAL);

      // One-time migration: Habits used to be its own AsyncStorage list
      // (key 'habits'). Now that Habits is folded into Tasks, anything
      // already saved there needs to land inside `journal` as
      // recurring:true entries instead of just disappearing because
      // HabitsScreen no longer reads that key. Guarded by a flag so this
      // only ever runs once, even though the old 'habits' key itself is
      // left on disk afterward (harmless, just unused) rather than
      // deleted — deleting user data as a side effect of a migration is
      // riskier than leaving an orphaned key behind.
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
    })();
  }, []);

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

  // Used by HomeScreen's per-section "jump to" arrows, so tapping a
  // section title on the Home screen navigates straight into it — and now
  // also registers in the back-button history stack like any other nav.
  const navigateTo = (screenId) => goToScreen(screenId);

  // ── Bottom nav icon "pop" animation ────────────────────────────────────
  // One persistent Animated.Value per nav item (created lazily, kept in a
  // ref so it survives re-renders), bounced whenever that item becomes
  // the active screen.
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

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      </View>
    );
  }

  if (isFirstUse) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const SCREENS = {
    home: (
      <HomeScreen
        exams={exams} tasks={journal}
        finances={finances} heatmap={heatmap} links={links}
        userName={userName} course={course} isFirstUse={isFirstUse}
        tipsShown={tipsShown} onDismissTip={dismissTip}
        onNavigate={navigateTo}
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
                 finances={finances}
                 loggedSeconds={loggedSeconds + timerSec}
               />,
  };

  const bottomNavItems = NAV.filter((n) => n.bottomNav);
  const currentNav     = NAV.find((n) => n.id === screen);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Top Bar ── kept solid: it sits in normal flex flow above
          `content`, not overlapping scrolling content, so there was never
          anything for a blur to actually show through here anyway. */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>
          <Text style={{ color: COLORS.accent }}>Life</Text>OS
        </Text>
        <Text style={styles.screenLabel}>
          {currentNav?.icon} {currentNav?.label}
        </Text>
      </View>

      {/* ── Drawer ──
          Redesigned as a solid sliding panel. It used to use a real-time
          BlurView, reasoned (in a now-outdated comment) as "genuine glass"
          because a Modal sits above real app content. That reasoning held
          on iOS — but on this project's pinned Expo SDK (54), expo-blur's
          BlurView does not blur on Android at all; it falls back to a
          flat semi-transparent rectangle. On the actual Android device
          this app is tested on, the drawer has therefore never been
          "glass" — it's been a cheap-looking tinted overlay the whole
          time, which is exactly the complaint. Fix: drop the blur
          entirely here and make the drawer a confidently solid panel that
          slides in from the left (translateX, not a fade), with its own
          backgroundColor instead of relying on a blur to provide one. */}
      <Modal visible={drawerMounted} animationType="none" transparent onRequestClose={closeDrawer}>
        <View style={styles.drawerOverlay}>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
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
                  onPress={() => { goToScreen(n.id); closeDrawer(); }}
                  style={[styles.drawerItem, screen === n.id && styles.drawerItemActive]}
                >
                  <Text style={{ fontSize: 18 }}>{n.icon}</Text>
                  <Text style={[styles.drawerLabel, screen === n.id && styles.drawerLabelActive]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} />
        </View>
      </Modal>

      {/* ── Main Content ── crossfades/slides in on every screen switch.
          Keying FadeSlideIn by `screen` forces a fresh mount (and so a
          fresh play of its entrance animation) each time the active
          screen changes, without needing a more complex overlapping
          unmount/mount transition. */}
      <View style={styles.content}>
        <FadeSlideIn key={screen} style={{ flex: 1 }}>
          {SCREENS[screen]}
        </FadeSlideIn>
      </View>

      {/* ── Bottom Nav ── kept solid, same reasoning as Top Bar. Icons get
          a quick scale "pop" when they become active. */}
      <View style={styles.bottomNav}>
        {bottomNavItems.map((n) => (
          <TouchableOpacity
            key={n.id}
            onPress={() => goToScreen(n.id)}
            style={styles.bottomNavItem}
          >
            <View style={[styles.bottomNavIconWrap, screen === n.id && styles.bottomNavIconWrapActive]}>
              <Animated.Text
                style={[
                  styles.bottomNavIcon,
                  screen === n.id && styles.bottomNavIconActive,
                  { transform: [{ scale: getNavScale(n.id) }] },
                ]}
              >
                {n.icon}
              </Animated.Text>
            </View>
            <Text style={[styles.bottomNavLabel, screen === n.id && styles.bottomNavLabelActive]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
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
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: COLORS.bg2,
    borderRightWidth: 1, borderRightColor: COLORS.border,
    // Solid panel now carries its own subtle depth instead of relying on
    // a blur to look "lifted" off the backdrop.
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    padding: 16,
    // The Modal this lives in is its own native layer — it does NOT
    // inherit the root SafeAreaView's top inset (that padding only
    // applies to the normally-rendered screen tree). Without an explicit
    // top offset here, this header starts at literal y=0 of the physical
    // screen and the logo/subtitle land directly under the status bar
    // icons (wifi/battery/clock) instead of below them. Reusing
    // StatusBar.currentHeight — the same value already used for `root`'s
    // padding — keeps this consistent with the rest of the app rather
    // than introducing a second, different mechanism for the same
    // problem. [Guessing] on iOS this is rougher (StatusBar.currentHeight
    // is Android-only and undefined there); 44 is a reasonable flat
    // estimate for non-notched devices, but this hasn't been verified on
    // an actual iPhone since the test device is the Nothing Phone 2a.
    paddingTop: 16 + (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44),
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

  content: { flex: 1 },

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
  bottomNavLabel: { fontSize: 10, color: COLORS.textSub, marginTop: 4 },
  bottomNavLabelActive: { color: COLORS.accent, fontWeight: '600' },
});
