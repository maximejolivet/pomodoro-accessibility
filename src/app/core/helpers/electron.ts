import type { TestResult } from '../services/notification.service';
import type { Alert, Reminder } from '../models/alert.model';

/** Ce que le preload Electron (`electron/preload.js`) expose à la page. */
export interface ElectronNotifications {
  schedule(alerts: Alert[], withSound: boolean): Promise<void>;
  scheduleReminders(reminders: Reminder[], withSound: boolean): Promise<void>;
  cancelAll(): Promise<void>;
  test(title: string, body: string, withSound: boolean): Promise<TestResult>;
  takePendingTap(): Promise<string | null>;
  onReminderTapped(callback: (routineId: string) => void): void;
  onAppState(callback: (isActive: boolean) => void): void;
}

export interface ElectronApi {
  platform: string;
  notifications: ElectronNotifications;
}

declare global {
  interface Window {
    electronAPI?: ElectronApi;
  }
}

/** Le pont Electron, ou `null` dans le navigateur et sur mobile. */
export function electronApi(): ElectronApi | null {
  return typeof window !== 'undefined' ? window.electronAPI ?? null : null;
}
