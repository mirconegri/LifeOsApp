// src/screens/OnboardingScreen.js
//
// First-run wizard, restyled on the M3 Expressive tokens.
//
// The flow is unchanged: welcome -> name -> university -> goals -> done, with
// the same validation (`canNext`), the same `onComplete` payload and the same
// ability to go back. Only the presentation moved: a MorphBlob hero that
// morphs and quarter-turns per step, filled fields with labels above, Chips
// for every choice row and a CtaButton in the footer.
//
// The hero lives outside the step blocks on purpose: that way it stays mounted
// while `step` changes, so MorphBlob can actually interpolate between presets
// instead of remounting at the target shape.
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle, useReducedMotion, useSharedValue, withSpring,
} from 'react-native-reanimated';

import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE, SPACING, SPRING, motionConst } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { Blob, MorphBlob } from '../ui/Blob';
import { Chip } from '../ui/Chip';
import { CtaButton } from '../ui/CtaButton';
import { SpringPressable } from '../ui/SpringPressable';
import { Icon } from '../components/Icon';

// One preset per step (index = step), so the shape morphs and quarter-turns.
const HERO_PRESETS = ['circle', 'cookie9', 'cookie12', 'flower', 'clover4'];

// Pill step indicator: 6 wide when inactive, 22 wide when current, sprung.
function StepDot({ active, complete }) {
  const reduced = useReducedMotion();
  const target = active ? motionConst.dotActive : motionConst.dotInactive;
  const width = useSharedValue(target);

  useEffect(() => {
    width.value = reduced ? target : withSpring(target, SPRING.fastSpatial);
  }, [reduced, target, width]);

  const animatedStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: active || complete ? M3.primary : M3.outlineVariant },
        animatedStyle,
      ]}
    />
  );
}

