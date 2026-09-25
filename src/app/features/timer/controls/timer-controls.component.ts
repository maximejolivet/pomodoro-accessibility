import { Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Preset } from '../../../core/models/preset.model';
import { SessionService } from '../../../core/services/session.service';

/** Remise à zéro, démarrage / pause, ouverture des réglages, et l'état affiché dessous. */
@Component({
  selector: 'app-timer-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer-controls.component.html',
  styleUrl: './timer-controls.component.css'
})
export class TimerControlsComponent {
  private readonly session = inject(SessionService);
  readonly i18n = inject(I18nService);

  @Output() readonly openSettings = new EventEmitter<void>();

  @ViewChild('settingsButton') private settingsButton?: ElementRef<HTMLButtonElement>;

  get selectedPreset(): Preset {
    return this.session.selectedPreset();
  }

  get isRunning(): boolean {
    return this.session.isRunning();
  }

  get mainActionLabel(): string {
    return this.session.mainActionLabel();
  }

  get stateLabel(): string {
    return this.session.stateLabel();
  }

  /** Cadran verrouillé : la remise à zéro se neutralise avec lui. */
  get locked(): boolean {
    return this.session.locked();
  }

  toggle(): void {
    this.session.toggle();
  }

  resetTimer(): void {
    this.session.reset();
  }

  /** Rend le focus au bouton Réglages à la fermeture du panneau. */
  focusSettingsButton(): void {
    this.settingsButton?.nativeElement.focus();
  }
}
