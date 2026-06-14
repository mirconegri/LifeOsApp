import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { COLORS } from '../config/colors';

const STEPS = [
  { id: 'welcome',  title: null },
  { id: 'name',     title: 'Come ti chiami?' },
  { id: 'uni',      title: 'La tua università' },
  { id: 'goals',    title: 'A cosa tieni di più?' },
  { id: 'done',     title: null },
];

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);

  // Fields
  const [nome,       setNome]       = useState('');
  const [corso,      setCorso]      = useState('');
  const [anno,       setAnno]       = useState('');
  const [cfuTotali,  setCfuTotali]  = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);

  const GOAL_OPTIONS = [
    { id: 'uni',     label: '🎓 Laurearmi',        key: 'uni'    },
    { id: 'finanze', label: '💶 Gestire i soldi',   key: 'finanze'},
    { id: 'habits',  label: '🔥 Costruire abitudini', key: 'habits'},
    { id: 'studio',  label: '📚 Studiare meglio',   key: 'studio' },
    { id: 'spesa',   label: '🛒 Spesa organizzata', key: 'spesa'  },
    { id: 'notes',   label: '💡 Prendere note',     key: 'notes'  },
  ];

  const toggleGoal = (key) => {
    setSelectedGoals(prev =>
      prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]
    );
  };

  const canNext = () => {
    if (step === 1) return nome.trim().length > 0;
    if (step === 2) return corso.trim().length > 0;
    if (step === 3) return selectedGoals.length > 0;
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleDone();
  };

  const handleDone = () => {
    onComplete({
      nome: nome.trim(),
      corso: corso.trim(),
      anno: anno.trim(),
      cfuTotali: parseInt(cfuTotali) || 180,
      goals: selectedGoals,
    });
  };

  const dots = STEPS.map((_, i) => (
    <View
      key={i}
      style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
    />
  ));

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Welcome ── */}
        {step === 0 && (
          <View style={styles.centerBlock}>
            <Text style={styles.logo}>
              <Text style={{ color: COLORS.accent }}>Life</Text>OS
            </Text>
            <Text style={styles.heroTitle}>Il tuo sistema operativo personale</Text>
            <Text style={styles.heroSub}>
              Esami, finanze, abitudini e molto altro — tutto in un unico posto.
              Ci vogliono 60 secondi per configurarlo.
            </Text>
            <TouchableOpacity style={styles.bigBtn} onPress={next}>
              <Text style={styles.bigBtnText}>Inizia →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Nome ── */}
        {step === 1 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.stepTitle}>Come ti chiami?</Text>
            <Text style={styles.stepSub}>Verrà usato nei saluti e nella dashboard.</Text>
            <TextInput
              style={styles.input}
              placeholder="Il tuo nome"
              placeholderTextColor={COLORS.textSub}
              value={nome}
              onChangeText={setNome}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={canNext() ? next : undefined}
            />
          </View>
        )}

        {/* ── Università ── */}
        {step === 2 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepEmoji}>🎓</Text>
            <Text style={styles.stepTitle}>La tua università</Text>
            <Text style={styles.stepSub}>Questi dati alimentano il tracker degli esami.</Text>

            <TextInput
              style={styles.input}
              placeholder="Corso di laurea (es. Informatica)"
              placeholderTextColor={COLORS.textSub}
              value={corso}
              onChangeText={setCorso}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Anno (es. 2°)"
              placeholderTextColor={COLORS.textSub}
              value={anno}
              onChangeText={setAnno}
              keyboardType="default"
            />
            <TextInput
              style={styles.input}
              placeholder="CFU totali del tuo piano (es. 180)"
              placeholderTextColor={COLORS.textSub}
              value={cfuTotali}
              onChangeText={setCfuTotali}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* ── Goals ── */}
        {step === 3 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>A cosa tieni di più?</Text>
            <Text style={styles.stepSub}>
              Seleziona almeno uno. Personalizzerà i suggerimenti iniziali.
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
            <Text style={styles.doneTitle}>Tutto pronto, {nome || 'benvenuto'}!</Text>
            <Text style={styles.heroSub}>
              LifeOS è configurato. Puoi aggiungere i tuoi esami, le abitudini e le transazioni
              in qualsiasi momento.
            </Text>
            <TouchableOpacity style={styles.bigBtn} onPress={handleDone}>
              <Text style={styles.bigBtnText}>Entra in LifeOS →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Footer nav ── */}
        {step > 0 && step < 4 && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Indietro</Text>
            </TouchableOpacity>
            <View style={styles.dotsRow}>{dots}</View>
            <TouchableOpacity
              onPress={next}
              style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
              disabled={!canNext()}
            >
              <Text style={styles.nextBtnText}>{step === 3 ? 'Fatto ✓' : 'Avanti →'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 0 && (
          <View style={styles.dotsRowCenter}>{dots}</View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    gap: 10,
    marginTop: 4,
  },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '47%',
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
  dotsRow: { flexDirection: 'row', gap: 6 },
  dotsRowCenter: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 24 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.bg4,
  },
  dotActive: { backgroundColor: COLORS.accent, width: 18 },
  dotDone:   { backgroundColor: COLORS.accentDim },
});