import type { I18nKey } from '../i18n/i18n.model';

/** Nature d'un mode : elle décide de l'enchaînement travail → pause. */
export type PresetKind = 'focus' | 'break' | 'longBreak';

export interface Preset {
  id: string;
  /** Nom saisi par l'utilisateur ; vide pour un mode par défaut (nom traduit via `nameKey`). */
  name: string;
  nameKey?: I18nKey;
  seconds: number;
  color: string;
  kind: PresetKind;
}
