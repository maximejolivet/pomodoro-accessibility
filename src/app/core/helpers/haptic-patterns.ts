/**
 * Motifs de vibration, jumeaux des motifs sonores de `sound-patterns.ts` : même
 * progression du discret à l'insistant à mesure que la fin approche, mais dans la main.
 *
 * C'est le seul canal qui reste à une personne sourde-aveugle — la voix ne l'atteint pas,
 * le cadran et le signal visuel non plus. Il sert aussi à prévenir sans rien montrer ni
 * faire entendre : en réunion, en cours, en open space.
 *
 * Ce qui distingue un palier d'un autre est d'abord le **nombre d'impulsions et leur
 * rythme**, et non leur seule durée : celle-ci est respectée sur Android et sur les iPhone
 * à Taptic Engine (CoreHaptics), mais les appareils iOS plus anciens retombent sur une
 * vibration système de longueur fixe. Le rythme, lui, passe partout.
 */

export type HapticId = 'milestone45' | 'milestone30' | 'milestone15' | 'end';

/** Une impulsion : sa durée, puis le silence qui la sépare de la suivante (millisecondes). */
export interface Pulse {
  duration: number;
  pause: number;
}

export const HAPTIC_PATTERNS: Record<HapticId, Pulse[]> = {
  // 45 min : une impulsion longue et posée, comme la note douce et grave
  milestone45: [{ duration: 320, pause: 0 }],
  // 30 min : deux impulsions, comme les deux notes montantes
  milestone30: [
    { duration: 200, pause: 180 },
    { duration: 200, pause: 0 }
  ],
  // 15 min : trois impulsions rapides, comme les trois notes « bip »
  milestone15: [
    { duration: 120, pause: 100 },
    { duration: 120, pause: 100 },
    { duration: 180, pause: 0 }
  ],
  // Fin : trois longues impulsions espacées, comme le carillon joué trois fois
  end: [
    { duration: 500, pause: 320 },
    { duration: 500, pause: 320 },
    { duration: 500, pause: 0 }
  ]
};

/** Durée totale d'un motif, pauses comprises. */
export function patternMs(id: HapticId): number {
  return HAPTIC_PATTERNS[id].reduce((total, p) => total + p.duration + p.pause, 0);
}
