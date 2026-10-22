const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const notifications = require('./notifications');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 360,
    minHeight: 600,
    title: 'Pomodoro TDAH',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, '../dist/pomodoro-tdah/browser/index.html'));

  // Les liens externes s'ouvrent dans le navigateur par défaut, pas dans l'app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Équivalent de appStateChange de Capacitor : l'app est « en arrière-plan » quand la fenêtre
  // n'a plus le focus, est réduite ou cachée. Les alertes de session prennent alors le relais.
  const sendState = isActive => win.webContents.send('app:state', isActive);
  win.on('focus', () => sendState(true));
  win.on('restore', () => sendState(true));
  win.on('blur', () => sendState(false));
  win.on('minimize', () => sendState(false));
  win.on('hide', () => sendState(false));

  return win;
}

// Windows regroupe les notifications sous cet identifiant : il doit correspondre à build.appId
if (process.platform === 'win32') app.setAppUserModelId('com.maxime.pomodoro-tdah');

app.whenReady().then(() => {
  notifications.init({
    openWindow: () => {
      const existing = BrowserWindow.getAllWindows()[0];
      return existing ?? createWindow();
    },
    getWindow: () => BrowserWindow.getAllWindows()[0] ?? null,
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => notifications.stop());
