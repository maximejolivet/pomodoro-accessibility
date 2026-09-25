/**
 * Intensité du signal visuel joué aux paliers et à la fin du décompte : sans lui, une
 * personne sourde ou malentendante (ou qui a coupé le son) n'a aucune alerte sur le web,
 * où la vibration n'existe pas.
 */
export type VisualAlert = 'off' | 'soft' | 'strong';

export const VISUAL_ALERTS: readonly VisualAlert[] = ['off', 'soft', 'strong'];

/**
 * Annonce vocale du temps restant : aux trois paliers, ou à chaque minute ronde. Sans elle,
 * une personne aveugle ou très malvoyante n'a rien — le cadran est muet, et les sons de
 * palier disent qu'un repère approche sans dire lequel.
 */
export type SpeechMode = 'off' | 'milestones' | 'minutes';

export const SPEECH_MODES: readonly SpeechMode[] = ['off', 'milestones', 'minutes'];
