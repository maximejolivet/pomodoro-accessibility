# Architecture

[← Retour au README](../README.md)

```
src/
├── index.html                  # Métadonnées, favicons
├── styles.css                  # Tailwind + styles globaux
└── app/
    ├── app.component.ts        # Cadran (géométrie SVG), réglage au doigt, sessions, enchaînement
    ├── app.component.html      # Boîtier 3D, cadran SVG, contrôles, panneau Modes / Stats / Réglages
    ├── app.component.css       # Style 3D, thèmes clair / sombre (variables CSS)
    ├── accessibility.component.*  # Page d'accessibilité (route /accessibility)
    ├── timer.service.ts        # Décompte basé sur l'heure de fin (RxJS)
    ├── preset.service.ts       # Modes personnalisables
    ├── history.service.ts      # Historique des sessions et statistiques
    ├── i18n.ts                 # Traductions FR / EN / ES / DE / IT / PT / AR, sens d'écriture
    ├── sound-patterns.ts       # Définition des sons + rendu WAV (partagé app / script)
    ├── sound.service.ts        # Lecture des sons (Web Audio)
    ├── notification.service.ts # Notifications locales Capacitor + sons natifs
    ├── keep-awake.service.ts   # Écran toujours allumé
    ├── widget.service.ts       # État transmis au widget iOS
    └── storage.ts              # Accès localStorage
scripts/
└── generate-sounds.ts          # WAV des notifications (node scripts/generate-sounds.ts)
resources/sounds/               # WAV générés
resources/app-icon.svg          # Icône iOS (make icon)
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

- **Cadran** : SVG unique (viewBox 420 × 420), avec des chemins calculés en TypeScript.
  Le disque est dessiné en deux couches : un voile en `mix-blend-mode: multiply` sur
  l'anneau, et un plateau plein au centre.
- **Décompte** : calculé à partir de l'heure de fin réelle, donc juste même en arrière-plan.
- **Thèmes** : toutes les couleurs sont des variables CSS sur `:host`, redéfinies sous `:host(.dark)`.
- **Préférences, modes et historique** : enregistrés dans `localStorage` (500 dernières sessions).
- **Traductions** : un dictionnaire par langue dans `i18n.ts`, typé à partir du français ;
  une clé manquante dans une autre langue est une erreur de compilation. Ajouter une langue =
  ajouter un dictionnaire et une entrée dans `LANGUAGES` (et dans `RTL_LANGS` si elle s'écrit
  de droite à gauche). Le CSS utilise des propriétés logiques (`inset-inline-*`, `start` / `end`).
