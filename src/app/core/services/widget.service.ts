import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { WidgetState } from '../models/widget-state.model';

/** Plugin natif propre à l'app (ios/App/App/WidgetBridgePlugin.swift). */
interface WidgetBridgePlugin {
  update(options: { json: string }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

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
