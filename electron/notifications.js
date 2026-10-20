const { ipcMain, Notification } = require('electron');

/** Vérifie les échéances une fois par seconde : assez précis pour un décompte, sans coût. */
const TICK_MS = 1000;
/** Délai laissé avant la notification de test : le temps de la voir arriver. */
const TEST_DELAY_MS = 5000;

// Son système macOS (/System/Library/Sounds) : la fin de session se distingue des jalons
const END_SOUND = 'Glass';
const MILESTONE_SOUND = 'Ping';

let sessionAlerts = [];
let reminders = [];
let tests = [];
let timer = null;
let pendingTap = null;
/** Une notification sans référence peut être ramassée avant son clic : on les garde ici. */
const shown = new Set();

let openWindow = () => null;
let mainWindow = () => null;

/** Prochaine occurrence d'un rappel hebdomadaire, strictement après `from`. */
function nextOccurrence({ hour, minute, day }, from) {
  const next = new Date(from);
  next.setHours(hour, minute, 0, 0);
  // Jour ISO (1 = lundi … 7 = dimanche) ramené au jour JS (0 = dimanche)
  const jsDay = day % 7;
  next.setDate(next.getDate() + ((jsDay - next.getDay() + 7) % 7));
  if (next.getTime() <= from) next.setDate(next.getDate() + 7);
  return next.getTime();
}

function focusApp(routineId) {
  const existing = mainWindow();
  const ready = existing && !existing.webContents.isLoading();

  if (ready) {
    if (existing.isMinimized()) existing.restore();
    existing.show();
    existing.focus();
    if (routineId) existing.webContents.send('notif:reminderTapped', routineId);
    return;
  }

  // Fenêtre fermée ou en cours de chargement : le renderer récupère le rappel à son démarrage
  if (routineId) pendingTap = routineId;
  const win = existing ?? openWindow();
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
}

function show({ title, body, withSound, sound, routineId }) {
  if (!Notification.isSupported()) return;
  const notification = new Notification({
    title,
    body,
    silent: !withSound,
    sound: withSound ? sound : undefined,
  });
  const release = () => shown.delete(notification);
  notification.on('click', () => {
    focusApp(routineId);
    release();
  });
  notification.on('close', release);
  shown.add(notification);
  notification.show();
}

function tick() {
  const now = Date.now();

  sessionAlerts = sessionAlerts.filter(alert => {
    if (alert.at > now) return true;
    show(alert);
    return false;
  });

  for (const reminder of reminders) {
    if (reminder.nextAt > now) continue;
    show({ ...reminder, sound: END_SOUND });
    reminder.nextAt = nextOccurrence(reminder, now);
  }

  tests = tests.filter(test => {
    if (test.at > now) return true;
    show(test);
    return false;
  });
}

function sound(id) {
  return id === 'end' ? END_SOUND : MILESTONE_SOUND;
}

/**
 * Notifications de session (jalons, fin) et rappels de routine, planifiés dans le process
 * principal : ils partent même quand la fenêtre est cachée, tant que l'app tourne.
 * `openWindow` ouvre ou ramène la fenêtre ; `getWindow` renvoie la fenêtre existante.
 */
function init({ openWindow: open, getWindow }) {
  openWindow = open;
  mainWindow = getWindow;

  ipcMain.handle('notif:schedule', (_event, alerts, withSound) => {
    const now = Date.now();
    sessionAlerts = alerts
      .filter(a => a.at > now)
      .map(a => ({ title: a.title, body: a.body, at: a.at, withSound, sound: sound(a.sound) }));
  });

  ipcMain.handle('notif:cancelAll', () => {
    sessionAlerts = [];
  });

  ipcMain.handle('notif:scheduleReminders', (_event, list, withSound) => {
    const now = Date.now();
    reminders = list.map(r => ({
      routineId: r.routineId,
      title: r.title,
      body: r.body,
      hour: r.hour,
      minute: r.minute,
      day: r.day,
      withSound,
      nextAt: nextOccurrence(r, now),
    }));
  });

  ipcMain.handle('notif:test', (_event, title, body, withSound) => {
    if (!Notification.isSupported()) return 'unsupported';
    tests.push({ title, body, withSound, sound: END_SOUND, at: Date.now() + TEST_DELAY_MS });
    return 'scheduled';
  });

  ipcMain.handle('notif:takePendingTap', () => {
    const routineId = pendingTap;
    pendingTap = null;
    return routineId;
  });

  timer = setInterval(tick, TICK_MS);
}

function stop() {
  clearInterval(timer);
}

module.exports = { init, stop, focusApp };
