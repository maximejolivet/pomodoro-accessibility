import type { Preset } from '../models/preset.model';

/** Couleurs proposées dans l'éditeur (celles de l'anneau du cadran). */
export const PRESET_COLORS = [
  '#8b6fd6', '#d63f4f', '#ef7d2d', '#f3a52b', '#c3cd36',
  '#56b27b', '#5aa9c4', '#5d6db3', '#b24f97', '#56636a'
];

/** Modes livrés avec l'app, restaurables depuis les réglages. */
export const DEFAULT_PRESETS: Preset[] = [
  { id: 'pomodoro', name: '', nameKey: 'preset.pomodoro', seconds: 25 * 60, color: '#8b6fd6', kind: 'focus' },
  { id: 'break', name: '', nameKey: 'preset.break', seconds: 5 * 60, color: '#56b27b', kind: 'break' },
  { id: 'long-break', name: '', nameKey: 'preset.longBreak', seconds: 15 * 60, color: '#5aa9c4', kind: 'longBreak' },
  { id: 'focus', name: '', nameKey: 'preset.focus', seconds: 15 * 60, color: '#ef7d2d', kind: 'focus' }
];
