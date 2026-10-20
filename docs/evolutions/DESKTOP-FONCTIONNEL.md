# Evolution: desktop application (macOS and Windows) — functional specification

🇬🇧 English · [🇫🇷 Français](DESKTOP-FONCTIONNEL.FR.md)

[← Back to the README](../../README.md) · [Technical specification](DESKTOP-TECHNIQUE.md)

## 1. Purpose

Pomodoro TDAH has so far been a web and mobile application (iOS, Android). This evolution adds an
**installable desktop application** for macOS and Windows, with the same screens and the same
functions, plus **native system notifications**.

The goal is to be able to use the app on the work computer, without a browser or a phone, and to be
warned of the end of a session or of a routine reminder even when the window is not in the foreground.

## 2. Scope

| Platform | Deliverable | Architecture | Status |
|----------|-------------|--------------|--------|
| macOS (Apple Silicon) | DMG | arm64 | Generated, tested (launch, notification) |
| Windows (64-bit) | `.exe` installer (NSIS) | x64 | Generated, **not tested on Windows** |
| macOS (Intel) | DMG | x64 | Not generated (see §7) |
| Web / iOS / Android | — | — | Unchanged |

Out of scope for this evolution:
- signing and notarisation (no certificate available);
- automatic application updates;
- notifications when the application is completely closed.

## 3. What does not change for the user

The screens, modes, routines, history, statistics, preferences, language and theme are identical to the
web version. The data (history, routines, preferences) stays local: it is stored in the desktop
application, separately from the browser's data.

## 4. New functional features

### 4.1 Installation

- **macOS**: open the DMG, drag the application into "Applications". As the application is not signed, at
  first launch you need to right-click → **Open** (or allow it from System Settings → Privacy & Security).
- **Windows**: run the installer. SmartScreen shows a warning because the publisher is not identified:
  "More info" → "Run anyway". The installation is made for the current user, without administrator rights,
  and the folder can be changed.

### 4.2 Native notifications

Notifications go through the system notification centre (macOS) or Windows notifications.

| Event | When | Behaviour |
|-------|------|-----------|
| Session milestones (45, 30, 15 min remaining) | Application in the background | Notification with sound |
| End of session | Application in the background | Notification with sound |
| Routine reminder | Every week, on the set day and time | Notification, even with the window hidden |

**Definition of "background"**: the window no longer has focus, is minimised or is hidden. While the
application is in the foreground, session notifications are not sent (the screen is enough).

**Clicking a reminder notification**: the window comes back to the foreground and the corresponding routine
is armed on the dial, ready to start. As on mobile, nothing starts on its own.

**Application closed**: no notification. If the application was closed and then reopened after clicking a
reminder, the routine is still armed at startup.

**Sounds**:
- macOS: the system "Ping" sound for milestones, "Glass" for the end and for reminders;
- Windows: the default system sound;
- the application's own sounds are not used on the desktop.

If sound is turned off in the app's settings, notifications arrive silently.

### 4.3 Portrait layout

In portrait mode (a tall window, or a phone held upright), the dial is smaller than before:
- maximum width of 420 px (instead of 560 px);
- side margins of 48 px (instead of 16 px).

Landscape mode and table mode do not change.

## 5. Test journey

To be done on each target platform:

1. Install and launch the application.
2. Start a session, then click in another window: check that the countdown continues.
3. Wait for a milestone or the end (or a short session) with the app in the background: a notification
   must appear with a sound.
4. Check that the **Focus / Do Not Disturb** mode is off, otherwise nothing is displayed.
5. Check that the application appears in the system notification settings, with permission granted and the
   "Banners" style.
6. Create a routine with a reminder a few minutes away, keep the app open in the background, then click the
   notification: the window must come back and the routine must be armed.
7. In portrait, check that the dial does not overflow and that the controls remain accessible.

## 6. Known limitations

- **No notification test button in the interface.** The texts exist in the translations, but no screen uses
  them. Testing is done through a session or a routine.
- **No notification when the application is closed** (see §4.2).
- **Display of notifications not checked visually**: on macOS, their sending and recording were confirmed in
  the system log, but no screenshot was taken.
- **Windows not tested** on a real machine at the date of this evolution.
- **No signing**: macOS and Windows warnings at installation.
- **Focus mode** removes notifications, as on the other platforms.

## 7. Decisions to be made

- **macOS Intel**: also generate an x64 DMG (`--x64`) or a universal DMG if Intel Macs need to be served.
- **Windows ARM**: add `--arm64` to the script if needed.
- **Signing**: an Apple Developer certificate (99 $/year) and a Windows code-signing certificate would remove the
  warnings and allow notarisation.
- **Test button**: adding it to the settings would allow notifications to be checked without waiting for the
  end of a session.
