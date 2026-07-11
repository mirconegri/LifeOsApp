// src/components/GradeSelector.js
// Typeahead grade selector for Italian university grades: 18-30, 30L
// Props:
//   value: number | null — 31 represents 30L internally
//   onChange: fn(numericValue)
//   placeholder: string
//   label: string
//
// ── Fix: tapping a dropdown row did nothing; only the keyboard's Enter
//    key actually committed a grade ─────────────────────────────────────
// onBlur called `setFocused(false)` SYNCHRONOUSLY, and `showDropdown`
// depends on `focused`. Tapping a dropdown row is a touch on a DIFFERENT
// view than the TextInput, which makes the TextInput lose focus — and on
// Android that blur fires essentially immediately on touch-down, before
// the row's own onPressIn callback runs. So the dropdown was unmounting
// itself out from under the tap before the tap could register: by the
// time onPressIn would have fired, `focused` was already false and the
// row was gone. Enter/onSubmitEditing worked because it calls
// tryAutoCommit() directly, with no blur race involved at all.
// The fix mirrors the pattern already used (correctly) in TagInput.js:
// defer the focus-loss with a short setTimeout, and have the row's
// onPressIn cancel that pending timeout before it fires. The row's
// commit now always wins the race instead of losing it.
//
// ── Fix #2: most grades unreachable when the dropdown shows all 14 ──────
// Separate bug, same component: the dropdown row was a plain View with
// overflow:'hidden' + a fixed maxHeight, which clips content rather than
// scrolling it. With the field empty (no filter), the dropdown is tall
// enough that only the first ~5 grades fall inside the visible/touchable
// area — everything below that line isn't just invisible, it's
// non-interactive. Typing a digit narrows the list enough that whatever
// you're after often falls back into that visible window, which is why
// it looked like "works once you start typing." Fixed by making the
// dropdown's contents an actual ScrollView instead of a clipped View.
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
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
  const blurTimer = useRef(null);

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
    // Cancel the pending blur-triggered close from the tap that just took
    // focus off the TextInput — without this, that timeout would still
    // fire afterwards and is harmless here (focused is already going to
    // false below) but cancelling keeps the intent explicit and matches
    // the commitTag pattern in TagInput.js this is mirroring.
    clearTimeout(blurTimer.current);
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
            clearTimeout(blurTimer.current);
            setFocused(true);
            setQuery('');
          }}
          onBlur={() => {
            tryAutoCommit();
            // Deferred, not immediate: gives a dropdown row's onPressIn
            // (fired by the same touch that caused this blur) a chance to
            // run and call handleSelect — which cancels this timer — before
            // the dropdown unmounts itself. See file header for the bug
            // this fixes.
            blurTimer.current = setTimeout(() => setFocused(false), 150);
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
        // Fix: this was a plain View with overflow:'hidden' + maxHeight:
        // 220. That clips, it doesn't scroll — with all 14 grades shown
        // (empty query), each row is ~44px, so 14 rows ≈ 616px against a
        // 220px cap means only the first ~5 (18–22) were ever visible OR
        // tappable; 23 through 30L — i.e. most of the grades anyone
        // actually gets — were rendered completely outside the touchable
        // area. That's exactly the "can't tap the dropdown when the field
        // is empty, but it works once I start typing" symptom: typing
        // narrows `filtered` down far enough that the target grade
        // happens to land back inside the first ~5 visible rows.
        // Wrapping the rows in a ScrollView instead makes every grade
        // reachable by scrolling within the same 220px window.
        <View style={styles.dropdown}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {filtered.map(g => (
              <TouchableOpacity
                key={g.label}
                style={[styles.option, value === g.value && styles.optionSelected]}
                // onPressIn fires on touch-down, before the deferred blur's
                // 150ms timeout above — so this now reliably wins the race
                // and commits the value before the dropdown can close.
                onPressIn={() => handleSelect(g)}
              >
                <Text style={[styles.optionText, value === g.value && styles.optionTextSelected]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
