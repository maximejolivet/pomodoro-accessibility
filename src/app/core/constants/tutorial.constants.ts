import type { I18nKey } from '../i18n/i18n.model';

/** Une vue du tutoriel : un pictogramme, un titre, une phrase. */
export interface TutorialSlide {
  icon: string;
  titleKey: I18nKey;
  textKey: I18nKey;
  color: string;
}

/**
 * Les cinq vues du tutoriel d'accueil.
 *
 * Cinq, et pas dix : un tutoriel long est un tutoriel passé, et l'application s'adresse
 * d'abord à des personnes que la lecture fatigue ou que l'attention lâche. L'ordre suit
 * celui de la découverte — voir le temps, le régler, le lancer, puis ce qu'il y a autour.
 *
 * Le pictogramme vient avant le titre, comme dans les routines : il porte l'idée pour
 * qui ne lit pas encore, ou plus.
 */
export const TUTORIAL_SLIDES: readonly TutorialSlide[] = [
  { icon: '🕒', titleKey: 'tutorial.1.title', textKey: 'tutorial.1.text', color: '#8b6fd6' },
  { icon: '👆', titleKey: 'tutorial.2.title', textKey: 'tutorial.2.text', color: '#f3a52b' },
  { icon: '▶️', titleKey: 'tutorial.3.title', textKey: 'tutorial.3.text', color: '#56b27b' },
  { icon: '🧩', titleKey: 'tutorial.4.title', textKey: 'tutorial.4.text', color: '#5aa9c4' },
  { icon: '🔔', titleKey: 'tutorial.5.title', textKey: 'tutorial.5.text', color: '#d63f4f' }
];
