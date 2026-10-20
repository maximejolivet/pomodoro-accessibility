# Evolution: desktop application (macOS and Windows) — technical specification

🇬🇧 English · [🇫🇷 Français](DESKTOP-TECHNIQUE.FR.md)

[← Back to the README](../../README.md) · [Functional specification](DESKTOP-FONCTIONNEL.md)

## 1. Architecture

The existing Angular application is packaged in **Electron 44** (Chromium + Node.js). The Angular code
does not change structure: it is compiled by `ng build` and then loaded by Electron from the file system.

```
┌────────────────────────── Electron ──────────────────────────┐
│  Main process (electron/main.js, notifications.js)           │
│   • window, lifecycle, relay of the window state              │
│   • notification scheduler (1 s tick)                         │
│   • Native notification (macOS / Windows)                     │
│                 ▲ ipcMain.handle / webContents.send           │
│                 │                                             │
│  Preload (electron/preload.js) — contextBridge                │
│   • window.electronAPI.notifications                          │
│                 ▲                                             │
│  Renderer: Angular (dist/pomodoro-tdah/browser)               │
│   • NotificationService → bridge if Electron, otherwise Capacitor │
│   • AppStateService → active state (Electron or Capacitor)    │
└──────────────────────────────────────────────────────────────┘
```

The web, iOS and Android code is not modified: the services detect the platform and choose the path.
`Capacitor.isNativePlatform()` stays false under Electron, so the Capacitor plugins remain inactive
(haptics, Live Activities, widget, keep-awake).

## 2. Files

| File | Role |
|------|------|
| `electron/main.js` | Window creation, relay of the active state, notification initialisation, Windows identifier |
| `electron/notifications.js` | Scheduler (session alerts, weekly reminders, tests), display, click handling |
| `electron/preload.js` | API exposed to the renderer: `electronAPI.notifications.*` |
| `src/app/core/helpers/electron.ts` | Bridge types and `electronApi()` access |
| `src/app/core/services/app-state.service.ts` | `isActive$` stream (Capacitor `appStateChange` or Electron events) |
| `src/app/core/services/notification.service.ts` | Electron branches in the existing methods |
| `src/app/core/services/session.service.ts` | Subscribes to `AppStateService` instead of `App.addListener` |
| `src/app/features/timer/sheet/routines-panel.component.ts` | `isNative` true under Electron (the "web" message is hidden) |
| `src/app/features/timer/dial/timer-dial.component.css` | Dial portrait rule |
| `src/app/app.config.ts` | Hash routing when the app is served over `file:` |
| `build/icon.icns`, `build/icon.ico` | macOS and Windows icons, generated from `resources/app-icon.svg` |
| `package.json` | `main`, scripts, `build` configuration (electron-builder) |
| `Makefile` | `electron-dev`, `electron-dmg`, `electron-win` targets |

## 3. IPC contract

Requests (`ipcRenderer.invoke` → `ipcMain.handle`):

| Channel | Arguments | Return |
|---------|-----------|--------|
| `notif:schedule` | `alerts: Alert[]`, `withSound` | — (replaces the session alerts) |
| `notif:cancelAll` | — | — |
| `notif:scheduleReminders` | `reminders[]`, `withSound` | — (replaces all reminders) |
| `notif:test` | `title`, `body`, `withSound` | `'scheduled' \| 'unsupported'` (5 s delay) |
| `notif:takePendingTap` | — | `routineId \| null` |

Events (`webContents.send` → `ipcRenderer.on`):

| Channel | Payload | Emitted when |
|---------|---------|--------------|
| `notif:reminderTapped` | `routineId` | A reminder is clicked, window open |
| `app:state` | `isActive: boolean` | `focus`/`restore` → `true`; `blur`/`minimize`/`hide` → `false` |

The alerts' `sound` is a `SoundId` (`milestone45`, `milestone30`, `milestone15`, `end`); the main process
translates it into a macOS system sound (`Glass` for `end`, `Ping` otherwise).

## 4. Scheduler (`electron/notifications.js`)

- **Session alerts**: an array replaced on each `schedule`, emptied by `cancelAll`. An alert fires when
  `Date.now() >= at`. Alerts already past at scheduling time are ignored.
- **Reminders**: each reminder carries a `nextAt`, computed by `nextOccurrence` (ISO day 1–7, hour,
  minute, local time). After firing, `nextAt` is recomputed from the current instant: a wake from sleep
  does not cause a burst of notifications.
- **Tests**: fire after 5 s, not cancelled by `cancelAll`.
- **Tick**: a 1-second `setInterval`, stopped on `before-quit`.
- **References**: the `Notification` objects are kept in a `Set` until `click` or `close`, so that they are
  not garbage-collected before being displayed.
- **Click**: `focusApp(routineId)`. If the window exists and has finished loading, the event is sent
  directly. Otherwise the identifier is kept in `pendingTap` and picked up by the renderer through
  `takePendingTap` when `NotificationService.setup()` starts.

The `nextOccurrence` calculation was checked on simple cases, including the switch to winter time.

## 5. Renderer

- `NotificationService`: the `electron` field is `electronApi()?.notifications ?? null`.
  `available` is `Capacitor.isNativePlatform() || electron !== null`. In each private method (`doSchedule`,
  `doScheduleReminders`, `doSendTest`, `cancelPending`), the Electron branch comes first and returns
  directly. `ensurePermission()` returns `true` (macOS and Windows handle permission in the system settings).
