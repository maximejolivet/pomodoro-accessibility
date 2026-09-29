import { Injectable } from '@angular/core';
import type { MilestoneTone } from '../constants/timer.constants';
import {
  CUE_PATTERNS, ENVELOPE, SOUND_PATTERNS, SoundId, SoundPattern, level, voices
} from '../helpers/sound-patterns';

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

  /** Timbre de palier : le premier (doux), le deuxième (montant) ou le dernier (insistant). */
  milestone(tone: MilestoneTone): void {
    this.play(`milestone${tone}`);
  }

  /** Fin du minuteur. */
  end(): void {
    this.play('end');
  }

  /** Tic d'une des dernières secondes d'une étape courte : « 3, 2, 1 ». */
  tick(): void {
    this.render(CUE_PATTERNS.tick);
  }

  play(id: SoundId): void {
    this.render(SOUND_PATTERNS[id]);
  }

  private render(pattern: SoundPattern): void {
    if (!this.enabled) return;
    const ctx = this.context();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    // Le motif est porté à la même crête que son fichier WAV, mesurée sur le signal rendu.
    // Pas de limiteur derrière : la marge laissée par `PEAK_TARGET` absorbe le peu que les
    // oscillateurs de Web Audio ajoutent en partant d'une phase quelconque (crête relevée à
    // -0,5 dB au pire), et un compresseur écraserait le tic, trop bref pour lui échapper.
    const master = ctx.createGain();
    master.gain.value = level(pattern);
    master.connect(ctx.destination);

    const now = ctx.currentTime + 0.02;
    for (const v of voices(pattern)) {
      const start = now + v.at;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = v.wave;
      osc.frequency.value = v.freq;
      gain.gain.setValueAtTime(ENVELOPE.floor, start);
      gain.gain.exponentialRampToValueAtTime(v.gain, start + ENVELOPE.attack);
      gain.gain.exponentialRampToValueAtTime(v.gain * ENVELOPE.decay, start + v.dur);
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
