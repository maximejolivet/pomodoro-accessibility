# Architecture technique

## Vue d'ensemble

```
src/
├── index.html                  # Métadonnées, favicons
├── styles.css                  # Imports du thème, Tailwind, utilitaires globaux
├── theme/
│   ├── tokens.css              # Jetons de couleur (thème clair), posés sur <app-root>
│   ├── dark.css                # Redéfinition des jetons en thème sombre
│   └── controls.css            # Primitives partagées (bouton relief, curseur, segmenté, interrupteur)
└── app/
    ├── app.component.*         # Coquille : applique le thème + <router-outlet>
    ├── app.config.ts           # Providers (routeur)
    ├── app.routes.ts           # Routes, chargées à la demande (loadComponent)
    ├── core/                   # Ce qui ne dépend d'aucune page
    │   ├── constants/          # timer · history · preset · routine · tutorial (règles et réglages du domaine)
    │   ├── models/             # preset · routine · session · alert · widget-state
    │   ├── helpers/            # storage.ts · time.ts
    │   │                     #   milestones.ts     paliers d'une session
    │   │                     #   sound-patterns.ts motifs, mise à niveau, WAV
    │   │                     #   haptic-patterns.ts motifs de vibration
    │   ├── i18n/
    │   │   ├── i18n.service.ts # Langue courante, sens d'écriture, traduction
    │   │   ├── i18n.model.ts   # Clés typées, liste des langues, langues RTL
    │   │   └── locales/        # Un dictionnaire par langue (fr en es de it pt ar)
    │   └── services/
    │       ├── timer.service.ts        # Décompte basé sur l'heure de fin (RxJS)
    │       ├── session.service.ts      # Session en cours, enchaînement, sons, notifications, widget
    │       ├── preferences.service.ts  # Préférences persistées, en signaux
    │       ├── preset.service.ts       # Modes personnalisables
    │       ├── routine.service.ts      # Routines : suites d'étapes enchaînées
    │       ├── history.service.ts      # Historique des sessions et statistiques
    │       ├── sound.service.ts        # Lecture des sons (Web Audio), au niveau mesuré dans les motifs
    │       ├── speech.service.ts       # Temps restant dit à voix haute (Web Speech)
    │       ├── haptics.service.ts      # Motifs de vibration par palier (Capacitor Haptics)
    │       ├── notification.service.ts # Notifications locales Capacitor + sons natifs + rappels hebdomadaires
    │       ├── keep-awake.service.ts   # Écran toujours allumé
    │       └── widget.service.ts       # État transmis au widget Android
    └── features/               # Une page par dossier
        ├── timer/
        │   ├── timer-page.component.*  # Assemble les blocs ci-dessous
        │   ├── dial/                   # Boîtier 3D, cadran SVG, réglage au doigt et au clavier
        │   ├── readout/                # Temps, mode, état, cycle, boutons − / +
        │   ├── routine/                # Bande des étapes de la routine en cours
        │   ├── controls/               # Remise à zéro, démarrage / pause, réglages
        │   ├── sheet/                  # Panneau coulissant + onglets Modes / Réglages
        │   │                           #   (l'onglet Modes contient la section Routines et son éditeur)
        │   ├── tutorial/               # Tutoriel d'accueil : cinq vues, au premier lancement
        │   ├── dial-geometry.ts        # Chemins SVG du cadran (fonctions pures)
        │   └── timer.model.ts          # Onglets du panneau, mode et routine en cours d'édition
        └── accessibility/
            ├── accessibility-page.component.*  # Page d'accessibilité (route /accessibility)
            └── accessibility.i18n.ts           # Ses textes, par langue
tests/
└── a11y.spec.ts                # Non-régression d'accessibilité (npm run test:a11y)
playwright.config.ts            # Démarre l'app et joue les tests sur Chromium
.github/workflows/a11y.yml      # Build de production + tests d'accessibilité à chaque push
scripts/
└── generate-sounds.ts          # WAV des notifications (make sounds - les copie aussi dans res/raw)
resources/sounds/               # WAV générés, crête à −1 dBFS
resources/app-icon.svg          # Icônes et écrans de lancement, iOS · Android · web (make icons)
resources/app-icon-foreground.svg  # Calque avant de l'icône adaptative Android
ios/App/App/
└── SceneDelegate.swift           # Voile de démarrage (logo, version) sur la WebView
public/
├── favicon.svg · favicon.ico · apple-touch-icon.png
docs/
└── documentation et captures d'écran
```

