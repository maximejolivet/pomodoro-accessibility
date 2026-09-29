/**
 * Définition des sons, partagée entre l'app (Web Audio) et la génération des fichiers WAV
 * pour les notifications natives (`scripts/generate-sounds.ts`).
 * Ce fichier ne doit rien importer : il est aussi exécuté directement par Node.
 */

export type Wave = 'sine' | 'triangle' | 'square';

export interface Note {
  freq: number;
  /** Décalage en secondes. */
  at: number;
  /** Durée de résonance en secondes. */
  dur: number;
  gain: number;
  wave: Wave;
}

export interface SoundPattern {
  notes: Note[];
  /** Ajoute un partiel aigu pour un son de cloche. */
  bell?: boolean;
}

export type SoundId = 'milestone45' | 'milestone30' | 'milestone15' | 'end';

const endArpeggio: Note[] = [];
for (let rep = 0; rep < 3; rep++) {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    endArpeggio.push({ freq, at: rep * 1.1 + i * 0.14, dur: 1.6, gain: 0.45, wave: 'sine' });
  });
}

export const SOUND_PATTERNS: Record<SoundId, SoundPattern> = {
  // 45 min : une note douce et grave
  milestone45: {
    notes: [{ freq: 523.25, at: 0, dur: 1.4, gain: 0.35, wave: 'sine' }]
  },
  // 30 min : deux notes montantes, timbre plus clair
  milestone30: {
    notes: [
      { freq: 587.33, at: 0, dur: 0.9, gain: 0.35, wave: 'triangle' },
      { freq: 880, at: 0.28, dur: 1.2, gain: 0.35, wave: 'triangle' }
    ]
  },
  // 15 min : trois notes rapides, plus insistantes. L'onde carrée porte plus d'énergie qu'une
  // sinusoïde à crête égale : à la mise à niveau, ce motif sort perçu un peu plus fort que
  // les autres — c'est le dernier palier, celui qu'il faut le moins manquer.
  milestone15: {
    notes: [
      { freq: 659.25, at: 0, dur: 0.5, gain: 0.3, wave: 'square' },
      { freq: 783.99, at: 0.16, dur: 0.5, gain: 0.3, wave: 'square' },
      { freq: 987.77, at: 0.32, dur: 1.0, gain: 0.3, wave: 'square' }
    ]
  },
  // Fin : carillon en arpège répété trois fois
  end: { notes: endArpeggio, bell: true }
};

/**
 * Motifs joués seulement dans l'application, jamais par une notification : ils n'ont donc
 * ni fichier WAV ni canal Android. Le tic des dernières secondes en fait partie — il
 * arrive une fois par seconde, ce qu'aucune notification ne saurait faire.
 */
export const CUE_PATTERNS = {
  // Une note brève et sèche, assez haute pour passer par-dessus un souffle d'effort
  tick: { notes: [{ freq: 880, at: 0, dur: 0.12, gain: 0.3, wave: 'sine' as Wave }] }
} satisfies Record<string, SoundPattern>;

/** Noms des fichiers (minuscules et _ : contrainte des ressources Android `res/raw`). */
export const SOUND_FILES: Record<SoundId, string> = {
  milestone45: 'milestone_45.wav',
  milestone30: 'milestone_30.wav',
  milestone15: 'milestone_15.wav',
  end: 'session_end.wav'
};

/**
 * Crête visée par chaque motif, à un cheveu du maximum. Un son d'alerte doit sortir fort :
 * c'est l'appareil qui décide du volume, pas nous, et sur Android il ne fait que réduire ce
 * qu'on lui donne. Un fichier rendu à mi-échelle arrive donc deux fois trop discret, et la
 * notification passe inaperçue — exactement ce qu'elle est censée empêcher.
 */
export const PEAK_TARGET = 0.89;

/**
 * Niveau atteint par une note au bout de sa durée, relatif à sa crête (-48 dB). Relatif et
 * non absolu : une décroissance jusqu'à un plancher fixe plonge d'autant plus vite que la
 * note part bas, si bien qu'une note douce n'était qu'un claquement. Là, toutes les notes
 * résonnent de la même façon — et ce qui résonne s'entend.
 */
