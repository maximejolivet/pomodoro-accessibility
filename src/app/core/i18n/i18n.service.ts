import { Injectable, computed, signal } from '@angular/core';
import { readPref, writePref } from '../helpers/storage';
import { RTL_LANGS, type I18nKey, type Lang, type LangChoice } from './i18n.model';
import { DICTIONARIES } from './locales';
import { fr } from './locales/fr';

const LANG_KEY = 'lang';

function isLang(value: string | null): value is Lang {
  return value !== null && Object.hasOwn(DICTIONARIES, value);
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly choice = signal<LangChoice>(this.savedChoice());
  readonly lang = computed<Lang>(() => {
    const c = this.choice();
    return c === 'auto' ? this.systemLang() : c;
  });
  readonly dir = computed<'ltr' | 'rtl'>(() => (RTL_LANGS.has(this.lang()) ? 'rtl' : 'ltr'));

  constructor() {
    this.applyToDocument();
  }

  setChoice(choice: LangChoice): void {
    this.choice.set(choice);
    writePref(LANG_KEY, choice);
    this.applyToDocument();
  }

  t(key: I18nKey, params?: Record<string, string | number>): string {
    let text = DICTIONARIES[this.lang()][key] ?? fr[key];
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  }

  private applyToDocument(): void {
    document.documentElement.lang = this.lang();
    document.documentElement.dir = this.dir();
  }

  private savedChoice(): LangChoice {
    const saved = readPref(LANG_KEY);
    return isLang(saved) ? saved : 'auto';
  }

  /** Langue du système si elle est disponible, sinon l'anglais. */
  private systemLang(): Lang {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'fr'];
    for (const tag of langs) {
      const base = tag.toLowerCase().split('-')[0];
      if (isLang(base)) return base;
    }
    return 'en';
  }
}
