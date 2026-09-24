import { Injectable, signal } from '@angular/core';
import { I18nKey } from './i18n';
import { readJson, writeJson } from './storage';

export type PresetKind = 'focus' | 'break' | 'longBreak';

export interface Preset {
  id: string;
  /** Nom saisi par l'utilisateur ; vide pour un mode par défaut (nom traduit via `nameKey`). */
  name: string;
  nameKey?: I18nKey;
  seconds: number;
  color: string;
  kind: PresetKind;
}

/** Couleurs proposées dans l'éditeur (celles de l'anneau du cadran). */
export const PRESET_COLORS = [
  '#8b6fd6', '#d63f4f', '#ef7d2d', '#f3a52b', '#c3cd36',
  '#56b27b', '#5aa9c4', '#5d6db3', '#b24f97', '#56636a'
];

const DEFAULT_PRESETS: Preset[] = [
  { id: 'pomodoro', name: '', nameKey: 'preset.pomodoro', seconds: 25 * 60, color: '#8b6fd6', kind: 'focus' },
  { id: 'break', name: '', nameKey: 'preset.break', seconds: 5 * 60, color: '#56b27b', kind: 'break' },
  { id: 'long-break', name: '', nameKey: 'preset.longBreak', seconds: 15 * 60, color: '#5aa9c4', kind: 'longBreak' },
  { id: 'focus', name: '', nameKey: 'preset.focus', seconds: 15 * 60, color: '#ef7d2d', kind: 'focus' }
];

const STORAGE_KEY = 'presets';

@Injectable({ providedIn: 'root' })
export class PresetService {
  readonly presets = signal<Preset[]>(this.load());

  byId(id: string | null | undefined): Preset | undefined {
    return this.presets().find(p => p.id === id);
  }

  /** Premier mode du type demandé, pour l'enchaînement automatique. */
  firstOfKind(kind: PresetKind): Preset | undefined {
    return this.presets().find(p => p.kind === kind);
  }

  save(preset: Preset): void {
    const list = this.presets();
    const exists = list.some(p => p.id === preset.id);
    this.update(exists ? list.map(p => (p.id === preset.id ? preset : p)) : [...list, preset]);
  }

  remove(id: string): void {
    const next = this.presets().filter(p => p.id !== id);
    // On garde toujours au moins un mode
    if (next.length) this.update(next);
  }

  restoreDefaults(): void {
    this.update(DEFAULT_PRESETS.map(p => ({ ...p })));
  }

  newPreset(): Preset {
    return {
      id: `custom-${Date.now().toString(36)}`,
      name: '',
      seconds: 20 * 60,
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      kind: 'focus'
    };
  }

  private update(list: Preset[]): void {
    this.presets.set(list);
    writeJson(STORAGE_KEY, list);
  }

  private load(): Preset[] {
    const saved = readJson<Preset[] | null>(STORAGE_KEY, null);
    const valid = Array.isArray(saved)
      ? saved.filter(p => p && typeof p.id === 'string' && p.seconds > 0 && typeof p.color === 'string')
      : [];
    return valid.length ? valid : DEFAULT_PRESETS.map(p => ({ ...p }));
  }
}
