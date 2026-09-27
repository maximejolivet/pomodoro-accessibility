import type { I18nKey } from '../i18n/i18n.model';
import type { PresetKind } from './preset.model';

/**
 * Étape d'une routine : un mode (nom, durée, couleur, nature) auquel s'ajoute un
 * pictogramme. C'est lui qui porte l'information pour qui ne lit pas — enfant,
 * personne dyslexique, personne avec une déficience intellectuelle — là où le nom
 * reste le libellé lu par les lecteurs d'écran.
 *
 * La forme est volontairement celle d'un `Preset` : une étape se démarre, s'affiche
 * et s'enregistre dans l'historique exactement comme un mode.
 */
export interface RoutineStep {
  id: string;
  /** Nom saisi ; vide pour une étape livrée avec l'app (nom traduit via `nameKey`). */
  name: string;
  nameKey?: I18nKey;
  icon: string;
  seconds: number;
  color: string;
  /** `focus` compte dans le temps de focus du jour ; `break` non (RG-10). */
  kind: PresetKind;
}

/**
 * Rappel d'une routine : l'heure à laquelle une notification vient la proposer, et les
 * jours où elle part.
 *
 * Une routine ne sert qu'à qui a pensé à ouvrir l'app à 7 h 30 — c'est-à-dire à qui en
 * avait le moins besoin. Ne pas remarquer qu'il est l'heure est justement le trouble
 * qu'on adresse : le rappel fait venir l'outil, au lieu d'attendre qu'on y pense.
 */
export interface RoutineReminder {
  /** Heure locale, 0-23. */
  hour: number;
  /** Minute, 0-59. */
  minute: number;
  /** Jours ISO 8601 : 1 = lundi … 7 = dimanche. Jamais vide (sinon pas de rappel). */
  days: number[];
}

/** Jours de la semaine, dans l'ordre ISO 8601 (lundi d'abord). */
export const WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * Un rappel venu du stockage : heure et jours ramenés dans leurs bornes, et `undefined`
 * s'il ne reste rien d'exploitable. Le stockage est modifiable à la main, et une version
 * précédente de l'app n'écrivait pas ce champ.
 */
export function normalizeReminder(value: unknown): RoutineReminder | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { hour, minute, days } = value as Partial<RoutineReminder>;
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return undefined;
  if (hour! < 0 || hour! > 23 || minute! < 0 || minute! > 59) return undefined;
  const kept = Array.isArray(days) ? [...new Set(days)].filter(d => WEEKDAYS.includes(d)).sort() : [];
  return kept.length ? { hour: hour!, minute: minute!, days: kept } : undefined;
}

/**
 * Suite ordonnée d'étapes qui s'enchaînent d'elles-mêmes : l'équivalent numérique de
 * l'emploi du temps visuel en bandes plastifiées utilisé en orthophonie, en IME et à
 * l'école. Le minuteur dit *combien de temps il reste* ; la routine dit *ce qui vient
 * après*, qui est l'autre moitié du problème des transitions.
 */
export interface Routine {
  id: string;
  name: string;
  nameKey?: I18nKey;
  icon: string;
  steps: RoutineStep[];
  /**
   * Nombre de fois que la suite d'étapes est jouée. Absent ou 1 : elle se joue une fois.
   *
   * C'est ce qui sépare une routine du matin d'un entraînement : « 20 s d'effort, 10 s de
   * repos » n'a de sens que répété huit fois, et vingt étapes dans la bande seraient
   * illisibles là où deux étapes et un nombre de tours se lisent d'un coup.
   */
  rounds?: number;
  /** Absent tant qu'aucun rappel n'est réglé : une routine se lance très bien à la main. */
  reminder?: RoutineReminder;
}

/** Durée d'un tour de routine, en secondes. */
export function routineSeconds(routine: Routine): number {
  return routine.steps.reduce((total, step) => total + step.seconds, 0);
}

/** Tours d'une routine : 1 quand rien n'est réglé. La valeur est bornée à l'écriture. */
export function routineRounds(routine: Routine): number {
  return routine.rounds ?? 1;
}

/** Durée de la routine entière, tours compris. */
export function routineTotalSeconds(routine: Routine): number {
  return routineSeconds(routine) * routineRounds(routine);
}
