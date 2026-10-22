# Technical specification

🇬🇧 English · [🇫🇷 Français](TECHNICAL-SPECIFICATION.FR.md)

[← Back to the README](../README.md) · [Functional specification](FUNCTIONAL-SPECIFICATION.md)

Version 1.1 - 26 September 2026 · **Pomodoro Accessibilité** application

This document describes *how* the requirements of the [functional specification](FUNCTIONAL-SPECIFICATION.md)
are implemented. For the map of the folders, see [Code architecture](ARCHITECTURE.md); for the commands,
[Installation](INSTALLATION.md); for the native side, [Mobile build](MOBILE.md).

## Contents

- [1. Technical foundation](#1-technical-foundation)
- [2. Application architecture](#2-application-architecture)
- [3. Data model and persistence](#3-data-model-and-persistence)
- [4. Domain services](#4-domain-services)
- [5. Dial rendering](#5-dial-rendering)
- [6. Welcome tutorial](#6-welcome-tutorial)
- [7. Milestones](#7-milestones)
- [8. Sounds](#8-sounds)
- [9. Native integration](#9-native-integration)
- [10. Internationalisation](#10-internationalisation)
- [11. Theme and styles](#11-theme-and-styles)
- [12. Technical accessibility](#12-technical-accessibility)
- [13. Build, execution and continuous integration](#13-build-execution-and-continuous-integration)
- [14. Quality and tests](#14-quality-and-tests)
- [15. Security](#15-security)
- [16. Constraints, limits and evolutions](#16-constraints-limits-and-evolutions)

---

## 1. Technical foundation

### 1.1 Dependencies

| Area                 | Choice                        | Version                        | Role                                                   |
| -------------------- | ----------------------------- | ------------------------------ | ------------------------------------------------------ |
| Framework            | Angular (standalone, signals) | 22                             | Components, routing, reactivity                        |
| Language             | TypeScript                    | 6                              | Strict typing of the domain                            |
| Asynchronous streams | RxJS                          | 7.8                            | Countdown ticks                                        |
| Styles               | Tailwind CSS + PostCSS        | 4 / 8                          | Utilities, theme tokens                                |
| Native               | Capacitor                     | 8                              | Web ↔ iOS / Android bridge                             |
| iOS widget           | Swift, SwiftUI, WidgetKit     | iOS 17+                        | Home screen widget                                     |
| Unit tests           | Karma + Jasmine               | 6 / 7                          | Tooling in place, **no specification written to date** |
| Accessibility tests  | Playwright + axe-core         | 1.63 / 4.13                    | RGAA / WCAG regression testing                         |
| Runtime              | Node.js                       | ^24.15.0 (`engines`, `.nvmrc`) | Tooling and scripts                                    |

Capacitor plugins: `@capacitor/app`, `@capacitor/local-notifications`, `@capacitor/haptics`,
`@capacitor/filesystem`, `@capacitor-community/keep-awake`, plus the local plugin `WidgetBridge`.

### 1.2 Architecture constraints

- **No back end.** No HTTP client, no interceptor, no deployment environment variables: there is nothing
  to configure per environment.
- **Everything is local.** The only persistence is `localStorage`, wrapped in a helper.
- **No empty folders in anticipation**: no `shared/`, `guards/`, `interceptors/`, `pipes/` or `environments/`
  until a second use appears.

---

## 2. Application architecture

### 2.1 Breakdown

```
app.component        Shell: applies the theme and writing direction, hosts <router-outlet>
app.config.ts        Providers (router)
app.routes.ts        '' → timer, 'accessibility' → accessibility page (loadComponent)
core/                Independent of any page: constants, models, helpers, i18n, services
features/timer/      Timer page = assembly of dial / readout / routine / controls / sheet
features/accessibility/  Accessibility statement page and its texts
```

### 2.2 Dependency rules

**`features/` depends on `core/`, never the reverse.**
The domain stays testable and reusable.

**Components read the state from the services, rather than through a cascade of inputs.**
This avoids passing properties down four levels.

**Only local state flows through inputs / outputs.**
Open panel, mode draft, gesture in progress: this separates view state from domain state.

**Session state lives in `SessionService` (root), not in the page.**
Pages are destroyed on every navigation; a session in progress would be lost.

**Both routes are loaded on demand (`loadComponent`).**
The accessibility page does not weigh on startup.

**`sound-patterns.ts` imports nothing.**
It is run both by the browser and directly by Node.

### 2.3 Reactivity model

- **Angular signals** for application state: preferences, modes, history, current session, derived
  values as `computed`, side effects as `effect`.
- **RxJS** only in `TimerService`, for the periodic emission of ticks and the end-of-countdown event.

---

## 3. Data model and persistence

### 3.1 Domain types

| Type              | Fields                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `Preset`          | `id`, `name`, `nameKey?`, `seconds`, `color`, `kind`                                            |
| `RoutineStep`     | `id`, `name`, `nameKey?`, `icon`, `seconds`, `color`, `kind`                                    |
| `Routine`         | `id`, `name`, `nameKey?`, `icon`, `steps`, `rounds?`, `workout?`, `reminder?`                   |
| `RoutineReminder` | `hour`, `minute`, `days`                                                                        |
| `Session`         | `name`, `color`, `kind`, `plannedSeconds`, `activeSeconds`, `startedAt`, `endedAt`, `completed` |
| `ActiveSession`   | `name`, `color`, `kind`, `plannedSeconds`, `startedAt`, `activeMs`, `runningSince`              |
| `DayStat`         | `date`, `focusMinutes`                                                                          |
| `Alert`           | `id`, `at`, `title`, `body`, `sound`                                                            |
| `Reminder`        | `routineId`, `title`, `body`, `hour`, `minute`, `day`                                           |
| `WidgetState`     | `dayStart`, `focusMinutes`, `goalMinutes`, `timer{…}`, `labels{…}`, `rtl`                       |

#### Details

`Preset` - `kind` ∈ `focus` \| `break` \| `longBreak`. `name` is empty for a default mode, whose label
comes from `nameKey`, translated.

`RoutineStep` - a `Preset` plus a pictogram: a step starts and is recorded exactly like a mode
(`kind` ∈ `focus` \| `break`).

`Routine` - ordered sequence of 1 to 10 steps (RG-16), played `rounds` times (1 to 20). `workout` switches
the page to sport mode.

`RoutineReminder` - `days` in ISO 8601 (1 = Monday … 7 = Sunday), never empty (RG-20).

`Session` - name and colour frozen when recorded (RG-9).

`ActiveSession` - `runningSince` is `null` when paused; `activeMs` accumulates the time counted down before
the current resume.

`DayStat` - one bar of the weekly histogram.

`Alert` - one-off local notification, scheduled when the app goes to the background.

`Reminder` - weekly reminder of a routine: one per ticked day.

`WidgetState` - contract shared with `PomodoroWidget.swift`.

### 3.2 Domain constants

| Constant                                  | Value                                                                      | Requirement covered |
| ----------------------------------------- | -------------------------------------------------------------------------- | ------------------- |
| `MAX_MINUTES`                             | 60                                                                         | RG-1                |
| `EXTRA_SECONDS`                           | 300                                                                        | RG-2                |
| `MILESTONES`                              | `[45, 30, 15]` - the three chimes, and the milestones of a long session    | RG-4                |
| `LONG_SESSION_MINUTES`                    | 40                                                                         | RG-4                |
| `FINAL_WARNING_MINUTES`                   | 1                                                                          | RG-4                |
| `LATE_ALERT_SECONDS`                      | 90                                                                         | RG-15               |
| `LONG_BREAK_EVERY`                        | 4                                                                          | RG-3                |
| `MAX_SESSIONS`                            | 500                                                                        | RG-7                |
| `MIN_RECORDED_SECONDS`                    | 60                                                                         | RG-6                |
| `GOAL_MIN / MAX / STEP / DEFAULT_MINUTES` | 10 / 300 / 5 / 100                                                         | RG-12               |
| `PRESET_COLORS`                           | 10 ring hues                                                               | EF-MOD-3            |
| `DEFAULT_PRESETS`                         | Pomodoro 25, Break 5, Long break 15, Focus 15                              | EF-MOD-1            |
| `STEP_ICONS`                              | 32 pictograms (daily life, school, work)                                   | EF-ROU-2            |
| `TUTORIAL_SLIDES`                         | 5 views (pictogram, title, text, colour)                                   | EF-TUT-1            |
| `MAX_STEPS`                               | 10                                                                         | RG-16               |
| `STEP_DURATIONS`                          | 5 → 55 s in steps of 5, then 1 → 60 min in steps of 1                      | EF-ROU-16           |
| `MAX_ROUNDS`                              | 20                                                                         | EF-ROU-17           |
| `SECONDS_DIAL_BELOW`                      | 60                                                                         | EF-ROU-20           |
| `COUNTDOWN_FROM`                          | 3                                                                          | EF-ROU-21           |
| `NEXT_ANNOUNCE_SECONDS`                   | 5                                                                          | EF-ROU-22           |
| `DEFAULT_ROUTINES`                        | Morning routine (4 steps), Tabata (2 steps × 8 rounds), Homework (4 steps) | EF-ROU-3            |

### 3.3 Persistence

Access is centralised in `core/helpers/storage.ts`. All keys are prefixed `pomodoro-tdah.`. Every read and
every write is wrapped in a `try/catch`: in private browsing or with blocked storage, the application keeps
working and the settings only last for the session (RG-14).

| Key (prefixed)  | Content                       | Format                                                      |
| --------------- | ----------------------------- | ----------------------------------------------------------- |
| `theme`         | Theme                         | `'dark'` \| `'light'` (absent ⇒ system preference)          |
| `opendyslexic`  | OpenDyslexic font             | `'on'` \| `'off'` (default: off)                            |
| `sound`         | Sounds                        | `'on'` \| `'off'` (default: on)                             |
| `haptics`       | Vibration                     | `'on'` \| `'off'` (default: on)                             |
| `visual-alert`  | Visual alert                  | `'off'` \| `'soft'` \| `'strong'` (default: soft)           |
| `auto-extra`    | +5 min extension              | `'on'` \| `'off'` (default: on)                             |
| `auto-chain`    | Automatic chaining            | `'on'` \| `'off'` (default: off)                            |
| `keep-awake`    | Screen on                     | `'on'` \| `'off'` (default: on)                             |
| `dial-lock`     | Dial lock                     | `'on'` \| `'off'` (default: off)                            |
| `speech`        | Voice announcement            | `'off'` \| `'milestones'` \| `'minutes'` (default: off)     |
| `tutorial-seen` | Welcome tutorial already seen | `'on'` \| `'off'` (default: off - it shows on first launch) |
| `lang`          | Language                      | language code or `'auto'`                                   |
| `preset`        | Selected mode                 | identifier                                                  |
| `presets`       | Modes                         | JSON `Preset[]`                                             |
| `routine`       | Loaded routine                | identifier, empty if none (EF-ROU-10)                       |
| `routines`      | Routines                      | JSON `Routine[]`, an empty list is allowed                  |
| `history`       | History                       | JSON `Session[]`, 500 entries at most                       |
| `daily-goal`    | Daily goal                    | minutes                                                     |

**Migrations.** There is no schema number: reads are defensive. Stored modes are filtered (string
identifier, positive duration, string colour) and, if nothing valid remains, the default modes are restored.
Unreadable JSON falls back to the default value. The stored goal is bounded and rounded. Stored routines are
filtered in the same way, step by step; an empty list is an empty list (the user deleted their routines),
whereas a missing key restores the default routines. An unreadable reminder (hour out of bounds, unknown days,
field missing from an earlier version) is discarded without taking the routine with it, which can still be
started by hand.

---

## 4. Domain services

All provided at root (`providedIn: 'root'`).

### 4.1 `TimerService` - countdown

The countdown is **computed from the real end time** (`endAt`), not by decrementing: on each tick,
`timeLeft = (endAt − now) / 1000`. A slowdown of the ticks by the browser or a move to the background therefore
introduces no drift (EF-TIM-9, ENF-PER-3). Ticks every 100 ms via `interval(100)`, stopped by a `takeUntil`.

| Member                                  | Role                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `timeLeft$`, `totalTime$`, `isRunning$` | Observable state                                                                     |
| `finished$`                             | Emitted at 0 with the **measured lateness** in seconds, used for the 90 s rule       |
| `endTime`                               | End time in ms if the countdown is running, otherwise `null` (widget, notifications) |
| `start` / `pause` / `resume` / `reset`  | Control                                                                              |
| `setTimeLeft`                           | Finger adjustment without interrupting the countdown: resets `endAt`                 |

The end haptic is loaded dynamically (`import('@capacitor/haptics')`) and its failure is ignored.

### 4.2 `SessionService` - orchestration

Central point: set duration, selected mode, current session, chaining, milestone sounds, notifications, widget,
screen-reader announcements. It lives at root precisely so that it survives navigation (EF-A11-4, ENF-PER-4).
It exposes derived signals ready to display: `displaySeconds`, `displayMinutes`, `modeName`, `stateLabel`,
`isPaused`, `announcement`.

It also carries the running of routines (`activeRoutine`, `routineIndex`, `routineDone`, `currentStep`). The
seam fits in one line: `selectedPreset` returns the current step as soon as a routine is loaded. Everything that
reads the mode - dial, display, history, notifications, widget - follows without knowing anything about routines.
Only three places know about them: the end-of-step chaining (the next step replaces the Pomodoro cycle, without
extension - RG-17, RG-18), the scheduling of notifications, and the step strip.

It also reacts to the application's lifecycle (`@capacitor/app`): on going to the background it schedules the
remaining notifications; on return it cancels them, catches up on the state and requests the screen-on lock again.

### 4.3 Other services

| Service               | Responsibility                  |
| --------------------- | ------------------------------- |
| `PreferencesService`  | Preferences as signals          |
| `PresetService`       | Modes                           |
| `RoutineService`      | Routines                        |
| `HistoryService`      | History, statistics, goal       |
| `SoundService`        | Web Audio playback              |
| `SpeechService`       | Voice announcement (Web Speech) |
| `HapticsService`      | Vibration patterns              |
| `NotificationService` | Local notifications             |
| `KeepAwakeService`    | Screen on                       |
| `WidgetService`       | iOS widget                      |
| `I18nService`         | Language and translation        |

#### Notable points

`PreferencesService` - initial theme: the saved value, otherwise `prefers-color-scheme`.

`PresetService` - filtered loading, refusal to delete the last mode, restoration of the default modes.

`RoutineService` - same rules as modes, but the list may be empty; a routine without steps is discarded on loading.

`HistoryService` - `today`, `week`, `streak` and `goalProgress` as `computed`; rescheduling at midnight.

`SoundService` - synthesis of the shared patterns, brought to the measured level (§ 8.1).

`SpeechService` - cancels the previous announcement, picks a voice in the current language if the browser offers
one, and hides itself if speech synthesis is missing.

`HapticsService` - pulses chained with `setTimeout`, Capacitor module loaded on demand, failure ignored where
vibration does not exist (iOS on the web, computer).

`NotificationService` - writes the iOS WAV files at launch, creates one Android channel per sound, and a silent
channel for the silent alerts.

`KeepAwakeService` - checks support, ignores failures, requests the lock again on return to the foreground.

`WidgetService` - active only on iOS; sends only if the JSON state has changed; retries at the next change on failure.

`I18nService` - detection from `navigator.languages`, fallback to French, updates the document's `lang` and `dir`.

---

## 5. Dial rendering

- **A single SVG**, `viewBox="0 0 420 420"`, whose paths are computed in TypeScript by pure functions
  (`features/timer/dial-geometry.ts`) - testable without the DOM.
- **Two layers**: a veil with `mix-blend-mode: multiply` over the rainbow ring of 12 segments of 5 minutes,
  and a solid plate at the centre.
- **Gestures**: *pointer* events (`pointerdown` / `pointermove` / `pointerup` / `pointercancel`), a single set of
  handlers for mouse, touch and stylus.
- **Keyboard**: ← / → (±1 min), Page Up / Page Down (±5 min), Home / End (0 / 60 min).
- The SVG is `aria-hidden`; its container carries the semantics (see §12).

### 5.1 Graduation in seconds

The dial projects a value from 0 to 60 onto a circle. Nothing requires that value to be minutes: when the set
duration falls below `SECONDS_DIAL_BELOW`, `SessionService` feeds the same geometry in **seconds**. The twelve
segments then stand for 5 s each, and the numbers on the face - 0, 5, 10… - stay correct without change, since
they are valid for both units.

Without this, an effort of 20 s would cover two degrees of the disc: the application would lose exactly what it
promises, which is to make time visible. With it, the disc starts at a third of the dial and empties before the
eyes.

Two safeguards:

- the unit follows the **set duration**, not the remaining time, otherwise a Pomodoro would switch to seconds in
  its last minute (RG-27);
- **setting** is blocked while the graduation is in seconds: dragging, arrows and the − / + buttons work in
  minutes and would produce a duration unrelated to the display (RG-26). Starting and pausing remain possible -
  the lock is what removes them, and the attribute used is `aria-readonly`, not `aria-disabled`.

A "dry" marker under the central button states the unit: without it, a dial set to 20 seconds reads as 20 minutes.

### 5.2 Sport mode

A routine marked `workout` adds the class `sport` to the stage, and publishes there the colour of the current step
(`--sport-c`). It is carried by the routine rather than by a global setting: a session is armed and left, whereas
a setting is switched on and forgotten.

The background of the stage is then **tinted** with that colour (18 % at the top, 30 % at the bottom) instead of
being replaced: light stays light and dark stays dark, so everything written on it keeps the contrast it had. A
solid colour would have forced re-checking every text of the application in ten hues.

One measured exception: the secondary grey fell to **2.82:1** on the tinted background (worst case across the ten
palette colours, light theme, bottom of the gradient). `.stage.sport` therefore redefines `--muted` as
`--muted-strong`, which raises the worst case to 5.0:1 and covers in one go everything written on the stage - the
state under the buttons, the round counter, the routine title.

The clock and the step name are enlarged through `:host-context(.sport)`: the class lives on the page, outside the
component, and an ordinary descendant selector would not match under Angular's encapsulation.

---

## 6. Welcome tutorial

`features/timer/tutorial/`: five full-screen views shown once, on first opening, driven by the `tutorial-seen`
preference. The timer page displays them while it is false; once seen, they are not shown again.

The constraints that shaped the component:

- **No automatic advance** (WCAG 2.2.2): nothing moves without a gesture. A carousel that scrolls by itself takes
  away the pace of someone reading slowly.
- **Three equivalent inputs**: horizontal swipe, buttons (Previous / Next, dots), keyboard arrows. Swiping is never
  the only means (WCAG 2.5.1).
- **Focus starts on *Next* and stays there** from one view to the next: you go through the tutorial by repeating the
  same key. A `aria-live` region says "Step 2 of 5: Set the duration" - the rank and title only, the text being read
  in place.
- **The four off-screen views are `inert` and `aria-hidden`**: they stay in the document for the swipe, but neither
  the tab key nor the screen reader enters them.
- **The rest of the page is `inert`** while the tutorial is shown, as for the settings panel: otherwise tabbing would
  leave a modal that declares itself `aria-modal`.
- **The dots are 44 px targets** for a visible dot of 10 px (WCAG 2.5.8).
- **Full screen rather than a card**: on first launch, nothing behind is worth looking at, and the whole surface leaves
  room for a pictogram large enough to carry the idea without the text. The reading column stays at 420 px, centred, on
  a large screen. Sizes follow the height (`clamp(…vh…)`), and the view scrolls instead of being cropped when the phone
  is lying down (`align-items: safe center`).
- `prefers-reduced-motion` removes the swipe: the views simply replace one another.
- In Arabic, `flex` already reverses the order of the views; the offset is reversed by `:host-context([dir='rtl'])` -
  not `[dir='rtl'] .track`, which Angular's encapsulation would prevent from matching, since the attribute lives on
  `<html>`.

## 7. Milestones

`core/helpers/milestones.ts` calculates, from the duration of a session, the list of milestones - minutes remaining and
the chime borrowed.

Fixed milestones at 45 / 30 / 15 only warn long sessions: a 25-minute Pomodoro would receive only the 15-minute one,
and a 10-minute routine step none. Above `LONG_SESSION_MINUTES`, the three known milestones are therefore kept as they
are; below it, they are derived from the duration: **the half, the last quarter, then one minute before the end**.

| Duration | Milestones (minutes remaining) |
| -------- | ------------------------------ |
| 60 min   | 45, 30, 15                     |
| 25 min   | 13, 6, 1                       |
| 10 min   | 5, 3, 1                        |
| 2 min    | 1                              |
| 1 min    | none                           |
| 20 s     | none                           |

A training step lasting a few seconds therefore receives no milestone: the first would fall after the chime. This is
intended - a "3, 2, 1" countdown every second is a different signal, which remains to be written.

The timbre (sound, vibration pattern, notification channel) comes from the **rank** and never from the number of
minutes: the last milestone always carries the most insistence. A milestone rounded to the same number of minutes as
another is merged, and none falls on the total duration itself.

`SessionService` exposes the list as a `computed`, calculated on the announced duration of the session - a finger
adjustment made along the way therefore does not move the milestones already passed - and empty during the "+5 min"
extension, which is a grace period and not a session to mark out.

---

## 8. Sounds

`core/helpers/sound-patterns.ts` defines the four patterns (`milestone45`, `milestone30`, `milestone15`, `end`) as notes -
frequency, offset, duration, gain, waveform - with an optional high partial for the bell effect.

This single file serves **two consumers**:

1. the application, which synthesises the patterns on the fly with Web Audio;
2. `scripts/generate-sounds.ts`, run by Node (`make sounds`), which renders the same patterns as 22,050 Hz WAV files
   for the native notifications.

This is why it imports nothing: it must remain runnable outside the bundle. The application's sounds and the
notification sounds are thus identical by construction.

### 8.1 Level-up

The gains written into the patterns are relative: they set the balance between the notes of one pattern, not its
volume. The volume comes from `level(pattern)`, which **measures the peak of the rendered signal** and brings it to
`PEAK_TARGET` (0.89, i.e. −1 dBFS). Measuring rather than calculating is necessary: the notes overlap and add up, so a
hand-set gain leaves the pattern either clipped or far too quiet. The factor is applied on both sides - master gain in
Web Audio, sample scale in the WAV - and it is memoised, since the calculation costs a full render.

Two intended consequences:

- **all patterns come out at the same peak**, whereas they used to spread over 17 dB (the end chime drowned out the
  milestones, and the 15-minute milestone was the most discreet of the four - the opposite of its role);
- **an alert sound must come out loud**, because the device only ever reduces what it is given. A file rendered at half
  scale arrives irremediably quiet, notably on Android where the notification volume is a separate setting.

The envelope decays towards a level **relative** to the peak of the note (−48 dB after `dur`). An absolute floor would
drop all the faster the lower the note started: a soft note was only a click, and what does not ring cannot be heard.

No limiter closes the Web Audio chain. The level-up is measured on a render where the oscillators start in phase, which
Web Audio does not guarantee: the real peak there rises to −0.5 dB instead of −1, which the margin in `PEAK_TARGET`
absorbs. A `DynamicsCompressorNode`, measured in passing, cost 3.9 dB on the transient - too brief to escape its attack -
for no protection at all.

---

## 9. Native integration

### 9.1 Local notifications

| Platform | Implementation                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | The application itself writes the WAV files into `Library/Sounds` at launch, via `@capacitor/filesystem`                           |
| Android  | `make sounds` copies the WAV files into `android/app/src/main/res/raw`; the application creates one notification channel per sound |

⚠️ **An Android channel is immutable.** Its sound is fixed at creation: recreating it does not change it. A channel
born from a build made **before** `make sounds` points to a missing `raw` resource and stays silent for ever on that
installation - the notification appears, without a sound. Hence `CHANNEL_VERSION` in `notification.service.ts`: the
identifiers carry `_v<n>`, and incrementing it creates new channels while deleting the previous ones (`deleteChannel`),
so that the same names do not appear twice in the phone's settings.

What is fixed deserves to be precise, lest one bumps for nothing: the channel retains a **URI**,
`android.resource://<package>/raw/<name>` (see `SoundResolver` on the plugin side), a reference by name resolved at
playback.

| What changes                                               | Bump `CHANNEL_VERSION`?                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| The **content** of a WAV file (level, timbre, pattern)     | No - reinstalling the APK is enough, the URI still designates the same resource |
| The **name** of a file, or the sound attached to a channel | Yes                                                                             |
| The **importance** or the vibration of a channel           | Yes                                                                             |
| A channel created while the `raw` resource was missing     | Yes - it is silent for ever                                                     |

**Two audio streams, two volumes.** The channel is created with `USAGE_NOTIFICATION` and
`CONTENT_TYPE_SONIFICATION`: notifications therefore follow Android's **notification** volume, whereas the sounds played
by the application in the foreground go through Web Audio, and so through the **media** volume. The two sliders are
independent, and the application chooses neither. This is the first thing to rule out when a sound report says it is too
quiet - the second being the level of the patterns themselves (§ 8.1).

The alerts (milestones, end, end of extension, end of the chained session) are scheduled when the app goes to the
background and cancelled on return. During a routine, it is the next step that names the end notification ("Next up:
Breakfast"), and no extension is scheduled (RG-17). On Android 12+, exact alarms may require `SCHEDULE_EXACT_ALARM`
in `AndroidManifest.xml`. No effect in the browser.

**Three lifetimes coexist**, and the distinction is vital:

|                  | Session alerts                           | Routine reminders     | Test notification        |
| ---------------- | ---------------------------------------- | --------------------- | ------------------------ |
| **Ids**          | < 1000 (`REMINDER_ID_BASE`)              | ≥ 1000                | 2000 (`TEST_ID`)         |
| **Scheduling**   | on going to the background               | on every change       | on demand                |
| **Cancellation** | all of them, on return to the foreground | never, except in bulk | never                    |
| **Form**         | `schedule.at`, one-off                   | `schedule.on`, weekly | `schedule.at`, after 5 s |

- **Scheduling** - the reminders are rewritten on every change to a routine, the language or the *Sound* setting;
  the test notification is sent from the settings.
- **Cancellation** - neither the return to the foreground nor the rewriting of the reminders reaches the test
  notification (RG-30). The reminders are cancelled only by a bulk rescheduling.
- **Form** - `schedule.on` works like cron (a day, an hour); the test fires at `TEST_DELAY_SECONDS` (5 s).

`cancelPending()> therefore filters on this boundary: without that filter, the first return to the foreground would
erase every reminder (RG-22). The days are converted from ISO 8601 to Capacitor's numbering, which counts from Sunday.
Android reschedules the reminders after a restart (`LocalNotificationRestoreReceiver`); iOS keeps them in the
notification centre.

A tap on a reminder is received by `localNotificationActionPerformed`: `extra.routineId` goes up to `SessionService`,
which **arms** the routine without starting it (RG-21).

### 9.2 Test notification and exact alarms

Authorisation, channel, sound, display on the locked screen: the chain can only be verified by walking through it.
`sendTest()` therefore schedules a notification five seconds ahead - the delay is the test itself, it leaves time to
lock the screen. The result returned to the caller (`TestResult`) distinguishes what happened: `scheduled`, `inexact`
(scheduled, but the device does not guarantee the time), `denied`, `unsupported` (browser: `Capacitor.isNativePlatform()`
is false, there is nothing to test) and `failed`. The *Settings* tab shows this outcome in an
`aria-live="polite"` region, next to the button.

`openExactAlarmSettings()` opens the system screen "Alarms & reminders" through `changeExactNotificationSetting()`.
Android only: before Android 12 the permission does not exist and the plugin answers "granted" without opening anything,
elsewhere the call would throw - hence `unsupported`, which does not lie about the reason. Note that switching from granted
to refused on this screen **restarts the application** and erases the exact alarms already scheduled; this is imposed by
the system. On return, the test must be run again: it is the test that judges, not the permission.

### 9.3 Persistent countdown outside the app

The widget waits for you to look at it; this one sits on the locked screen. A single method on the web side -
`LiveStatusService.update()` - receives **the same state as the widget**, at the same moment, and each platform does what
it can with it.

|                   | Android                                                     | iOS                                        |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------ |
| Form              | Permanent notification (`LiveStatusPlugin.java`, id 3000)   | Live Activity (ActivityKit, iOS 16.2+)     |
| Seconds           | `setUsesChronometer` + `setChronometerCountDown` (API 24)   | `Text(timerInterval:)`                     |
| Dial              | absent: a notification has no live image                    | `DialFace`, **frozen between two updates** |
| Channel / setting | channel `ongoing_v1`, low importance, no sound or vibration | `NSSupportsLiveActivities` in `Info.plist` |

**It informs, it does not alert**: otherwise the persistent countdown would cover the milestones, which must be heard.
Hence a silent channel on Android and `setOnlyAlertOnce(true)`, which prevents each rewrite from replaying the arrival of
the notification.

On iOS, `PomodoroActivity.swift` belongs to **both** targets - the application that requests the activity and the
extension that draws it: ActivityKit pairs the two ends by type, and two copies in two modules would not pair. The dial,
for its part, is redrawn only on updates pushed by the application: a Live Activity does not animate by itself, and waking
it every minute would require a push notification server. The number, on the other hand, runs on its own.

### 9.4 Home screen widgets

- `PomodoroWidget` extension (SwiftUI, WidgetKit, iOS 17+).
- Transport: local Capacitor plugin `WidgetBridge` (`ios/App/App/WidgetBridgePlugin.swift`), registered by
  `MainViewController`, which writes the JSON state into the App Group `group.com.maximejolivet.pomodorotdah`.
- The widget counts down on its own between two updates; the application pushes a state only on changes (start,
  pause, end, background, goal, language, theme, set duration) and only if the JSON differs.
- The data contract is the type `WidgetState` on the TypeScript side and `WidgetState` on the Swift side: **any change
  must be made on both sides**. On the Swift side, fields added later (`dialUnit`, `dialSeconds`, `secShort`, `dark`) are
  optional: a state written by an older version still decodes.
- On a device, the signing team must be chosen for the **App** and **PomodoroWidget** targets so that Xcode creates the
  App Group.

**The widget shows the dial, not a summary of it.** The `Dial` enumeration in `PomodoroWidget.swift` carries the
constants of `dial-geometry.ts` - 420 × 420 frame, `CX`/`CY`, radii, twelve segment colours, anticlockwise from 0 - and a
`Canvas` draws them at the widget's scale: ring, mode veil in `multiply` over the ring, central plate, twelve separators,
edge line, tab, pearly button, and the unit marker when the graduation counts seconds. The tokens of `src/theme/` are copied
into `Palette` (light and dark): the widget follows the **theme chosen in the app** (`dark`), not the system's.

| Family         | Composition                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| `systemSmall`  | The dial, and under it the reading badge: colour dot, time, mode name                                        |
| `systemMedium` | The dial on the left; on the right the mode, the time in large type in the mode's colour, and the day's goal |

**Android** (`android/app/src/main/java/.../`, in Java: the `app` module does not have the Kotlin plugin, and the widget was
not worth touching the Gradle setup) keeps the same drawing with different constraints. A widget cannot run a view of its own:
`DialBitmap` paints the dial into a `Bitmap` - a third port of the same geometry - which `RemoteViews` displays. The width of the
widget selects the layout (`widget_pomodoro` below 220 dp, `widget_pomodoro_wide` above), since multi-size `RemoteViews` do not
exist before API 31.

|            | iOS                           | Android                                                    |
| ---------- | ----------------------------- | ---------------------------------------------------------- |
| Drawing    | SwiftUI `Canvas`              | `Canvas` on a `Bitmap` (320 px at most: it travels by IPC) |
| Seconds    | `Text(timerInterval:)`        | `Chronometer` in countdown mode (API 24)                   |
| Graduation | one timeline entry per minute | one `AlarmManager` alarm per minute                        |
| Transport  | App Group + `WidgetCenter`    | `SharedPreferences` + `AppWidgetManager` (same process)    |

**Two clocks, and this is what makes the widget sustainable for the battery**: the chronometer ticks the seconds without
anything waking it, and the alarm redraws the dial only when the graduation changes - a minute, or five seconds on a dial
graduated in seconds. When the countdown stops, the alarm is cancelled: a frozen dial has no reason to wake the phone.
`updatePeriodMillis` is therefore **0**: the system wakes nothing by itself.

On Android 12+, the exact alarm depends on "Alarms & reminders"; if refused, the widget falls back to an ordinary alarm and
is a little late, it does not stop. Before Android 12 - so on Android 9 - the question does not arise: the exact alarm is
granted by default.

The disc empties by itself: the timeline sets one entry per **graduation crossed** - one per minute, or one per second on a
dial graduated in seconds - plus the end of the countdown and midnight, 58 steps at most. `.contentMarginsDisabled()` returns to
the dial the margin that the system reserves. The dial is `accessibilityHidden`: it is an image of the time, and the badge says
the same thing in full words.

### 9.5 Application identity

`appId`: `com.maximejolivet.pomodorotdah` · `appName`: Pomodoro Accessibilité · `webDir`: `www`.
The icons and launch screens of both platforms are generated by `make icons` (`scripts/generate-icons.ts`, rendered by Chromium)
from `resources/app-icon.svg` and `resources/app-icon-foreground.svg` - see [MOBILE.md](MOBILE.md).

---

## 10. Internationalisation

- One dictionary per language in `core/i18n/locales/`: `fr`, `en`, `es`, `de`, `it`, `pt`, `ar`.
- The keys are **typed from French** (`type I18nKey = keyof typeof fr`): a key missing in another language is a compile-time
  error (ENF-MNT-1).
- The texts of the accessibility page live separately, in `features/accessibility/accessibility.i18n.ts`.
- `I18nService` detects the language from `navigator.languages`, falls back to French, and updates
  `document.documentElement.lang` as well as the writing direction (`dir`).
- **Adding a language** = a file in `locales/`, then an entry in `Lang`, `DICTIONARIES`, `LANGUAGES` - and in `RTL_LANGS` if it is
  written right to left.
- The CSS uses logical properties (`inset-inline-*`, `start` / `end`): switching to RTL needs no mirrored rule.

---

## 11. Theme and styles

| File                     | Content                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| `src/styles.css`         | Theme imports, Tailwind, global utilities                           |
| `src/theme/tokens.css`   | Light theme colour tokens, set on `<app-root>`                      |
| `src/theme/dark.css`     | Token overrides under `app-root.dark`                               |
| `src/theme/controls.css` | Shared primitives: relief button, slider, segmented control, switch |

Colours are **never** hard-coded in a component: all go through CSS variables inherited from `<app-root>`, which makes
the theme switch instant and guarantees consistent contrast (ENF-MNT-2).

---

## 12. Technical accessibility

| Requirement                           | Implementation                                                       |
| ------------------------------------- | -------------------------------------------------------------------- |
| Dial usable by keyboard and announced | Focusable container carrying `role="slider"`                         |
| Real-time announcements               | Live region fed by `SessionService.announcement`                     |
| Remaining time without sight          | Optional voice announcement (`SpeechService`)                        |
| Alert without sight or hearing        | A vibration pattern specific to each milestone (`HapticsService`)    |
| Alert without sound                   | Coloured pulse at 0.6 Hz and a persistent end banner                 |
| Involuntary gestures                  | Dial lock                                                            |
| Settings panel                        | Trapped focus, closed with Escape, focus returned to the trigger     |
| Tabs                                  | `tablist` / `tab` / `tabpanel` roles, arrow-key navigation           |
| Contrast                              | Theme tokens checked to 4.5:1 minimum, in light and dark             |
| Colour alone                          | Each mode colour is accompanied by its name                          |
| Animations                            | `prefers-reduced-motion` respected                                   |
| Dyslexia                              | OpenDyslexic font can be enabled, with wider letter and line spacing |
| Sequence of actions without reading   | A pictogram before each step's name                                  |
| Structure                             | Semantic HTML, `main`, hierarchical headings, page metadata          |

### Details

**Dial** - `aria-valuemin=1`, `aria-valuemax=60`, `aria-valuenow`, `aria-valuetext` ("*n* minutes, *action*") and `aria-label`.
The SVG itself is `aria-hidden`: it says nothing a screen reader could use.

**Voice announcement** - at the milestones or every minute, in the language of the interface.

**Vibration** - the patterns are distinguished by the number of pulses and their rhythm, not by their duration (see `ENF-A11-13`).

**Alert without sound** - `aria-hidden` and `pointer-events: none`, frozen under `prefers-reduced-motion`: it duplicates information
already given elsewhere.

**Dial lock** - `SessionService` ignores the setting, the reset, the step change and the exit from a routine. The slider gets
`aria-disabled`, as do the − / + buttons and the step tiles.

**Tabs** - the arrow keys are named for screen readers.

**Routine steps** - the strip is an `<ol>` of buttons, the current step marked `aria-current="step"`. The state (done, current) is
restated in the accessible name and doubled by a tick, never carried by colour alone.

The known gaps are published in the application's accessibility statement (see § 7.1 of the functional specification).

---

## 13. Build, execution and continuous integration

### 13.1 Commands

The `Makefile` is the entry point (`make` on its own shows the help): `install`, `dev`, `build`, `watch`, `test`, `sync`,
`sounds`, `icon`, `ios`, `android`, `open-ios`, `open-android`, `clean`. The matching npm scripts are `start`, `build`, `watch`,
`test`, `test:a11y`.

### 13.2 Web build

- Builder `@angular-devkit/build-angular:application`, output `dist/pomodoro-tdah`.
- Production: hashed file names, budgets of **500 kB / 1 MB** for the initial bundle and **24 kB / 32 kB** per component
  stylesheet.
- Development: optimisation disabled, source maps.
- The files of `public/` are copied as they are (favicons, Apple icon).

### 13.3 Mobile chain

`make sync`: build → copy of `dist/pomodoro-tdah/browser` into `www/` → `npx cap sync` → `make sounds` (generation of the WAV
files and copy into `res/raw` if the Android folder exists). `make open-ios` / `make open-android` chain `sync` and then open the
native IDE.

### 13.4 Continuous integration

GitHub Actions workflow `.github/workflows/a11y.yml`, triggered by pushes to `main` and by every merge request, with two jobs on
`ubuntu-latest`:

1. **Production build** - `npm ci` then `npm run build`.
2. **Accessibility regression** - installation of Chromium by Playwright, `npm run test:a11y`, then upload of the Playwright
   report as an artefact (7-day retention).

The Node version comes from `.nvmrc`; the npm cache is enabled.

### 13.5 Deployment

The web build is a set of static files: any static host will do, with no environment variable and no add-on service. The mobile
versions are produced from Xcode and Android Studio. There are no published versions: only the latest version of `main` is maintained.

---

## 14. Quality and tests

| Level         | Tool                                     | Scope                             |
| ------------- | ---------------------------------------- | --------------------------------- |
| Unit          | Karma + Jasmine (`make test`)            | **Nothing for now**               |
| Accessibility | Playwright + axe-core (`make test-a11y`) | Real journeys, keyboard, contrast |

⚠️ `src/` contains **no** `.spec.ts`, so `make test` fails with `TS18003`. The domain logic - dial geometry, time helpers,
services - is covered only end to end, by the accessibility suite.

Playwright configuration: `tests/` folder, Chromium project at **420 × 900** (mobile framing), development server started
automatically on `http://localhost:4200`, parallel execution, one retry in CI, trace on the first retry, `forbidOnly` in CI.

The suite `tests/a11y.spec.ts` (80 tests) analyses with the rule sets `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and
`best-practice`, in **light and dark themes**, on the home page, on the open settings panel and on the mode and routine editors.
The behaviours that depend on time (voice announcement, vibration, visual alert, chaining of the steps of a routine) are played
with Playwright's simulated clock. Any violation fails the CI.

**Acceptance criteria for a contribution**: the production build passes, the accessibility suite reports no violation, no colour
is hard-coded, no translation key is missing (the compiler checks it), and the commit message follows the semantic format.

---

## 15. Security

- **Reduced attack surface**: no server, no outgoing request, no authentication, no data leaving the device.
- The only data stored are preferences, modes and history, in local storage, with no identifying personal data.
- Reporting a vulnerability: **no public issue**; use GitHub's private reporting (*Security* tab → *Report a vulnerability*).
  See `SECURITY.md`.
- Only the latest version of `main` receives fixes.
- On the native side: permissions limited to local notifications, haptics, keeping the screen on, and writing the sounds into
  the application's container.

---

## 16. Constraints, limits and evolutions

### 16.1 Accepted limits

| Limit                                                   | Reason                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| History capped at 500 sessions                          | Size of `localStorage`; beyond that, the statistical value is marginal       |
| No data export by the user                              | Not specified to date                                                        |
| iOS widget only                                         | No Android equivalent built                                                  |
| `WidgetState` contract duplicated in TypeScript / Swift | No code generation; any change is made on both sides                         |
| No tests with a real screen reader                      | Automatic checks and code review only; the gap is published in the statement |
| Accessibility tests on Chromium only                    | A single engine in CI                                                        |

### 16.2 Points of attention

- Any new colour must go through the theme tokens and be checked in light **and** dark.
- Any new text must exist in the seven dictionaries, otherwise it is a compile-time error.
- Any new alert must exist both as a Web Audio sound and as a native notification, otherwise the behaviour differs depending on
  whether the application is in the foreground or not.
- Any new session state must be carried by `SessionService`, never by a page component.

### 16.3 Possible evolutions

Export and import of data · Android widget · full manual audit with a screen reader and 200% magnification · measurement of the
contrast of non-text elements on the rendering · extension of the accessibility tests to other engines and to other languages,
including Arabic in RTL · a pictogram bank such as ARASAAC as a complement to emojis, for AAC uses (augmentative and alternative
communication) where the symbols are already those of the person.
