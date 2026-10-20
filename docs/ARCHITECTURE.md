# Architecture

🇬🇧 English · [🇫🇷 Français](ARCHITECTURE.FR.md)

[← Back to the README](../README.md) · [Technical specification](TECHNICAL-SPECIFICATION.md)

```
src/
├── index.html                  # Metadata, favicons
├── styles.css                  # Theme imports, Tailwind, global utilities
├── theme/
│   ├── tokens.css              # Colour tokens (light theme), set on <app-root>
│   ├── dark.css                # Token overrides for the dark theme
│   └── controls.css            # Shared primitives (relief button, slider, segmented control, switch)
└── app/
    ├── app.component.*         # Shell: applies the theme + <router-outlet>
    ├── app.config.ts           # Providers (router)
    ├── app.routes.ts           # Routes, loaded on demand (loadComponent)
    ├── core/                   # What does not depend on any page
    │   ├── constants/          # timer · history · preset · routine · tutorial (domain rules and settings)
    │   ├── models/             # preset · routine · session · alert · widget-state
    │   ├── helpers/            # storage.ts · time.ts
    │   │                     #   milestones.ts     session milestones
    │   │                     #   sound-patterns.ts sound patterns, levelling, WAV
    │   │                     #   haptic-patterns.ts vibration patterns
    │   ├── i18n/
    │   │   ├── i18n.service.ts # Current language, writing direction, translation
    │   │   ├── i18n.model.ts   # Typed keys, language list, RTL languages
    │   │   └── locales/        # One dictionary per language (fr en es de it pt ar)
    │   └── services/
    │       ├── timer.service.ts        # Countdown based on the end time (RxJS)
    │       ├── session.service.ts      # Current session, chaining, sounds, notifications, widget
    │       ├── preferences.service.ts  # Persisted preferences, as signals
    │       ├── preset.service.ts       # Customisable modes
    │       ├── routine.service.ts      # Routines: chained sequences of steps
    │       ├── history.service.ts      # Session history and statistics
    │       ├── sound.service.ts        # Sound playback (Web Audio), at the level measured in the patterns
    │       ├── speech.service.ts       # Remaining time read aloud (Web Speech)
    │       ├── haptics.service.ts      # Vibration patterns per milestone (Capacitor Haptics)
    │       ├── notification.service.ts # Capacitor local notifications + native sounds + weekly reminders
    │       ├── keep-awake.service.ts   # Screen kept on
    │       └── widget.service.ts       # State sent to the iOS widget
    └── features/               # One page per folder
        ├── timer/
        │   ├── timer-page.component.*  # Assembles the blocks below
        │   ├── dial/                   # 3D case, SVG dial, adjustment by touch and keyboard
        │   ├── readout/                # Time, mode, state, cycle, − / + buttons
        │   ├── routine/                # Strip of the steps of the current routine
        │   ├── controls/               # Reset, start / pause, settings
        │   ├── sheet/                  # Sliding panel + Modes / Settings tabs
        │   │                           #   (the Modes tab holds the Routines section and its editor)
        │   ├── tutorial/               # Welcome tutorial: five views, on first launch
        │   ├── dial-geometry.ts        # SVG paths of the dial (pure functions)
        │   └── timer.model.ts          # Panel tabs, mode and routine being edited
        └── accessibility/
            ├── accessibility-page.component.*  # Accessibility page (route /accessibility)
            └── accessibility.i18n.ts           # Its texts, per language
tests/
└── a11y.spec.ts                # Accessibility regression tests (npm run test:a11y)
playwright.config.ts            # Starts the app and runs the tests on Chromium
.github/workflows/a11y.yml      # Production build + accessibility tests on every push
scripts/
└── generate-sounds.ts          # Notification WAV files (make sounds — also copies them into res/raw)
resources/sounds/               # Generated WAV files, peak at −1 dBFS
resources/app-icon.svg          # Icons and launch screens, iOS · Android · web (make icons)
resources/app-icon-foreground.svg  # Foreground layer of the Android adaptive icon
ios/App/
├── App/WidgetBridgePlugin.swift  # Local plugin: state → App Group → widget
├── App/MainViewController.swift  # Registers the local plugins
└── PomodoroWidget/               # WidgetKit extension (SwiftUI)
public/
├── favicon.svg · favicon.ico · apple-touch-icon.png
docs/
└── documentation and screenshots
```