## Découpage

```
app.component        Coquille : applique le thème et le sens d'écriture, porte <router-outlet>
app.config.ts        Providers (routeur)
app.routes.ts        '' → timer, 'accessibility' → page d'accessibilité (loadComponent)
core/                Indépendant de toute page : constants, models, helpers, i18n, services
features/timer/      Page du minuteur = assemblage de dial / readout / routine / controls / sheet
features/accessibility/  Page de déclaration d'accessibilité et ses textes
```

## Règles de dépendance

**`features/` dépend de `core/`, jamais l'inverse.**
Le domaine reste testable et réutilisable.

**Les composants lisent l'état dans les services, plutôt que par une cascade d'entrées.**
Évite le passage de propriétés sur quatre niveaux.

**Seul l'état local circule en entrées / sorties.**
Panneau ouvert, brouillon de mode, geste en cours : cela sépare l'état de vue de l'état de
domaine.

**L'état de session vit dans `SessionService` (racine), pas dans la page.**
Les pages sont détruites à chaque navigation ; une session en cours serait perdue.

**Les deux routes sont chargées à la demande (`loadComponent`).**
La page d'accessibilité ne pèse pas sur le démarrage.

**`sound-patterns.ts` n'importe rien.**
Il est exécuté aussi bien par le navigateur que directement par Node.

## Modèle de réactivité

- **Signaux Angular** pour l'état applicatif : préférences, modes, historique, session en cours,
  valeurs dérivées en `computed`, effets de bord en `effect`.
- **RxJS** uniquement dans `TimerService`, pour l'émission périodique des ticks et l'événement de
  fin de décompte.

## Services du domaine

Tous fournis en racine (`providedIn: 'root'`).

### `TimerService` - décompte

Le décompte est **calculé à partir de l'heure de fin réelle** (`endAt`), et non par
décrémentation : à chaque tick, `timeLeft = (endAt − now) / 1000`. Un ralentissement des ticks
par le navigateur ou un passage en arrière-plan n'introduit donc aucune dérive (EF-TIM-9,
ENF-PER-3). Ticks toutes les 100 ms via `interval(100)`, arrêtés par un `takeUntil`.

| Membre                                  | Rôle                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| `timeLeft$`, `totalTime$`, `isRunning$` | État observable                                                                   |
| `finished$`                             | Émis à 0 avec le **retard constaté** en secondes, exploité pour la règle des 90 s |
| `endTime`                               | Heure de fin en ms si le décompte tourne, sinon `null` (widget, notifications)    |
| `start` / `pause` / `resume` / `reset`  | Contrôle                                                                          |
| `setTimeLeft`                           | Réglage au doigt sans interrompre le décompte : recale `endAt`                    |

L'haptique de fin est chargée dynamiquement (`import('@capacitor/haptics')`) et son échec est ignoré.

### `SessionService` - orchestration

Point central : durée réglée, mode sélectionné, session en cours, enchaînement, paliers sonores,
notifications, widget, annonces pour lecteurs d'écran. Il vit en racine précisément pour survivre
à la navigation (EF-A11-4, ENF-PER-4). Il expose des signaux dérivés prêts à afficher :
`displaySeconds`, `displayMinutes`, `modeName`, `stateLabel`, `isPaused`, `announcement`.

