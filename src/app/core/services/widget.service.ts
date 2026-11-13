import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { WidgetState } from '../models/widget-state.model';

/** Plugin natif propre à l'app (`WidgetBridgePlugin.java`, Android uniquement). */
interface WidgetBridgePlugin {
  update(options: { json: string }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

/**
 * Widget d'écran d'accueil (Android) : l'app lui transmet son état, le widget décompte seul
 * ensuite. Le plugin est local à l'app - `WidgetBridgePlugin.java` - et il n'existe pas sur
 * iOS : on n'y appelle rien, plutôt que d'échouer et de réessayer à chaque changement.
 */
@Injectable({ providedIn: 'root' })
export class WidgetService {
  private readonly enabled = Capacitor.getPlatform() === 'android';
  private lastJson = '';

  update(state: WidgetState): void {
    if (!this.enabled) return;
    const json = JSON.stringify(state);
    if (json === this.lastJson) return;
    this.lastJson = json;
    WidgetBridge.update({ json }).catch(err => {
      // Widget indisponible : on retentera au prochain changement
      console.warn('[widget]', err);
      this.lastJson = '';
    });
  }
}
