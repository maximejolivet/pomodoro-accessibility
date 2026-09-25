import { Injectable, signal } from '@angular/core';
import { readFlag, readOption, readPref, writeFlag, writePref } from '../helpers/storage';
import { VISUAL_ALERTS, type VisualAlert } from '../models/preferences.model';

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
  /** Signal visuel aux paliers et à la fin : la seule alerte qui reste sans le son. */
  readonly visualAlert = signal<VisualAlert>(readOption('visual-alert', VISUAL_ALERTS, 'soft'));

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

  setVisualAlert(level: VisualAlert): void {
    this.visualAlert.set(level);
    writePref('visual-alert', level);
  }

  private static initialDarkMode(): boolean {
    const saved = readPref('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
