import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config/colors';
import { CustomAlert } from '../components/CustomAlert';

export default function OnboardingScreen({
  onComplete, 
  onGoogleSignIn,
  onResolveConflictKeepGoogleAccount, 
  onResolveConflictKeepThisDevice,
}) {
  // Navigation & UI States
  const [step, setStep] = useState(0);
  const [alertConfig, setAlertConfig] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    { label: 'Triennale (180 CFU)',  value: 180 },
    { label: 'Magistrale (120 CFU)', value: 120 },
    { label: 'Ciclo Unico (300 CFU)', value: 300 },
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

  const applyGoogleProfile = (profile) => {
    if (profile?.name) setName(profile.name);
    setStep(2);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await onGoogleSignIn();
      if (result.status === 'cancelled') return;

      if (result.status === 'conflict') {
        setAlertConfig({
          title: 'Account already in use',
          message: 'This Google account is already linked to another LifeOS profile. You can stay on this device, or switch to that account — data created here so far won\'t follow.',
          buttons: [
            { text: 'Stay here', style: 'cancel', onPress: () => setAlertConfig(null) },
            { text: 'Use that account', style: 'destructive', onPress: async () => {
              await onResolveConflictKeepGoogleAccount(result.credential);
              setAlertConfig(null);
              applyGoogleProfile(result.profile);
            }},
          ],
        });
        return;
      }

      applyGoogleProfile(result.profile);
    } catch (e) {
      setAlertConfig({
        title: 'Sign-in failed',
        message: 'Something went wrong with Google sign-in. You can continue by entering your name manually.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }],
      });
    } finally {
      setGoogleLoading(false);
    }
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

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <Text style={styles.googleBtnText}>
                {googleLoading ? 'Connecting…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
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

            <Text style={styles.fieldLabel}>Current year</Text>
            <View style={styles.chipRow}>
              {YEAR_OPTIONS.map(y => (
                <TouchableOpacity
                  key={y}
                  onPress={() => setYear(y)}
                  style={[styles.yearChip, year === y && styles.yearChipActive]}
                >
                  <Text style={[styles.yearChipText, year === y && styles.yearChipTextActive]}>{y}°</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Degree type</Text>
            <View style={{ marginBottom: 4 }}>
              {CREDIT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setTotalCredits(opt.value)}
                  style={[styles.creditOption, totalCredits === opt.value && styles.creditOptionActive]}
                >
                  <Text style={[styles.creditOptionText, totalCredits === opt.value && styles.creditOptionTextActive]}>
                    {opt.label}
                  </Text>
                  {totalCredits === opt.value && <Text style={styles.creditCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
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
      <CustomAlert config={alertConfig} />
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

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textSub, fontSize: 12, marginHorizontal: 10 },
  googleBtn: {
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
  },
  googleBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },

  // Year / credit-type selectors
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', marginBottom: 18 },
  yearChip: {
    width: 44, height: 44, borderRadius: 12, marginRight: 10,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  yearChipActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  yearChipText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
  yearChipTextActive: { color: COLORS.accent },
  creditOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10,
  },
  creditOptionActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  creditOptionText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  creditOptionTextActive: { color: COLORS.accent, fontWeight: '700' },
  creditCheck: { color: COLORS.accent, fontWeight: '700', fontSize: 14 },

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