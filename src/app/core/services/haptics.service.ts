import { Injectable } from '@angular/core';
import { HAPTIC_PATTERNS, type HapticId } from '../helpers/haptic-patterns';

/**
 * Vibrations de l'appareil : un motif reconnaissable par palier (voir `haptic-patterns.ts`),
 * et une impulsion légère de confirmation pendant le réglage.
 *
 * Le module Capacitor est chargé à la demande : sur le web, la vibration n'existe que sur
 * Android, et une plateforme sans vibration ne doit ni peser dans le paquet ni lever d'erreur.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  enabled = true;

  private plugin: Promise<typeof import('@capacitor/haptics')> | null = null;
  private pulseTimers: ReturnType<typeof setTimeout>[] = [];

  /** Joue un motif : une vibration par impulsion, espacées par les pauses du motif. */
  play(id: HapticId): void {
    if (!this.enabled) return;
    // Un motif chasse le précédent : deux rythmes mêlés ne se distinguent plus
    this.stop();
    let at = 0;
    for (const pulse of HAPTIC_PATTERNS[id]) {
      const start = at;
      this.pulseTimers.push(setTimeout(() => this.vibrate(pulse.duration), start));
      at += pulse.duration + pulse.pause;
    }
  }

  /** Confirmation d'un pas de réglage (minute ajoutée ou retirée). */
  impact(): void {
    if (!this.enabled) return;
    this.haptics()
      .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
      .catch(() => {});
  }

  /** Interrompt un motif en cours : reset, pause, ou arrêt du décompte. */
  stop(): void {
    for (const timer of this.pulseTimers) clearTimeout(timer);
    this.pulseTimers = [];
  }

  private vibrate(duration: number): void {
    this.haptics()
      .then(({ Haptics }) => Haptics.vibrate({ duration }))
      .catch(() => {
        // pas de vibration sur cette plateforme (iOS sur le web, ordinateur) : le son,
        // la voix et le signal visuel restent
      });
  }

  private haptics(): Promise<typeof import('@capacitor/haptics')> {
    this.plugin ??= import('@capacitor/haptics');
    return this.plugin;
  }
}
