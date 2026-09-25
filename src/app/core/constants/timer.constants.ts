/** Règles du minuteur : durées et jalons du cycle pomodoro. */

/** Durée maximale réglable, et graduation complète du cadran. */
export const MAX_MINUTES = 60;

/** Prolongation proposée à la fin d'une session de travail (« +5 min »). */
export const EXTRA_SECONDS = 5 * 60;

/** Minutes restantes auxquelles un son de palier est joué. */
export const MILESTONES = [45, 30, 15] as const;

/** Au-delà de ce retard (app en arrière-plan), la notification a déjà prévenu : pas de son en rattrapage. */
export const LATE_ALERT_SECONDS = 90;

/** Une pause longue toutes les N sessions de travail terminées. */
export const LONG_BREAK_EVERY = 4;