Il porte aussi le déroulé des routines (`activeRoutine`, `routineIndex`, `routineDone`,
`currentStep`). Le point de couture tient en une ligne : `selectedPreset` renvoie l'étape en
cours dès qu'une routine est chargée. Tout ce qui lit le mode - cadran, affichage, historique,
notifications, widget - suit sans rien savoir des routines. Seuls trois endroits les connaissent :
l'enchaînement de fin (l'étape suivante remplace le cycle pomodoro, sans prolongation - RG-17,
RG-18), la programmation des notifications, et la bande d'étapes.

Il réagit aussi au cycle de vie de l'application (`@capacitor/app`) : à la mise en arrière-plan
il programme les notifications restantes ; au retour il les annule, rattrape l'état et
redemande le maintien d'écran.

### Autres services

| Service               | Responsabilité                     |
| --------------------- | ---------------------------------- |
| `PreferencesService`  | Préférences en signaux             |
| `PresetService`       | Modes                              |
| `RoutineService`      | Routines                           |
| `HistoryService`      | Historique, statistiques, objectif |
| `SoundService`        | Lecture Web Audio                  |
| `SpeechService`       | Annonce vocale (Web Speech)        |
| `HapticsService`      | Motifs de vibration                |
| `NotificationService` | Notifications locales              |
| `KeepAwakeService`    | Maintien de l'écran                |
| `WidgetService`       | Widget Android                     |
| `I18nService`         | Langue et traduction               |

#### Points notables

`PreferencesService` - thème initial : la valeur enregistrée, sinon `prefers-color-scheme`.

`PresetService` - chargement filtré, refus de supprimer le dernier mode, restauration des modes
par défaut.

`RoutineService` - mêmes règles que les modes, mais la liste peut être vide ; une routine sans
étape est écartée au chargement.

`HistoryService` - `today`, `week`, `streak` et `goalProgress` en `computed` ; replanification au
passage de minuit.

`SoundService` - synthèse des motifs partagés, portés au niveau mesuré (voir « Sons » du [Design UI/UX](07_UI_UX_DESIGN.md)).

`SpeechService` - coupe l'annonce précédente, choisit une voix de la langue courante si le
navigateur en propose une, et se masque si la synthèse manque.

`HapticsService` - impulsions enchaînées par `setTimeout`, module Capacitor chargé à la demande,
échec ignoré là où la vibration n'existe pas (iOS sur le web, ordinateur).

`NotificationService` - écrit les WAV iOS au lancement, crée un canal Android par son, et un canal
silencieux pour les alertes muettes.

`KeepAwakeService` - vérifie le support, ignore les échecs, redemande le verrou au retour au
premier plan.

`WidgetService` - actif uniquement sur Android ; n'envoie que si l'état JSON a changé ; réessaie au
changement suivant en cas d'échec.

`I18nService` - détection depuis `navigator.languages`, repli sur le français, met à jour `lang`
et `dir` du document.

## Points clés

### Structure

La coquille (`app.component.*`) ne porte que le thème et le routeur. Chaque page vit dans
`features/`, tout ce qu'elles partagent dans `core/`. Les deux pages sont chargées à la demande,
donc la page d'accessibilité ne pèse pas sur le démarrage.

**Pas de `shared/`, `guards/`, `interceptors/`, `pipes/` ni `environments/`** : rien à y mettre
aujourd'hui. Ces dossiers se créeront le jour où un deuxième usage apparaîtra.

### Composants

La page du minuteur n'assemble que des blocs - `dial`, `readout`, `controls`, `sheet` - chacun
avec son gabarit et son style.

Ils lisent l'état dans les services plutôt que par une cascade d'entrées. Seul ce qui est local
circule en entrées / sorties : panneau ouvert, brouillon de mode, geste en cours.

### État de session dans un service, pas dans la page

