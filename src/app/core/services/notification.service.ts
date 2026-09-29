import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Subject } from 'rxjs';
import { SOUND_FILES, SOUND_PATTERNS, SoundId, renderWav } from '../helpers/sound-patterns';
import type { Alert, ChannelNames, Reminder } from '../models/alert.model';

const QUIET_CHANNEL = 'quiet';
const SILENT_FILE = 'silence.wav';

/**
 * Version des canaux Android. Un canal est **immuable** : son son est fixé à sa création et
 * ne change plus jamais — le recréer ne le corrige pas. Un canal né alors que le WAV manquait
 * dans `res/raw` (build fait avant `make sounds`) reste donc muet pour toujours, sur cette
 * installation. Incrémenter cette version crée de nouveaux canaux, qui portent le son ;
 * les précédents sont supprimés pour ne pas encombrer les réglages du téléphone.
 */
const CHANNEL_VERSION = 2;

/**
 * Les rappels de routine vivent au-dessus de cette borne, les alertes d'une session
 * en dessous. La distinction est vitale : les alertes sont annulées à chaque retour au
 * premier plan, alors qu'un rappel doit survivre — il est programmé une fois et attend
 * son heure, parfois des jours.
 */
const REMINDER_ID_BASE = 1000;

/**
 * La notification de test vit au-dessus des deux autres bornes, et hors de toute annulation :
 * elle ne doit disparaître ni au retour au premier plan, ni à la réécriture des rappels.
 */
const TEST_ID = 2000;

/** Délai laissé avant la notification de test : le temps de verrouiller l'écran pour la voir arriver. */
export const TEST_DELAY_SECONDS = 5;

/** Ce qu'il est advenu d'une notification de test, à dire à qui l'a demandée. */
export type TestResult = 'scheduled' | 'inexact' | 'denied' | 'unsupported' | 'failed';

/** Ce qu'a donné le passage par l'écran « Alarmes et rappels ». */
export type ExactAlarmResult = 'granted' | 'denied' | 'unsupported';

/** Capacitor compte les jours à partir du dimanche (1) ; l'app les compte en ISO (1 = lundi). */
function capacitorWeekday(isoDay: number): number {
  return (isoDay % 7) + 1;
}

function channelBase(sound: SoundId): string {
  return SOUND_FILES[sound].replace('.wav', '');
}

