import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PRESET_COLORS } from '../../../core/constants/preset.constants';
import { MAX_MINUTES } from '../../../core/constants/timer.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { I18nKey } from '../../../core/i18n/i18n.model';
import type { Preset, PresetKind } from '../../../core/models/preset.model';
import { PresetService } from '../../../core/services/preset.service';
import { SessionService } from '../../../core/services/session.service';
import type { PresetDraft } from '../timer.model';

/** Onglet « Modes » : durée du prochain décompte, liste des modes et leur éditeur. */
@Component({
  selector: 'app-modes-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modes-tab.component.html',
  styleUrl: './modes-tab.component.css'
})
export class ModesTabComponent {
  private readonly session = inject(SessionService);
  readonly presetService = inject(PresetService);
  readonly i18n = inject(I18nService);

  @Output() readonly closeSheet = new EventEmitter<void>();

  readonly maxMinutes = MAX_MINUTES;
  readonly presetColors = PRESET_COLORS;
  readonly presetKinds: PresetKind[] = ['focus', 'break', 'longBreak'];

  readonly draft = signal<PresetDraft | null>(null);
  /** Action destructive en attente de second tap. */
  readonly confirming = signal<'delete' | 'restore' | null>(null);

  get durationSeconds(): number {
    return this.session.durationSeconds();
  }

  get selectedPreset(): Preset {
    return this.session.selectedPreset();
  }

  presetName(preset: Preset): string {
    return this.session.presetName(preset);
  }

  kindLabel(kind: PresetKind): string {
    return this.i18n.t(`preset.kind.${kind}` as I18nKey);
  }

  colorLabel(hex: string): string {
    const colorNames: Record<string, I18nKey> = {
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
    const key = colorNames[hex];
    return key ? this.i18n.t(key) : hex;
  }

  setDurationMinutes(minutes: number): void {
    this.session.setMinutes(Math.max(1, Math.min(MAX_MINUTES, minutes)));
  }

  selectPreset(preset: Preset): void {
    this.session.selectPreset(preset);
  }

  /** Remet l'onglet à plat (fermeture du panneau, changement d'onglet). */
  reset(): void {
    this.draft.set(null);
    this.confirming.set(null);
  }

  editPreset(preset: Preset): void {
    this.confirming.set(null);
    this.draft.set({
      preset,
      name: this.presetName(preset),
      minutes: Math.round(preset.seconds / 60),
      color: preset.color,
      kind: preset.kind,
      isNew: false
    });
  }

  newPreset(): void {
    const preset = this.presetService.newPreset();
    this.confirming.set(null);
    this.draft.set({ preset, name: '', minutes: preset.seconds / 60, color: preset.color, kind: preset.kind, isNew: true });
  }

  saveDraft(): void {
    const d = this.draft();
    if (!d) return;
    const name = d.name.trim();
    const original = d.preset;
    // Nom par défaut inchangé : on garde la traduction automatique
    const keepKey = !!original.nameKey && (name === '' || name === this.i18n.t(original.nameKey));
    const saved: Preset = {
      id: original.id,
      name: keepKey ? '' : name || this.i18n.t('preset.new'),
      nameKey: keepKey ? original.nameKey : undefined,
      seconds: Math.max(1, Math.min(MAX_MINUTES, Math.round(d.minutes))) * 60,
      color: d.color,
      kind: d.kind
    };
    this.presetService.save(saved);
    this.session.syncDurationWith(saved);
    this.draft.set(null);
  }

  deleteDraft(): void {
    const draft = this.draft();
    if (!draft) return;
    if (this.confirming() !== 'delete') {
      this.confirming.set('delete');
      return;
    }
    const id = draft.preset.id;
    // selectedPreset, et non selectedPresetId : sans choix enregistré, c'est le premier mode qui est affiché
    const wasSelected = id === this.selectedPreset.id;
    this.presetService.remove(id);
    if (wasSelected) {
      this.selectPreset(this.presetService.presets()[0]);
    }
    this.draft.set(null);
    this.confirming.set(null);
  }

  restorePresets(): void {
    if (this.confirming() !== 'restore') {
      this.confirming.set('restore');
      return;
    }
    this.presetService.restoreDefaults();
    this.selectPreset(this.presetService.presets()[0]);
    this.confirming.set(null);
  }
}
