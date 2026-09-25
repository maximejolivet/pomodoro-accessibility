/**
 * Intensité du signal visuel joué aux paliers et à la fin du décompte : sans lui, une
 * personne sourde ou malentendante (ou qui a coupé le son) n'a aucune alerte sur le web,
 * où la vibration n'existe pas.
 */
export type VisualAlert = 'off' | 'soft' | 'strong';

export const VISUAL_ALERTS: readonly VisualAlert[] = ['off', 'soft', 'strong'];
