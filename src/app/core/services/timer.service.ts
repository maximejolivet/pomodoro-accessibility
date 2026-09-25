import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, interval, takeUntil } from 'rxjs';

/**
 * Décompte basé sur l'heure de fin réelle : le temps restant est recalculé à chaque tick,
 * il reste donc juste même si le navigateur ralentit les ticks ou si l'app passe en arrière-plan.
 */
@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timeLeft = new BehaviorSubject<number>(0);
  private totalTime = new BehaviorSubject<number>(0);
  private isRunning = new BehaviorSubject<boolean>(false);
  private stopTimer$ = new Subject<void>();
  private finished = new Subject<number>();
  /** Horodatage (ms) de fin du décompte en cours. */
  private endAt = 0;

  timeLeft$ = this.timeLeft.asObservable();
  totalTime$ = this.totalTime.asObservable();
  isRunning$ = this.isRunning.asObservable();
  /** Émis quand le décompte atteint 0 (pas lors d'un reset), avec le retard constaté en secondes. */
  finished$ = this.finished.asObservable();

  /** Heure de fin (ms) si le décompte tourne, sinon null. */
  get endTime(): number | null {
    return this.isRunning.value ? this.endAt : null;
  }

  start(seconds: number): void {
    if (this.isRunning.value) return;
    this.totalTime.next(seconds);
    this.run(seconds);
  }

  pause(): void {
    if (!this.isRunning.value) return;
    this.stopTimer$.next();
    this.timeLeft.next(this.remaining());
    this.isRunning.next(false);
  }

  resume(): void {
    if (this.isRunning.value || this.timeLeft.value <= 0) return;
    this.run(this.timeLeft.value);
  }

  /** Change le temps restant (réglage au doigt), sans interrompre le décompte. */
  setTimeLeft(seconds: number): void {
    if (this.isRunning.value) {
      this.endAt = Date.now() + seconds * 1000;
    }
    this.timeLeft.next(seconds);
    if (seconds > this.totalTime.value) {
      this.totalTime.next(seconds);
    }
  }

  reset(): void {
    this.stopTimer$.next();
    this.isRunning.next(false);
    this.timeLeft.next(0);
    this.totalTime.next(0);
  }

  getProgress(): number {
    const total = this.totalTime.value;
    if (total === 0) return 0;
    return ((total - this.timeLeft.value) / total) * 100;
  }

  private run(seconds: number): void {
    this.endAt = Date.now() + seconds * 1000;
    this.timeLeft.next(seconds);
    this.isRunning.next(true);

    interval(100)
      .pipe(takeUntil(this.stopTimer$))
      .subscribe(() => this.tick());
  }

  private tick(): void {
    const left = (this.endAt - Date.now()) / 1000;
    if (left > 0) {
      this.timeLeft.next(left);
      return;
    }
    this.stopTimer$.next();
    this.timeLeft.next(0);
    this.isRunning.next(false);
    this.finished.next(-left);
    import('@capacitor/haptics').then(({ Haptics }) => {
      Haptics.vibrate({ duration: 500 });
    }).catch(() => {});
  }

  private remaining(): number {
    return Math.max(0, (this.endAt - Date.now()) / 1000);
  }
}
