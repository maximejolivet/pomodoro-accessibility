import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LANGUAGES, LangChoice } from '../../../core/i18n/i18n.model';
import { PreferencesService } from '../../../core/services/preferences.service';
import { SessionService } from '../../../core/services/session.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/** Onglet « Réglages » : thème, son, langue, tutoriel, mode table. */
@Component({
  selector: 'app-settings-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './settings-tab.component.html',
  styleUrl: './settings-tab.component.css'
})
export class SettingsTabComponent {
  readonly session = inject(SessionService);
  readonly prefs = inject(PreferencesService);
  readonly i18n = inject(I18nService);

  @Output() readonly closeSheet = new EventEmitter<void>();

  readonly languages = LANGUAGES;

  setLanguage(choice: LangChoice): void {
    this.i18n.setChoice(choice);
  }

  openTableMode(): void {
    this.session.setTableMode(true);
    this.closeSheet.emit();
  }
}
