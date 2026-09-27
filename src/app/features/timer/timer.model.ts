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

/**
 * Étape en cours d'édition. La durée y reste en secondes, contrairement à l'éditeur de
 * mode : une étape peut durer 20 secondes, et un arrondi en minutes les perdrait.
 */
export interface RoutineStepDraft {
  id: string;
  name: string;
  nameKey?: I18nKey;
  icon: string;
  seconds: number;
  color: string;
  kind: PresetKind;
}

/**
 * Rappel en cours d'édition. L'heure y est la chaîne « HH:MM » de `<input type="time">`,
 * qui reste en 24 h quelle que soit la langue — c'est l'affichage qui se localise.
 */
export interface RoutineReminderDraft {
  enabled: boolean;
  time: string;
  /** Jours ISO 8601 cochés : 1 = lundi … 7 = dimanche. */
  days: number[];
}

/** Routine en cours d'édition dans le panneau « Modes ». */
export interface RoutineDraft {
  routine: Routine;
  name: string;
  icon: string;
  steps: RoutineStepDraft[];
  reminder: RoutineReminderDraft;
  /** Nombre de tours : 1 quand la suite d'étapes ne se joue qu'une fois. */
  rounds: number;
  /** Routine d'entraînement : la page passe en mode sport tant qu'elle est chargée. */
  workout: boolean;
  isNew: boolean;
}
