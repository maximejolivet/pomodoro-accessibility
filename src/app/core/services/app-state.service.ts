import { Injectable } from '@angular/core';
import { App } from '@capacitor/app';
import { Subject } from 'rxjs';
import { electronApi } from '../helpers/electron';

/**
 * Passage au premier plan ou en arrière-plan. Sur mobile, c'est Capacitor qui le dit ;
 * sous Electron, c'est la fenêtre (focus, réduction, masquage) relayée par le pont.
 */
@Injectable({ providedIn: 'root' })
export class AppStateService {
  private readonly changes = new Subject<boolean>();
  readonly isActive$ = this.changes.asObservable();

  constructor() {
    const electron = electronApi();
    if (electron) {
      electron.notifications.onAppState(isActive => this.changes.next(isActive));
      return;
    }
    App.addListener('appStateChange', ({ isActive }) => this.changes.next(isActive));
  }
}
