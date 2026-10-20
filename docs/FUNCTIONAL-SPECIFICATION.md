# Functional specification

🇬🇧 English · [🇫🇷 Français](FUNCTIONAL-SPECIFICATION.FR.md)

[← Back to the README](../README.md) · [Technical specification](TECHNICAL-SPECIFICATION.md)

Version 1.1 — 26 September 2026 · **Pomodoro Accessibilité** application (web, iOS, Android)

## Contents

- [1. Context and goals](#1-context-and-goals)
- [2. Scope](#2-scope)
- [3. Target users](#3-target-users)
- [4. Functional requirements](#4-functional-requirements)
- [5. Business rules](#5-business-rules)
- [6. User journeys](#6-user-journeys)
- [7. Non-functional requirements](#7-non-functional-requirements)
- [8. Out of scope](#8-out-of-scope)

---

## 1. Context and goals

### 1.1 Observation

A clock gives the time, a digital timer shows digits: neither one **shows** the remaining time. For
many neurodivergent people (ADHD, autism, dys- disorders), time is not "felt": ten minutes and an
hour can seem identical, and reading the time does not help work out how much is left.

### 1.2 Product goal

Provide a **visual timer** in which a coloured disc covers the chosen duration and shrinks as time
passes, so that a calculation is replaced by an image. Add to it the mechanisms of the Pomodoro method
(sessions, breaks, chaining, statistics) without ever introducing pressure or judgement.

### 1.3 Measurable goals

| Ref. | Goal | Indicator |
| --- | --- | --- |
| OBJ-1 | Understand the remaining time without reading numbers | The dial alone is enough to place the duration |
| OBJ-2 | Be usable by everyone | RGAA 4.1 / WCAG 2.1 AA, 0 axe-core violations on the tested journeys |
| OBJ-3 | Work without an account or network | No outgoing request, no data leaving the device |
| OBJ-4 | Stay accurate in the background | Zero drift in the countdown after returning to the foreground |
| OBJ-5 | Serve beyond the school setting | Use in a professional context documented and supported (open-plan offices, meetings) |
| OBJ-6 | Follow a sequence of actions without being able to read | Each step of a routine is carried by a pictogram before its name |

### 1.4 Guiding principles

1. **No pressure**: no punitive score, no penalty; no other goal.
2. **User control**: sounds, vibration, screen on, chaining — everything can be switched off.
3. **Calm display**: no flashing; animations are reduced when the device asks for it.
4. **Gentle ending**: at 0, a 5-minute extension avoids an abrupt stop.
5. **Accessibility by default**, never an option added after the fact.

---

## 2. Scope

### 2.1 Platforms

| Platform | Support | Specifics |
| --- | --- | --- |
| Web (modern browser) | Main target | Web Audio sounds, Wake Lock where available |
| iOS | Via Capacitor | Local notifications, haptics, home screen widget |
| Android | Via Capacitor | Local notifications with sound channels, haptics |

### 2.2 Screens

| Screen | Route | Content |
| --- | --- | --- |
| Timer | `/` | Dial, time display, routine strip, controls, panel (Modes / Settings) |
| Accessibility | `/accessibility` | RGAA accessibility statement, notes on neurodiversity, targeted standards |

### 2.3 Structural constraints

- **No server**: no account, no API, no synchronisation. Everything is local.
- **No collection**: no analytics, no telemetry, no identifier.
- **Fully offline**: the application works without network once loaded.

---

## 3. Target users

### 3.1 Profiles

**ADHD** — estimating a duration, starting, stopping on time.
→ Continuous visual cue, short sessions, *ADHD Focus* mode.

**Autism** — transitions, the unexpected, noise.
→ Milestones announced in advance, routines in pictograms, sounds that can be switched off.

**Dys- disorders** — reading digits or a time, fatigue when reading.
→ Time readable without digits, OpenDyslexic font, spaced text.

**Other profiles** — need clear instructions and less pressure.
→ Free durations of 1–60 min, custom modes, no scores.

**People who do not read** (young children, intellectual disability) — following a sequence of
actions without text.
→ Routines in pictograms, one step after another, nothing to read.

**Carers** (parents, teachers, managers) — remind someone of the time without intervening.
→ Duration visible to everyone, the person's autonomy preserved.

### 3.2 Usage contexts

Homework and home routines · classroom · Pomodoro work sessions · meetings and interviews (duration
visible to everyone) · open-plan office and remote work (discreet vibration and notifications) ·
workplace adjustments that do not stigmatise, since the tool serves everyone.

### 3.3 Technical usage context

- Mobile screen first (the layout is designed for a phone-sized width).
- May be used keyboard only, with a screen reader, or by touch.
- A session may last 60 min with the application in the background or the device locked.

---

## 4. Functional requirements

Coding: `EF-<area>-<n>`. Priority: **M** (must), **S** (should), **C** (could).

### 4.1 Dial and countdown (`EF-TIM`)

| Ref. | Requirement | Prio |
| --- | --- | --- |
| EF-TIM-1 | The dial shows a coloured disc covering the remaining time, which shrinks to 0. | M |
| EF-TIM-2 | The graduation covers 60 min, with a ring of 12 coloured segments of 5 min. | M |
| EF-TIM-3 | Dragging a finger on the dial sets the duration, from 0 to 60 min, including during the countdown. | M |
| EF-TIM-4 | Tapping the dial or ▶ starts, pauses or resumes the countdown. | M |
| EF-TIM-5 | The ↺ button resets the timer to zero without recording a session. | M |
| EF-TIM-6 | The remaining time is also shown in plain text (mm:ss) next to the dial. | M |
| EF-TIM-7 | The current state (mode, running / paused / finished, cycle) is shown under the time. | M |
| EF-TIM-8 | Keyboard: ← / → adjust by one minute, Page Up / Page Down by five, Home / End go to 0 / 60 min. | M |
| EF-TIM-9 | The countdown stays accurate if the application goes to the background or the device locks. | M |
| EF-TIM-10 | A haptic response accompanies finger adjustment and the end of the countdown. | S |
| EF-TIM-11 | Two buttons − / + frame the display: one minute per tap. | M |

**EF-TIM-11** — holding the button repeats the minutes.

### 4.2 Modes (`EF-MOD`)

| Ref. | Requirement | Prio |
| --- | --- | --- |
| EF-MOD-1 | Four modes are shipped: Pomodoro, Break, Long break, ADHD Focus. | M |
| EF-MOD-2 | The user can create, edit and delete their own modes. | M |
| EF-MOD-3 | A mode has a name, a duration from 1 to 60 min, a colour and a nature. | M |
| EF-MOD-4 | The mode's colour tints the dial and the history. | M |
| EF-MOD-5 | The default modes can be restored from the settings. | S |
| EF-MOD-6 | The selected mode is remembered from one opening to the next. | M |
| EF-MOD-7 | Every colour is always accompanied by its name (never information carried by colour alone). | M |

**EF-MOD-3** — the colour is chosen from a palette of 10; the nature is *work*, *break* or *long break*.

**EF-MOD-1** — 25, 5, 15 and 15 min respectively.

### 4.3 Routines (`EF-ROU`)

| Ref.      | Requirement                                                                 | Prio |
| --------- | --------------------------------------------------------------------------- | ---- |
| EF-ROU-1  | A routine is an ordered sequence of steps that chain on their own.          | M    |
| EF-ROU-2  | A step carries a pictogram, a name, a duration and a colour.                | M    |
| EF-ROU-3  | Two example routines are shipped, restorable from the panel.                | S    |
| EF-ROU-4  | The user creates, renames, reorders and deletes routines and steps.         | M    |
| EF-ROU-5  | Choosing a routine arms its first step, without starting anything.          | M    |
| EF-ROU-6  | A strip shows the steps in order, each with its pictogram.                  | M    |
| EF-ROU-7  | Each step of the strip is a button: it takes you straight to that step.     | S    |
| EF-ROU-8  | At the end of a step, the next one starts and its name is announced.        | M    |
| EF-ROU-9  | At the last step, the routine is finished and everything is ticked.         | M    |
| EF-ROU-10 | The loaded routine is remembered and can be left with one button.           | S    |
| EF-ROU-11 | The dial lock blocks step changes and leaving the routine.                  | M    |
| EF-ROU-12 | A routine can carry a reminder: a time and days.                            | S    |
| EF-ROU-13 | At the set time, the notification names the routine and its pictogram.     | S    |
| EF-ROU-14 | The reminder survives closing the application and restarting the device.    | M    |
| EF-ROU-15 | A set reminder is visible on the routine's card.                            | S    |
| EF-ROU-16 | The duration of a step is set with a single slider.                         | M    |
| EF-ROU-17 | A routine can be repeated from 1 to 20 times.                               | S    |
| EF-ROU-18 | The current round is shown ("Round 2 of 8") and announced.                  | M    |
| EF-ROU-19 | A training routine is shipped: Tabata, eight rounds.                        | S    |
| EF-ROU-20 | Below one minute, the dial graduates in **seconds** and shows them.         | M    |
| EF-ROU-21 | On a short step, the last three seconds are counted down.                   | S    |
| EF-ROU-22 | On such a step, the next one is announced 5 s before the end.               | S    |
| EF-ROU-23 | A routine can be marked **training**.                                       | S    |
| EF-ROU-24 | In sport mode, the colour of the current step tints the whole page.         | S    |
| EF-ROU-25 | In sport mode, the clock and the step name are enlarged.                    | S    |

#### Details

**EF-ROU-1** — with no action from the user between two steps.

**EF-ROU-2** — duration from 5 s to 60 min, and whether it counts towards the day's focus or not.

**EF-ROU-3** — "Morning routine" and "Homework".

**EF-ROU-4** — from 1 to 10 steps per routine.

**EF-ROU-5** — the countdown then starts with the same gesture as a mode.

**EF-ROU-6** — what is done, what is playing, what comes next.

**EF-ROU-7** — forwards as well as backwards.

**EF-ROU-8** — through the sound, the voice, the notification and the live region.

**EF-ROU-11** — as it blocks the reset.

**EF-ROU-13** — tapping opens the application and **arms** the routine without starting it.

**EF-ROU-14** — it is rescheduled when the routine or the language changes.

**EF-ROU-15** — and is stated in its accessible name.

**EF-ROU-16** — in steps of 5 s below one minute, in steps of one minute above it.

**EF-ROU-17** — the sequence of steps starts again from the first one on each round.

**EF-ROU-18** — the dots count rounds, not Pomodoro cycles.

**EF-ROU-19** — 20 s of effort and 10 s of rest.

**EF-ROU-20** — a "dry" marker signals it.

**EF-ROU-21** — a sound, a vibration, a flash, and the digits are spoken.

**EF-ROU-22** — spoken aloud: "Next: Rest".

**EF-ROU-23** — sport mode is set up while it is loaded, and is left with it.

**EF-ROU-24** — it changes with each phase, without anything to read.

**EF-ROU-25** — the name moves under the clock.

### 4.4 Welcome tutorial (`EF-TUT`)

| Ref. | Requirement | Prio |
| --- | --- | --- |
| EF-TUT-1 | On first launch, five full-screen views introduce the application. | S |
| EF-TUT-2 | Each view carries a pictogram before its title, and at most one sentence. | M |
| EF-TUT-3 | You move on by swiping, with the buttons (Previous / Next, dots) or with the keyboard (arrows). | M |
| EF-TUT-4 | No automatic advance: the pace belongs to the reader (WCAG 2.2.2). | M |
| EF-TUT-5 | The tutorial is dismissed with *Skip* or Escape, and does not reappear on its own. | M |

**EF-TUT-1** — seeing the time, setting it, starting it, the modes and routines, the alerts.

### 4.4b Table mode (`EF-TAB`)

| Ref. | Requirement | Prio |
| --- | --- | --- |
| EF-TAB-1 | A table mode shows the dial large, with everything else cleared. | S |
| EF-TAB-2 | Everything that cannot be read from two metres is cleared. | S |
| EF-TAB-3 | Start / Pause and the dial lock remain: a timer you cannot start is of no use. | M |
| EF-TAB-4 | In landscape, the dial goes on the left and the time on the right: stacked, neither would fit. | S |
| EF-TAB-5 | The exit is visible, named in full, reachable by keyboard, and Escape also exits. | M |
| EF-TAB-6 | The screen stays on for as long as table mode lasts, whatever the setting. | M |

**EF-TAB-6** — a table timer that switches its screen off is of no use.

**EF-TAB-2** — settings, reset, − / + buttons, accessibility badge.

**EF-TAB-1** — a phone placed upright then serves as a visual timer for a table or a class.

### 4.5 Chaining and extension (`EF-CHA`)

| Ref. | Requirement | Prio |
| --- | --- | --- |
| EF-CHA-1 | "+5 min" option: at 0, a work session extends automatically by 5 minutes. | M |
| EF-CHA-2 | The extension happens only once per session. | M |
| EF-CHA-3 | Automatic chaining option: work → break → work, without user action. | S |
| EF-CHA-4 | A long break is offered after every 4 completed work sessions. | S |
| EF-CHA-5 | The two options can be switched off independently. | M |

### 4.6 Sound, haptic and notification alerts (`EF-ALE`)

| Ref.      | Requirement                                                                       | Prio |
| --------- | --------------------------------------------------------------------------------- | ---- |
| EF-ALE-1  | Three milestones before the end, each with a different sound, then a chime at 0.  | M    |
| EF-ALE-2  | The sounds go from the most discreet to the most insistent as the end approaches. | M    |
| EF-ALE-4  | The sounds can be turned off globally; the choice is remembered.                  | M    |
| EF-ALE-5  | On mobile, local notifications take over these alerts, with the same sounds.      | M    |
| EF-ALE-6  | Notifications are cancelled when the app returns to the foreground.               | M    |
| EF-ALE-7  | A milestone passed more than 90 s ago in the background is not replayed.          | S    |
| EF-ALE-8  | Permission is requested on first launch, not on opening.                          | M    |
| EF-ALE-9  | Each milestone and the end have a distinct vibration pattern.                     | S    |
| EF-ALE-10 | A pattern is recognised by its number of pulses and their rhythm.                 | S    |
| EF-ALE-11 | Each milestone and the end trigger a visual signal: none, soft or strong.         | S    |
| EF-ALE-12 | The visual signal beats at 0.6 Hz at most and freezes if the device asks for it.  | M    |
| EF-ALE-13 | At the end, a "Time's up" banner stays until the next action.                     | S    |
| EF-ALE-14 | A test notification is scheduled for five seconds, from the settings.             | S    |
| EF-ALE-15 | The test says in the same place what happened, in a live region.                  | M    |
| EF-ALE-16 | A link leads to the system screen "Alarms & reminders" (Android 12+).             | S    |
| EF-ALE-17 | During a session, a persistent countdown appears outside the application.         | S    |
| EF-ALE-18 | This countdown never alerts: no sound, no vibration, no badge.                    | M    |
| EF-ALE-19 | It disappears as soon as the countdown stops, and tapping it starts nothing.      | M    |
| EF-ALE-20 | All sounds come out at the same level, close to the maximum of the scale.         | M    |

#### Details

**EF-ALE-1** — the three milestones are calculated from the session's duration (§ 7. Milestones in the
technical specification), not at fixed times.

**EF-ALE-2** — this progression is carried by the pattern and the timbre: one round note, two rising
notes, three quick beeps. It is **not** carried by the volume. A milestone must not be missed because
it comes first.

**EF-ALE-5** — when the application is in the background or the device is locked, where JavaScript is
suspended.

**EF-ALE-6** — the application's sounds then take over.

**EF-ALE-7** — the notification has already warned; replaying it would make the same milestone ring twice.

**EF-ALE-9** — the pattern follows the rhythm of the matching sound: one long pulse, two pulses, three
short, three long.

**EF-ALE-10** — the requested duration is honoured on Android and on an iPhone with a Taptic Engine; an
older iOS device falls back to a system vibration of fixed length. Hence recognition by number and
rhythm rather than by duration.

**EF-ALE-11** — one beat at a milestone, three at the end.

**EF-ALE-12** — it freezes under `prefers-reduced-motion`, intercepts no click and is not exposed to
screen readers: it duplicates information already given elsewhere.

**EF-ALE-13** — an alert that passes by is easily missed.

**EF-ALE-14** — the delay is the point of the test: it leaves time to lock the screen, and it is with the
screen locked that you want to know whether the device warns you.

**EF-ALE-15** — five distinct outcomes: scheduled, scheduled without exact alarm, notifications refused,
unavailable outside the installed application, or failed.

**EF-ALE-16** — elsewhere, the link states that this screen does not exist, rather than implying a refusal.

**EF-ALE-17** — a silent notification on Android, a Live Activity on iOS. It gives the remaining time
without unlocking the device.

**EF-ALE-18** — it informs, and lets the milestones be heard.

**EF-ALE-20** — a device only ever *reduces* what it is given. A sound rendered at half scale arrives
irremediably quiet, and an alert that cannot be heard does not fulfil its role.

### 4.8 Preferences (`EF-PRE`)

| Ref. | Requirement | Prio |
| --- | --- | --- |
| EF-PRE-1 | Dark mode: follows the device on first launch, then editable and remembered. | M |
| EF-PRE-2 | OpenDyslexic font can be turned on. | M |
| EF-PRE-3 | Sounds on/off. | M |
| EF-PRE-4 | "+5 min" extension on/off. | M |
| EF-PRE-5 | Automatic chaining on/off. | S |
| EF-PRE-6 | Screen kept on during the countdown, on/off. | S |
| EF-PRE-8 | Language: automatic (device language) or chosen. | M |
| EF-PRE-9 | Every preference is kept from one opening to the next. | M |
| EF-PRE-10 | Voice announcement: none, at milestones, or every minute (default: none). | S |
| EF-PRE-11 | Vibration on/off (default: on); turning it on lets you feel the end pattern. | S |
| EF-PRE-12 | Visual alert: none, soft or strong (default: soft); the choice is shown at once. | S |
| EF-PRE-13 | Dial lock on/off (default: off), kept from one opening to the next. | S |

**EF-PRE-10** — the choice is heard at once.

### 4.9 Internationalisation (`EF-I18`)

| Ref. | Requirement | Prio |
| --- | --- | --- |
| EF-I18-1 | Seven languages: French, English, Spanish, German, Italian, Portuguese, Arabic. | M |
| EF-I18-2 | Arabic is displayed right to left, layout included. | M |
| EF-I18-3 | The language is detected from the device on first launch, falling back to French. | M |
| EF-I18-4 | Changing language takes effect at once, without reloading. | M |
| EF-I18-5 | Labels passed to the widget and to notifications follow the application's language. | S |

### 4.10 Screen on and widget (`EF-NAT`)

| Ref.     | Requirement                                                                              | Prio |
| -------- | ---------------------------------------------------------------------------------------- | ---- |
| EF-NAT-1 | The screen does not switch off during the countdown, if the option is active.            | S    |
| EF-NAT-2 | A home screen widget, iOS and Android, shows the dial.                                   | C    |
| EF-NAT-3 | The widget counts down on its own between two application updates.                       | C    |
| EF-NAT-4 | The widget is updated at every change.                                                   | C    |
| EF-NAT-5 | The widget follows the application's theme, light or dark.                               | C    |
| EF-NAT-6 | Tapping the widget opens the application, without starting anything.                     | C    |
| EF-NAT-7 | The application opens on a black background where the dial turns, until it is ready.    | S    |
| EF-NAT-8 | The opening dial freezes if the device asks for less animation.                          | M    |

#### Details

**EF-NAT-2** — colour ring, mode disc, central button, with the remaining time and the day's goal.

**EF-NAT-3** — its disc empties graduation by graduation.

**EF-NAT-4** — start, pause, end, going to the background, goal, language.

**EF-NAT-5** — not the system's theme: the application decides.

**EF-NAT-6** — it shows, it does not command.

**EF-NAT-7** — then the veil fades away.

**EF-NAT-8** — it freezes under `prefers-reduced-motion`, and the veil fades **whatever happens**, even if
startup fails: a veil left in place would leave an incomprehensible black screen.

### 4.11 Accessibility page (`EF-A11`)

| Ref.     | Requirement                                                                   | Prio |
| -------- | ----------------------------------------------------------------------------- | ---- |
| EF-A11-1 | An "♿ Accessibility" link is reachable from the timer.                        | M    |
| EF-A11-2 | The page publishes the statement following the plan of decree no. 2019-768.   | M    |
| EF-A11-3 | The page is translated into the seven languages.                              | M    |
| EF-A11-4 | A session continues, ends and is recorded while the page is being read.       | M    |
| EF-A11-5 | The page states that the statement is voluntary.                              | M    |
| EF-A11-6 | No compliance rate is announced without an audit carried out by a third party. | M    |
| EF-A11-7 | The statement names what it is based on.                                      | M    |

#### Details

**EF-A11-2** — the seven sections, in the order of the decree: commitment, state of compliance, test
results, content not accessible (non-compliances, exemptions for disproportionate burden, content not
subject to the rules), preparation of the statement, contact, redress procedures.

**EF-A11-5** — the application does not fall within the scope of article 47: implying an obligation would
be false.

**EF-A11-6** — a self-assigned percentage would mislead about what has actually been verified.

**EF-A11-7** — the date, the technologies, the test environment, the tools and the pages evaluated; and the
fact that no assistive technology was used.

---

## 5. Business rules

| Ref.   | Rule                                                                                    |
| ------ | --------------------------------------------------------------------------------------- |
| RG-1   | Adjustable duration: 0 to 60 min; mode duration: 1 to 60 min.                           |
| RG-2   | The extension is 5 min, on **work** sessions, once per session.                         |
| RG-3   | A long break is offered after every **4** completed work sessions.                      |
| RG-4   | Above **40 min**, milestones fall at **45, 30 and 15** min remaining.                   |
| RG-4b  | A milestone's sound, vibration and channel come from its **rank**.                      |
| RG-5   | No milestone sound is played during finger adjustment.                                  |
| RG-6   | A session interrupted before **60 s** have been counted down is not recorded.           |
| RG-7   | The history keeps at most the **500** most recent sessions.                             |
| RG-8   | The recorded time excludes breaks and includes the extension.                           |
| RG-9   | The name and colour of a session are frozen when it is recorded.                        |
| RG-13  | At least one mode always exists: deleting the last one is refused.                      |
| RG-14  | Without local storage, the application remains usable.                                  |
| RG-15  | A milestone passed by more than **90 s** when returning to the foreground is not replayed. |
| RG-16  | A routine has 1 to 10 steps; the last one cannot be deleted.                            |
| RG-16b | A step lasts **5 s to 60 min**; a routine runs for **1 to 20 rounds**.                  |
| RG-17  | During a routine, the "+5 min" extension does not apply.                                |
| RG-18  | During a routine, chaining follows the steps of the routine.                            |
| RG-19  | A step outside the day's focus is recorded as a break.                                  |
| RG-20  | A reminder with no day ticked is not saved.                                             |
| RG-21  | Tapping a reminder **arms** the routine; it does not start it.                          |
| RG-22  | Reminders are rescheduled in bulk on every change.                                      |
| RG-23  | The tutorial is shown until it has been seen, and never again afterwards.               |
| RG-24  | The tutorial never advances on its own, and the settings panel closes first.            |
| RG-25  | The round counter restarts at 1 when the routine starts, or when it is left.            |
| RG-26  | Dial graduated in seconds: **setting** the duration is blocked.                         |
| RG-27  | The dial's unit follows the **set duration**, never the remaining time.                 |
| RG-28  | Sport mode **tints** the theme's background (18 to 30 %) instead of replacing it.       |
| RG-29  | On this tinted background, the secondary grey moves to the strong grey.                 |
| RG-30  | The test notification lives above the two other identifier bounds.                      |

### Details

**RG-4** — below 40 min, milestones are calculated from the chosen duration: the **half**, the **last
quarter**, then **1 min** before the end. Otherwise a 25-minute Pomodoro would be warned only once, and a
10-minute routine step never.

**RG-4b** — the last milestone is therefore always the most insistent, whatever the duration.

**RG-6** — it is a false start, not a session.

**RG-7** — the oldest ones are deleted.

**RG-8** — `activeSeconds`: the time actually counted down.

**RG-9** — renaming a mode does not rewrite the history.

**RG-11** — up to today, or up to yesterday if nothing has been done yet today.

**RG-14** — in private browsing or with blocked storage, settings only last for the session.

**RG-16b** — a duration or round count out of bounds is brought back within the bounds when read.

**RG-17** — what was announced happens at the announced time.

**RG-18** — whether or not the "chain work → break" option is active.

**RG-19** — brushing one's teeth is not work time (RG-10).

**RG-20** — better no reminder than a reminder that will never go off. Switching a reminder on ticks the whole
week.

**RG-21** — a countdown that starts without any gesture from the user is a source of anxiety.

**RG-22** — this way they escape the cancellation of session alerts, which happens on every return to the
foreground.

**RG-23** — once passed, finished or seen, it does not reappear on its own.

**RG-24** — two modals at once would not be heard properly.

**RG-25** — never when jumping from one step to another: redoing a step does not restart the training.

**RG-26** — swiping, arrows and the − / + buttons work in minutes. Starting and pausing remain possible.

**RG-27** — a Pomodoro does not switch to seconds in its last minute.

**RG-28** — light stays light, dark stays dark, and the texts keep their contrast.

**RG-29** — measured on the ten colours of the palette, it was 2.82:1 (WCAG 1.4.3).

**RG-30** — neither the return to the foreground, which cancels session alerts, nor the bulk rewrite of
reminders erases it: it has to arrive, that is its whole purpose.

---

## 6. User journeys

### 6.1 First launch

The tutorial opens full screen on its first of five views, the rest of the page becoming inert. Focus
is on *Next* and stays there from one view to the next: you go through the tutorial by repeating the same
key, while an announcement says "Step 2 of 5: Set the duration". *Skip* or Escape shortens it. The last
view says *Let's go*; focus then returns to ▶, which is the next gesture. At the next launch, the timer is
there straight away.

### 6.2 Simple session

1. Opening: the remembered mode is selected, its duration is shown on the dial.
2. Optional adjustment with a finger, the − / + buttons or the keyboard.
3. Tap the dial or ▶: the countdown starts, the screen stays on if the option is active.
4. Milestones — 45 / 30 / 15 min remaining above 40 min, otherwise the half, the last quarter and 1 min:
   a sound, and a notification if the application is in the background.
5. At 0: chime, end vibration pattern; 5-min extension if the option is active, otherwise the end.
6. The session is recorded if it lasted at least 60 s.

### 6.3 Automatic chaining

At the end of a work session, the matching break starts; at the end of the break, a work session resumes.
After every 4 completed work sessions, the long break replaces the short one. The user can interrupt the
chain at any time.

### 6.4 Running a routine

A repeated routine also serves as training: two steps — "Effort 20 s", "Rest 10 s" — and eight rounds make a
Tabata, shipped with the application. On a step this short, the dial graduates in seconds, the last three are
counted down and the next step is announced before the end. The warm-up, for its part, is done as a separate
routine: the rounds replay the whole routine. Marked *training*, the routine also switches the page to sport
mode: the colour of the step tints the whole screen — red during effort, green during rest — and the clock is
enlarged.

⚙︎ → Modes → *Routines* → "Morning routine": the panel closes, the first step ("Get dressed", 10 min) is armed
on the dial, and the strip shows the four steps. Tap ▶: the countdown starts. At 0, the chime sounds, "Next up:
Breakfast" is announced and the next step starts on its own. A step already done is revisited with one tap on its
tile. At the end of the last one, all tiles are ticked and "Routine finished" is announced.

### 6.5 Routine reminder

⚙︎ → Modes → *Routines* → pencil → *Reminder*: the switch on offers 8:00 am and the whole week; the time is set,
the days are unticked. Save. At 7:30 on Monday, a notification "Time for: 🌅 Morning routine — 4 steps · 33 min"
arrives, even with the application closed. Tapping opens the application with the routine armed on the dial: you
still need to press ▶.

### 6.6 Creating a mode

⚙︎ → Modes → "new": enter a name, set the duration, choose a colour (name displayed), choose the nature. Save.
The mode joins the list and can be selected.

## 7. Non-functional requirements

### 7.1 Accessibility (`ENF-A11`)

| Ref.       | Requirement                                                                   |
| ---------- | ----------------------------------------------------------------------------- |
| ENF-A11-1  | Targeted frameworks: **RGAA 4.1** and **WCAG 2.1 level AA**.                  |
| ENF-A11-2  | All functions are reachable by keyboard alone.                                |
| ENF-A11-3  | Focus is trapped in the settings panel, and Escape closes it.                 |
| ENF-A11-4  | The remaining time and state changes go through a live region.               |
| ENF-A11-5  | Text contrast of at least 4.5:1, in light as well as dark theme.              |
| ENF-A11-6  | No information is carried by colour alone.                                    |
| ENF-A11-7  | The system "reduce motion" preference is respected.                           |
| ENF-A11-8  | No rapid flashing: the only visual alert beats at 0.6 Hz.                     |
| ENF-A11-9  | The dial exposes a slider role, with value, bounds and readable text.         |
| ENF-A11-10 | axe-core tests report no violation on the covered journeys.                   |
| ENF-A11-11 | What is set by dragging can also be set with a simple pointer.                |
| ENF-A11-12 | The remaining time can be spoken aloud by the device's speech synthesis.      |
| ENF-A11-13 | Each milestone and the end have a distinct vibration pattern.                 |
| ENF-A11-14 | A lock disables the dial, the − / + buttons and the reset.                    |
| ENF-A11-15 | A routine step is identifiable without being able to read.                    |

#### Details

**ENF-A11-1** — declared status: compliant with WCAG 2.1 level AA and RGAA 4.1.

**ENF-A11-2** — with an always-visible focus indicator.

**ENF-A11-8** — a beat of 1.6 s, five times below the threshold of three flashes per second (WCAG 2.3.1). It can
be set, switched off, and freezes under `prefers-reduced-motion`.

**ENF-A11-10** — axe-core on WCAG 2.0 / 2.1 levels A and AA, plus best practices, in light and dark themes.

**ENF-A11-11** — WCAG 2.5.7, with targets of at least 44 × 44 px (WCAG 2.5.8).

**ENF-A11-12** — a three-choice setting, offline, off by default: without looking at the dial.

**ENF-A11-13** — recognisable without sight or hearing: it is the only alert channel for a deafblind person.

**ENF-A11-14** — for people who trigger unintended actions (tremors, spasticity, a resting palm). Start / Pause
remains active: only the reset loses the session.

**ENF-A11-15** — a pictogram precedes its name, and its state (done, current, upcoming) is carried by a tick and by
the accessible name, never by colour alone.

#### Known and accepted gaps

Published in the accessibility statement:

- the dial is a slider whose activation also starts the timer (RGAA 7.1 and 7.3);
- the contrast of non-text elements has not been measured on the rendering (3.2);
- 200% magnification and the screen reader journey have not been checked manually (10.4, 7.1).

### 7.2 Privacy and security

| Ref. | Requirement |
| --- | --- |
| ENF-SEC-1 | No data leaves the device: no account, no server, no analytics. |
| ENF-SEC-2 | Preferences, modes and history reside in the device's local storage. |
| ENF-SEC-3 | No sensitive personal data is collected; GDPR does not apply to any remote processing. |
| ENF-SEC-4 | Vulnerabilities are reported privately through the repository's GitHub security advisory (see `SECURITY.md`). |

### 7.3 Performance and robustness

| Ref. | Requirement |
| --- | --- |
| ENF-PER-1 | Initial bundle budget: warning at 500 kB, error at 1 MB. |
| ENF-PER-2 | Both pages are loaded on demand: the accessibility page does not weigh on startup. |
| ENF-PER-3 | The accuracy of the countdown does not depend on the regularity of the browser's ticks. |
| ENF-PER-4 | A session in progress survives navigation between the two pages. |
| ENF-PER-5 | An unavailable service never blocks the application. |

**ENF-PER-5** — storage, notifications, haptics or keeping the screen on.

### 7.4 Compatibility

| Target | Requirement |
| --- | --- |
| Browsers | Modern browsers supporting Web Audio and CSS logical properties |
| iOS | WidgetKit widget from iOS 17 |
| Android | Channel-based notifications; the exact alarm permission may be required from Android 12 |
| Screens | Mobile-first design; light and dark themes; left-to-right and right-to-left writing direction |

### 7.5 Maintainability

| Ref. | Requirement |
| --- | --- |
| ENF-MNT-1 | Adding a language requires only a dictionary and four declarations. |
| ENF-MNT-2 | Colours are centralised CSS variables, never hard-coded in components. |
| ENF-MNT-3 | Accessibility regression tests are run on every push and every merge request. |
| ENF-MNT-4 | Commit messages follow the semantic format. |

**ENF-MNT-1** — a missing key is a compile-time error.

---

## 8. Out of scope

> Independent project, inspired by the principle of visual timers. It is neither affiliated with nor endorsed
> by Time Timer®, a registered trademark of its owner.
