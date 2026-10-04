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

// Nouvelle fin : mélodie longue et majestueuse (Do-Mi-Sol-Do en crescendo)
const endMelody: Note[] = [
  // Phrase 1: Do-Mi-Sol-Do (doux, fondation)
  { freq: 261.63, at: 0.0, dur: 0.5, gain: 0.35, wave: 'sine' },
  { freq: 329.63, at: 0.55, dur: 0.5, gain: 0.35, wave: 'sine' },
  { freq: 392.0, at: 1.1, dur: 0.7, gain: 0.38, wave: 'sine' },
  { freq: 523.25, at: 1.9, dur: 1.0, gain: 0.4, wave: 'sine' },

  // Phrase 2: Arpège montant Do-Mi-Sol-Do-Mi-Sol (plus fort, plus rapide)
  { freq: 261.63, at: 3.1, dur: 0.3, gain: 0.38, wave: 'triangle' },
  { freq: 329.63, at: 3.45, dur: 0.3, gain: 0.38, wave: 'triangle' },
  { freq: 392.0, at: 3.8, dur: 0.3, gain: 0.4, wave: 'triangle' },
  { freq: 523.25, at: 4.15, dur: 0.3, gain: 0.4, wave: 'triangle' },
  { freq: 659.25, at: 4.5, dur: 0.3, gain: 0.42, wave: 'triangle' },
  { freq: 783.99, at: 4.85, dur: 0.4, gain: 0.42, wave: 'triangle' },

  // Phrase 3: Do aigu prolongé (climax)
  { freq: 523.25, at: 5.35, dur: 1.5, gain: 0.45, wave: 'sine' },

  // Phrase 4: Resolution Sol-Mi-Do (retour au calme, satisfaction)
  { freq: 392.0, at: 7.0, dur: 0.6, gain: 0.4, wave: 'sine' },
  { freq: 329.63, at: 7.7, dur: 0.6, gain: 0.38, wave: 'sine' },
  { freq: 261.63, at: 8.4, dur: 1.2, gain: 0.4, wave: 'sine' }
];

export const SOUND_PATTERNS: Record<SoundId, SoundPattern> = {
  // 45 min : bip grave et chaud (approche, pas urgent)
  milestone45: {
    notes: [
      { freq: 440, at: 0, dur: 0.3, gain: 0.38, wave: 'sine' },
      { freq: 440, at: 0.35, dur: 0.3, gain: 0.35, wave: 'sine' }
    ]
  },
  // 30 min : deux bips montants (moyen urgent)
  milestone30: {
    notes: [
      { freq: 600, at: 0, dur: 0.25, gain: 0.4, wave: 'sine' },
      { freq: 800, at: 0.3, dur: 0.35, gain: 0.42, wave: 'sine' }
    ]
  },
  // 15 min : trois bips aigus rapides (très urgent!) - tonalité carrée pour plus d'impact
  milestone15: {
    notes: [
      { freq: 900, at: 0, dur: 0.2, gain: 0.38, wave: 'square' },
      { freq: 1000, at: 0.25, dur: 0.2, gain: 0.38, wave: 'square' },
      { freq: 1100, at: 0.5, dur: 0.3, gain: 0.4, wave: 'square' }
    ]
  },
  // Fin : mélodie agréable Do-Mi-Sol-Do (accord majeur optimiste)
  end: { notes: endMelody }
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
