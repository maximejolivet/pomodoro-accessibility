import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatTime } from '../../../core/helpers/time';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Session } from '../../../core/models/session.model';
import { HistoryService } from '../../../core/services/history.service';

/** Onglet « Stats » : totaux du jour, objectif, semaine et dernières sessions. */
@Component({
  selector: 'app-stats-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-tab.component.html',
  styleUrl: './stats-tab.component.css'
})
export class StatsTabComponent {
  readonly history = inject(HistoryService);
  readonly i18n = inject(I18nService);

  /** Effacement de l'historique en attente de second tap. */
  readonly confirming = signal<'clear' | null>(null);

  /** Barres des 7 derniers jours (hauteur relative au meilleur jour). */
  readonly weekBars = computed(() => {
    const days = this.history.week();
    const max = Math.max(1, ...days.map(d => d.focusMinutes));
    const weekday = new Intl.DateTimeFormat(this.i18n.lang(), { weekday: 'short' });
    return days.map((d, i) => ({
      label: weekday.format(d.date).replace('.', ''),
      minutes: d.focusMinutes,
      pct: (d.focusMinutes / max) * 100,
      isToday: i === days.length - 1,
      isMax: d.focusMinutes === max && d.focusMinutes > 0
    }));
  });

  formatTime(seconds: number): string {
    return formatTime(seconds);
  }

  /** Remet l'onglet à plat (fermeture du panneau, changement d'onglet). */
  reset(): void {
    this.confirming.set(null);
  }

  clearHistory(): void {
    if (this.confirming() !== 'clear') {
      this.confirming.set('clear');
      return;
    }
    this.history.clear();
    this.confirming.set(null);
  }

  sessionTime(session: Session): string {
    const lang = this.i18n.lang();
    const ended = new Date(session.endedAt);
    const isToday = ended.toDateString() === new Date().toDateString();
    const time = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(ended);
    if (isToday) return time;
    return `${new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(ended)} · ${time}`;
  }

  weekBarLabel(bar: { label: string; minutes: number }): string {
    return this.i18n.t('stats.weekLabel', { day: bar.label, m: bar.minutes });
  }
}
