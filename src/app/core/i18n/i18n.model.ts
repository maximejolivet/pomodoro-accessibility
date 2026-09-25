import { fr } from './locales/fr';

/** Clés de traduction, typées d'après le français : une clé manquante ailleurs ne compile pas. */
export type I18nKey = keyof typeof fr;
export type Dictionary = Record<I18nKey, string>;

/**
 * Langues disponibles. Pour en ajouter une : un fichier dans `locales/`, une entrée
 * dans cette union, dans `DICTIONARIES`, dans `LANGUAGES` — et dans `RTL_LANGS` si
 * elle s'écrit de droite à gauche.
 */
export type Lang = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ar';
export type LangChoice = Lang | 'auto';

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' }
];

/** Langues écrites de droite à gauche. */
export const RTL_LANGS: ReadonlySet<Lang> = new Set<Lang>(['ar']);
