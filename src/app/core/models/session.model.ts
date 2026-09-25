import type { PresetKind } from './preset.model';

/** Session terminée, telle qu'elle est enregistrée dans l'historique. */
export interface Session {
  /** Nom affiché au moment de la session (figé, même si le mode est renommé ensuite). */
  name: string;
  color: string;
  kind: PresetKind;
  /** Durée prévue (s). */
  plannedSeconds: number;
  /** Temps réellement décompté (s), pauses exclues, prolongation incluse. */
  activeSeconds: number;
  startedAt: number;
  endedAt: number;
  completed: boolean;
}

/** Total d'une journée, pour l'histogramme de la semaine. */
export interface DayStat {
  date: Date;
  focusMinutes: number;
}

/** Session en cours, enregistrée dans l'historique à sa fin. */
export interface ActiveSession {
  name: string;
  color: string;
  kind: PresetKind;
  plannedSeconds: number;
  startedAt: number;
  /** Temps décompté avant la dernière reprise (ms). */
  activeMs: number;
  /** Début du segment en cours de décompte (ms), null en pause. */
  runningSince: number | null;
}
