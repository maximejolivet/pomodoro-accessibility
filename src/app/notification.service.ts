import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { SOUND_FILES, SOUND_PATTERNS, SoundId, renderWav } from './sound-patterns';

export interface Alert {
  id: number;
  at: number;
  title: string;
  body: string;
  sound: SoundId;
}

/** Noms des canaux Android, fournis par l'appelant (traduits). */
export type ChannelNames = Record<SoundId, string>;

const QUIET_CHANNEL = 'quiet';
const SILENT_FILE = 'silence.wav';

function channelId(sound: SoundId): string {
  return SOUND_FILES[sound].replace('.wav', '');
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/**
 * Notifications locales programmées quand l'app passe en arrière-plan,
 * pour être alerté même téléphone verrouillé (le JavaScript y est suspendu).
 * Chaque alerte joue le même son que dans l'app :
 * - iOS : fichiers WAV générés au lancement dans Library/Sounds ;
 * - Android : un canal par son, fichiers dans res/raw (`make sounds`).
 * Sans effet dans le navigateur.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly platform = Capacitor.getPlatform();
  private readonly native = Capacitor.isNativePlatform();
  private permission: Promise<boolean> | null = null;
  private ready: Promise<void> | null = null;
  /**
   * Programmer et annuler s'exécutent l'un après l'autre : sinon, un aller-retour rapide
   * (Centre de contrôle iOS) laisse l'annulation passer avant la programmation.
   */
  private queue: Promise<void> = Promise.resolve();

  /** Prépare les sons (iOS) et les canaux (Android). À appeler une fois au démarrage. */
  setup(channelNames: ChannelNames): Promise<void> {
    if (!this.native) return Promise.resolve();
    this.ready ??= (this.platform === 'ios' ? this.installIosSounds() : this.createAndroidChannels(channelNames))
      .catch(() => {});
    return this.ready;
  }

  /** Demande l'autorisation (une seule fois), à appeler depuis un geste utilisateur. */
  ensurePermission(): Promise<boolean> {
    if (!this.native) return Promise.resolve(false);
    this.permission ??= LocalNotifications.requestPermissions()
      .then(p => p.display === 'granted')
      .catch(() => false);
    return this.permission;
  }

  schedule(alerts: Alert[], withSound: boolean): Promise<void> {
    return this.enqueue(() => this.doSchedule(alerts, withSound));
  }

  cancelAll(): Promise<void> {
    return this.enqueue(() => this.cancelPending());
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    const run = this.queue.then(task);
    this.queue = run.catch(() => {});
    return run;
  }

  private async doSchedule(alerts: Alert[], withSound: boolean): Promise<void> {
    if (!this.native || !(await this.ensurePermission())) return;
    await this.ready;
    await this.cancelPending();

    const now = Date.now();
    const notifications: LocalNotificationSchema[] = alerts
      .filter(a => a.at > now)
      .map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        schedule: { at: new Date(a.at), allowWhileIdle: true },
        sound: withSound ? SOUND_FILES[a.sound] : SILENT_FILE,
        channelId: withSound ? channelId(a.sound) : QUIET_CHANNEL
      }));

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications }).catch(() => {});
    }
  }

  private async cancelPending(): Promise<void> {
    if (!this.native) return;
    try {
      const { notifications } = await LocalNotifications.getPending();
      if (notifications.length) {
        await LocalNotifications.cancel({ notifications: notifications.map(n => ({ id: n.id })) });
      }
    } catch {
      // plugin indisponible : rien à annuler
    }
  }

  /** iOS cherche les sons de notification dans Library/Sounds : on y écrit les WAV générés. */
  private async installIosSounds(): Promise<void> {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const files: [string, Uint8Array][] = (Object.keys(SOUND_PATTERNS) as SoundId[])
      .map(id => [SOUND_FILES[id], renderWav(SOUND_PATTERNS[id])]);
    files.push([SILENT_FILE, renderWav({ notes: [{ freq: 440, at: 0, dur: 0.2, gain: 0, wave: 'sine' }] })]);

    for (const [name, bytes] of files) {
      await Filesystem.writeFile({
        path: `Sounds/${name}`,
        data: toBase64(bytes),
        directory: Directory.Library,
        recursive: true
      });
    }
  }

  /** Android 8+ : le son est porté par le canal, un canal par son. */
  private async createAndroidChannels(names: ChannelNames): Promise<void> {
    for (const id of Object.keys(SOUND_FILES) as SoundId[]) {
      await LocalNotifications.createChannel({
        id: channelId(id),
        name: names[id],
        sound: SOUND_FILES[id],
        importance: 4,
        vibration: true
      });
    }
    // Son coupé dans l'app : notification visible mais silencieuse
    await LocalNotifications.createChannel({ id: QUIET_CHANNEL, name: 'Pomodoro Accessibilité', importance: 2 });
  }
}
