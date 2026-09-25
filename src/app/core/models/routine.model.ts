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
}

/** Durée totale d'une routine, en secondes. */
export function routineSeconds(routine: Routine): number {
  return routine.steps.reduce((total, step) => total + step.seconds, 0);
}