export default function OnboardingScreen({ onComplete }) {
  // Navigation & UI States
  const [step, setStep] = useState(0);

  // Form Fields
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('1');
  const [totalCredits, setTotalCredits] = useState(180);
  const [selectedGoals, setSelectedGoals] = useState([]);

  const STEPS = [
    { id: 'welcome',  title: null },
    { id: 'name',     title: 'What is your name?' },
    { id: 'uni',      title: 'Your university' },
    { id: 'goals',    title: 'What matters most to you?' },
    { id: 'done',     title: null },
  ];

  const CREDIT_OPTIONS = [
    { label: 'Bachelor (180 credits)',   value: 180 },
    { label: 'Master (120 credits)',     value: 120 },
    { label: 'Single cycle (300 credits)', value: 300 },
  ];

  const YEAR_OPTIONS = ['1', '2', '3', '4', '5'];

  const GOAL_OPTIONS = [
    { id: 'uni',       label: '🎓 Graduate',          key: 'uni'      },
    { id: 'finances',  label: '💶 Manage money',      key: 'finances' },
    { id: 'habits',    label: '🔥 Build habits',      key: 'habits'   },
    { id: 'study',     label: '📚 Study better',      key: 'study'    },
    { id: 'groceries', label: '🛒 Organized groceries', key: 'groceries'},
    { id: 'notes',     label: '💡 Take notes',        key: 'notes'    },
  ];

  const toggleGoal = (key) => {
    setSelectedGoals(prev =>
      prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]
    );
  };

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return course.trim().length > 0;
    if (step === 3) return selectedGoals.length > 0;
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleDone();
  };

  const handleDone = () => {
    onComplete({
      name: name.trim(),
      course: course.trim(),
      year,
      totalCredits,
      goals: selectedGoals,
    });
  };

  const dots = STEPS.map((_, i) => (
    <StepDot key={i} active={i === step} complete={i < step} />
  ));

  const showHero = step > 0 && step < 4;

  return (
    <SafeAreaView style={styles.safeRoot}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" backgroundColor={M3.background} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">

          {/* ── Hero: one persistent MorphBlob, morphed by the step index ── */}
          {showHero ? (
            <View style={styles.hero}>
              <View style={styles.heroCircle} />
              <View style={styles.heroBlobLayer}>
                <Blob preset="cookie12" size={200} color={MODULE_TONES.home.container} />
              </View>
              <MorphBlob
                index={step}
                presets={HERO_PRESETS}
                size={176}
                color={MODULE_TONES.home.on}
              />
            </View>
          ) : null}

          {/* ── Welcome ── */}
          {step === 0 && (
            <View style={styles.centerBlock}>
              <Text style={[TEXT.headlineLarge, styles.logo]}>
                <Text style={styles.logoAccent}>Life</Text>OS
              </Text>
              <Text style={[TEXT.headlineMedium, styles.heroTitle]}>
                Your personal operating system
              </Text>
              <Text style={[TEXT.bodyMedium, styles.heroSub]}>
                Exams, finances, habits, and much more — all in one place.
                It takes 60 seconds to set up.
              </Text>
              <CtaButton label="Get started" onPress={next} style={styles.primaryCta} />
            </View>
          )}

          {/* ── Name ── */}
          {step === 1 && (
            <View style={styles.stepBlock}>
              <Text style={[TEXT.headlineSmall, styles.stepTitle]}>What is your name?</Text>
              <Text style={[TEXT.bodyMedium, styles.stepSub]}>
                Will be used in greetings and on the dashboard.
              </Text>

              <Text style={styles.fieldLabel}>Your name *</Text>
              <TextInput
                style={[styles.input, TEXT.bodyLarge]}
                placeholder="Your name"
                placeholderTextColor={M3.outline}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={canNext() ? next : undefined}
              />

              <Text style={[TEXT.bodySmall, styles.localNote]}>
                Your data stays on this device. You can export it anytime from Settings.
              </Text>
            </View>
          )}

          {/* ── University ── */}
          {step === 2 && (
            <View style={styles.stepBlock}>
              <Text style={[TEXT.headlineSmall, styles.stepTitle]}>Your university</Text>
              <Text style={[TEXT.bodyMedium, styles.stepSub]}>
                This data powers the exam tracker.
              </Text>

              <Text style={styles.fieldLabel}>Degree course *</Text>
              <TextInput
                style={[styles.input, TEXT.bodyLarge]}
                placeholder="Degree course (e.g. Computer Science)"
                placeholderTextColor={M3.outline}
                value={course}
                onChangeText={setCourse}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Current year</Text>
              <View style={styles.chipRow}>
                {YEAR_OPTIONS.map(y => (
                  <Chip
                    key={y}
                    label={`${y}°`}
                    selected={year === y}
                    onPress={() => setYear(y)}
                    accessibilityLabel={`Year ${y}`}
                  />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Degree type</Text>
              <View style={styles.chipColumn}>
                {CREDIT_OPTIONS.map(opt => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={totalCredits === opt.value}
                    onPress={() => setTotalCredits(opt.value)}
                    accessibilityLabel={opt.label}
                    style={styles.creditChip}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Goals ── */}
          {step === 3 && (
            <View style={styles.stepBlock}>
              <Text style={[TEXT.headlineSmall, styles.stepTitle]}>What matters most to you?</Text>
              <Text style={[TEXT.bodyMedium, styles.stepSub]}>
                Select at least one. This will personalize initial suggestions.
              </Text>
              <View style={styles.chipRow}>
                {GOAL_OPTIONS.map(g => (
                  <Chip
                    key={g.id}
                    label={g.label}
                    selected={selectedGoals.includes(g.key)}
                    onPress={() => toggleGoal(g.key)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Done ── */}
          {step === 4 && (
            <View style={styles.centerBlock}>
              <View style={styles.doneIcon}>
                <Icon name="rocket" size={40} color={MODULE_TONES.home.on} />
              </View>
              <Text style={[TEXT.headlineSmall, styles.doneTitle]}>
                All set, {name || 'welcome'}!
              </Text>
              <Text style={[TEXT.bodyMedium, styles.heroSub]}>
                LifeOS is configured. You can add your exams, habits, and transactions
                at any time.
              </Text>
              <CtaButton label="Enter LifeOS" onPress={handleDone} style={styles.primaryCta} />
            </View>
          )}

          {/* ── Footer nav ── */}
          {step > 0 && step < 4 && (
            <View style={styles.footer}>
              <SpringPressable
                onPress={() => setStep(s => s - 1)}
                haptic="selection"
                accessibilityLabel="Go back"
                accessibilityRole="button"
                style={styles.backBtn}
                contentStyle={styles.backContent}
              >
                <Icon name="arrow-left" size={16} color={M3.onSurfaceVariant} />
                <Text style={[TEXT.labelLarge, styles.backText]}>Back</Text>
              </SpringPressable>

              <View style={styles.dotsRow}>{dots}</View>

              <CtaButton
                label="Next"
                onPress={next}
                disabled={!canNext()}
                style={styles.nextCta}
              />
            </View>
          )}

          {step === 0 && (
            <View style={styles.dotsRowCenter}>{dots}</View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: M3.background,
  },
  root: {
    flex: 1,
    backgroundColor: M3.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  // Hero
  hero: {
    width: 224,
    height: 224,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  heroCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SHAPE.full,
    backgroundColor: M3.surfaceContainer,
  },
  heroBlobLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Welcome / Done
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  logo: {
    color: M3.onSurface,
    marginBottom: SPACING.sm,
  },
  logoAccent: {
    color: M3.primary,
  },
  heroTitle: {
    color: M3.onSurface,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  heroSub: {
    color: M3.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  primaryCta: {
    alignSelf: 'stretch',
    marginTop: SPACING.sm,
  },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: SHAPE.full,
    backgroundColor: MODULE_TONES.home.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  doneTitle: {
    color: M3.onSurface,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },

  // Steps
  stepBlock: {
    flex: 1,
  },
  stepTitle: {
    color: M3.onSurface,
    marginBottom: SPACING.xs,
  },
  stepSub: {
    color: M3.onSurfaceVariant,
    marginBottom: SPACING.lg,
  },

  // Filled fields: surfaceContainerHigh, radius 16, 56 high, label above.
  fieldLabel: {
    color: M3.onSurfaceVariant,
    marginTop: SPACING.xs,
    marginBottom: 6,
  },
  input: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: M3.onSurface,
    marginBottom: SPACING.md,
  },
  localNote: {
    color: M3.outline,
    marginTop: SPACING.xs,
  },

  // Choice rows — Chips instead of bordered rows.
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  chipColumn: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  creditChip: {
    width: '100%',
  },

  // Footer nav
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  backBtn: {
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: SPACING.xs,
  },
  backText: {
    color: M3.onSurfaceVariant,
  },
  nextCta: {
    minWidth: 116,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotsRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
  },
  dot: {
    width: motionConst.dotInactive,
    height: motionConst.dotInactive,
    borderRadius: SHAPE.full,
  },
});
