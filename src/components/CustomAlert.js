// src/components/CustomAlert.js
//
// Public API unchanged: <CustomAlert config={alertConfig} /> where config is
// { title, message, buttons: [{ text, style: 'cancel'|'destructive', onPress }] }
// or null. Internals now render the shared Dialog primitive (solid
// surfaceContainerHigh card, 28 radius, 70% scrim, right-aligned text
// buttons). Hardware back routes to the cancel button when one exists and is
// a no-op otherwise — it must never confirm a destructive action.
import React from 'react';
import { Dialog } from '../ui/Dialog';

export function CustomAlert({ config }) {
  if (!config) return null;

  const { title, message, buttons = [], icon } = config;

  const handleRequestClose = () => {
    const cancelBtn = buttons.find(b => b.style === 'cancel');
    if (cancelBtn) cancelBtn.onPress?.();
  };

  return (
    <Dialog
      visible
      title={title}
      message={message}
      icon={icon}
      buttons={buttons}
      onRequestClose={handleRequestClose}
    />
  );
}
