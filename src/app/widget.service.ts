import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

/** Plugin natif propre à l'app (ios/App/App/WidgetBridgePlugin.swift). */
interface WidgetBridgePlugin {
  update(options: { json: string }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

/** État lu par le widget iOS (voir WidgetState dans PomodoroWidget.swift). */
export interface WidgetState {
  /** Début (ms) du jour auquel se rapporte `focusMinutes`. */
  dayStart: number;
  focusMinutes: number;
  goalMinutes: number;
  timer: {
    state: 'running' | 'paused' | 'idle';
    name: string;
    color: string;
    /** Heure de fin (ms) si le décompte tourne. */
    endAt?: number;
    /** Temps restant (s) en pause. */
    remainingSeconds?: number;
  };
  /** Libellés déjà traduits dans la langue de l'app. */
  labels: {
    today: string;
    goalReached: string;
    paused: string;
    ready: string;
    finished: string;
  };
  rtl: boolean;
}

/** Widget d'écran d'accueil (iOS) : l'app lui transmet son état, le widget décompte seul ensuite. */
@Injectable({ providedIn: 'root' })
export class WidgetService {
  private readonly enabled = Capacitor.getPlatform() === 'ios';
  private lastJson = '';

  update(state: WidgetState): void {
    if (!this.enabled) return;
    const json = JSON.stringify(state);
    if (json === this.lastJson) return;
    this.lastJson = json;
    WidgetBridge.update({ json }).catch(err => {
      // App Group indisponible (signature) : on retentera au prochain changement
      console.warn('[widget]', err);
      this.lastJson = '';
    });
  }
}
