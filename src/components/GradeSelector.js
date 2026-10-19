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
//
// ── Fix #3: backspace left the field unable to accept any further digit ─
// The TextInput was fed from TWO different places: `query` while focused,
// and the committed value's display string while not. One native buffer,
// two writers — and editing an already-committed grade ran them out of
// step, because backspacing calls onChange(null) while the buffer still
// holds the truncated text. From then on React's idea of the text and the
// buffer's disagreed, so the next keystroke was either swallowed or
// reverted on the following render. There is now a single `text` state
// that owns the field: while the user is typing it is theirs, and the
// moment they leave it re-syncs to whatever the parent committed.
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
} from 'react-native';
import { M3 } from '../config/colors';
import { SHAPE } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { SpringPressable } from '../ui/SpringPressable';
import { Icon } from './Icon';

// All valid grades as display strings and numeric values
// We store 30L as the number 31 internally to distinguish it
const ALL_GRADES = [
  ...Array.from({ length: 13 }, (_, i) => ({ label: String(18 + i), value: 18 + i })),
  { label: '30L', value: 31 },
];

const BLUR_DELAY = 150;  // lets a dropdown tap win the race — see Fix #1
const SELECT_HOLD = 200; // keeps the tapped row highlighted before closing

function gradeToDisplay(val) {
  if (val === null || val === undefined || val === '') return '';
  if (val === 31) return '30L';
  return String(val);
}

export function GradeSelector({ value, onChange, placeholder = 'Grade (18–30L)', label }) {
  const [text, setText] = useState(() => gradeToDisplay(value));
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef(null);

  // While the user is typing the field belongs to them; the moment they
  // leave, it mirrors whatever the parent committed. This is what keeps the
  // buffer and the state from drifting apart — see Fix #3.
  useEffect(() => {
    if (!focused) setText(gradeToDisplay(value));
  }, [value, focused]);

  // When focused: show filtered options based on what has been typed
  const filtered = ALL_GRADES.filter(g => g.label.startsWith(text));

  function tryAutoCommit() {
    const exactMatch = ALL_GRADES.find(g => g.label === text);
    if (exactMatch) onChange(exactMatch.value);
  }

  function handleSelect(grade) {
    clearTimeout(blurTimer.current);
    onChange(grade.value);
    setText(grade.label);
    blurTimer.current = setTimeout(() => setFocused(false), SELECT_HOLD);
  }

  function handleClear() {
    onChange(null);
    setText('');
  }

  function handleChangeText(next) {
    const clean = next.replace(/[^0-9Ll]/g, '').toUpperCase();
    setText(clean);
    if (clean === '') {
      onChange(null);
      return;
    }
    // Live match: digitando "25" committa subito, senza aspettare blur
    const match = ALL_GRADES.find(g => g.label === clean);
    if (match) {
      onChange(match.value);
    } else if (value != null && value !== '' && gradeToDisplay(value) !== clean) {
      // Utente modifica da valore committato → lo rimuove
      onChange(null);
    }
  }

  const showDropdown = focused && filtered.length > 0;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[TEXT.labelMedium, styles.label]}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, TEXT.bodyLarge]}
          placeholder={placeholder}
          placeholderTextColor={M3.outline}
          value={text}
          onChangeText={handleChangeText}
          onFocus={() => {
            clearTimeout(blurTimer.current);
            setFocused(true);
            // Re-show the committed value when the field is focused again.
            setText(value != null && value !== '' ? gradeToDisplay(value) : '');
          }}
          onBlur={() => {
            tryAutoCommit();
            // Deferred, not immediate: gives a dropdown row's onPressIn
            // (fired by the same touch that caused this blur) a chance to
            // run and call handleSelect — which cancels this timer — before
            // the dropdown unmounts itself. See file header for the bug
            // this fixes.
            blurTimer.current = setTimeout(() => setFocused(false), BLUR_DELAY);
          }}
          onSubmitEditing={tryAutoCommit}
          keyboardType="default"
          autoCapitalize="characters"
          maxLength={3}
          returnKeyType="done"
        />
        {(value !== null && value !== undefined && value !== '') ? (
          <SpringPressable
            onPress={handleClear}
            haptic={false}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Clear grade"
            style={styles.clearBtn}
            contentStyle={styles.clearBtnContent}
          >
            <Icon name="x" size={16} color={M3.outline} />
          </SpringPressable>
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
              <SpringPressable
                key={g.label}
                style={styles.option}
                contentStyle={styles.optionContent}
                // onPressIn fires on touch-down, before the deferred blur's
                // 150ms timeout above — so this reliably wins the race and
                // commits the value before the dropdown can close.
                onPressIn={() => handleSelect(g)}
                haptic="selection"
                accessibilityRole="button"
                accessibilityLabel={`Grade ${g.label}`}
              >
                <Text style={[
                  TEXT.bodyLarge,
                  styles.optionText,
                  value === g.value && styles.optionTextSelected,
                ]}>
                  {g.label}
                </Text>
              </SpringPressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { marginBottom: 12, zIndex: 100, elevation: 100 },
  label:     { color: M3.onSurfaceVariant, marginBottom: 6 },
  inputRow:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
  },
  input:     {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: M3.onSurface,
  },
  clearBtn:  { borderRadius: SHAPE.full },
  clearBtnContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SHAPE.full,
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0, right: 0,
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    zIndex: 999,
    elevation: 999,
    overflow: 'hidden',
    maxHeight: 220,
    marginTop: 4,
    paddingVertical: 4,
  },
  option: {
    marginHorizontal: 4,
    borderRadius: SHAPE.sm,
  },
  optionContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: SHAPE.sm,
  },
  optionText:     { color: M3.onSurface },
  optionTextSelected: { color: M3.primary },
});