Les pages sont détruites à chaque navigation. `SessionService` (racine) porte donc la session en
cours, l'enchaînement, les sons, les notifications et le widget ; la page du minuteur n'en est
qu'une vue.

Conséquence voulue : une session continue, se termine et s'enregistre pendant la lecture de la
page d'accessibilité.

### Cadran

SVG unique (viewBox 420 × 420), avec des chemins calculés en TypeScript. Le disque est dessiné en
deux couches : un voile en `mix-blend-mode: multiply` sur l'anneau, et un plateau plein au centre.

### Décompte

Calculé à partir de l'heure de fin réelle, donc juste même en arrière-plan.

### Sons définis une fois, joués de deux façons

`core/helpers/sound-patterns.ts` décrit les motifs en notes et n'importe **rien**, parce qu'il est
exécuté à la fois dans le bundle et par Node :

- l'application les synthétise en Web Audio ;
- `scripts/generate-sounds.ts` les rend en WAV pour les notifications natives.

Les deux sont donc identiques par construction, et un son ajouté d'un côté ne peut pas manquer de
l'autre.

**Le volume n'est pas écrit dans les motifs** : les gains des notes n'y règlent que leur équilibre
entre elles. C'est `level(pattern)` qui mesure la crête du signal rendu et la porte à −1 dBFS, du
même facteur des deux côtés.

Mesurer plutôt que calculer est nécessaire : les notes se chevauchent et s'additionnent, si bien
qu'un gain posé à la main laisse le motif soit écrêté, soit très en dessous. Un son d'alerte doit
sortir fort, parce que l'appareil ne fait que *réduire* ce qu'on lui donne - et sur Android, le
volume des notifications est un curseur à part de celui du média.

### Une routine est une suite de modes

Chaque étape a la forme d'un `Preset` - nom, durée, couleur, nature - plus un pictogramme.

`SessionService.selectedPreset` renvoie l'étape en cours quand une routine est chargée, si bien
que le cadran, l'historique, les notifications et le widget n'ont aucune notion de routine à
gérer. Seuls l'enchaînement et la bande en ont une.

### Thèmes

Toutes les couleurs sont des variables CSS dans `src/theme/`, posées sur `<app-root>` et
redéfinies sous `app-root.dark`, donc héritées par les pages.

### Traductions

Un dictionnaire par langue dans `core/i18n/locales/`, typé à partir du français : une clé
manquante dans une autre langue est une **erreur de compilation**.

Ajouter une langue, c'est ajouter un fichier dans `locales/`, puis une entrée dans `Lang`,
`DICTIONARIES` et `LANGUAGES` - et dans `RTL_LANGS` si elle s'écrit de droite à gauche. Le CSS
utilise des propriétés logiques (`inset-inline-*`, `start` / `end`).

### Persistance

Préférences, modes, routines et historique sont enregistrés dans `localStorage`, l'historique
gardant les 500 dernières sessions.

### Accessibilité testée en continu

`npm run test:a11y` lance l'application et vérifie soixante-douze points :

- **axe-core** sur l'accueil, le panneau (trois onglets), l'éditeur de mode, l'éditeur de routine
  et la page d'accessibilité - en thème clair et sombre, et en arabe ;
- le réglage du cadran **au clavier** ;
- l'enchaînement des étapes d'une routine, et sa bande ;
- le **piège à focus** de la modale, Échap, et le retour du focus ;
- l'absence de défilement horizontal à **320 px** ;
- l'espacement du texte (WCAG 1.4.12) ;
- le contraste des interrupteurs, mesuré sur les **pixels rendus** (WCAG 1.4.11).

La CI les rejoue à chaque push.

## Données

Tout est local : la seule persistance est `localStorage`, derrière `core/helpers/storage.ts`. Les types, les constantes et les clés sont décrits dans le [schéma des données](05_DATA_SCHEMA.md).

## Sécurité

Aucun serveur, aucune requête sortante, aucun compte. La surface d'attaque, la confidentialité et le signalement des vulnérabilités sont décrits dans le [TRD](04_TRD.md).

