
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar, SafeAreaView,
} from 'react-native';
import { COLORS } from '../config/colors';

const STEPS = [
  { id: 'welcome',  title: null },
  { id: 'name',     title: 'What is your name?' },
  { id: 'uni',      title: 'Your university' },
  { id: 'goals',    title: 'What matters most to you?' },
  { id: 'done',     title: null },
];

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);

  // Fields
  const [name,         setName]         = useState('');
  const [course,       setCourse]       = useState('');
  const [year,         setYear]         = useState('');
  const [totalCredits, setTotalCredits] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);

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
      year: year.trim(),
      totalCredits: parseInt(totalCredits) || 180,
      goals: selectedGoals,
    });
  };

  const dots = STEPS.map((_, i) => (
    <View
      key={i}
      style={[
        styles.dot, 
        i === step && styles.dotActive, 
        i < step && styles.dotDone,
        i !== STEPS.length - 1 && { marginRight: 6 }
      ]}
    />
  ));

  return (
    <SafeAreaView style={styles.safeRoot}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">

        {/* ── Welcome ── */}
        {step === 0 && (
          <View style={styles.centerBlock}>
            <Text style={styles.logo}>
              <Text style={{ color: COLORS.accent }}>Life</Text>OS
            </Text>
            <Text style={styles.heroTitle}>Your personal operating system</Text>
            <Text style={styles.heroSub}>
              Exams, finances, habits, and much more — all in one place.
              It takes 60 seconds to set up.
            </Text>
            <TouchableOpacity style={styles.bigBtn} onPress={next}>
              <Text style={styles.bigBtnText}>Get Started →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Name ── */}
        {step === 1 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.stepTitle}>What is your name?</Text>
            <Text style={styles.stepSub}>Will be used in greetings and on the dashboard.</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={COLORS.textSub}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={canNext() ? next : undefined}
            />
          </View>
        )}

        {/* ── University ── */}
        {step === 2 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepEmoji}>🎓</Text>
            <Text style={styles.stepTitle}>Your university</Text>
            <Text style={styles.stepSub}>This data powers the exam tracker.</Text>

            <TextInput
              style={styles.input}
              placeholder="Degree course (e.g. Computer Science)"
              placeholderTextColor={COLORS.textSub}
              value={course}
              onChangeText={setCourse}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Year (e.g. 2nd)"
              placeholderTextColor={COLORS.textSub}
              value={year}
              onChangeText={setYear}
              keyboardType="default"
            />
            <TextInput
              style={styles.input}
              placeholder="Total credits of your plan (e.g. 180)"
              placeholderTextColor={COLORS.textSub}
              value={totalCredits}
              onChangeText={setTotalCredits}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* ── Goals ── */}
        {step === 3 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>What matters most to you?</Text>
            <Text style={styles.stepSub}>
              Select at least one. This will personalize initial suggestions.
            </Text>
            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map(g => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => toggleGoal(g.key)}
                  style={[styles.goalChip, selectedGoals.includes(g.key) && styles.goalChipActive]}
                >
                  <Text style={[styles.goalText, selectedGoals.includes(g.key) && styles.goalTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Done ── */}
        {step === 4 && (
          <View style={styles.centerBlock}>
            <Text style={styles.doneEmoji}>🚀</Text>
            <Text style={styles.doneTitle}>All set, {name || 'welcome'}!</Text>
            <Text style={styles.heroSub}>
              LifeOS is configured. You can add your exams, habits, and transactions
              at any time.
            </Text>
            <TouchableOpacity style={styles.bigBtn} onPress={handleDone}>
              <Text style={styles.bigBtnText}>Enter LifeOS →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Footer nav ── */}
        {step > 0 && step < 4 && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.dotsRow}>{dots}</View>
            <TouchableOpacity
              onPress={next}
              style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
              disabled={!canNext()}
            >
              <Text style={styles.nextBtnText}>{step === 3 ? 'Done ✓' : 'Next →'}</Text>
            </TouchableOpacity>
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
    backgroundColor: COLORS.bg,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flexGrow: 1,
    padding: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Welcome / Done
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  bigBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  bigBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  doneEmoji: { fontSize: 60, marginBottom: 16 },
  doneTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 12 },

  // Steps
  stepBlock: {
    flex: 1,
    paddingTop: 20,
  },
  stepEmoji: { fontSize: 48, marginBottom: 16 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  stepSub:   { fontSize: 14, color: COLORS.textMuted, marginBottom: 28, lineHeight: 20 },
  input: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 14,
  },

  // Goals
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '48%',
    marginBottom: 10,
  },
  goalChipActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  goalText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  goalTextActive: { color: COLORS.accent, fontWeight: '700' },

  // Footer nav
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  backBtn: { padding: 10 },
  backBtnText: { color: COLORS.textMuted, fontSize: 15 },
  nextBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Dots
  dotsRow: { flexDirection: 'row' },
  dotsRowCenter: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.bg4,
  },
  dotActive: { backgroundColor: COLORS.accent, width: 18 },
  dotDone:   { backgroundColor: COLORS.accentDim },
});

