import type { Dictionary, Lang } from '../i18n.model';
import { fr } from './fr';
import { en } from './en';
import { es } from './es';
import { de } from './de';
import { it } from './it';
import { pt } from './pt';
import { ar } from './ar';

export const DICTIONARIES: Record<Lang, Dictionary> = { fr, en, es, de, it, pt, ar };
