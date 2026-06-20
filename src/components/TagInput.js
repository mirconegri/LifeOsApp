// src/components/TagInput.js
//
// Chip-style tag input with autocomplete against previously used tags.
//
// Behavior (matches what was asked for):
// - As you type, a dropdown appears showing existing tags that start with
//   what you've typed, PLUS the literal text you're typing as its own
//   option (so you can always create a brand-new tag, not just pick an
//   old one).
// - Tapping any option in the dropdown — whether it's an existing tag or
//   the "create new" entry for what you just typed — commits it as a
//   purple chip, exactly like the other tag chips shown elsewhere in the
//   Notes section.
// - After committing a tag, the text field clears and keeps focus, so the
//   keyboard stays up and you can immediately type the next tag without
//   re-tapping the input.
// - A tag is forced to a single word with no uppercase: typing a space
//   commits the current word as a tag (instead of inserting a space into
//   it), and all characters are lowercased as you type.
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { COLORS } from '../config/colors';

// Cleans a raw tag candidate down to the allowed shape: lowercase, single
// word, no leading/trailing junk. Used both while typing and on commit.
function sanitizeTag(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, ''); // letters/digits/hyphen only, no spaces
}

export function TagInput({ tags, onChangeTags, allKnownTags = [], placeholder = 'Add a tag...' }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const cleanQuery = sanitizeTag(query);

  // Suggestions: existing tags (from other notes) that start with what's
  // typed and aren't already attached to this note, plus — if what's typed
  // isn't already an existing tag — an explicit "create new" option for it.
  const existingMatches = cleanQuery
    ? allKnownTags.filter(t => t.startsWith(cleanQuery) && !tags.includes(t))
    : allKnownTags.filter(t => !tags.includes(t));

  const showCreateOption = cleanQuery.length > 0 && !allKnownTags.includes(cleanQuery);
  const suggestions = showCreateOption ? [cleanQuery, ...existingMatches] : existingMatches;

  function commitTag(tag) {
    const clean = sanitizeTag(tag);
    if (!clean) return;
    if (!tags.includes(clean)) {
      onChangeTags([...tags, clean]);
    }
    setQuery('');
    // Re-focus immediately so the keyboard stays open and the next tag
    // can be typed right away, instead of the field losing focus after
    // each selection.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function removeTag(tag) {
    onChangeTags(tags.filter(t => t !== tag));
  }

  function handleChangeText(text) {
    // A space commits whatever's been typed so far as a tag, rather than
    // becoming part of it — this is what enforces "one word per tag"
    // at the input level, not just on save.
    if (text.endsWith(' ')) {
      commitTag(text.slice(0, -1));
      return;
    }
    setQuery(sanitizeTag(text));
  }

  return (
    <View style={styles.wrapper}>
      {/* Committed tags as purple chips — same visual language as the
          read-only tag pills shown on note cards elsewhere in this
          section, so a tag looks the same whether you're creating it or
          just viewing it later. */}
      {tags.length > 0 && (
        <View style={styles.chipRow}>
          {tags.map(tag => (
            <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={styles.chip}>
              <Text style={styles.chipText}>#{tag}</Text>
              <Text style={styles.chipRemove}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSub}
        value={query}
        onChangeText={handleChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onSubmitEditing={() => commitTag(query)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />

      {focused && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.slice(0, 6).map((s, i) => (
            <TouchableOpacity
              key={s}
              style={[styles.option, i < suggestions.length - 1 && styles.optionDivider]}
              onPressIn={() => commitTag(s)}
            >
              <Text style={styles.optionText}>
                {s === cleanQuery && showCreateOption && !allKnownTags.includes(s) ? `Create "#${s}"` : `#${s}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12, zIndex: 100, elevation: 100 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent,
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
    marginRight: 6, marginBottom: 6,
  },
  chipText: { color: COLORS.accent, fontSize: 12, fontWeight: '600', marginRight: 6 },
  chipRemove: { color: COLORS.accent, fontSize: 11 },

  input: {
    backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14,
  },

  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, marginTop: 4, zIndex: 999, elevation: 999,
    overflow: 'hidden', maxHeight: 220,
  },
  option: { paddingHorizontal: 14, paddingVertical: 11 },
  optionDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  optionText: { color: COLORS.text, fontSize: 14 },
});
