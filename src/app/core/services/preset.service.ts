import { Injectable, signal } from '@angular/core';
import { DEFAULT_PRESETS, PRESET_COLORS } from '../constants/preset.constants';
import { readJson, writeJson } from '../helpers/storage';
import type { Preset, PresetKind } from '../models/preset.model';

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