## Key points

### Structure

The shell (`app.component.*`) holds only the theme and the router. Each page lives in
`features/`, and everything they share lives in `core/`. Both pages are loaded on demand, so the
accessibility page does not weigh on startup.

**No `shared/`, `guards/`, `interceptors/`, `pipes/` or `environments/` folders**: there is nothing
to put in them today. These folders will be created on the day a second use appears.

### Components

The timer page only assembles blocks — `dial`, `readout`, `controls`, `sheet` — each with its own
template and style.

They read the state from the services rather than through a cascade of inputs. Only what is local
flows through inputs / outputs: open panel, mode draft, gesture in progress.

### Session state in a service, not in the page

Pages are destroyed on every navigation. `SessionService` (root) therefore holds the current
session, the chaining, the sounds, the notifications and the widget; the timer page is only a view.

Intended consequence: a session keeps running, ends and is recorded while the accessibility page is
being read.

### Dial

A single SVG (viewBox 420 × 420), with paths computed in TypeScript. The disc is drawn in two
layers: a veil with `mix-blend-mode: multiply` on the ring, and a solid plate at the centre.

### Countdown

Computed from the real end time, so it stays correct even in the background.

### Sounds defined once, played in two ways

`core/helpers/sound-patterns.ts` describes the patterns as notes and imports **nothing**, because it
runs both in the bundle and under Node:

- the app synthesises them with Web Audio;
- `scripts/generate-sounds.ts` renders them as WAV files for the native notifications.

Both are therefore identical by construction, and a sound added on one side cannot be missing on the
other.

**The volume is not written into the patterns**: the note gains only set the balance between the
notes. `level(pattern)` measures the peak of the rendered signal and brings it to −1 dBFS, with the
same factor on both sides.

Measuring rather than calculating is necessary: the notes overlap and add up, so a hand-set gain
leaves the pattern either clipped or far too quiet. An alert sound must come out loud, because the
device only ever *reduces* what it is given — and on Android, the notification volume is a slider
separate from the media volume.

### A routine is a sequence of modes

Each step has the shape of a `Preset` — name, duration, colour, nature — plus an icon.

`SessionService.selectedPreset` returns the current step when a routine is loaded, so the dial, the
history, the notifications and the widget have no concept of routines to handle. Only the chaining
and the strip have one.

### Themes

All colours are CSS variables in `src/theme/`, set on `<app-root>` and overridden under
`app-root.dark`, so the pages inherit them.

### Translations

One dictionary per language in `core/i18n/locales/`, typed from French: a key missing in another
language is a **compile-time error**.

Adding a language means adding a file in `locales/`, then an entry in `Lang`, `DICTIONARIES` and
`LANGUAGES` — and in `RTL_LANGS` if it is written right to left. The CSS uses logical properties
(`inset-inline-*`, `start` / `end`).

### Persistence

Preferences, modes, routines and history are saved in `localStorage`; the history keeps the last
500 sessions.

### Accessibility tested continuously

`npm run test:a11y` starts the application and checks seventy-two points:

- **axe-core** on the home page, the panel (three tabs), the mode editor, the routine editor and the
  accessibility page — in light and dark themes, and in Arabic;
- adjusting the dial **with the keyboard**;
- the chaining of the steps of a routine, and its strip;
- the **focus trap** of the modal, Escape, and the return of focus;
- no horizontal scrolling at **320 px**;
- text spacing (WCAG 1.4.12);
- the contrast of the switches, measured on the **rendered pixels** (WCAG 1.4.11).

The CI runs them again on every push.
