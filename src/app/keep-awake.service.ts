import { Injectable } from '@angular/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

/** Garde l'écran allumé pendant le décompte (Wake Lock sur le web, API native sur mobile). */
@Injectable({ providedIn: 'root' })
export class KeepAwakeService {
  private active = false;

  async set(on: boolean): Promise<void> {
    if (on === this.active) return;
    this.active = on;
    try {
      const { isSupported } = await KeepAwake.isSupported();
      if (!isSupported) return;
      await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep());
    } catch {
      // non supporté (navigateur ancien, onglet caché) : sans conséquence
    }
  }

  /** Le Wake Lock du navigateur est relâché quand l'onglet est caché : on le redemande au retour. */
  refresh(): void {
    if (!this.active) return;
    this.active = false;
    this.set(true);
  }
}
