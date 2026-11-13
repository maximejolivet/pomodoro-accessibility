import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { WidgetState } from '../models/widget-state.model';

/** Plugin natif propre à l'app (`LiveStatusPlugin.java`, Android uniquement). */
interface LiveStatusPlugin {
  update(options: { json: string }): Promise<void>;
  hide(): Promise<void>;
}

const LiveStatus = registerPlugin<LiveStatusPlugin>('LiveStatus');

/**
 * Le décompte qui reste sous les yeux quand l'app ne l'est plus : une notification
 * permanente et muette sur Android. Elle montre le même état que le widget - on lui donne
 * d'ailleurs le même JSON - mais là où le widget attend qu'on aille le voir, celle-ci se
 * pose sur l'écran verrouillé.
 *
 * Aucun effet dans le navigateur ni sur iOS, où le plugin n'existe pas.
 */
@Injectable({ providedIn: 'root' })
export class LiveStatusService {
  private readonly enabled = Capacitor.getPlatform() === 'android';
  private lastJson = '';

  update(state: WidgetState): void {
    if (!this.enabled) return;
    const json = JSON.stringify(state);
    if (json === this.lastJson) return;
    this.lastJson = json;
    LiveStatus.update({ json }).catch(err => {
      // Notifications refusées : le décompte, lui, continue
      console.warn('[live]', err);
      this.lastJson = '';
    });
  }
}
