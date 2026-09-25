import type { SoundId } from '../helpers/sound-patterns';

/** Notification locale à programmer avant la mise en arrière-plan. */
export interface Alert {
  id: number;
  at: number;
  title: string;
  body: string;
  sound: SoundId;
}

/** Noms des canaux Android, fournis par l'appelant (traduits). */
export type ChannelNames = Record<SoundId, string>;
