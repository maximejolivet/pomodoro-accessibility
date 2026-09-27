import type { Routine } from '../models/routine.model';

/**
 * Pictogrammes proposés dans l'éditeur d'étape. Des emoji plutôt qu'une banque
 * d'images : ils sont déjà sur l'appareil (rien à télécharger, rien à mettre à jour),
 * ils suivent la langue du lecteur d'écran, et ils restent nets à n'importe quelle
 * taille. Le choix couvre le quotidien, l'école et le travail, dans cet ordre.
 */
export const STEP_ICONS = [
  '🌅', '🛏️', '🚿', '🪥', '👕', '🥣', '🍽️', '🧃',
  '🎒', '🧥', '🚌', '💊', '🧹', '🧺', '🛒', '🐕',
  '📖', '✏️', '📚', '🔢', '🎨', '🎵', '🧰', '🧠',
  '💻', '📧', '📞', '🗂️', '🏃', '🧘', '🧸', '🌙'
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

/**
 * Routines livrées avec l'app. Elles servent de modèle : la plupart des utilisateurs
 * n'imaginent pas ce qu'est une routine tant qu'ils n'en ont pas vu une.
 */
export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'morning',
    name: '',
    nameKey: 'routine.morning',
    icon: '🌅',
    steps: [
      { id: 'morning-dress', name: '', nameKey: 'routine.morning.dress', icon: '👕', seconds: 10 * 60, color: '#f3a52b', kind: 'break' },
      { id: 'morning-breakfast', name: '', nameKey: 'routine.morning.breakfast', icon: '🥣', seconds: 15 * 60, color: '#56b27b', kind: 'break' },
      { id: 'morning-teeth', name: '', nameKey: 'routine.morning.teeth', icon: '🪥', seconds: 3 * 60, color: '#5aa9c4', kind: 'break' },
      { id: 'morning-bag', name: '', nameKey: 'routine.morning.bag', icon: '🎒', seconds: 5 * 60, color: '#8b6fd6', kind: 'break' }
    ]
  },
  {
    id: 'tabata',
    name: '',
    nameKey: 'routine.tabata',
    icon: '💪',
    // Huit tours de 20 s d'effort et 10 s de repos : le Tabata, tel qu'il se pratique.
    // Pas d'échauffement dans la liste — les tours rejouent la routine entière, il
    // reviendrait huit fois. Un échauffement se fait en routine à part.
    rounds: 8,
    steps: [
      { id: 'tabata-work', name: '', nameKey: 'routine.tabata.work', icon: '🏃', seconds: 20, color: '#d63f4f', kind: 'focus' },
      { id: 'tabata-rest', name: '', nameKey: 'routine.tabata.rest', icon: '🧘', seconds: 10, color: '#56b27b', kind: 'break' }
    ]
  },
  {
    id: 'homework',
    name: '',
    nameKey: 'routine.homework',
    icon: '📚',
    steps: [
      { id: 'homework-setup', name: '', nameKey: 'routine.homework.setup', icon: '🧰', seconds: 3 * 60, color: '#56636a', kind: 'break' },
      { id: 'homework-work', name: '', nameKey: 'routine.homework.work', icon: '📖', seconds: 20 * 60, color: '#8b6fd6', kind: 'focus' },
      { id: 'homework-pause', name: '', nameKey: 'routine.homework.pause', icon: '🧃', seconds: 5 * 60, color: '#56b27b', kind: 'break' },
      { id: 'homework-tidy', name: '', nameKey: 'routine.homework.tidy', icon: '🧹', seconds: 3 * 60, color: '#5aa9c4', kind: 'break' }
    ]
  }
];
