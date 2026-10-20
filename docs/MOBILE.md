# Mobile build (iOS / Android)

🇬🇧 English · [🇫🇷 Français](MOBILE.FR.md)

[← Back to the README](../README.md)

```bash
make ios          # first time only
make open-ios     # build + sync + Xcode

make android      # first time only
make open-android # build + sync + Android Studio
```

## Local notifications

Permission is requested the first time the timer starts, and the first time a reminder is set.
Alerts (milestones, end, end of extension, end of the chained session) are scheduled when the app
goes to the background and cancelled on return, where the app's sounds take over.

### Routine reminders

A routine can carry a time and days (⚙︎ → Modes → *Routines* → pencil → *Reminder*).
They follow a different life from session alerts:

- they are scheduled as `schedule.on` (cron-like: a day, a time), so they repeat each week without
  the app having to run;
- their identifiers start at 1000, which puts them **out of reach** of the cancellation done on
  every return to the foreground — without this, opening the app once would erase the reminders;
- Android re-schedules them after a device restart, iOS keeps them in the notification centre;
- tapping opens the app with the routine armed on the dial: nothing starts on its own.

They borrow the end chime, as they have no sound of their own yet.

### Notification sounds

They are generated from the same patterns as the app (`src/app/core/helpers/sound-patterns.ts`):

- **iOS**: the app writes the WAV files into `Library/Sounds` itself at launch; nothing to do;
- **Android**: `make sounds` (called by `make sync`) copies the WAV files into
  `android/app/src/main/res/raw`, and the app creates a notification channel per sound.

