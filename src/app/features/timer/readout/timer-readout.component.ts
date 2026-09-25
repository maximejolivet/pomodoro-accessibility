import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LONG_BREAK_EVERY } from '../../../core/constants/timer.constants';
import { formatTime } from '../../../core/helpers/time';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Preset } from '../../../core/models/preset.model';
import { SessionService } from '../../../core/services/session.service';

/** Attente avant que l'appui maintenu se mette à répéter, puis intervalle entre deux pas. */
const HOLD_DELAY_MS = 450;
const HOLD_INTERVAL_MS = 110;

/**
 * Temps restant, mode et position dans le cycle travail / pause, encadrés par
 * les boutons − / + : le seul moyen de régler la durée au doigt sans glisser sur le
 * cadran, exigé par la WCAG 2.2 (critère 2.5.7, mouvements de glissement).
 */
@Component({
  selector: 'app-timer-readout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer-readout.component.html',
  styleUrl: './timer-readout.component.css'
})
export class TimerReadoutComponent implements OnDestroy {
  private readonly session = inject(SessionService);
  readonly i18n = inject(I18nService);

  readonly longBreakEvery = LONG_BREAK_EVERY;
  readonly cycleSlots = Array.from({ length: LONG_BREAK_EVERY }, (_, i) => i);

  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdInterval: ReturnType<typeof setInterval> | null = null;
  /** Le pas a déjà été joué à l'appui : le clic qui suit ne doit pas le rejouer. */
  private handled = false;

  get selectedPreset(): Preset {
    return this.session.selectedPreset();
  }

  get displaySeconds(): number {
    return this.session.displaySeconds();
  }

  get modeName(): string {
    return this.session.modeName();
  }

  get cycleLabel(): string | null {
    return this.session.cycleLabel();
  }

  get focusRounds(): number {
    return this.session.focusRounds();
  }

  formatTime(seconds: number): string {
    return formatTime(seconds);
  }

  canStep(delta: number): boolean {
    return this.session.canStep(delta);
  }

  /** Appui au doigt ou à la souris : un pas tout de suite, puis répétition si l'appui dure. */
  press(delta: number, event: PointerEvent): void {
    if (event.button !== 0) return;
    this.handled = true;
    this.step(delta);
    // La capture garantit le `pointerup`, même si le doigt a glissé hors du bouton
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.holdTimer = setTimeout(() => {
      this.holdInterval = setInterval(() => this.step(delta), HOLD_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  }

  release(): void {
    if (this.holdTimer !== null) clearTimeout(this.holdTimer);
    if (this.holdInterval !== null) clearInterval(this.holdInterval);
    this.holdTimer = null;
    this.holdInterval = null;
    // Le clic synthétique suit le relâchement : on ne libère le garde-fou qu'après lui
    setTimeout(() => (this.handled = false));
  }

  /** Activation au clavier (Entrée, Espace) : aucun `pointerdown` ne l'a précédée. */
  tap(delta: number): void {
    if (this.handled) return;
    this.step(delta);
  }

  ngOnDestroy(): void {
    this.release();
  }

  private step(delta: number): void {
    if (!this.canStep(delta)) {
      this.release();
      return;
    }
    this.session.stepMinutes(delta, true);
  }
}
