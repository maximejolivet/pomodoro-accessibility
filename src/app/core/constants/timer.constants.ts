/** Règles du minuteur : durées et jalons du cycle pomodoro. */

/** Durée maximale réglable, et graduation complète du cadran. */
export const MAX_MINUTES = 60;

/** Durée minimale atteignable par pas (flèches, boutons − / +) : en dessous, il n'y a plus de session. */
export const MIN_MINUTES = 1;

/** Prolongation proposée à la fin d'une session de travail (« +5 min »). */
export const EXTRA_SECONDS = 5 * 60;

/**
 * Les trois timbres de palier, du plus doux au plus insistant, nommés par les minutes
 * restantes auxquelles ils se déclenchent sur une longue session. Sur une session plus
 * courte, ce sont les mêmes trois timbres, joués à des minutes calculées
 * (`helpers/milestones.ts`) : c'est le rang qui porte l'insistance, pas le nombre.
 */
export const MILESTONES = [45, 30, 15] as const;

export type MilestoneTone = (typeof MILESTONES)[number];

/**
 * Au-delà de cette durée, les paliers restent ceux qu'on connaît : 45, 30 et 15 minutes
 * restantes. En dessous, ils se calculent sur la durée choisie — sinon un Pomodoro de
 * 25 min n'est prévenu qu'une fois, et une étape de routine de 10 min jamais.
 */
export const LONG_SESSION_MINUTES = 40;

/** Dernier palier d'une session courte : une minute pour conclure ce qui est en cours. */
export const FINAL_WARNING_MINUTES = 1;

/** Au-delà de ce retard (app en arrière-plan), la notification a déjà prévenu : pas de son en rattrapage. */
export const LATE_ALERT_SECONDS = 90;

/** Une pause longue toutes les N sessions de travail terminées. */
export const LONG_BREAK_EVERY = 4;

/**
 * Durée du signal visuel, en millisecondes : une pulsation de 1,6 s aux paliers, trois à
 * la fin. Soit 0,6 Hz — très loin des trois éclats par seconde interdits (WCAG 2.3.1).
 */
export const CUE_MS = { milestone: 1600, end: 4800 } as const;
