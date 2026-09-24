# Build mobile (iOS / Android)

[← Retour au README](../README.md)

```bash
make ios          # première fois seulement
make open-ios     # build + sync + Xcode

make android      # première fois seulement
make open-android # build + sync + Android Studio
```

## Notifications locales

L'autorisation est demandée au premier démarrage du minuteur. Les alertes (paliers, fin,
fin de prolongation, fin de la session enchaînée) sont programmées quand l'app passe en
arrière-plan et annulées au retour, là où les sons de l'app prennent le relais.

### Sons des notifications

Ils sont générés à partir des mêmes motifs que l'app (`src/app/sound-patterns.ts`) :

- **iOS** : l'app écrit elle-même les WAV dans `Library/Sounds` au lancement, rien à faire ;
- **Android** : `make sounds` (appelé par `make sync`) copie les WAV dans
  `android/app/src/main/res/raw`, et l'app crée un canal de notification par son.

Sur Android 12+, les alarmes exactes peuvent nécessiter la permission
`SCHEDULE_EXACT_ALARM` dans `AndroidManifest.xml`.

## Widget iOS

L'extension `PomodoroWidget` (SwiftUI, iOS 17+) lit l'état écrit par l'app dans l'App Group
`group.com.maximejolivet.pomodorotdah` (plugin local `WidgetBridge`, enregistré par
`MainViewController`).

Sur un appareil, choisir son équipe dans *Signing & Capabilities* pour les cibles **App** et
**PomodoroWidget** : Xcode crée alors l'App Group. Le décompte du widget avance seul ; l'app
ne le met à jour qu'aux changements (démarrage, pause, fin, passage en arrière-plan,
objectif, langue).

## Icône

`resources/app-icon.svg` est dérivé de `public/favicon.svg` (plein cadre, coins arrondis par
iOS). Après modification : `make icon`.
