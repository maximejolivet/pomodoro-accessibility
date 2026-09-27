import { Component, ElementRef, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { PRESET_COLORS } from '../../../core/constants/preset.constants';
import {
  DEFAULT_REMINDER_TIME, MAX_ROUNDS, MAX_STEPS, STEP_DURATIONS, STEP_ICONS
} from '../../../core/constants/routine.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { I18nKey } from '../../../core/i18n/i18n.model';
import type { Routine, RoutineReminder, RoutineStep } from '../../../core/models/routine.model';
import { WEEKDAYS, routineRounds, routineTotalSeconds } from '../../../core/models/routine.model';
import { RoutineService } from '../../../core/services/routine.service';
import { SessionService } from '../../../core/services/session.service';
import type { RoutineDraft, RoutineReminderDraft, RoutineStepDraft } from '../timer.model';

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

  readonly maxSteps = MAX_STEPS;
  readonly maxRounds = MAX_ROUNDS;
  /** Le curseur de durée parcourt la liste des durées : sa valeur est un rang, pas des secondes. */
  readonly lastDuration = STEP_DURATIONS.length - 1;
  readonly stepIcons = STEP_ICONS;
  readonly presetColors = PRESET_COLORS;

  readonly draft = signal<RoutineDraft | null>(null);
  /** Étape dépliée : son nom, sa durée, son pictogramme et sa couleur. */
  readonly openStep = signal<string | null>(null);
  /** Action destructive en attente de second appui. */
  readonly confirming = signal<'delete' | 'restore' | null>(null);

  readonly activeRoutineId = computed(() => this.session.activeRoutine()?.id ?? null);

  /** Hors iOS et Android, aucune notification ne part : le dire plutôt que le laisser croire. */
  readonly isNative = Capacitor.isNativePlatform();

  /**
   * Les sept jours, lundi d'abord, nommés par le navigateur : une lettre sur le bouton,
   * le nom entier pour les lecteurs d'écran, dans les sept langues et sans rien traduire.
   */
  readonly weekdays = computed(() => {
    const lang = this.i18n.lang();
    const narrow = new Intl.DateTimeFormat(lang, { weekday: 'narrow', timeZone: 'UTC' });
    const long = new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' });
    // Le 1er janvier 2024 est un lundi : sept jours de suite donnent la semaine ISO
    return WEEKDAYS.map(iso => {
      const day = new Date(Date.UTC(2024, 0, iso));
      return { iso, short: narrow.format(day), long: long.format(day) };
    });
  });

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

  /** Le rappel d'une routine, en brouillon : « HH:MM » pour le champ d'heure. */
  private toReminderDraft(reminder: RoutineReminder | undefined): RoutineReminderDraft {
    if (!reminder) return { enabled: false, time: DEFAULT_REMINDER_TIME, days: [...WEEKDAYS] };
    const time = `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`;
    return { enabled: true, time, days: [...reminder.days] };
  }

  /**
   * Le brouillon rendu au modèle. Un rappel éteint, sans jour coché ou sans heure lisible
   * n'est pas enregistré : mieux vaut pas de rappel qu'un rappel qui ne partira jamais.
   */
  private fromReminderDraft(draft: RoutineReminderDraft): RoutineReminder | undefined {
    const [hour, minute] = (draft.time ?? '').split(':').map(Number);
    if (!draft.enabled || !draft.days.length) return undefined;
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return undefined;
    return { hour, minute, days: [...draft.days].sort() };
  }

  /** Une étape en cours d'édition : le nom traduit se remplit, la durée reste en secondes. */
  private toDraft(step: RoutineStep): RoutineStepDraft {
    return { ...step, name: this.rawName(step) };
  }

  /** Rang de la durée dans la liste : la plus proche, quand une valeur ancienne tombe entre deux. */
  durationIndex(step: RoutineStepDraft): number {
    let best = 0;
    for (let i = 1; i < STEP_DURATIONS.length; i++) {
      if (Math.abs(STEP_DURATIONS[i] - step.seconds) < Math.abs(STEP_DURATIONS[best] - step.seconds)) best = i;
    }
    return best;
  }

  setDurationIndex(step: RoutineStepDraft, index: number): void {
    step.seconds = STEP_DURATIONS[Math.max(0, Math.min(this.lastDuration, Math.round(index)))];
  }

  durationLabel(seconds: number): string {
    return this.session.durationLabel(seconds);
  }

  shortDuration(seconds: number): string {
    return this.session.shortDuration(seconds);
  }

  /** « Une seule fois » ou « 8 fois » : le nombre nu ne dirait pas de quoi il parle. */
  roundsLabel(rounds: number): string {
    return rounds <= 1 ? this.i18n.t('routine.roundsOnce') : this.i18n.t('routine.roundsTimes', { n: rounds });
  }

  /**
   * Nom accessible de la carte : le rappel y est dit, parce que l'`aria-label` remplace
   * tout le contenu du bouton — la pastille ⏰ ne serait vue que des voyants.
   */
  startLabel(routine: Routine): string {
    const label = this.i18n.t('routine.start', { name: this.routineName(routine) });
    const at = this.reminderAt(routine);
    return at ? `${label}, ${at}` : label;
  }

  /** « rappel à 07:30 », ou une chaîne vide quand la routine n'en a pas. */
  reminderAt(routine: Routine): string {
    const reminder = routine.reminder;
    return reminder ? this.i18n.t('routine.reminderAt', { time: this.clockTime(reminder) }) : '';
  }

  /** L'heure comme le pays l'écrit : « 07:30 » en français, « 7:30 AM » en anglais. */
  clockTime(reminder: RoutineReminder): string {
    const at = new Date(2024, 0, 1, reminder.hour, reminder.minute);
    return new Intl.DateTimeFormat(this.i18n.lang(), { hour: '2-digit', minute: '2-digit' }).format(at);
  }

  /** « 4 étapes · 33 min », tours compris : c'est le temps que la routine prendra vraiment. */
  summary(routine: Routine): string {
    const rounds = routineRounds(routine);
    const summary = this.i18n.t('routine.summary', {
      n: routine.steps.length,
      m: Math.round(routineTotalSeconds(routine) / 60)
    });
    return rounds > 1 ? `${summary} · ×${rounds}` : summary;
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
      reminder: this.toReminderDraft(routine.reminder),
      rounds: routineRounds(routine),
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
      reminder: this.toReminderDraft(undefined),
      rounds: 1,
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

  /**
   * Allumer un rappel coche la semaine entière : un rappel sans jour ne partirait jamais,
   * et décocher est plus rapide que cocher sept fois.
   */
  toggleReminder(draft: RoutineDraft, on: boolean): void {
    draft.reminder.enabled = on;
    if (on && !draft.reminder.days.length) draft.reminder.days = [...WEEKDAYS];
  }

  toggleDay(draft: RoutineDraft, iso: number): void {
    const days = draft.reminder.days;
    const at = days.indexOf(iso);
    if (at === -1) days.push(iso);
    else days.splice(at, 1);
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
      rounds: Math.max(1, Math.min(MAX_ROUNDS, Math.round(draft.rounds))),
      reminder: this.fromReminderDraft(draft.reminder),
      steps: draft.steps.map(step => ({
        id: step.id,
        ...this.label(step.name, step.nameKey, this.i18n.t('routine.stepUntitled')),
        icon: step.icon,
        seconds: step.seconds,
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