The WAV files peak at −1 dBFS, the same for all four. This is deliberate and it is the expected
level for an alert sound: the device only **reduces** what it is given, so a file rendered at
half scale arrives irremediably quiet, whatever the volume setting. See
[§ 8.1 of the technical specification](TECHNICAL-SPECIFICATION.md#81-level-up).

### Two volumes not to confuse

An app sound and a notification sound do not go through the same slider, and this is the first thing
to check when "the sounds are not loud":

| What plays | Android stream | Setting |
| --- | --- | --- |
| The app's sounds, in the foreground (Web Audio) | media | **Media** volume |
| Notifications, app in the background or locked screen | notification (`USAGE_NOTIFICATION`) | **Notification** volume |

Media at 20 % therefore keeps the milestones quiet during a session, even if notifications ring
loudly. The app cannot change this: the system chooses the stream of a sound, not the app.

### Android channels: what is immutable and what is not

A notification channel is **immutable** once created: recreating it changes neither its importance
nor its sound. Hence `CHANNEL_VERSION` in `notification.service.ts`, which must be incremented to
start again with new channels (the previous ones are then deleted, otherwise the user would see the
same names twice in the phone's settings).

What is fixed is the URI, `android.resource://<package>/raw/<name>` — a reference by **name**,
resolved at playback. **Replacing the content of a WAV file therefore requires no bump**: reinstalling
the APK is enough. What does require one is renaming a file, changing the sound attached to a
channel, or touching its importance.

### Exact alarms and testing a notification

On Android 12+, exact alarms may require the `SCHEDULE_EXACT_ALARM` permission in
`AndroidManifest.xml`. The app does not wait for the end of a session to tell you: ⚙︎ → *Settings* →
**Test a notification** schedules one in one to five seconds — enough time to lock the screen — and
names what is missing if necessary (permission refused, exact alarm absent). The **Allow exact
alarms** link opens the system screen "Alarms & reminders"; on iOS and in the browser, it says that
this screen does not exist.

⚠️ Switching from granted to refused on this screen **restarts the application** and erases the exact
alarms already scheduled: this is imposed by Android, not by the app.

## Persistent countdown

During a session, the remaining time appears outside the app:

- **Android** — a permanent, silent notification whose chronometer ticks on its own. Channel
  `ongoing_v1`, low importance: it must never cover the milestones. It works from Android 7 (the
  chronometer countdown dates from API 24); before that, it shows the remaining time frozen.
- **iOS** — a Live Activity, on the lock screen and in the Dynamic Island, from **iOS 16.2**.
  It requires `NSSupportsLiveActivities` in `App/Info.plist` (already set) and that the user has not
  turned off live activities in the system settings.

⚠️ On iOS, the dial of a Live Activity is **frozen between two updates**: only the number ticks on
its own. Animating it would require a push notification server, which this app does not have — and
will not have, as it does not talk to anyone.

## Home screen widgets

### iOS

The `PomodoroWidget` extension (SwiftUI, iOS 17+) reads the state written by the app in the App Group
`group.com.maximejolivet.pomodorotdah` (local plugin `WidgetBridge`, registered by
`MainViewController`).

On a device, choose your team in *Signing & Capabilities* for the **App** and **PomodoroWidget**
targets: Xcode then creates the App Group. The widget's countdown advances on its own; the app only
updates it on changes (start, pause, end, going to the background, goal, language, theme, duration
set).

The widget shows **the app's dial**, redrawn in SwiftUI from the same constants as
`src/app/features/timer/dial-geometry.ts` and the same colours as `src/theme/`: the disc empties there
graduation by graduation, without waking the app. Changing the geometry or the palette on one side
therefore requires the same change on the other.

### Android

Nothing to configure: the widget is an `AppWidgetProvider` of the `app` module, declared in the
manifest, available as soon as the app is installed (long press on the home screen → Widgets). The
dial is painted there into a bitmap by `DialBitmap.java`, from the same constants; two layouts depending
on the size chosen, 2×2 and 4×2.

State passes through `WidgetBridgePlugin.java`, the twin of the Swift plugin, registered in
`MainActivity`. The countdown advances on its own (`Chronometer`), and the disc empties on a per-minute
alarm, cancelled as soon as the countdown stops.

## Icons and launch screens

Two SVG files, one command:

- `resources/app-icon.svg` — the whole icon, case included, full bleed: the system rounds the corners
  (iOS);
- `resources/app-icon-foreground.svg` — the dial alone, without the case, on a transparent background.
  It is used for the Android adaptive icon, whose background is a colour (`ic_launcher_background`,
  the blue of the case) and whose shape is cut out by the launcher, and for the launch screens.

`make icons` produces everything at once, by going through Chromium — the same engine that displays
the app, so the gradients and the dial's `mix-blend-mode` come out identical:

| Output | Detail |
| --- | --- |
| iOS, icon | `AppIcon-512@2x.png` (1024 px, no alpha channel: the App Store rejects it) |
| iOS, launch | `Splash.imageset`, 2732 × 2732 at all three scales |
| Android, icons | `ic_launcher`, `ic_launcher_round` and `ic_launcher_foreground` at five densities |
| Android, launch | `splash.png`, portrait and landscape, at five densities |
| Web | `public/apple-touch-icon.png` (180 px) |

The foreground drawing fits in a 63-unit disc on the 108-unit canvas, so inside the 66 safe units: no
launcher mask, however tight, bites into the ring. To be checked if the SVG is retouched.

### Opening, in three steps

The background is **black** everywhere: it applies to both themes, and it does not flash white at
anyone who opens the app in the dark.

1. **The system launch screen** — a fixed image. Android cannot animate it before version 12, and
   Apple forbids it: it is the dial set on black, nothing more.
2. **The boot veil** (`src/index.html`) — from the very first line of HTML, on the same black, the
   dial's ring starts turning around its face. Style and SVG are inline: it appears before any download.
   `main.ts` removes it once the app is ready, including **if startup fails** — a veil left in place
   would leave a silent black screen.
3. **The application**, which takes over its own theme.

Under `prefers-reduced-motion`, the ring stops and the fade disappears: it remains a logo, not a
windmill. On Android 12 and later, the system imposes its own screen; `values-v31/styles.xml` gives it
the same black and the same icon, so that all versions open the same way.
