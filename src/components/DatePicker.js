// src/components/DatePicker.js
// Custom date picker: shows a month calendar, restricts which dates are
// selectable depending on `mode`.
// Props:
//   value: 'YYYY-MM-DD' string or ''
//   onChange: fn(dateStr)
//   mode: 'future'  — today or later, no upper bound
//         'future5' — today or later, capped at maxYearsBack years ahead
//         'past'    — today or earlier, no lower bound
//         'past5'   — today or earlier, capped at maxYearsBack years back
//         'any'     — no restriction
//   maxYearsBack: number (default 5) — used by 'future5' and 'past5'
//   label: string
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal,
} from 'react-native';
import { COLORS } from '../config/colors';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function pad(n) { return String(n).padStart(2, '0'); }

function toDateStr(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return { y, m: m - 1, d };
}

export function DatePicker({ value, onChange, mode = 'any', maxYearsBack = 5, label }) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Initialize calendar view to the selected date or today
  const parsed = parseDate(value);
  const [viewYear, setViewYear] = useState(parsed ? parsed.y : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.m : today.getMonth());

  const minYear = today.getFullYear() - maxYearsBack;
  const maxYear = today.getFullYear() + 5;

  function isDisabled(dateStr) {
    if (mode === 'future') return dateStr <= todayStr;
    if (mode === 'future5') {
      const limit = new Date(today);
      limit.setFullYear(limit.getFullYear() + maxYearsBack);
      const limitStr = toDateStr(limit.getFullYear(), limit.getMonth(), limit.getDate());
      return dateStr <= todayStr || dateStr > limitStr;
    }
    if (mode === 'past')   return dateStr > todayStr;
    if (mode === 'past5')  {
      const limit = new Date(today);
      limit.setFullYear(limit.getFullYear() - maxYearsBack);
      const limitStr = toDateStr(limit.getFullYear(), limit.getMonth(), limit.getDate());
      return dateStr > todayStr || dateStr < limitStr;
    }
    return false;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDate(dateStr) {
    if (isDisabled(dateStr)) return;
    onChange(dateStr);
    setOpen(false);
  }

  function handleToday() {
    if (!isDisabled(todayStr)) {
      onChange(todayStr);
      setOpen(false);
    }
  }

  // Build grid for the current month
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.calIcon}>📅</Text>
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {displayValue || (label || 'Select date')}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={styles.pickerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map(d => (
              <Text key={d} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e${i}`} style={styles.cell} />;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const disabled = isDisabled(dateStr);
              const selected = dateStr === value;
              const isToday  = dateStr === todayStr;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.cell,
                    selected && styles.cellSelected,
                    isToday && !selected && styles.cellToday,
                    disabled && styles.cellDisabled,
                  ]}
                  onPress={() => selectDate(dateStr)}
                  disabled={disabled}
                >
                  <Text style={[
                    styles.cellText,
                    selected && styles.cellTextSelected,
                    isToday && !selected && styles.cellTextToday,
                    disabled && styles.cellTextDisabled,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today shortcut */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleToday}
              style={[styles.todayBtn, isDisabled(todayStr) && styles.todayBtnDisabled]}
              disabled={isDisabled(todayStr)}
            >
              <Text style={[styles.todayBtnText, isDisabled(todayStr) && styles.todayBtnTextDisabled]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const CELL = 40;
const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
    marginBottom: 12,
  },
  calIcon:   { fontSize: 16, marginRight: 8 },
  triggerText:{ fontSize: 14, color: COLORS.text, flex: 1 },
  placeholder:{ color: COLORS.textSub },
  clearBtn:  { fontSize: 14, color: COLORS.textSub, paddingLeft: 8 },

  backdrop:  {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  pickerContainer: {
    position: 'absolute',
    left: 16, right: 16,
    top: '20%',
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
    elevation: 10,
  },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn:    { padding: 8 },
  navArrow:  { fontSize: 24, color: COLORS.accent, fontWeight: '700' },
  monthLabel:{ fontSize: 16, fontWeight: '700', color: COLORS.text },

  weekRow:   { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { width: CELL, textAlign: 'center', fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  grid:      { flexDirection: 'row', flexWrap: 'wrap' },
  cell:      { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  cellSelected:   { backgroundColor: COLORS.accent },
  cellToday:      { borderWidth: 1.5, borderColor: COLORS.accent },
  cellDisabled:   { opacity: 0.25 },
  cellText:       { fontSize: 14, color: COLORS.text },
  cellTextSelected:{ color: '#fff', fontWeight: '700' },
  cellTextToday:  { color: COLORS.accent, fontWeight: '600' },
  cellTextDisabled:{ color: COLORS.textSub },

  footer:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, alignItems: 'center' },
  todayBtn:  { backgroundColor: COLORS.accentGlow, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.accent },
  todayBtnDisabled:    { opacity: 0.3 },
  todayBtnText:        { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  todayBtnTextDisabled:{ color: COLORS.textSub },
  closeBtn:  { paddingHorizontal: 18, paddingVertical: 8 },
  closeBtnText:{ color: COLORS.textMuted, fontSize: 13 },
});
