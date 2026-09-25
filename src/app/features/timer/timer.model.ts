import type { Preset, PresetKind } from '../../core/models/preset.model';

/** Onglets du panneau coulissant. */
export type SheetTab = 'modes' | 'stats' | 'settings';

/** Mode en cours d'édition dans le panneau « Modes ». */
export interface PresetDraft {
  preset: Preset;
  name: string;
  minutes: number;
  color: string;
  kind: PresetKind;
  isNew: boolean;
}
