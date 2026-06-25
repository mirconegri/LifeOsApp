// src/components/GradeSelector.js
// Typeahead grade selector for Italian university grades: 18-30, 30L
// Props:
//   value: number | null — 31 represents 30L internally
//   onChange: fn(numericValue)
//   placeholder: string
//   label: string
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { COLORS } from '../config/colors';

// All valid grades as display strings and numeric values
// We store 30L as the number 31 internally to distinguish it
const ALL_GRADES = [
  ...Array.from({ length: 13 }, (_, i) => ({ label: String(18 + i), value: 18 + i })),
  { label: '30L', value: 31 },
];

function gradeToDisplay(val) {
  if (val === null || val === undefined || val === '') return '';
  if (val === 31) return '30L';
  return String(val);
}

export function GradeSelector({ value, onChange, placeholder = 'Grade (18–30L)', label }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const displayValue = gradeToDisplay(value);

  // When focused: show filtered options based on query
  // When not focused: show the selected value
  const filtered = ALL_GRADES.filter(g =>
    g.label.startsWith(query)
  );

  function tryAutoCommit() {
    // If what's currently typed is an exact, valid grade, commit it even
    // though the user never explicitly tapped a dropdown row. Without
    // this, typing "30" and pressing Done (or tapping elsewhere) on the
    // keyboard just let the typed text vanish on blur — nothing had ever
    // called onChange, because that only happened inside handleSelect,
    // which only fired from tapping a dropdown option directly.
    const exactMatch = ALL_GRADES.find(g => g.label === query);
    if (exactMatch) {
      onChange(exactMatch.value);
      setQuery('');
    }
  }

  function handleSelect(grade) {
    onChange(grade.value);
    setQuery('');
    setFocused(false);
  }

  function handleClear() {
    onChange(null);
    setQuery('');
  }

  function handleChangeText(text) {
    // Only allow digits and L
    const clean = text.replace(/[^0-9Ll]/g, '').toUpperCase();
    setQuery(clean);
    // If user clears the field, clear value too
    if (clean === '') onChange(null);
  }

  const showDropdown = focused && filtered.length > 0;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSub}
          value={focused ? query : displayValue}
          onChangeText={handleChangeText}
          onFocus={() => {
            setFocused(true);
            setQuery('');
          }}
          onBlur={() => {
            tryAutoCommit();
            setFocused(false);
          }}
          onSubmitEditing={tryAutoCommit}
          keyboardType="default"
          autoCapitalize="characters"
          maxLength={3}
          returnKeyType="done"
        />
        {(value !== null && value !== undefined && value !== '') ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          {filtered.map(g => (
            <TouchableOpacity
              key={g.label}
              style={[styles.option, value === g.value && styles.optionSelected]}
              // onPressIn fires on touch-down, before the TextInput's onBlur
              // fires on touch-release. That ordering used to race against a
              // 150ms setTimeout — fast enough taps, or anything below that
              // on a slower device, could lose the race and have the
              // dropdown disappear (closed by onBlur) before onPress ever
              // registered the selection. onPressIn removes the race
              // entirely: the selection is committed before blur can close
              // anything, so there's nothing left to time.
              onPressIn={() => handleSelect(g)}
            >
              <Text style={[styles.optionText, value === g.value && styles.optionTextSelected]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { marginBottom: 12, zIndex: 100, elevation: 100 },
  label:     { color: COLORS.textSub, fontSize: 13, marginBottom: 6 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10 },
  input:     {
    flex: 1, paddingHorizontal: 12, paddingVertical: 11,
    color: COLORS.text, fontSize: 14,
  },
  clearBtn:  { paddingHorizontal: 12 },
  clearText: { color: COLORS.textSub, fontSize: 14 },

  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0, right: 0,
    backgroundColor: COLORS.bg3,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10,
    zIndex: 999,
    elevation: 999,
    overflow: 'hidden',
    maxHeight: 220,
  },
  option: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  optionSelected: { backgroundColor: COLORS.accentGlow },
  optionText:     { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  optionTextSelected: { color: COLORS.accent, fontWeight: '700' },
});
