import type { Routine } from '../models/routine.model';
import type { IconName } from '../services/icons.service';

/**
 * Pictogrammes proposés dans l'éditeur d'étape. Icônes SVG professionnelles
 * de Material Design (Iconify) qui fonctionnent à n'importe quelle taille,
 * sont maintenues automatiquement, et offrent une cohérence visuelle.
 * Le choix couvre le quotidien, l'école et le travail, dans cet ordre.
 */
export const STEP_ICONS: readonly IconName[] = [
  'sunrise', 'bed', 'shower', 'toothbrush', 'shirt', 'fork', 'cup', 'backpack',
  'jacket', 'bus', 'medicine', 'cleaning', 'laundry', 'shopping', 'dog', 'book',
  'pencil', 'bookshelf', 'calculator', 'art', 'music', 'wrench', 'brain', 'computer',
  'email', 'phone', 'folder', 'run', 'yoga', 'gym', 'moon', 'clock'
];

/**
 * Heure proposée quand on allume un rappel : le matin, parce que c'est l'usage premier
 * d'une routine — se préparer, partir à l'heure. Elle se change en deux gestes.
 */
export const DEFAULT_REMINDER_TIME = '08:00';

/**
 * Durées proposées pour une étape : de 5 à 55 secondes par pas de 5, puis de 1 à 60
 * minutes par pas d'une minute.
 *
 * Une seule liste parcourue par un curseur, plutôt que deux champs « minutes » et
 * « secondes » : au doigt comme au clavier, un pas donne la valeur suivante qui a un
 * sens. Le pas est court en bas parce qu'un exercice se règle à 20 ou 30 secondes, long
 * en haut parce qu'un petit-déjeuner ne se règle pas à la seconde.
 */
export const STEP_DURATIONS: readonly number[] = [
  ...Array.from({ length: 11 }, (_, i) => (i + 1) * 5),
  ...Array.from({ length: 60 }, (_, i) => (i + 1) * 60)
];

export const MIN_STEP_SECONDS = STEP_DURATIONS[0];
export const MAX_STEP_SECONDS = STEP_DURATIONS[STEP_DURATIONS.length - 1];

/**
 * Nombre maximal de tours. Vingt couvre le Tabata (8) et les séries de gainage, sans
 * permettre une routine qui ne finirait jamais.
 */
export const MAX_ROUNDS = 20;

/** Nombre maximal d'étapes : au-delà, la bande devient illisible et la routine, une corvée. */
export const MAX_STEPS = 10;

export const DEFAULT_ROUTINES: Routine[] = [];