## Contraintes d'architecture

- **Aucun back-end.** Pas de client HTTP, pas d'intercepteur, pas de variables d'environnement
  de déploiement : il n'y a rien à configurer par environnement.
- **Tout est local.** La seule persistance est `localStorage`, encapsulée dans un helper.
- **Pas de dossiers vides par anticipation** : pas de `shared/`, `guards/`, `interceptors/`,
  `pipes/` ni `environments/` tant qu'un second usage n'apparaît pas.

## Environnements

Le build web est un ensemble de fichiers statiques : n'importe quel hébergement statique convient,
sans variable d'environnement ni service annexe. Les versions mobiles sont produites depuis Xcode
et Android Studio. Il n'existe pas de versions publiées : seule la dernière version de `main` est
maintenue.

## Contrôles qualité

| Niveau        | Outil                                    | Portée                              |
| ------------- | ---------------------------------------- | ----------------------------------- |
| Unitaire      | Karma + Jasmine (`make test`)            | **Rien pour l'instant**             |
| Accessibilité | Playwright + axe-core (`make test-a11y`) | Parcours réels, clavier, contrastes |

⚠️ `src/` ne contient **aucun** `.spec.ts`, et `make test` échoue donc sur `TS18003`. La logique du
domaine - géométrie du cadran, helpers de temps, services - n'est couverte que de bout en bout,
par la suite d'accessibilité.

Configuration Playwright : dossier `tests/`, projet Chromium en **420 × 900** (cadrage mobile),
serveur de développement démarré automatiquement sur `http://localhost:4200`, exécution
parallèle, une reprise en CI, trace à la première reprise, `forbidOnly` en CI.

