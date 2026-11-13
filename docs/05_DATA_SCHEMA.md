# Schéma des données

## Principe

Pomodoro Accessibilité n'a pas de back end : il n'y a ni base de données, ni API, ni compte. Les « entités » sont des types TypeScript et la persistance tient dans `localStorage`, sous le préfixe `pomodoro-tdah.`. Ce document remplace le schéma de base de données.

## Entités (types du domaine)

| Type              | Champs                                                                                          |
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

### Précisions

`Preset` - `kind` ∈ `focus` \| `break` \| `longBreak`. `name` est vide pour un mode par défaut,
dont le libellé vient de `nameKey`, traduit.

`RoutineStep` - un `Preset` plus un pictogramme : une étape se démarre et s'enregistre exactement
comme un mode (`kind` ∈ `focus` \| `break`).

`Routine` - suite ordonnée de 1 à 10 étapes (RG-16), jouée `rounds` fois (1 à 20). `workout` fait
passer la page en mode sport.

`RoutineReminder` - `days` en ISO 8601 (1 = lundi … 7 = dimanche), jamais vide (RG-20).

`Session` - nom et couleur figés à l'enregistrement (RG-9).

`ActiveSession` - `runningSince` vaut `null` en pause ; `activeMs` cumule le temps décompté avant
la reprise courante.

`DayStat` - une barre de l'histogramme hebdomadaire.

`Alert` - notification locale ponctuelle, programmée au passage en arrière-plan.

`Reminder` - rappel hebdomadaire d'une routine : un par jour coché.

`WidgetState` - contrat partagé avec `WidgetState.java`.

## Constantes du domaine

| Constante                                 | Valeur                                                                       | Exigence couverte |
| ----------------------------------------- | ---------------------------------------------------------------------------- | ----------------- |
| `MAX_MINUTES`                             | 60                                                                           | RG-1              |
| `EXTRA_SECONDS`                           | 300                                                                          | RG-2              |
| `MILESTONES`                              | `[45, 30, 15]` - les trois timbres, et les paliers d'une longue session      | RG-4              |
| `LONG_SESSION_MINUTES`                    | 40                                                                           | RG-4              |
| `FINAL_WARNING_MINUTES`                   | 1                                                                            | RG-4              |
| `LATE_ALERT_SECONDS`                      | 90                                                                           | RG-15             |
| `LONG_BREAK_EVERY`                        | 4                                                                            | RG-3              |
| `MAX_SESSIONS`                            | 500                                                                          | RG-7              |
| `MIN_RECORDED_SECONDS`                    | 60                                                                           | RG-6              |
| `GOAL_MIN / MAX / STEP / DEFAULT_MINUTES` | 10 / 300 / 5 / 100                                                           | RG-12             |
| `PRESET_COLORS`                           | 10 teintes de l'anneau                                                       | EF-MOD-3          |
| `DEFAULT_PRESETS`                         | Pomodoro 25, Pause 5, Pause longue 15, Focus 15                              | EF-MOD-1          |
| `STEP_ICONS`                              | 32 pictogrammes (quotidien, école, travail)                                  | EF-ROU-2          |
| `TUTORIAL_SLIDES`                         | 5 vues (pictogramme, titre, texte, couleur)                                  | EF-TUT-1          |
| `MAX_STEPS`                               | 10                                                                           | RG-16             |
| `STEP_DURATIONS`                          | 5 → 55 s par pas de 5, puis 1 → 60 min par pas de 1                          | EF-ROU-16         |
| `MAX_ROUNDS`                              | 20                                                                           | EF-ROU-17         |
| `SECONDS_DIAL_BELOW`                      | 60                                                                           | EF-ROU-20         |
| `COUNTDOWN_FROM`                          | 3                                                                            | EF-ROU-21         |
| `NEXT_ANNOUNCE_SECONDS`                   | 5                                                                            | EF-ROU-22         |
| `DEFAULT_ROUTINES`                        | Routine du matin (4 étapes), Tabata (2 étapes × 8 tours), Devoirs (4 étapes) | EF-ROU-3          |

## Persistance et clés de stockage

Accès centralisé dans `core/helpers/storage.ts`. Toutes les clés sont préfixées
`pomodoro-tdah.`. Chaque lecture et chaque écriture est protégée par un `try/catch` : en
navigation privée ou stockage bloqué, l'application continue et les réglages ne valent que pour
la session (RG-14).

