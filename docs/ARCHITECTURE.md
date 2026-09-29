# Architecture

[← Retour au README](../README.md) · [Cahier des charges technique](TECHNICAL-SPECIFICATION.md)

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
    │       └── widget.service.ts       # État transmis au widget iOS
    └── features/               # Une page par dossier
        ├── timer/
        │   ├── timer-page.component.*  # Assemble les blocs ci-dessous
        │   ├── dial/                   # Boîtier 3D, cadran SVG, réglage au doigt et au clavier
        │   ├── readout/                # Temps, mode, état, cycle, boutons − / +
        │   ├── routine/                # Bande des étapes de la routine en cours
        │   ├── controls/               # Remise à zéro, démarrage / pause, réglages
        │   ├── sheet/                  # Panneau coulissant + onglets Modes / Stats / Réglages
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
└── generate-sounds.ts          # WAV des notifications (make sounds — les copie aussi dans res/raw)
resources/sounds/               # WAV générés, crête à −1 dBFS
resources/app-icon.svg          # Icônes et écrans de lancement, iOS · Android · web (make icons)
resources/app-icon-foreground.svg  # Calque avant de l'icône adaptative Android
ios/App/
├── App/WidgetBridgePlugin.swift  # Plugin local : état → App Group → widget
├── App/MainViewController.swift  # Enregistre les plugins locaux
└── PomodoroWidget/               # Extension WidgetKit (SwiftUI)
public/
├── favicon.svg · favicon.ico · apple-touch-icon.png
docs/
└── documentation et captures d'écran
```

## Points clés

### Structure

La coquille (`app.component.*`) ne porte que le thème et le routeur. Chaque page vit dans
`features/`, tout ce qu'elles partagent dans `core/`. Les deux pages sont chargées à la demande,
donc la page d'accessibilité ne pèse pas sur le démarrage.

**Pas de `shared/`, `guards/`, `interceptors/`, `pipes/` ni `environments/`** : rien à y mettre
aujourd'hui. Ces dossiers se créeront le jour où un deuxième usage apparaîtra.

### Composants

La page du minuteur n'assemble que des blocs — `dial`, `readout`, `controls`, `sheet` — chacun
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
sortir fort, parce que l'appareil ne fait que *réduire* ce qu'on lui donne — et sur Android, le
volume des notifications est un curseur à part de celui du média.

### Une routine est une suite de modes

Chaque étape a la forme d'un `Preset` — nom, durée, couleur, nature — plus un pictogramme.

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
`DICTIONARIES` et `LANGUAGES` — et dans `RTL_LANGS` si elle s'écrit de droite à gauche. Le CSS
utilise des propriétés logiques (`inset-inline-*`, `start` / `end`).

### Persistance

Préférences, modes, routines et historique sont enregistrés dans `localStorage`, l'historique
gardant les 500 dernières sessions.

### Accessibilité testée en continu

`npm run test:a11y` lance l'application et vérifie soixante-douze points :

- **axe-core** sur l'accueil, le panneau (trois onglets), l'éditeur de mode, l'éditeur de routine
  et la page d'accessibilité — en thème clair et sombre, et en arabe ;
- le réglage du cadran **au clavier** ;
- l'enchaînement des étapes d'une routine, et sa bande ;
- le **piège à focus** de la modale, Échap, et le retour du focus ;
- l'absence de défilement horizontal à **320 px** ;
- l'espacement du texte (WCAG 1.4.12) ;
- le contraste des interrupteurs, mesuré sur les **pixels rendus** (WCAG 1.4.11).

La CI les rejoue à chaque push.
