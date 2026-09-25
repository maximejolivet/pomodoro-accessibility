import { Injectable } from '@angular/core';

/**
 * Lecture à voix haute par la synthèse du navigateur (Web Speech), sans aucun fichier
 * ni service en ligne : le texte ne sort pas de l'appareil.
 *
 * C'est le pendant vocal du cadran. Un disque qui rétrécit ne dit rien à qui ne le voit
 * pas, et les sons de palier signalent qu'un repère est passé sans dire lequel : la voix
 * donne le temps restant lui-même.
 */
@Injectable({ providedIn: 'root' })
export class SpeechService {
  /** Débit légèrement ralenti : on annonce un chiffre à retenir, pas une phrase à survoler. */
  private static readonly RATE = 0.95;

  private voices: SpeechSynthesisVoice[] = [];

  /** Faux sur les navigateurs sans synthèse : le réglage est alors masqué plutôt qu'inerte. */
  get available(): boolean {
    return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  /** Dit le texte dans la langue de l'interface, en coupant l'annonce précédente. */
  speak(text: string, lang: string): void {
    if (!this.available) return;
    // Deux voix qui se superposent ne s'entendent plus : la dernière annonce est la bonne
    this.stop();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = SpeechService.RATE;
    const voice = this.voiceFor(lang);
    if (voice) utterance.voice = voice;
    try {
      speechSynthesis.speak(utterance);
    } catch {
      // synthèse indisponible ou refusée : le son et le signal visuel restent
    }
  }

  stop(): void {
    if (!this.available) return;
    try {
      speechSynthesis.cancel();
    } catch {
      // rien à annuler
    }
  }

  /**
   * Première voix de la langue demandée. La liste arrive de façon asynchrone sur certains
   * navigateurs : tant qu'elle est vide, on ne la met pas en cache et on laisse la voix
   * par défaut, qui suit déjà `utterance.lang`.
   */
  private voiceFor(lang: string): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.voices = speechSynthesis.getVoices() ?? [];
    }
    const prefix = lang.toLowerCase();
    return this.voices.find(v => v.lang.toLowerCase().startsWith(prefix)) ?? null;
  }
}
