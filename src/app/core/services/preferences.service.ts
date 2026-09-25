import { Injectable, signal } from '@angular/core';
import { readFlag, readOption, readPref, writeFlag, writePref } from '../helpers/storage';
import { SPEECH_MODES, VISUAL_ALERTS, type SpeechMode, type VisualAlert } from '../models/preferences.model';

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
  /** Vibration : motif par palier, et confirmation au réglage. Seul canal d'alerte tactile. */
  readonly haptics = signal(readFlag('haptics'));
  /** À 0, relance automatiquement 5 minutes pour terminer ce qui est en cours (sessions de travail). */
  readonly autoExtra = signal(readFlag('auto-extra'));
  /** Enchaîne automatiquement travail → pause → travail. */
  readonly autoChain = signal(readFlag('auto-chain', false));
  readonly keepAwake = signal(readFlag('keep-awake'));
  /** Signal visuel aux paliers et à la fin : la seule alerte qui reste sans le son. */
  readonly visualAlert = signal<VisualAlert>(readOption('visual-alert', VISUAL_ALERTS, 'soft'));
  /**
   * Temps restant dit à voix haute. Éteint par défaut : la voix se superposerait au lecteur
   * d'écran de qui ne l'a pas demandée, et surprendrait tout le monde au premier lancement.
   */
  readonly speech = signal<SpeechMode>(readOption('speech', SPEECH_MODES, 'off'));

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

  setHaptics(on: boolean): void {
    this.haptics.set(on);
    writeFlag('haptics', on);
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

  setSpeech(mode: SpeechMode): void {
    this.speech.set(mode);
    writePref('speech', mode);
  }

  private static initialDarkMode(): boolean {
    const saved = readPref('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