| Clé (préfixée)  | Contenu                    | Format                                                               |
| --------------- | -------------------------- | -------------------------------------------------------------------- |
| `theme`         | Thème                      | `'dark'` \| `'light'` (absent ⇒ préférence système)                  |
| `opendyslexic`  | Police OpenDyslexic        | `'on'` \| `'off'` (défaut : off)                                     |
| `sound`         | Sons                       | `'on'` \| `'off'` (défaut : on)                                      |
| `haptics`       | Vibration                  | `'on'` \| `'off'` (défaut : on)                                      |
| `visual-alert`  | Alerte visuelle            | `'off'` \| `'soft'` \| `'strong'` (défaut : soft)                    |
| `auto-extra`    | Prolongation +5 min        | `'on'` \| `'off'` (défaut : on)                                      |
| `auto-chain`    | Enchaînement automatique   | `'on'` \| `'off'` (défaut : off)                                     |
| `keep-awake`    | Écran allumé               | `'on'` \| `'off'` (défaut : on)                                      |
| `speech`        | Annonce vocale             | `'off'` \| `'milestones'` \| `'minutes'` (défaut : off)              |
| `tutorial-seen` | Tutoriel d'accueil déjà vu | `'on'` \| `'off'` (défaut : off - il se montre au premier lancement) |
| `lang`          | Langue                     | code de langue ou `'auto'`                                           |
| `preset`        | Mode sélectionné           | identifiant                                                          |
| `presets`       | Modes                      | JSON `Preset[]`                                                      |
| `routine`       | Routine chargée            | identifiant, vide si aucune (EF-ROU-10)                              |
| `routines`      | Routines                   | JSON `Routine[]`, liste vide possible                                |
| `history`       | Historique                 | JSON `Session[]`, 500 entrées max                                    |
| `daily-goal`    | Objectif quotidien         | minutes                                                              |

**Migrations.** Il n'y a pas de numéro de schéma : les lectures sont défensives. Les modes
relus sont filtrés (identifiant chaîne, durée positive, couleur chaîne) et, si rien de valide ne
subsiste, les modes par défaut sont restaurés. Un JSON illisible retombe sur la valeur par défaut.
L'objectif relu est borné et arrondi. Les routines relues sont filtrées de la même façon, étape
par étape ; une liste vide est une liste vide (l'utilisateur a supprimé ses routines), alors
qu'une clé absente rend les routines par défaut. Un rappel illisible (heure hors bornes, jours
inconnus, champ absent d'une version précédente) est écarté sans emporter la routine, qui se
lance très bien à la main.

## Conservation et suppression

- L'historique est plafonné à 500 sessions ; au-delà, les plus anciennes sont écartées.

- Une session interrompue avant 60 secondes n'est pas enregistrée (faux départ).

- Il n'y a pas d'export ni de suppression de compte : les données restent sur l'appareil et partent avec lui. Désinstaller l'application, ou vider le stockage du navigateur, les efface.

## Confidentialité et propriété des données

| Réf.      | Exigence                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------ |
| ENF-SEC-1 | Aucune donnée ne quitte l'appareil : pas de compte, pas de serveur, pas d'analytique.                  |
| ENF-SEC-2 | Préférences, modes et historique résident dans le stockage local de l'appareil.                        |
| ENF-SEC-3 | Aucune donnée personnelle sensible n'est collectée ; le RGPD ne s'applique à aucun traitement distant. |
| ENF-SEC-4 | Les vulnérabilités se signalent en privé via l'avis de sécurité GitHub du dépôt (voir `SECURITY.md`).  |

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# Data schema

## Principle

Pomodoro Accessibilité has no back end: no database, no API, no account. The "entities" are TypeScript types and persistence lives in `localStorage`, under the `pomodoro-tdah.` prefix. This document stands in for a database schema.

## Entities (domain types)

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

### Details

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

`WidgetState` - contract shared with `WidgetState.java`.

## Domain constants

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

## Persistence and storage keys

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

## Retention and deletion

- The history is capped at 500 sessions; beyond that, the oldest are dropped.

- A session interrupted before 60 seconds is not recorded (false start).

- There is no export and no account deletion: the data stays on the device and goes with it. Uninstalling the application, or clearing the browser storage, erases it.

## Privacy and data ownership

| Ref.      | Requirement                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| ENF-SEC-1 | No data leaves the device: no account, no server, no analytics.                                               |
| ENF-SEC-2 | Preferences, modes and history reside in the device's local storage.                                          |
| ENF-SEC-3 | No sensitive personal data is collected; GDPR does not apply to any remote processing.                        |
| ENF-SEC-4 | Vulnerabilities are reported privately through the repository's GitHub security advisory (see `SECURITY.md`). |