const DECAY = 0.004;

const ATTACK = 0.015;
const FLOOR = 0.0001;

/** Échantillonnage du rendu : celui des WAV, et celui qui sert à mesurer la crête. */
const SAMPLE_RATE = 22050;

/** Voix jouées, partiel de cloche compris (même rendu en Web Audio et en WAV). */
export function voices(pattern: SoundPattern): Note[] {
  const list: Note[] = [];
  for (const n of pattern.notes) {
    list.push({ ...n });
    if (pattern.bell) {
      list.push({ freq: n.freq * 2.76, at: n.at, dur: n.dur * 0.5, gain: n.gain * 0.25, wave: 'sine' });
    }
  }
  return list;
}

/** Enveloppe : attaque exponentielle rapide puis décroissance exponentielle jusqu'à `dur`. */
export function envelope(t: number, peak: number, dur: number): number {
  if (t < 0 || t > dur) return 0;
  if (t < ATTACK) return FLOOR * Math.pow(peak / FLOOR, t / ATTACK);
  return peak * Math.pow(DECAY, (t - ATTACK) / (dur - ATTACK));
}

export const ENVELOPE = { attack: ATTACK, floor: FLOOR, decay: DECAY };

function oscillator(wave: Wave, phase: number): number {
  const x = phase - Math.floor(phase);
  switch (wave) {
    case 'sine':
      return Math.sin(2 * Math.PI * x);
    case 'triangle':
      return 1 - 4 * Math.abs(x - 0.5);
    case 'square':
      return x < 0.5 ? 1 : -1;
  }
}

/** Durée totale du motif, résonance de la dernière note comprise. */
function duration(list: Note[]): number {
  return Math.max(...list.map(v => v.at + v.dur)) + 0.1;
}

/** Somme des voix, sans mise à niveau : le signal brut, tel que les gains des notes le décrivent. */
function renderSamples(pattern: SoundPattern, sampleRate: number): Float32Array {
  const list = voices(pattern);
  const count = Math.ceil(duration(list) * sampleRate);
  const samples = new Float32Array(count);

  for (const v of list) {
    const start = Math.floor(v.at * sampleRate);
    const end = Math.min(count, Math.ceil((v.at + v.dur) * sampleRate));
    for (let i = start; i < end; i++) {
      const t = i / sampleRate - v.at;
      samples[i] += oscillator(v.wave, v.freq * t) * envelope(t, v.gain, v.dur);
    }
  }
  return samples;
}

const levels = new WeakMap<SoundPattern, number>();

/**
 * Facteur qui porte un motif à `PEAK_TARGET`. Mesuré sur le signal rendu, et non déduit des
 * gains des notes : celles qui se chevauchent s'additionnent, et le faire à la main revient
 * soit à écrêter, soit à rester bien en dessous — c'est ce qui laissait les trois dernières
 * notes dix décibels sous les autres. Mesuré une fois et retenu, le calcul valant un rendu.
 */
export function level(pattern: SoundPattern): number {
  const known = levels.get(pattern);
  if (known !== undefined) return known;

  let peak = 0;
  for (const s of renderSamples(pattern, SAMPLE_RATE)) peak = Math.max(peak, Math.abs(s));
  // Un motif muet (le silence des notifications sans son) n'a pas de crête à porter
  const factor = peak > 0 ? PEAK_TARGET / peak : 1;
  levels.set(pattern, factor);
  return factor;
}

/** Rend un motif en fichier WAV PCM 16 bits mono. */
export function renderWav(pattern: SoundPattern, sampleRate = SAMPLE_RATE): Uint8Array {
  const samples = renderSamples(pattern, sampleRate);
  const gain = level(pattern);
  const count = samples.length;

  const dataSize = count * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);            // PCM
  view.setUint16(22, 1, true);            // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < count; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] * gain));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return new Uint8Array(buffer);
}
