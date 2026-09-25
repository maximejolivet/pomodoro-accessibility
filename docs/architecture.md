# Architecture

[← Retour au README](../README.md)

```
src/
├── index.html                  # Métadonnées, favicons
├── styles.css                  # Imports du thème, Tailwind, utilitaires globaux
├── theme/
│   ├── tokens.css              # Jetons de couleur (thème clair), posés sur <app-root>
│   └── dark.css                # Redéfinition des jetons en thème sombre
└── app/
    ├── app.component.*         # Coquille : applique le thème + <router-outlet>
    ├── app.config.ts           # Providers (routeur)
    ├── app.routes.ts           # Routes, chargées à la demande (loadComponent)
    ├── core/                   # Ce qui ne dépend d'aucune page
    │   ├── constants/          # timer · history · preset (règles et réglages du domaine)
    │   ├── models/             # preset · session · alert · widget-state
    │   ├── helpers/            # storage.ts · time.ts · sound-patterns.ts (motifs + WAV)
    │   ├── i18n/
    │   │   ├── i18n.service.ts # Langue courante, sens d'écriture, traduction
    │   │   ├── i18n.model.ts   # Clés typées, liste des langues, langues RTL
    │   │   └── locales/        # Un dictionnaire par langue (fr en es de it pt ar)
    │   └── services/
    │       ├── timer.service.ts        # Décompte basé sur l'heure de fin (RxJS)
    │       ├── session.service.ts      # Session en cours, enchaînement, sons, notifications, widget
    │       ├── preferences.service.ts  # Préférences persistées, en signaux
    │       ├── preset.service.ts       # Modes personnalisables
    │       ├── history.service.ts      # Historique des sessions et statistiques
    │       ├── sound.service.ts        # Lecture des sons (Web Audio)
    │       ├── notification.service.ts # Notifications locales Capacitor + sons natifs
    │       ├── keep-awake.service.ts   # Écran toujours allumé
    │       └── widget.service.ts       # État transmis au widget iOS
    └── features/               # Une page par dossier
        ├── timer/
        │   ├── timer-page.component.*  # Boîtier 3D, cadran, contrôles, panneau Modes / Stats / Réglages
        │   ├── dial-geometry.ts        # Chemins SVG du cadran (fonctions pures)
        │   └── timer.model.ts          # Onglets du panneau, mode en cours d'édition
        └── accessibility/
            ├── accessibility-page.component.*  # Page d'accessibilité (route /accessibility)
            └── accessibility.i18n.ts           # Ses textes, par langue
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
- **Structure** : la coquille (`app.component.*`) ne porte que le thème et le routeur ;
  chaque page vit dans `features/`, tout ce qu'elles partagent dans `core/`. Les deux pages
  sont chargées à la demande, donc la page d'accessibilité ne pèse pas sur le démarrage.
- **État de session dans un service, pas dans la page** : les pages sont détruites à chaque
  navigation. `SessionService` (racine) porte donc la session en cours, l'enchaînement, les
  sons, les notifications et le widget ; la page du minuteur n'en est qu'une vue. Une session
  continue, se termine et s'enregistre pendant la lecture de la page d'accessibilité.
- **Thèmes** : toutes les couleurs sont des variables CSS dans `src/theme/`, posées sur
  `<app-root>` et redéfinies sous `app-root.dark`, donc héritées par les pages.
- **Pas de `shared/`, `guards/`, `interceptors/`, `pipes/` ni `environments/`** : rien à y
  mettre aujourd'hui. Ces dossiers se créeront le jour où un deuxième usage apparaîtra.
- **Préférences, modes et historique** : enregistrés dans `localStorage` (500 dernières sessions).
- **Traductions** : un dictionnaire par langue dans `core/i18n/locales/`, typé à partir du français ;
  une clé manquante dans une autre langue est une erreur de compilation. Ajouter une langue =
  ajouter un fichier dans `locales/`, puis une entrée dans `Lang`, `DICTIONARIES` et `LANGUAGES`
  (et dans `RTL_LANGS` si elle s'écrit de droite à gauche). Le CSS utilise des propriétés logiques (`inset-inline-*`, `start` / `end`).