- `setup()` connects the `reminderTapped` event to the existing RxJS subject and picks up any pending click.
- `AppStateService` replaces the direct listener on `App` in `SessionService`. The behaviour is the same:
  on going to the background, alerts are scheduled; on return, they are cancelled.

## 6. Build and packaging

Scripts:

```bash
npm run electron:dev        # ng build --base-href ./ && electron .
npm run electron:build      # ng build --base-href ./ && electron-builder --mac dmg --publish never
npm run electron:build:win  # ng build --base-href ./ && electron-builder --win nsis --x64 --publish never
```

Important points:

- **`--base-href ./`**: essential under `file://`, otherwise the asset paths are wrong.
- **Routing**: `app.config.ts` switches to hash routing if `window.location.protocol === 'file:'`.
  Without this, a reload on `/accessibility` would fail.
- **`files`**: `electron/**/*`, `dist/pomodoro-tdah/browser/**/*`, `package.json`.
- **Output**: `release/` (ignored by git).

### 6.1 macOS

- `mac.target: dmg`, arm64 architecture by default.
- `mac.identity: "-"`: ad-hoc signature.
- `mac.hardenedRuntime: false`: the hardened runtime with an ad-hoc signature prevents the Electron
  frameworks from launching, since they do not share the app's identity.

**Important finding**: without `identity: "-"`, the app was signed with the original Electron signature,
with `Identifier=Electron` and `Info.plist=not bound`. macOS could not associate the notifications with
the application. Verified with `codesign -dv` and `codesign --verify --deep --strict`.

**Important finding, authorisation**: on the first attempt, the app launched directly from the binary
(`Contents/MacOS/...`) received `didGrant: 0 hasError: 1`, and macOS recorded it as `Denied`. Relaunched
with `open` (LaunchServices), the request succeeds (`didGrant: 1 hasError: 0`). For testing, always launch
the app with `open` or by double-clicking. The `log show` command lets you follow the
`com.apple.UserNotifications` lines.

### 6.2 Windows

- `win.target: nsis`, `--x64` forced in the script. Without this flag, electron-builder takes the host
  architecture (arm64 on an Apple Silicon Mac), which was observed.
- `win.icon: build/icon.ico` (16 to 256 px).
- `nsis`: per-user installation (`perMachine: false`), folder can be changed, "Pomodoro TDAH" shortcut,
  data kept on uninstall.
- `app.setAppUserModelId('com.maxime.pomodoro-tdah')` in `main.js`, only under `win32`. The value must
  match `build.appId`.
- Build done from macOS: the installer is generated (`signtool` skipped for lack of a certificate).

## 7. Tests and checks performed

| Check | Result |
|-------|--------|
| `npm run build` (Angular) after each change | OK |
| `npx tsc -p tsconfig.app.json --noEmit` | OK |
| Scheduler with a simulated `electron` module: past alert ignored, end fired with its `Glass` sound | OK |
| `nextOccurrence` on three cases (Monday, upcoming Sunday, Sunday already passed with a time change) | OK |
| `npm run electron:build` (DMG) | OK |
| Launch of the packaged app, no error at startup | OK |
| `electronAPI` bridge called from the page (via the remote debugging port) | OK, platform `darwin` |
| Notification received by the macOS notification centre (log) | OK after relaunch via `open` |
| `npm run electron:build:win` | OK, x64 installer generated, contents checked |
| Windows installer run on Windows | **Not done** |
| Visual display of the notifications | **Not verified** |
| Clicking a notification (macOS) | **Not verified** |

### 7.1 Reproducing the bridge check

The remote debugging port lets you call the bridge from a script, without clicking in the interface:

```bash
open -n "release/mac-arm64/Pomodoro TDAH.app" --args --remote-debugging-port=9222
# then, with the page's WebSocket (listed at http://127.0.0.1:9222/json/list):
# Runtime.evaluate → window.electronAPI.notifications.test('Title', 'Body', true)
```

Do not leave this port open outside these tests.

## 8. Limits and technical debt

- **No test button**: `settings.notifTest*` exists in the translations, but no component uses it. Adding
  a button would allow notifications to be checked without a session.
- **Custom sounds not used** on the desktop: `sound` only accepts macOS system sounds, and Windows ignores
  this option.
- **Reminders are not persisted in the main process**: they are sent back by the renderer at each startup.
  With no window open, no rescheduling takes place, so reminders do not survive a complete closing of the app.
- **Package size**: the DMG contains the Capacitor dependencies (about 275 MB), useless under Electron.
  Excluding them via `build.files` or an exclusion list would reduce the package.
- **No signing or notarisation.**
- **Electron and electron-builder dependency**: versions `44.9.0` and `26.15.3`, to be updated regularly.
- **Lockfile**: `package-lock.json` has grown considerably because of the Electron dependencies.
- **Install scripts blocked**: `allow-scripts` prevented the Electron binary from downloading; it was run by
  hand (`node node_modules/electron/install.js`).

## 9. Maintenance

- After a change in `electron/`: `npm run electron:dev` for a quick trial.
- After an Angular change: `npm run electron:build` (or `make electron-dmg`), which rebuilds `dist/` before
  packaging.
- Never test the DMG for notifications by launching the binary by hand: go through `open` or a double-click.
