# Cahier des charges technique

[← Retour au README](../README.md) · [Cahier des charges fonctionnel](FUNCTIONAL-SPECIFICATION.md)

Version 1.0 — 25 septembre 2026 · Application **Pomodoro Accessibilité**

Ce document décrit *comment* les exigences du [cahier des charges
fonctionnel](FUNCTIONAL-SPECIFICATION.md) sont réalisées. Pour la carte des dossiers, voir
[Architecture du code](ARCHITECTURE.md) ; pour les commandes, [Installation](INSTALLATION.md) ;
pour le natif, [Build mobile](MOBILE.md).

## Sommaire

- [1. Socle technique](#1-socle-technique)
- [2. Architecture applicative](#2-architecture-applicative)
- [3. Modèle de données et persistance](#3-modèle-de-données-et-persistance)
- [4. Services du domaine](#4-services-du-domaine)
- [5. Rendu du cadran](#5-rendu-du-cadran)
- [6. Sons](#6-sons)
- [7. Intégration native](#7-intégration-native)
- [8. Internationalisation](#8-internationalisation)
- [9. Thème et styles](#9-thème-et-styles)
- [10. Accessibilité technique](#10-accessibilité-technique)
- [11. Build, exécution et intégration continue](#11-build-exécution-et-intégration-continue)
- [12. Qualité et tests](#12-qualité-et-tests)
- [13. Sécurité](#13-sécurité)
- [14. Contraintes, limites et évolutions](#14-contraintes-limites-et-évolutions)

---

## 1. Socle technique

### 1.1 Dépendances

| Domaine | Choix | Version | Rôle |
| ------- | ----- | ------- | ---- |
| Framework | Angular (standalone, signaux) | 22 | Composants, routage, réactivité |
| Langage | TypeScript | 6 | Typage strict du domaine |
| Flux asynchrones | RxJS | 7.8 | Ticks du décompte |
| Styles | Tailwind CSS + PostCSS | 4 / 8 | Utilitaires, jetons de thème |
| Natif | Capacitor | 8 | Pont web ↔ iOS / Android |
| Widget iOS | Swift, SwiftUI, WidgetKit | iOS 17+ | Widget d'écran d'accueil |
| Tests unitaires | Karma + Jasmine | 6 / 7 | Tests unitaires |
| Tests d'accessibilité | Playwright + axe-core | 1.63 / 4.13 | Non-régression RGAA / WCAG |
| Exécution | Node.js | ^24.15.0 (`engines`, `.nvmrc`) | Outillage et scripts |

Plugins Capacitor : `@capacitor/app`, `@capacitor/local-notifications`, `@capacitor/haptics`,
`@capacitor/filesystem`, `@capacitor-community/keep-awake`, plus le plugin local `WidgetBridge`.

### 1.2 Contraintes d'architecture

- **Aucun back-end.** Pas de client HTTP, pas d'intercepteur, pas de variables d'environnement
  de déploiement : il n'y a rien à configurer par environnement.
- **Tout est local.** La seule persistance est `localStorage`, encapsulée dans un helper.
- **Pas de dossiers vides par anticipation** : pas de `shared/`, `guards/`, `interceptors/`,
  `pipes/` ni `environments/` tant qu'un second usage n'apparaît pas.

---

## 2. Architecture applicative

### 2.1 Découpage

```
app.component        Coquille : applique le thème et le sens d'écriture, porte <router-outlet>
app.config.ts        Providers (routeur)
app.routes.ts        '' → timer, 'accessibility' → page d'accessibilité (loadComponent)
core/                Indépendant de toute page : constants, models, helpers, i18n, services
features/timer/      Page du minuteur = assemblage de dial / readout / controls / sheet
features/accessibility/  Page de déclaration d'accessibilité et ses textes
```

### 2.2 Règles de dépendance

| Règle | Justification |
| ----- | ------------- |
| `features/` dépend de `core/`, jamais l'inverse. | Le domaine reste testable et réutilisable. |
| Les composants lisent l'état dans les services plutôt que par une cascade d'entrées. | Évite le passage de propriétés sur 4 niveaux. |
| Seul l'état local circule en entrées / sorties : panneau ouvert, brouillon de mode, geste en cours. | Sépare l'état de vue de l'état de domaine. |
| L'état de session vit dans `SessionService` (racine), pas dans la page. | Les pages sont détruites à chaque navigation ; une session en cours serait perdue. |
| Les deux routes sont chargées à la demande (`loadComponent`). | La page d'accessibilité ne pèse pas sur le démarrage. |
| `sound-patterns.ts` n'importe rien. | Il est exécuté aussi bien par le navigateur que directement par Node. |

### 2.3 Modèle de réactivité

- **Signaux Angular** pour l'état applicatif : préférences, modes, historique, session en cours,
  valeurs dérivées en `computed`, effets de bord en `effect`.
- **RxJS** uniquement dans `TimerService`, pour l'émission périodique des ticks et l'événement de
  fin de décompte.

---

## 3. Modèle de données et persistance

### 3.1 Types du domaine

| Type | Champs | Notes |
| ---- | ------ | ----- |
| `Preset` | `id`, `name`, `nameKey?`, `seconds`, `color`, `kind` | `kind` ∈ `focus` \| `break` \| `longBreak` ; `name` vide pour un mode par défaut, dont le libellé vient de `nameKey` (traduit) |
| `Session` | `name`, `color`, `kind`, `plannedSeconds`, `activeSeconds`, `startedAt`, `endedAt`, `completed` | Nom et couleur figés à l'enregistrement (RG-9) |
| `ActiveSession` | `name`, `color`, `kind`, `plannedSeconds`, `startedAt`, `activeMs`, `runningSince` | `runningSince` à `null` en pause ; `activeMs` cumule le temps décompté avant la reprise courante |
| `DayStat` | `date`, `focusMinutes` | Une barre de l'histogramme hebdomadaire |
| `Alert` | `id`, `at`, `title`, `body`, `sound` | Notification locale à programmer |
| `WidgetState` | `dayStart`, `focusMinutes`, `goalMinutes`, `timer{…}`, `labels{…}`, `rtl` | Contrat partagé avec `PomodoroWidget.swift` |

### 3.2 Constantes du domaine

| Constante | Valeur | Exigence couverte |
| --------- | ------ | ----------------- |
| `MAX_MINUTES` | 60 | RG-1 |
| `EXTRA_SECONDS` | 300 | RG-2 |
| `MILESTONES` | `[45, 30, 15]` | RG-4 |
| `LATE_ALERT_SECONDS` | 90 | RG-15 |
| `LONG_BREAK_EVERY` | 4 | RG-3 |
| `MAX_SESSIONS` | 500 | RG-7 |
| `MIN_RECORDED_SECONDS` | 60 | RG-6 |
| `GOAL_MIN / MAX / STEP / DEFAULT_MINUTES` | 10 / 300 / 5 / 100 | RG-12 |
| `PRESET_COLORS` | 10 teintes de l'anneau | EF-MOD-3 |
| `DEFAULT_PRESETS` | Pomodoro 25, Pause 5, Pause longue 15, Focus 15 | EF-MOD-1 |

### 3.3 Persistance

Accès centralisé dans `core/helpers/storage.ts`. Toutes les clés sont préfixées
`pomodoro-tdah.`. Chaque lecture et chaque écriture est protégée par un `try/catch` : en
navigation privée ou stockage bloqué, l'application continue et les réglages ne valent que pour
la session (RG-14).

| Clé (préfixée) | Contenu | Format |
| -------------- | ------- | ------ |
| `theme` | Thème | `'dark'` \| `'light'` (absent ⇒ préférence système) |
| `opendyslexic` | Police OpenDyslexic | `'on'` \| `'off'` (défaut : off) |
| `sound` | Sons | `'on'` \| `'off'` (défaut : on) |
| `auto-extra` | Prolongation +5 min | `'on'` \| `'off'` (défaut : on) |
| `auto-chain` | Enchaînement automatique | `'on'` \| `'off'` (défaut : off) |
| `keep-awake` | Écran allumé | `'on'` \| `'off'` (défaut : on) |
| `lang` | Langue | code de langue ou `'auto'` |
| `preset` | Mode sélectionné | identifiant |
| `presets` | Modes | JSON `Preset[]` |
| `history` | Historique | JSON `Session[]`, 500 entrées max |
| `daily-goal` | Objectif quotidien | minutes |

**Migrations.** Il n'y a pas de numéro de schéma : les lectures sont défensives. Les modes
relus sont filtrés (identifiant chaîne, durée positive, couleur chaîne) et, si rien de valide ne
subsiste, les modes par défaut sont restaurés. Un JSON illisible retombe sur la valeur par défaut.
L'objectif relu est borné et arrondi.

---

## 4. Services du domaine

Tous fournis en racine (`providedIn: 'root'`).

### 4.1 `TimerService` — décompte

Le décompte est **calculé à partir de l'heure de fin réelle** (`endAt`), et non par
décrémentation : à chaque tick, `timeLeft = (endAt − now) / 1000`. Un ralentissement des ticks
par le navigateur ou un passage en arrière-plan n'introduit donc aucune dérive (EF-TIM-9,
ENF-PER-3). Ticks toutes les 100 ms via `interval(100)`, arrêtés par un `takeUntil`.

| Membre | Rôle |
| ------ | ---- |
| `timeLeft$`, `totalTime$`, `isRunning$` | État observable |
| `finished$` | Émis à 0 avec le **retard constaté** en secondes, exploité pour la règle des 90 s |
| `endTime` | Heure de fin en ms si le décompte tourne, sinon `null` (widget, notifications) |
| `start` / `pause` / `resume` / `reset` | Contrôle |
| `setTimeLeft` | Réglage au doigt sans interrompre le décompte : recale `endAt` |

L'haptique de fin est chargée dynamiquement (`import('@capacitor/haptics')`) et son échec est ignoré.

### 4.2 `SessionService` — orchestration

Point central : durée réglée, mode sélectionné, session en cours, enchaînement, paliers sonores,
notifications, widget, annonces pour lecteurs d'écran. Il vit en racine précisément pour survivre
à la navigation (EF-A11-4, ENF-PER-4). Il expose des signaux dérivés prêts à afficher :
`displaySeconds`, `displayMinutes`, `modeName`, `stateLabel`, `isPaused`, `announcement`.

Il réagit aussi au cycle de vie de l'application (`@capacitor/app`) : à la mise en arrière-plan
il programme les notifications restantes ; au retour il les annule, rattrape l'état et
redemande le maintien d'écran.

### 4.3 Autres services

| Service | Responsabilité | Points notables |
| ------- | -------------- | --------------- |
| `PreferencesService` | Préférences en signaux | Thème initial : valeur enregistrée, sinon `prefers-color-scheme` |
| `PresetService` | Modes | Chargement filtré, refus de supprimer le dernier mode, restauration des modes par défaut |
| `HistoryService` | Historique, statistiques, objectif | `today`, `week`, `streak`, `goalProgress` en `computed` ; replanification au passage de minuit |
| `SoundService` | Lecture Web Audio | Synthèse des motifs partagés |
| `NotificationService` | Notifications locales | Écrit les WAV iOS au lancement, crée un canal Android par son, canal silencieux pour les alertes muettes |
| `KeepAwakeService` | Maintien de l'écran | Vérifie le support, ignore les échecs, redemande le verrou au retour au premier plan |
| `WidgetService` | Widget iOS | Actif uniquement sur iOS ; n'envoie que si l'état JSON a changé ; réessaie au changement suivant en cas d'échec |
| `I18nService` | Langue et traduction | Détection depuis `navigator.languages`, repli français, met à jour `lang` et `dir` du document |

---

## 5. Rendu du cadran

- **Un seul SVG**, `viewBox="0 0 420 420"`, dont les chemins sont calculés en TypeScript par des
  fonctions pures (`features/timer/dial-geometry.ts`) — testables sans DOM.
- **Deux couches** : un voile en `mix-blend-mode: multiply` posé sur l'anneau arc-en-ciel de
  12 segments de 5 minutes, et un plateau plein au centre.
- **Gestes** : événements *pointer* (`pointerdown` / `pointermove` / `pointerup` /
  `pointercancel`), un seul jeu de gestionnaires pour la souris, le tactile et le stylet.
- **Clavier** : ← / → (±1 min), Page↑ / Page↓ (±5 min), Début / Fin (0 / 60 min).
- Le SVG est `aria-hidden` ; c'est son conteneur qui porte la sémantique (voir §10).

---

## 6. Sons

`core/helpers/sound-patterns.ts` définit les quatre motifs (`milestone45`, `milestone30`,
`milestone15`, `end`) sous forme de notes — fréquence, décalage, durée, gain, forme d'onde — avec
un partiel aigu optionnel pour l'effet de cloche.

Ce fichier unique sert **deux consommateurs** :

1. l'application, qui synthétise les motifs à la volée via Web Audio ;
2. `scripts/generate-sounds.ts`, exécuté par Node (`make sounds`), qui rend les mêmes motifs en
   fichiers WAV 22 050 Hz pour les notifications natives.

C'est la raison pour laquelle il n'importe rien : il doit rester exécutable hors bundle. Les sons
de l'application et ceux des notifications sont ainsi identiques par construction.

---

## 7. Intégration native

### 7.1 Notifications locales

| Plateforme | Mise en œuvre |
| ---------- | ------------- |
| iOS | L'application écrit elle-même les WAV dans `Library/Sounds` au lancement, via `@capacitor/filesystem` |
| Android | `make sounds` copie les WAV dans `android/app/src/main/res/raw` ; l'application crée un canal de notification par son |

Les alertes (paliers, fin, fin de prolongation, fin de la session enchaînée) sont programmées au
passage en arrière-plan et annulées au retour. Sur Android 12+, les alarmes exactes peuvent
requérir `SCHEDULE_EXACT_ALARM` dans `AndroidManifest.xml`. Aucun effet dans le navigateur.

### 7.2 Widget iOS

- Extension `PomodoroWidget` (SwiftUI, WidgetKit, iOS 17+).
- Transport : plugin Capacitor **local** `WidgetBridge` (`ios/App/App/WidgetBridgePlugin.swift`),
  enregistré par `MainViewController`, qui écrit l'état JSON dans l'App Group
  `group.com.maximejolivet.pomodorotdah`.
- Le widget décompte seul entre deux mises à jour ; l'application ne pousse un état qu'aux
  changements (démarrage, pause, fin, arrière-plan, objectif, langue) et seulement si le JSON diffère.
- Le contrat de données est le type `WidgetState` côté TypeScript et `WidgetState` côté Swift :
  **toute évolution doit être faite des deux côtés**.
- Sur appareil, l'équipe de signature doit être choisie pour les cibles **App** et
  **PomodoroWidget** afin que Xcode crée l'App Group.

### 7.3 Identité de l'application

`appId` : `com.maximejolivet.pomodorotdah` · `appName` : Pomodoro Accessibilité · `webDir` : `www`.
L'icône iOS est générée depuis `resources/app-icon.svg` par `make icon`.

---

## 8. Internationalisation

- Un dictionnaire par langue dans `core/i18n/locales/` : `fr`, `en`, `es`, `de`, `it`, `pt`, `ar`.
- Les clés sont **typées d'après le français** (`type I18nKey = keyof typeof fr`) : une clé
  manquante dans une autre langue est une erreur de compilation (ENF-MNT-1).
- Les textes de la page d'accessibilité vivent à part, dans `features/accessibility/accessibility.i18n.ts`.
- `I18nService` détecte la langue depuis `navigator.languages`, retombe sur le français, et met à
  jour `document.documentElement.lang` ainsi que le sens d'écriture (`dir`).
- **Ajouter une langue** = un fichier dans `locales/`, puis une entrée dans `Lang`,
  `DICTIONARIES`, `LANGUAGES` — et dans `RTL_LANGS` si elle s'écrit de droite à gauche.
- Le CSS emploie des propriétés logiques (`inset-inline-*`, `start` / `end`) : le passage en RTL
  ne demande aucune règle miroir.

---

## 9. Thème et styles

| Fichier | Contenu |
| ------- | ------- |
| `src/styles.css` | Imports du thème, Tailwind, utilitaires globaux |
| `src/theme/tokens.css` | Jetons de couleur du thème clair, posés sur `<app-root>` |
| `src/theme/dark.css` | Redéfinition des jetons sous `app-root.dark` |
| `src/theme/controls.css` | Primitives partagées : bouton en relief, curseur, contrôle segmenté |

Les couleurs ne sont **jamais** écrites en dur dans un composant : toutes passent par des
variables CSS héritées depuis `<app-root>`, ce qui rend le basculement de thème instantané et
garantit l'homogénéité des contrastes (ENF-MNT-2).

---

## 10. Accessibilité technique

| Exigence | Mise en œuvre |
| -------- | ------------- |
| Cadran utilisable au clavier et annoncé | Conteneur focalisable portant `role="slider"`, `aria-valuemin=1`, `aria-valuemax=60`, `aria-valuenow`, `aria-valuetext` (« *n* minutes, *action* »), `aria-label` ; le SVG est `aria-hidden` |
| Annonces temps réel | Région live alimentée par le signal `announcement` de `SessionService` |
| Panneau de réglages | Focus piégé tant qu'il est ouvert, fermeture par Échap, focus rendu au déclencheur |
| Onglets | Rôles `tablist` / `tab` / `tabpanel`, navigation par flèches, flèches nommées pour les lecteurs d'écran |
| Contraste | Jetons de thème vérifiés à 4,5:1 minimum en clair et en sombre |
| Couleur seule | Chaque couleur de mode est accompagnée de son nom |
| Animations | `prefers-reduced-motion` respecté |
| Dyslexie | Police OpenDyslexic activable, interlettrage et interlignage élargis |
| Structure | HTML sémantique, `main`, titres hiérarchisés, métadonnées de page |

Les écarts connus sont publiés dans la déclaration d'accessibilité de l'application (voir §7.1 du
cahier des charges fonctionnel).

---

## 11. Build, exécution et intégration continue

### 11.1 Commandes

Le `Makefile` est le point d'entrée (`make` seul affiche l'aide) : `install`, `dev`, `build`,
`watch`, `test`, `sync`, `sounds`, `icon`, `ios`, `android`, `open-ios`, `open-android`, `clean`.
Les scripts npm correspondants sont `start`, `build`, `watch`, `test`, `test:a11y`.

### 11.2 Build web

- Builder `@angular-devkit/build-angular:application`, sortie `dist/pomodoro-tdah`.
- Production : hachage des noms de fichiers, budgets **500 ko / 1 Mo** pour le bundle initial et
  **24 ko / 32 ko** par feuille de style de composant.
- Développement : optimisation désactivée, *source maps*.
- Les fichiers de `public/` sont copiés tels quels (favicons, icône Apple).

### 11.3 Chaîne mobile

`make sync` : build → copie de `dist/pomodoro-tdah/browser` dans `www/` → `npx cap sync` →
`make sounds` (génération des WAV et copie dans `res/raw` si le dossier Android existe).
`make open-ios` / `make open-android` enchaînent `sync` puis l'ouverture de l'IDE natif.

### 11.4 Intégration continue

Workflow GitHub Actions `.github/workflows/a11y.yml`, déclenché sur les poussées vers `main` et
sur chaque demande de fusion, avec deux jobs sur `ubuntu-latest` :

1. **Build de production** — `npm ci` puis `npm run build`.
2. **Non-régression d'accessibilité** — installation de Chromium par Playwright, `npm run test:a11y`,
   puis dépôt du rapport Playwright en artefact (7 jours de rétention).

La version de Node vient de `.nvmrc` ; le cache npm est activé.

### 11.5 Déploiement

Le build web est un ensemble de fichiers statiques : n'importe quel hébergement statique convient,
sans variable d'environnement ni service annexe. Les versions mobiles sont produites depuis Xcode
et Android Studio. Il n'existe pas de versions publiées : seule la dernière version de `main` est
maintenue.

---

## 12. Qualité et tests

| Niveau | Outil | Portée |
| ------ | ----- | ------ |
| Unitaire | Karma + Jasmine (`make test`) | Logique du domaine : géométrie du cadran, helpers de temps, services |
| Accessibilité | Playwright + axe-core (`npm run test:a11y`) | Parcours réels, clavier, focus, contrastes |

Configuration Playwright : dossier `tests/`, projet Chromium en **420 × 900** (cadrage mobile),
serveur de développement démarré automatiquement sur `http://localhost:4200`, exécution
parallèle, une reprise en CI, trace à la première reprise, `forbidOnly` en CI.

La suite `tests/a11y.spec.ts` (20 tests) analyse avec les jeux de règles `wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa` et `best-practice`, en **thème clair et en thème sombre**, sur l'accueil et
sur le panneau de réglages ouvert. Toute violation fait échouer la CI.

**Critères d'acceptation d'une contribution** : le build de production passe, la suite
d'accessibilité ne relève aucune violation, aucune couleur n'est écrite en dur, aucune clé de
traduction ne manque (le compilateur le vérifie), et le message de commit suit le format
sémantique.

---

## 13. Sécurité

- **Surface d'attaque réduite** : aucun serveur, aucune requête sortante, aucune authentification,
  aucune donnée quittant l'appareil.
- Les seules données stockées sont les préférences, les modes et l'historique, dans le stockage
  local, sans donnée personnelle identifiante.
- Signalement d'une vulnérabilité : **pas d'issue publique** ; utiliser le signalement privé
  GitHub (onglet *Security* → *Report a vulnerability*). Voir `SECURITY.md`.
- Seule la dernière version de `main` reçoit des correctifs.
- Côté natif : permissions limitées aux notifications locales, à l'haptique, au maintien d'écran
  et à l'écriture des sons dans le conteneur de l'application.

---

## 14. Contraintes, limites et évolutions

### 14.1 Limites assumées

| Limite | Raison |
| ------ | ------ |
| Historique plafonné à 500 sessions | Taille de `localStorage` ; au-delà, l'intérêt statistique est marginal |
| Pas d'export de données par l'utilisateur | Non spécifié à ce jour |
| Widget iOS uniquement | Aucun équivalent Android réalisé |
| Contrat `WidgetState` dupliqué TypeScript / Swift | Pas de génération de code ; toute évolution se fait des deux côtés |
| Pas de tests avec lecteur d'écran réel | Vérification automatique et revue de code seulement ; écart publié dans la déclaration |
| Tests d'accessibilité sur Chromium seul | Un seul moteur en CI |

### 14.2 Points de vigilance

- Toute nouvelle couleur doit passer par les jetons de thème et être vérifiée en clair **et** en sombre.
- Tout nouveau texte doit exister dans les sept dictionnaires, sous peine d'erreur de compilation.
- Toute nouvelle alerte doit exister à la fois en son Web Audio et en notification native, sans
  quoi le comportement diffère selon que l'application est au premier plan ou non.
- Tout nouvel état de session doit être porté par `SessionService`, jamais par un composant de page.

### 14.3 Évolutions envisageables

Export et import des données · widget Android · audit manuel complet avec lecteur d'écran et
agrandissement à 200 % · mesure du contraste des éléments non textuels sur le rendu · extension
des tests d'accessibilité à d'autres moteurs et à d'autres langues, dont l'arabe en RTL.
