import { Injectable, signal } from '@angular/core';
import { readFlag, readPref, writeFlag, writePref } from '../helpers/storage';

/**
 * Préférences de l'utilisateur, en signaux : la coquille de l'app y lit le thème,
 * la page du minuteur les réglages. Chaque changement est écrit dans localStorage.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  /** Thème sombre : choix enregistré, sinon celui du système. */
  readonly darkMode = signal(PreferencesService.initialDarkMode());
  readonly opendyslexic = signal(readFlag('opendyslexic', false));
  readonly sound = signal(readFlag('sound'));
  /** À 0, relance automatiquement 5 minutes pour terminer ce qui est en cours (sessions de travail). */
  readonly autoExtra = signal(readFlag('auto-extra'));
  /** Enchaîne automatiquement travail → pause → travail. */
  readonly autoChain = signal(readFlag('auto-chain', false));
  readonly keepAwake = signal(readFlag('keep-awake'));

  setDarkMode(on: boolean): void {
    this.darkMode.set(on);
    writePref('theme', on ? 'dark' : 'light');
  }

  setOpendyslexic(on: boolean): void {
    this.opendyslexic.set(on);
    writeFlag('opendyslexic', on);
  }

  setSound(on: boolean): void {
    this.sound.set(on);
    writeFlag('sound', on);
  }

  setAutoExtra(on: boolean): void {
    this.autoExtra.set(on);
    writeFlag('auto-extra', on);
  }

  setAutoChain(on: boolean): void {
    this.autoChain.set(on);
    writeFlag('auto-chain', on);
  }

  setKeepAwake(on: boolean): void {
    this.keepAwake.set(on);
    writeFlag('keep-awake', on);
  }

  private static initialDarkMode(): boolean {
    const saved = readPref('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
