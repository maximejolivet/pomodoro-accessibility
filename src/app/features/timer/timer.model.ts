import type { I18nKey } from '../../core/i18n/i18n.model';
import type { Preset, PresetKind } from '../../core/models/preset.model';
import type { Routine } from '../../core/models/routine.model';

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

/** Étape en cours d'édition : la durée s'y règle en minutes, comme dans l'éditeur de mode. */
export interface RoutineStepDraft {
  id: string;
  name: string;
  nameKey?: I18nKey;
  icon: string;
  minutes: number;
  color: string;
  kind: PresetKind;
}

/** Routine en cours d'édition dans le panneau « Modes ». */
export interface RoutineDraft {
  routine: Routine;
  name: string;
  icon: string;
  steps: RoutineStepDraft[];
  isNew: boolean;
}
