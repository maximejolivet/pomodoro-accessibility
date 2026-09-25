import { Injectable } from '@angular/core';
import { ENVELOPE, MASTER_GAIN, SOUND_PATTERNS, SoundId, voices } from '../helpers/sound-patterns';

/**
 * Sons synthétisés avec Web Audio (aucun fichier audio).
 * Chaque palier a un timbre et un motif différents pour être reconnu sans regarder l'écran.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private ctx: AudioContext | null = null;
  enabled = true;

  /** À appeler depuis un geste utilisateur (tap) pour autoriser l'audio, surtout sur iOS. */
  unlock(): void {
    const ctx = this.context();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  /** Palier de temps restant : 45, 30 ou 15 minutes. */
  milestone(minutes: 45 | 30 | 15): void {
    this.play(`milestone${minutes}`);
  }

  /** Fin du minuteur. */
  end(): void {
    this.play('end');
  }

  play(id: SoundId): void {
    if (!this.enabled) return;
    const ctx = this.context();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);

    const now = ctx.currentTime + 0.02;
    for (const v of voices(SOUND_PATTERNS[id])) {
      const start = now + v.at;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = v.wave;
      osc.frequency.value = v.freq;
      gain.gain.setValueAtTime(ENVELOPE.floor, start);
      gain.gain.exponentialRampToValueAtTime(v.gain, start + ENVELOPE.attack);
      gain.gain.exponentialRampToValueAtTime(ENVELOPE.floor, start + v.dur);
      osc.connect(gain).connect(master);
      osc.start(start);
      osc.stop(start + v.dur + 0.05);
    }
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }
}
