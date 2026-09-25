import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LONG_BREAK_EVERY } from '../../../core/constants/timer.constants';
import { formatTime } from '../../../core/helpers/time';
import type { Preset } from '../../../core/models/preset.model';
import { SessionService } from '../../../core/services/session.service';

/** Temps restant, mode, état et position dans le cycle travail / pause. */
@Component({
  selector: 'app-timer-readout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer-readout.component.html',
  styleUrl: './timer-readout.component.css'
})
export class TimerReadoutComponent {
  private readonly session = inject(SessionService);

  readonly longBreakEvery = LONG_BREAK_EVERY;
  readonly cycleSlots = Array.from({ length: LONG_BREAK_EVERY }, (_, i) => i);

  get selectedPreset(): Preset {
    return this.session.selectedPreset();
  }

  get displaySeconds(): number {
    return this.session.displaySeconds();
  }

  get modeName(): string {
    return this.session.modeName();
  }

  get stateLabel(): string {
    return this.session.stateLabel();
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
}