function channelId(sound: SoundId): string {
  return `${channelBase(sound)}_v${CHANNEL_VERSION}`;
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
  /** Faux dans le navigateur : il n'y a alors ni notification à programmer, ni test à proposer. */
  readonly available = Capacitor.isNativePlatform();
  private permission: Promise<boolean> | null = null;
  /** Faux si les sons n'ont pas pu être installés : une notification sonore serait muette. */
  private soundsInstalled = true;
  private ready: Promise<void> | null = null;
  private tapListener: Promise<unknown> | null = null;
  private readonly reminderTapped = new Subject<string>();
  /** Id de la routine dont le rappel vient d'être touché. */
  readonly reminderTapped$ = this.reminderTapped.asObservable();
  /**
   * Programmer et annuler s'exécutent l'un après l'autre : sinon, un aller-retour rapide
   * (Centre de contrôle iOS) laisse l'annulation passer avant la programmation.
   */
  private queue: Promise<void> = Promise.resolve();

  /** Prépare les sons (iOS) et les canaux (Android). À appeler une fois au démarrage. */
  setup(channelNames: ChannelNames): Promise<void> {
    if (!this.available) return Promise.resolve();
    this.listenToTaps();
    this.ready ??= (this.platform === 'ios' ? this.installIosSounds() : this.createAndroidChannels(channelNames))
      .catch(err => {
        // Sans son installé, la notification arrivera muette : autant le savoir ici, et le dire
        // à qui demande un test, plutôt que de lui laisser croire que l'appareil est en cause.
        this.soundsInstalled = false;
        console.warn('[notifications] sons non installés', err);
      });
    return this.ready;
  }

  /** Demande l'autorisation (une seule fois), à appeler depuis un geste utilisateur. */
  ensurePermission(): Promise<boolean> {
    if (!this.available) return Promise.resolve(false);
    this.permission ??= LocalNotifications.requestPermissions()
      .then(p => p.display === 'granted')
      .catch(() => false);
    return this.permission;
  }

  schedule(alerts: Alert[], withSound: boolean): Promise<void> {
    return this.enqueue(() => this.doSchedule(alerts, withSound));
  }

  /**
   * Remplace tous les rappels de routine programmés. Appelé au démarrage et à chaque
   * modification des routines : le système ne sait pas qu'une routine a changé de nom,
   * d'heure, ou qu'elle a été supprimée.
   */
  scheduleReminders(reminders: Reminder[], withSound: boolean): Promise<void> {
    return this.enqueue(() => this.doScheduleReminders(reminders, withSound));
  }

  /**
   * Programme une notification de test dans quelques secondes. Le délai est le sujet même
   * du test : il laisse le temps de verrouiller l'écran, et c'est écran verrouillé qu'on
   * veut savoir si l'appareil prévient — l'autorisation, le canal et le son y passent tous.
   */
  sendTest(title: string, body: string, withSound: boolean): Promise<TestResult> {
    if (!this.available) return Promise.resolve<TestResult>('unsupported');
    return this.enqueue(() => this.doSendTest(title, body, withSound));
  }

  /**
   * Ouvre l'écran système « Alarmes et rappels ». Android seulement : avant Android 12 la
   * permission n'existe pas et le plugin répond « accordé » sans rien ouvrir.
   *
   * À savoir : passer d'accordé à refusé depuis cet écran fait redémarrer l'app et efface
   * les alarmes exactes déjà programmées — c'est le système qui l'impose, pas l'app.
   */
  async openExactAlarmSettings(): Promise<ExactAlarmResult> {
    // L'écran n'existe que sur Android ; ailleurs l'appel lèverait, et « refusé » mentirait
    // sur la raison — il n'y a rien à refuser là où la permission n'existe pas.
    if (!this.available || this.platform !== 'android') return 'unsupported';
    try {
      const { exact_alarm } = await LocalNotifications.changeExactNotificationSetting();
      return exact_alarm === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }

  cancelAll(): Promise<void> {
    return this.enqueue(() => this.cancelPending());
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task);
    this.queue = run.then(() => {}, () => {});
    return run;
  }

  private async doSchedule(alerts: Alert[], withSound: boolean): Promise<void> {
    if (!this.available || !(await this.ensurePermission())) return;
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

  private async doScheduleReminders(reminders: Reminder[], withSound: boolean): Promise<void> {
    if (!this.available) return;
    // Un rappel n'a de sens que si l'appareil accepte de le montrer
    if (reminders.length && !(await this.ensurePermission())) return;
    await this.ready;
    await this.cancelPending(true);
    if (!reminders.length) return;

    const notifications: LocalNotificationSchema[] = reminders.map((r, i) => ({
      id: REMINDER_ID_BASE + i,
      title: r.title,
      body: r.body,
      // `on` est la forme récurrente, façon cron : un jour, une heure, et rien d'autre —
      // la notification revient chaque semaine, et survit au redémarrage de l'appareil
      schedule: {
        on: { weekday: capacitorWeekday(r.day), hour: r.hour, minute: r.minute, second: 0 },
        allowWhileIdle: true
      },
      sound: withSound ? SOUND_FILES.end : SILENT_FILE,
      channelId: withSound ? channelId('end') : QUIET_CHANNEL,
      extra: { routineId: r.routineId }
    }));

    await LocalNotifications.schedule({ notifications }).catch(() => {});
  }

  private async doSendTest(title: string, body: string, withSound: boolean): Promise<TestResult> {
    if (!(await this.ensurePermission())) return 'denied';
    await this.ready;
    // Un test qui annonce « envoyée » alors que le son n'a pas pu être installé ferait
    // chercher la panne du côté du téléphone, là où elle est dans l'app.
    if (withSound && !this.soundsInstalled) return 'failed';

    return LocalNotifications.schedule({
      notifications: [{
        id: TEST_ID,
        title,
        body,
        schedule: { at: new Date(Date.now() + TEST_DELAY_SECONDS * 1000), allowWhileIdle: true },
        sound: withSound ? SOUND_FILES.end : SILENT_FILE,
        channelId: withSound ? channelId('end') : QUIET_CHANNEL
      }]
      // Depuis Android 14, « Alarmes et rappels » n'est plus accordé d'office : le système
      // rétrograde alors l'alarme en inexacte et la notification peut arriver avec des
      // minutes de retard. Le plugin le signale, et un test qui tairait ce repli mentirait
      // précisément sur ce qu'il est censé vérifier.
    }).then<TestResult, TestResult>(r => (r.warning ? 'inexact' : 'scheduled'), () => 'failed');
  }

  /**
   * L'appui sur un rappel dit quelle routine armer. L'écoute est posée au démarrage, et
   * non à la première programmation : l'appui a lieu **avant** que l'app existe, et c'est
   * lui qui la lance. Les deux plateformes retiennent l'événement jusqu'à ce qu'un
   * écouteur le prenne, encore faut-il qu'il finisse par y en avoir un.
   */
  private listenToTaps(): void {
    this.tapListener ??= LocalNotifications
      .addListener('localNotificationActionPerformed', ({ notification }) => {
        const routineId = (notification.extra as { routineId?: unknown } | null)?.routineId;
        if (typeof routineId === 'string' && routineId) this.reminderTapped.next(routineId);
      })
      .catch(() => {});
  }

  /** `reminders` : les rappels de routine plutôt que les alertes d'une session. */
  private async cancelPending(reminders = false): Promise<void> {
    if (!this.available) return;
    try {
      const { notifications } = await LocalNotifications.getPending();
      const mine = notifications.filter(n => n.id !== TEST_ID && (n.id >= REMINDER_ID_BASE) === reminders);
      if (mine.length) {
        await LocalNotifications.cancel({ notifications: mine.map(n => ({ id: n.id })) });
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
    await this.deleteLegacyChannels();
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

  /**
   * Efface les canaux des versions précédentes. Ils ne servent plus, et surtout ils traînent
   * dans les réglages du téléphone, où l'utilisateur verrait deux fois les mêmes intitulés.
   */
  private async deleteLegacyChannels(): Promise<void> {
    const ids: string[] = [];
    for (const id of Object.keys(SOUND_FILES) as SoundId[]) {
      // La toute première version n'avait pas de suffixe.
      ids.push(channelBase(id));
      for (let v = 1; v < CHANNEL_VERSION; v++) ids.push(`${channelBase(id)}_v${v}`);
    }
    for (const id of ids) {
      await LocalNotifications.deleteChannel({ id }).catch(() => {});
    }
  }
}
