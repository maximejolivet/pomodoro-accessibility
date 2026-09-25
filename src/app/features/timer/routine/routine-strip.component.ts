import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Routine, RoutineStep } from '../../../core/models/routine.model';
import { SessionService } from '../../../core/services/session.service';

/**
 * Bande des étapes de la routine en cours : ce qui est fait, ce qui se joue, ce qui
 * vient après. C'est l'emploi du temps visuel que le cadran ne peut pas donner — il
 * montre le temps d'une étape, elle montre la place de cette étape dans la suite.
 *
 * Chaque étape est un bouton : on y va directement quand elle est déjà faite, ou
 * qu'on veut la refaire. Le verrou du cadran les neutralise, comme la remise à zéro.
 */
@Component({
  selector: 'app-routine-strip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './routine-strip.component.html',
  styleUrl: './routine-strip.component.css'
})
export class RoutineStripComponent {
  readonly session = inject(SessionService);
  readonly i18n = inject(I18nService);

  readonly routine = this.session.activeRoutine;
  readonly locked = this.session.locked;

  readonly routineLabel = computed(() => {
    const routine = this.routine();
    return routine ? this.session.routineName(routine) : '';
  });

  stepName(step: RoutineStep): string {
    return this.session.presetName(step) || this.i18n.t('routine.stepUntitled');
  }

  minutes(step: RoutineStep): number {
    return Math.round(step.seconds / 60);
  }

  isCurrent(index: number): boolean {
    return !this.session.routineDone() && index === this.session.routineIndex();
  }

  isDone(index: number): boolean {
    return this.session.routineDone() || index < this.session.routineIndex();
  }

  /** « Étape 2 sur 4 : Petit-déjeuner, 15 minutes, en cours » : l'état est dit, pas seulement montré. */
  label(index: number): string {
    const state = this.isDone(index)
      ? this.i18n.t('routine.stepDone')
      : this.isCurrent(index)
        ? this.i18n.t('routine.stepCurrent')
        : '';
    const step = this.session.stepLabel(index);
    return state ? `${step}, ${state}` : step;
  }

  goTo(index: number): void {
    this.session.goToStep(index);
  }

  quit(): void {
    this.session.exitRoutine();
  }

  trackById(_: number, step: RoutineStep): string {
    return step.id;
  }

  steps(routine: Routine): RoutineStep[] {
    return routine.steps;
  }
}
