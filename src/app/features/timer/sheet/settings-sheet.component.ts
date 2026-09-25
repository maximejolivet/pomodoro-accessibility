import {
  Component, ElementRef, HostListener, effect, inject, input, output, untracked, viewChild, viewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Preset } from '../../../core/models/preset.model';
import { SessionService } from '../../../core/services/session.service';
import type { SheetTab } from '../timer.model';
import { ModesTabComponent } from './modes-tab.component';
import { SettingsTabComponent } from './settings-tab.component';
import { StatsTabComponent } from './stats-tab.component';

const TABS: SheetTab[] = ['modes', 'stats', 'settings'];

/** Panneau coulissant modal : onglets Modes / Stats / Réglages. */
@Component({
  selector: 'app-settings-sheet',
  standalone: true,
  imports: [CommonModule, ModesTabComponent, StatsTabComponent, SettingsTabComponent],
  templateUrl: './settings-sheet.component.html',
  styleUrl: './settings-sheet.component.css'
})
export class SettingsSheetComponent {
  private readonly session = inject(SessionService);
  readonly i18n = inject(I18nService);

  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  readonly tabs = TABS;
  tab: SheetTab = 'modes';

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
  private readonly modesTab = viewChild(ModesTabComponent);
  private readonly statsTab = viewChild(StatsTabComponent);

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => {
        if (open) {
          // Le panneau ne sort de `inert` qu'au rendu : on attend pour donner le focus.
          // Il va sur l'onglet actif, d'où les flèches gauche / droite fonctionnent aussitôt.
          setTimeout(() => {
            const active = this.tabButtons()[TABS.indexOf(this.tab)];
            (active?.nativeElement ?? this.dialog()?.nativeElement)?.focus();
          });
        } else {
          this.modesTab()?.reset();
          this.statsTab()?.reset();
        }
      });
    });
  }

  get selectedPreset(): Preset {
    return this.session.selectedPreset();
  }

  close(): void {
    this.closed.emit();
  }

  /** Échap ferme la modale, où que soit le focus. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  setTab(tab: SheetTab): void {
    this.modesTab()?.reset();
    this.statsTab()?.reset();
    this.tab = tab;
  }

  /** Flèches gauche / droite sur la liste d'onglets, comme le veut le motif ARIA. */
  selectPrevTab(): void {
    this.moveTab(-1);
  }

  selectNextTab(): void {
    this.moveTab(1);
  }

  private moveTab(delta: number): void {
    const index = (TABS.indexOf(this.tab) + delta + TABS.length) % TABS.length;
    this.setTab(TABS[index]);
    this.tabButtons()[index]?.nativeElement.focus();
  }
}