La suite `tests/a11y.spec.ts` (80 tests) analyse avec les jeux de règles `wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa` et `best-practice`, en **thème clair et en thème sombre**, sur l'accueil,
sur le panneau de réglages ouvert et sur les éditeurs de mode et de routine. Les comportements
qui dépendent du temps (annonce vocale, vibration, alerte visuelle, enchaînement des étapes
d'une routine) sont joués à l'horloge simulée de Playwright. Toute violation fait échouer la CI.

**Critères d'acceptation d'une contribution** : le build de production passe, la suite
d'accessibilité ne relève aucune violation, aucune couleur n'est écrite en dur, aucune clé de
traduction ne manque (le compilateur le vérifie), et le message de commit suit le format
sémantique.

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# Technical architecture

## Overview

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
    │       └── widget.service.ts       # State sent to the Android widget
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
└── generate-sounds.ts          # Notification WAV files (make sounds - also copies them into res/raw)
resources/sounds/               # Generated WAV files, peak at −1 dBFS
resources/app-icon.svg          # Icons and launch screens, iOS · Android · web (make icons)
resources/app-icon-foreground.svg  # Foreground layer of the Android adaptive icon
ios/App/App/
└── SceneDelegate.swift           # Boot overlay (logo, version) over the web view
public/
├── favicon.svg · favicon.ico · apple-touch-icon.png
docs/
└── documentation and screenshots
```

## Breakdown

```
app.component        Shell: applies the theme and writing direction, hosts <router-outlet>
app.config.ts        Providers (router)
app.routes.ts        '' → timer, 'accessibility' → accessibility page (loadComponent)
core/                Independent of any page: constants, models, helpers, i18n, services
features/timer/      Timer page = assembly of dial / readout / routine / controls / sheet
features/accessibility/  Accessibility statement page and its texts
```

## Dependency rules

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

## Reactivity model

- **Angular signals** for application state: preferences, modes, history, current session, derived
  values as `computed`, side effects as `effect`.
- **RxJS** only in `TimerService`, for the periodic emission of ticks and the end-of-countdown event.

## Domain services

All provided at root (`providedIn: 'root'`).

### `TimerService` - countdown

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

### `SessionService` - orchestration

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

### Other services

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
| `WidgetService`       | Android widget                  |
| `I18nService`         | Language and translation        |

#### Notable points

`PreferencesService` - initial theme: the saved value, otherwise `prefers-color-scheme`.

`PresetService` - filtered loading, refusal to delete the last mode, restoration of the default modes.

`RoutineService` - same rules as modes, but the list may be empty; a routine without steps is discarded on loading.

`HistoryService` - `today`, `week`, `streak` and `goalProgress` as `computed`; rescheduling at midnight.

`SoundService` - synthesis of the shared patterns, brought to the measured level (see "Sounds" in the [UI/UX design](07_UI_UX_DESIGN.md)).

`SpeechService` - cancels the previous announcement, picks a voice in the current language if the browser offers
one, and hides itself if speech synthesis is missing.

`HapticsService` - pulses chained with `setTimeout`, Capacitor module loaded on demand, failure ignored where
vibration does not exist (iOS on the web, computer).

`NotificationService` - writes the iOS WAV files at launch, creates one Android channel per sound, and a silent
channel for the silent alerts.

`KeepAwakeService` - checks support, ignores failures, requests the lock again on return to the foreground.

`WidgetService` - active only on Android; sends only if the JSON state has changed; retries at the next change on failure.

`I18nService` - detection from `navigator.languages`, fallback to French, updates the document's `lang` and `dir`.

## Key points

### Structure

The shell (`app.component.*`) holds only the theme and the router. Each page lives in
`features/`, and everything they share lives in `core/`. Both pages are loaded on demand, so the
accessibility page does not weigh on startup.

**No `shared/`, `guards/`, `interceptors/`, `pipes/` or `environments/` folders**: there is nothing
to put in them today. These folders will be created on the day a second use appears.

### Components

The timer page only assembles blocks - `dial`, `readout`, `controls`, `sheet` - each with its own
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
device only ever *reduces* what it is given - and on Android, the notification volume is a slider
separate from the media volume.

### A routine is a sequence of modes

Each step has the shape of a `Preset` - name, duration, colour, nature - plus an icon.

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
`LANGUAGES` - and in `RTL_LANGS` if it is written right to left. The CSS uses logical properties
(`inset-inline-*`, `start` / `end`).

### Persistence

Preferences, modes, routines and history are saved in `localStorage`; the history keeps the last
500 sessions.

### Accessibility tested continuously

`npm run test:a11y` starts the application and checks seventy-two points:

- **axe-core** on the home page, the panel (three tabs), the mode editor, the routine editor and the
  accessibility page - in light and dark themes, and in Arabic;
- adjusting the dial **with the keyboard**;
- the chaining of the steps of a routine, and its strip;
- the **focus trap** of the modal, Escape, and the return of focus;
- no horizontal scrolling at **320 px**;
- text spacing (WCAG 1.4.12);
- the contrast of the switches, measured on the **rendered pixels** (WCAG 1.4.11).

The CI runs them again on every push.

## Data

Everything is local: the only persistence is `localStorage`, behind `core/helpers/storage.ts`. The types, constants and keys are described in the [data schema](05_DATA_SCHEMA.md).

## Security

No server, no outgoing request, no account. The attack surface, privacy and vulnerability reporting are described in the [TRD](04_TRD.md).

## Architecture constraints

- **No back end.** No HTTP client, no interceptor, no deployment environment variables: there is nothing
  to configure per environment.
- **Everything is local.** The only persistence is `localStorage`, wrapped in a helper.
- **No empty folders in anticipation**: no `shared/`, `guards/`, `interceptors/`, `pipes/` or `environments/`
  until a second use appears.

## Environments

The web build is a set of static files: any static host will do, with no environment variable and no add-on service. The mobile
versions are produced from Xcode and Android Studio. There are no published versions: only the latest version of `main` is maintained.

## Quality checks

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
