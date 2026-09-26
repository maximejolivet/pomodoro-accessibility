import type { SoundId } from '../helpers/sound-patterns';

/** Notification locale à programmer avant la mise en arrière-plan. */
export interface Alert {
  id: number;
  at: number;
  title: string;
  body: string;
  sound: SoundId;
}

/**
 * Rappel de routine à programmer : il se répète chaque semaine, le même jour à la même
 * heure, et survit à la fermeture de l'app — c'est le système qui le garde.
 */
export interface Reminder {
  /** Routine à armer quand la notification est touchée. */
  routineId: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  /** Jour ISO 8601 : 1 = lundi … 7 = dimanche. */
  day: number;
}

/** Noms des canaux Android, fournis par l'appelant (traduits). */
export type ChannelNames = Record<SoundId, string>;
