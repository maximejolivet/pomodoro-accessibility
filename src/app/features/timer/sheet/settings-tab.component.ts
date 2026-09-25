import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GOAL_MAX_MINUTES, GOAL_MIN_MINUTES, GOAL_STEP_MINUTES
} from '../../../core/constants/history.constants';
import { LONG_BREAK_EVERY } from '../../../core/constants/timer.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LANGUAGES, LangChoice } from '../../../core/i18n/i18n.model';
import { HistoryService } from '../../../core/services/history.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { SessionService } from '../../../core/services/session.service';
import { SoundService } from '../../../core/services/sound.service';

/** Onglet « Réglages » : thème, sons, enchaînement, objectif quotidien, langue. */
@Component({
  selector: 'app-settings-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-tab.component.html',
  styleUrl: './settings-tab.component.css'
})
export class SettingsTabComponent {
  readonly session = inject(SessionService);
  readonly prefs = inject(PreferencesService);
  readonly history = inject(HistoryService);
  readonly i18n = inject(I18nService);
  private readonly sound = inject(SoundService);

  readonly languages = LANGUAGES;
  readonly longBreakEvery = LONG_BREAK_EVERY;
  readonly goalMin = GOAL_MIN_MINUTES;
  readonly goalMax = GOAL_MAX_MINUTES;
  readonly goalStep = GOAL_STEP_MINUTES;

  readonly soundPreviews = [
    { value: 45, label: '45', color: '#5a55a3' },
    { value: 30, label: '30', color: '#c3cd36' },
    { value: 15, label: '15', color: '#f3a52b' },
    { value: 0, label: '0', color: '#d63f4f' }
  ] as const;

  setLanguage(choice: LangChoice): void {
    this.i18n.setChoice(choice);
  }

  previewSound(value: 45 | 30 | 15 | 0): void {
    this.sound.unlock();
    if (value === 0) {
      this.sound.end();
    } else {
      this.sound.milestone(value);
    }
  }
}
