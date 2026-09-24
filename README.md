<div align="center">

<img src="public/apple-touch-icon.png" alt="Icône Pomodoro TDAH" width="96" height="96">

# Pomodoro TDAH

**Un minuteur visuel pour l'autisme, le TDAH et les profils neurodivergents.**
On voit le temps qui reste au lieu de le lire.

![TDAH](https://img.shields.io/badge/TDAH-friendly-8b6fd6)
![Autisme](https://img.shields.io/badge/autisme-friendly-5d9fb6)
![Neurodivergent](https://img.shields.io/badge/neurodivergent-friendly-56b27b)
![Minuteur visuel](https://img.shields.io/badge/minuteur-visuel-f3a52b)
![Pomodoro](https://img.shields.io/badge/pomodoro-🍅-d63f4f)

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?logo=reactivex&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Web Audio](https://img.shields.io/badge/Web_Audio-API-FF6F00?logo=webaudio&logoColor=white)

![iOS](https://img.shields.io/badge/iOS-000000?logo=apple&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white)
![Web](https://img.shields.io/badge/Web-4285F4?logo=googlechrome&logoColor=white)
![Mode sombre](https://img.shields.io/badge/mode_sombre-✓-1d282d)
![Langues](https://img.shields.io/badge/langues-FR_·_EN_·_ES_·_DE_·_IT_·_PT_·_AR-0055A4)

<img src="docs/screenshot.png" alt="Pomodoro TDAH en mode clair" width="300">
&nbsp;&nbsp;
<img src="docs/screenshot-dark.png" alt="Pomodoro TDAH en mode sombre" width="300">

</div>

---

## Sommaire

- [Pomodoro TDAH](#pomodoro-tdah)
  - [Sommaire](#sommaire)
  - [Pourquoi un minuteur visuel ?](#pourquoi-un-minuteur-visuel-)
  - [Fonctionnalités](#fonctionnalités)
  - [Utilisation](#utilisation)
  - [Sons](#sons)
  - [Installation](#installation)
  - [Commandes `make`](#commandes-make)
  - [Build mobile (iOS / Android)](#build-mobile-ios--android)
  - [Architecture](#architecture)

## Pourquoi un minuteur visuel ?

Une horloge donne l'heure, un minuteur numérique affiche des chiffres, mais aucun des deux
ne **montre** vraiment le temps. Pomodoro TDAH reprend le principe du minuteur visuel : un
disque coloré couvre la durée choisie et **rétrécit à mesure que le temps passe**. D'un
coup d'œil, on sait s'il reste beaucoup ou peu de temps, sans lire ni calculer.

Ce repère concret aide particulièrement les personnes **TDAH, autistes ou neurodivergentes** :

- 🧭 **Rendre le temps concret** : une durée abstraite devient une surface qui diminue.
- 🔄 **Faciliter les transitions** : les sons à 45, 30 et 15 min puis le carillon de fin
  préviennent en douceur qu'un changement d'activité approche.
- 🌱 **Favoriser l'autonomie** : on gère soi-même son temps de travail ou de pause, sans
  qu'un adulte ou un collègue ait à le rappeler.
- 🏠 **Au quotidien** : devoirs, routines du matin, temps d'écran, séances de travail en
  Pomodoro, à la maison comme en classe ou au bureau.

> [!NOTE]
> Projet indépendant, inspiré du principe des minuteurs visuels. Il n'est ni affilié ni
> approuvé par Time Timer®, marque déposée de son propriétaire.

## Fonctionnalités

|                                 |                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 🕒 **Cadran façon Time Timer**   | Disque coloré qui recule vers 0, anneau arc-en-ciel en 12 segments de 5 min, jusqu'à 60 min                            |
| 👆 **Réglage au doigt**          | Glisser sur le cadran règle les minutes, même pendant le décompte                                                      |
| 🧊 **Style 3D**                  | Boîtier en relief, reflet de vitre, bouton central bombé, légère inclinaison qui suit la souris                        |
| 🎯 **Modes personnalisables**    | Pomodoro, Pause, Pause longue, Focus TDAH… ou tes propres modes : nom, durée (1-60 min), couleur, type travail / pause |
| 🔁 **Enchaînement automatique**  | Travail → pause → travail, avec une pause longue tous les 4 cycles (désactivable)                                      |
| 📊 **Historique & statistiques** | Temps de focus du jour, sessions terminées, série de jours, graphique des 7 derniers jours, dernières sessions         |
| 🏁 **Objectif quotidien**        | Minutes de focus visées par jour (10-300 min, 100 par défaut), barre de progression dans Stats                         |
| 🧩 **Widget écran d'accueil**    | iOS, petit et moyen : décompte en cours ou anneau d'objectif du jour                                                   |
| 🔔 **Sons de palier**            | Un son différent à 45, 30 et 15 min restantes, puis un carillon à 0                                                    |
| ⏱️ **+5 min automatique**        | À 0, 5 minutes de prolongation pour terminer ce qui est en cours (désactivable)                                        |
| 📳 **Vibration**                 | Retour haptique à la fin et à chaque minute pendant le réglage                                                         |
| 📲 **Notifications locales**     | Alertes même téléphone verrouillé ou app en arrière-plan, avec **les mêmes sons que l'app** (iOS / Android)            |
| 🔆 **Écran toujours allumé**     | L'écran ne se met pas en veille pendant le décompte (désactivable)                                                     |
| 🌍 **Multilingue**               | Français, anglais, espagnol, allemand, italien, portugais, arabe (de droite à gauche) ; langue du système par défaut   |
| 🌗 **Mode sombre**               | Suit le système au premier lancement, puis se règle dans ⚙︎                                                             |
| 🔇 **Son on/off**                | Coupure complète des sons, choix mémorisé                                                                              |
| ♿ **Accessibilité**             | Libellés pour lecteurs d'écran, navigation clavier, `prefers-reduced-motion` respecté                                  |

## Utilisation

| Geste                      | Action                                                                            |
| -------------------------- | --------------------------------------------------------------------------------- |
| **Tap** sur le cadran ou ▶ | Démarrer / mettre en pause / reprendre                                            |
| **Glisser** sur le cadran  | Régler les minutes (0 → 60)                                                       |
| ↺                          | Remettre à zéro                                                                   |
| ⚙︎ → **Modes**              | Durée, choix du mode, création / modification / suppression de modes (✎)          |
| ⚙︎ → **Stats**              | Objectif du jour, statistiques et historique des sessions                         |
| ⚙︎ → **Réglages**           | Mode sombre, son, +5 min auto, enchaînement, écran allumé, objectif, langue, sons |

Le décompte est calculé à partir de l'heure de fin réelle : il reste juste même si l'onglet
est en arrière-plan ou si le téléphone est verrouillé. Au retour, la prolongation et la
session suivante reprennent là où elles en seraient.

<p align="center">
  <img src="docs/screenshot-modes.png" alt="Éditeur de mode" width="260">
  &nbsp;&nbsp;
  <img src="docs/screenshot-stats.png" alt="Statistiques" width="260">
</p>

## Sons

Tous les sons sont synthétisés avec l'API Web Audio (aucun fichier audio). Ils vont du plus
discret au plus insistant à l'approche de la fin, et peuvent s'écouter dans ⚙︎ → *Écouter les sons*.

| Moment               | Son                                                 | Timbre               |
| -------------------- | --------------------------------------------------- | -------------------- |
| **45 min** restantes | 1 note douce, *do* (523 Hz)                         | sinus, rond          |
| **30 min**           | 2 notes montantes, *ré → la*                        | triangle, plus clair |
| **15 min**           | 3 notes rapides, *mi → sol → si*                    | carré, style « bip » |
| **0**                | carillon *do-mi-sol-do* joué 3 fois, avec vibration | cloche               |

## Installation

**Prérequis :** Node.js 22+ · npm 10+ · Xcode (iOS) · Android Studio (Android)

```bash
git clone <url-du-repo> pomodoro-tdah
cd pomodoro-tdah
make install   # npm install
make dev       # http://localhost:4200
```

## Commandes `make`

Lancer `make` seul affiche l'aide.

| Commande                              | Rôle                                                            |
| ------------------------------------- | --------------------------------------------------------------- |
| `make install`                        | Installe les dépendances                                        |
| `make dev`                            | Serveur de dev avec rechargement à chaud                        |
| `make build`                          | Build de production                                             |
| `make watch`                          | Build de dev en continu                                         |
| `make test`                           | Tests unitaires (Karma / Jasmine)                               |
| `make sync`                           | Build, copie dans `www/`, `npx cap sync`, puis `make sounds`    |
| `make sounds`                         | Génère les sons de notification (WAV) et les copie dans Android |
| `make icon`                           | Génère l'icône iOS depuis `resources/app-icon.svg`              |
| `make ios` / `make android`           | Ajoute la plateforme native (une seule fois)                    |
| `make open-ios` / `make open-android` | Sync puis ouvre Xcode / Android Studio                          |
| `make clean`                          | Supprime `dist/`, `www/` et le cache Angular                    |

## Build mobile (iOS / Android)

```bash
make ios          # première fois seulement
make open-ios     # build + sync + Xcode

make android      # première fois seulement
make open-android # build + sync + Android Studio
```

> [!NOTE]
> **Notifications locales.** L'autorisation est demandée au premier démarrage du minuteur.
> Les alertes (paliers, fin, fin de prolongation, fin de la session enchaînée) sont
> programmées quand l'app passe en arrière-plan et annulées au retour, là où les sons de
> l'app prennent le relais.
>
> **Sons des notifications.** Ils sont générés à partir des mêmes motifs que l'app
> (`src/app/sound-patterns.ts`) :
> - **iOS** : l'app écrit elle-même les WAV dans `Library/Sounds` au lancement, rien à faire ;
> - **Android** : `make sounds` (appelé par `make sync`) copie les WAV dans
>   `android/app/src/main/res/raw`, et l'app crée un canal de notification par son.
>
> Sur Android 12+, les alarmes exactes peuvent nécessiter la permission
> `SCHEDULE_EXACT_ALARM` dans `AndroidManifest.xml`.

> [!IMPORTANT]
> **Widget iOS.** L'extension `PomodoroWidget` (SwiftUI, iOS 17+) lit l'état écrit par l'app
> dans l'App Group `group.com.maximejolivet.pomodorotdah` (plugin local `WidgetBridge`, enregistré par
> `MainViewController`). Sur un appareil, choisir son équipe dans *Signing & Capabilities*
> pour les cibles **App** et **PomodoroWidget** : Xcode crée alors l'App Group. Le décompte
> du widget avance seul ; l'app ne le met à jour qu'aux changements (démarrage, pause, fin,
> passage en arrière-plan, objectif, langue).
>
> **Icône.** `resources/app-icon.svg` est dérivé de `public/favicon.svg` (plein cadre,
> coins arrondis par iOS). Après modification : `make icon`.

## Architecture

```
src/
├── index.html                  # Métadonnées, favicons
├── styles.css                  # Tailwind + styles globaux
└── app/
    ├── app.component.ts        # Cadran (géométrie SVG), réglage au doigt, sessions, enchaînement
    ├── app.component.html      # Boîtier 3D, cadran SVG, contrôles, panneau Modes / Stats / Réglages
    ├── app.component.css       # Style 3D, thèmes clair / sombre (variables CSS)
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
└── captures d'écran
```

- **Cadran** : SVG unique (viewBox 420 × 420), avec des chemins calculés en TypeScript.
  Le disque est dessiné en deux couches : un voile en `mix-blend-mode: multiply` sur
  l'anneau, et un plateau plein au centre.
- **Thèmes** : toutes les couleurs sont des variables CSS sur `:host`, redéfinies sous `:host(.dark)`.
- **Préférences, modes et historique** : enregistrés dans `localStorage` (500 dernières sessions).
- **Traductions** : un dictionnaire par langue dans `i18n.ts`, typé à partir du français ;
  une clé manquante dans une autre langue est une erreur de compilation. Ajouter une langue =
  ajouter un dictionnaire et une entrée dans `LANGUAGES` (et dans `RTL_LANGS` si elle s'écrit
  de droite à gauche). Le CSS utilise des propriétés logiques (`inset-inline-*`, `start` / `end`).
