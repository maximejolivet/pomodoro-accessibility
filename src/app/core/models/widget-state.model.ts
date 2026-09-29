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
    /** Ce que gradue le cadran : des minutes, ou des secondes sous la minute. */
    dialUnit: 'minutes' | 'seconds';
    /** Ce que le cadran montre à l'écriture : durée réglée au repos, temps restant en pause. */
    dialSeconds: number;
  };
  /** Libellés déjà traduits dans la langue de l'app. */
  labels: {
    today: string;
    goalReached: string;
    paused: string;
    ready: string;
    finished: string;
    /** Abréviation de « seconde » : le cadran gradué en secondes la porte, comme dans l'app. */
    secShort: string;
  };
  rtl: boolean;
  /** Thème choisi dans l'app : le widget s'y accorde plutôt qu'au système. */
  dark: boolean;
}
