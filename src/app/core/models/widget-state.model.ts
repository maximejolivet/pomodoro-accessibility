/** État lu par le widget iOS (voir WidgetState dans PomodoroWidget.swift). */
export interface WidgetState {
  /** Début (ms) du jour auquel se rapporte `focusMinutes`. */
  dayStart: number;
  focusMinutes: number;
  goalMinutes: number;
  timer: {
    state: 'running' | 'paused' | 'idle';
    name: string;
    color: string;
    /** Heure de fin (ms) si le décompte tourne. */
    endAt?: number;
    /** Temps restant (s) en pause. */
    remainingSeconds?: number;
  };
  /** Libellés déjà traduits dans la langue de l'app. */
  labels: {
    today: string;
    goalReached: string;
    paused: string;
    ready: string;
    finished: string;
  };
  rtl: boolean;
}
