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
