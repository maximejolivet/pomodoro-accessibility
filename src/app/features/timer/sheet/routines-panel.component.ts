import { Component, ElementRef, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PRESET_COLORS } from '../../../core/constants/preset.constants';
import { MAX_STEPS, STEP_ICONS } from '../../../core/constants/routine.constants';
import { MAX_MINUTES, MIN_MINUTES } from '../../../core/constants/timer.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { I18nKey } from '../../../core/i18n/i18n.model';
import type { Routine, RoutineStep } from '../../../core/models/routine.model';
import { routineSeconds } from '../../../core/models/routine.model';
import { RoutineService } from '../../../core/services/routine.service';
import { SessionService } from '../../../core/services/session.service';
import type { RoutineDraft, RoutineStepDraft } from '../timer.model';

/**
 * Section « Routines » de l'onglet Modes : la liste des routines, et leur éditeur.
 *
 * L'éditeur occupe tout l'onglet pendant qu'il est ouvert (`editing`) : une liste de
 * modes au-dessus d'une liste d'étapes ferait deux listes concurrentes à l'écran.
 */
@Component({
  selector: 'app-routines-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './routines-panel.component.html',
  styleUrl: './routines-panel.component.css'
})
export class RoutinesPanelComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly session = inject(SessionService);
  readonly routineService = inject(RoutineService);
  readonly i18n = inject(I18nService);

  /** Prévient l'onglet : pendant l'édition, il cache les modes. */
  @Output() readonly editing = new EventEmitter<boolean>();
  @Output() readonly closeSheet = new EventEmitter<void>();

  readonly minMinutes = MIN_MINUTES;
  readonly maxMinutes = MAX_MINUTES;
  readonly maxSteps = MAX_STEPS;
  readonly stepIcons = STEP_ICONS;
  readonly presetColors = PRESET_COLORS;

  readonly draft = signal<RoutineDraft | null>(null);
  /** Étape dépliée : son nom, sa durée, son pictogramme et sa couleur. */
  readonly openStep = signal<string | null>(null);
  /** Action destructive en attente de second appui. */
  readonly confirming = signal<'delete' | 'restore' | null>(null);

  readonly activeRoutineId = computed(() => this.session.activeRoutine()?.id ?? null);

  routineName(routine: Routine): string {
    return this.session.routineName(routine);
  }

  stepName(step: RoutineStep | RoutineStepDraft): string {
    return this.rawName(step) || this.i18n.t('routine.stepUntitled');
  }

  /** Nom réel de l'étape : celui qui est saisi, ou la traduction d'une étape livrée. */
  private rawName(step: RoutineStep | RoutineStepDraft): string {
    return step.name || (step.nameKey ? this.i18n.t(step.nameKey) : '');
  }

  /** Une étape en cours d'édition : la durée passe en minutes, le nom traduit se remplit. */
  private toDraft(step: RoutineStep): RoutineStepDraft {
    return { ...step, name: this.rawName(step), minutes: Math.round(step.seconds / 60) };
  }

  summary(routine: Routine): string {
    return this.i18n.t('routine.summary', {
      n: routine.steps.length,
      m: Math.round(routineSeconds(routine) / 60)
    });
  }

  colorLabel(hex: string): string {
    const names: Record<string, I18nKey> = {
      '#8b6fd6': 'color.purple',
      '#d63f4f': 'color.red',
      '#ef7d2d': 'color.orange',
      '#f3a52b': 'color.amber',
      '#c3cd36': 'color.lime',
      '#56b27b': 'color.green',
      '#5aa9c4': 'color.cyan',
      '#5d6db3': 'color.blue',
      '#b24f97': 'color.magenta',
      '#56636a': 'color.gray'
    };
    const key = names[hex];
    return key ? this.i18n.t(key) : hex;
  }

  // ---------- Liste ----------

  /** Charge la routine et ferme le panneau : la première étape attend sur le cadran. */
  start(routine: Routine): void {
    this.session.startRoutine(routine);
    this.closeSheet.emit();
  }

  edit(routine: Routine): void {
    this.confirming.set(null);
    this.openStep.set(null);
    this.setDraft({
      routine,
      name: this.routineName(routine),
      icon: routine.icon,
      steps: routine.steps.map(step => this.toDraft(step)),
      isNew: false
    });
  }

  create(): void {
    const routine = this.routineService.newRoutine();
    this.confirming.set(null);
    this.setDraft({
      routine,
      name: '',
      icon: routine.icon,
      steps: routine.steps.map(step => this.toDraft(step)),
      isNew: true
    });
    this.openStep.set(routine.steps[0].id);
  }

  restoreDefaults(): void {
    if (this.confirming() !== 'restore') {
      this.confirming.set('restore');
      return;
    }
    this.routineService.restoreDefaults();
    this.session.syncRoutine(
      this.routineService.byId(this.activeRoutineId()) ?? null,
      this.activeRoutineId() ?? ''
    );
    this.confirming.set(null);
  }

  /** Remet la section à plat (fermeture du panneau, changement d'onglet). */
  reset(): void {
    this.setDraft(null);
    this.openStep.set(null);
    this.confirming.set(null);
  }

  // ---------- Éditeur ----------

  toggleStep(id: string): void {
    this.openStep.update(open => (open === id ? null : id));
    this.revealChosenIcons();
  }

  addStep(): void {
    const draft = this.draft();
    if (!draft || draft.steps.length >= MAX_STEPS) return;
    const step = this.routineService.newStep();
    draft.steps.push(this.toDraft(step));
    this.openStep.set(step.id);
    this.revealChosenIcons();
  }

  moveStep(index: number, delta: number): void {
    const draft = this.draft();
    const target = index + delta;
    if (!draft || target < 0 || target >= draft.steps.length) return;
    const steps = draft.steps;
    [steps[index], steps[target]] = [steps[target], steps[index]];
  }

  removeStep(index: number): void {
    const draft = this.draft();
    // Une routine sans étape ne pourrait pas se jouer : la dernière ne s'enlève pas
    if (!draft || draft.steps.length <= 1) return;
    const [removed] = draft.steps.splice(index, 1);
    if (this.openStep() === removed.id) this.openStep.set(null);
  }

  /** L'interrupteur dit ce que l'étape fait aux statistiques, pas sa « nature ». */
  setCounted(step: RoutineStepDraft, counted: boolean): void {
    step.kind = counted ? 'focus' : 'break';
  }

  save(): void {
    const draft = this.draft();
    if (!draft) return;
    const saved: Routine = {
      id: draft.routine.id,
      ...this.label(draft.name, draft.routine.nameKey, this.i18n.t('routine.new')),
      icon: draft.icon,
      steps: draft.steps.map(step => ({
        id: step.id,
        ...this.label(step.name, step.nameKey, this.i18n.t('routine.stepUntitled')),
        icon: step.icon,
        seconds: Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, Math.round(step.minutes))) * 60,
        color: step.color,
        kind: step.kind
      }))
    };
    this.routineService.save(saved);
    this.session.syncRoutine(saved, saved.id);
    this.setDraft(null);
    this.openStep.set(null);
  }

  remove(): void {
    const draft = this.draft();
    if (!draft) return;
    if (this.confirming() !== 'delete') {
      this.confirming.set('delete');
      return;
    }
    this.routineService.remove(draft.routine.id);
    this.session.syncRoutine(null, draft.routine.id);
    this.setDraft(null);
    this.confirming.set(null);
  }

  cancel(): void {
    this.setDraft(null);
    this.openStep.set(null);
    this.confirming.set(null);
  }

  /** Nom par défaut inchangé : la traduction automatique est conservée. */
  private label(name: string, nameKey: I18nKey | undefined, fallback: string) {
    const trimmed = name.trim();
    const keepKey = !!nameKey && (trimmed === '' || trimmed === this.i18n.t(nameKey));
    return { name: keepKey ? '' : trimmed || fallback, nameKey: keepKey ? nameKey : undefined };
  }

  /**
   * Amène le pictogramme choisi dans la partie visible de sa grille : sans cela, il faut
   * faire défiler trente-deux images pour retrouver celui qui est déjà sélectionné.
   */
  private revealChosenIcons(): void {
    setTimeout(() => {
      const host = this.host.nativeElement as HTMLElement;
      for (const grid of host.querySelectorAll<HTMLElement>('.icons')) {
        const chosen = grid.querySelector<HTMLElement>('.icon.active');
        if (chosen) grid.scrollTop = chosen.offsetTop - (grid.clientHeight - chosen.clientHeight) / 2;
      }
    });
  }

  private setDraft(draft: RoutineDraft | null): void {
    this.draft.set(draft);
    this.editing.emit(draft !== null);
    if (draft) this.revealChosenIcons();
  }
}
