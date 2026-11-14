# Document d'exigences techniques (TRD)

## Plateformes et compatibilité

| Cible       | Exigence                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Navigateurs | Navigateurs modernes supportant Web Audio et les propriétés logiques CSS                           |
| iOS         | iOS 15 ou plus                                                                                     |
| Android     | Notifications à canaux ; la permission d'alarme exacte peut être nécessaire à partir d'Android 12  |
| macOS, Windows | Application Electron : DMG macOS (Apple Silicon) et installeur Windows x64 |
| Écrans      | Conception mobile d'abord ; thème clair et sombre ; sens d'écriture gauche→droite et droite→gauche |

## Technologies

| Domaine               | Choix                         | Version                        | Rôle                                                          |
| --------------------- | ----------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Framework             | Angular (standalone, signaux) | 22                             | Composants, routage, réactivité                               |
| Langage               | TypeScript                    | 6                              | Typage strict du domaine                                      |
| Flux asynchrones      | RxJS                          | 7.8                            | Ticks du décompte                                             |
| Styles                | Tailwind CSS + PostCSS        | 4 / 8                          | Utilitaires, jetons de thème                                  |
| Natif                 | Capacitor                     | 8                              | Pont web ↔ iOS / Android                                      |
| Bureau                | Electron, electron-builder    | 44 / 26                        | Application macOS et Windows |
| Widget Android        | Java, `AppWidgetProvider`     | Android 7+ (API 24)            | Widget d'écran d'accueil                                      |
| Tests unitaires       | Karma + Jasmine               | 6 / 7                          | Outillage en place, **aucune spécification écrite à ce jour** |
| Tests d'accessibilité | Playwright + axe-core         | 1.63 / 4.13                    | Non-régression RGAA / WCAG                                    |
| Exécution             | Node.js                       | ^24.15.0 (`engines`, `.nvmrc`) | Outillage et scripts                                          |

Plugins Capacitor : `@capacitor/app`, `@capacitor/local-notifications`, `@capacitor/haptics`,
`@capacitor/filesystem`, `@capacitor-community/keep-awake`, plus les plugins locaux Android `WidgetBridge` et `LiveStatus`.

## Intégration native

### Notifications locales

| Plateforme | Mise en œuvre                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| iOS        | L'application écrit elle-même les WAV dans `Library/Sounds` au lancement, via `@capacitor/filesystem`                 |
| Android    | `make sounds` copie les WAV dans `android/app/src/main/res/raw` ; l'application crée un canal de notification par son |

⚠️ **Un canal Android est immuable.** Son son est fixé à sa création : le recréer ne le change
pas. Un canal né d'un build fait **avant** `make sounds` pointe vers une ressource `raw`
absente et reste muet pour toujours sur cette installation - la notification s'affiche, sans
un bruit. D'où `CHANNEL_VERSION` dans `notification.service.ts` : les identifiants portent
`_v<n>`, et l'incrémenter crée des canaux neufs en supprimant les précédents (`deleteChannel`),
pour ne pas laisser deux fois les mêmes intitulés dans les réglages du téléphone.

Ce qui est figé mérite d'être précis, sous peine de bumper pour rien : le canal retient une
**URI**, `android.resource://<package>/raw/<nom>` (voir `SoundResolver` côté plugin), un renvoi
par nom résolu à la lecture.

| Ce qui change                                         | Bump de `CHANNEL_VERSION` ?                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Le **contenu** d'un WAV (niveau, timbre, motif)       | Non - réinstaller l'APK suffit, l'URI désigne toujours la même ressource |
| Le **nom** d'un fichier, ou le son associé à un canal | Oui                                                                      |
| L'**importance** ou la vibration d'un canal           | Oui                                                                      |
| Un canal créé alors que la ressource `raw` manquait   | Oui - il est muet à vie                                                  |

**Deux flux audio, deux volumes.** Le canal est créé avec `USAGE_NOTIFICATION` et
`CONTENT_TYPE_SONIFICATION` : les notifications suivent donc le volume **notifications** d'Android,
tandis que les sons joués par l'application au premier plan passent par Web Audio, donc par le
volume **multimédia**. Les deux curseurs sont indépendants, et l'application ne choisit ni l'un
ni l'autre. C'est la première chose à écarter devant un rapport de son trop faible - la seconde
étant le niveau des motifs eux-mêmes (voir « Sons » du [Design UI/UX](07_UI_UX_DESIGN.md)).

Les alertes (paliers, fin, fin de prolongation, fin de la session enchaînée) sont programmées au
passage en arrière-plan et annulées au retour. Pendant une routine, c'est l'étape suivante qui
nomme la notification de fin (« Place à : Petit-déjeuner »), et aucune prolongation n'est
programmée (RG-17). Sur Android 12+, les alarmes exactes peuvent
requérir `SCHEDULE_EXACT_ALARM` dans `AndroidManifest.xml`. Aucun effet dans le navigateur.

**Trois durées de vie cohabitent**, et la distinction est vitale :

|                   | Alertes de session                | Rappels de routine          | Notification de test |
| ----------------- | --------------------------------- | --------------------------- | -------------------- |
| **Ids**           | < 1000 (`REMINDER_ID_BASE`)       | ≥ 1000                      | 2000 (`TEST_ID`)     |
| **Programmation** | au passage en arrière-plan        | à chaque changement         | à la demande         |
| **Annulation**    | toutes, au retour au premier plan | jamais, sauf en bloc        | jamais               |
| **Forme**         | `schedule.at`, ponctuelle         | `schedule.on`, hebdomadaire | `schedule.at`, à 5 s |

- **Programmation** - les rappels sont réécrits à chaque changement de routine, de langue ou du
  réglage *Son* ; la notification de test part depuis les réglages.
- **Annulation** - ni le retour au premier plan, ni la réécriture des rappels n'atteignent la
  notification de test (RG-30). Les rappels ne sont annulés que par une reprogrammation en bloc.
- **Forme** - `schedule.on` fonctionne façon cron (un jour, une heure) ; le test part à
  `TEST_DELAY_SECONDS` (5 s).

`cancelPending()` filtre donc sur cette borne : sans ce filtre, le premier retour au premier plan
effacerait tous les rappels (RG-22). Les jours sont convertis d'ISO 8601 vers la numérotation de
Capacitor, qui compte à partir du dimanche. Android replace les rappels après un redémarrage
(`LocalNotificationRestoreReceiver`), iOS les garde dans le centre de notifications.

L'appui sur un rappel est reçu par `localNotificationActionPerformed` : `extra.routineId` remonte
jusqu'à `SessionService`, qui **arme** la routine sans la démarrer (RG-21).

### Notification de test et alarmes exactes

Autorisation, canal, son, affichage écran verrouillé : la chaîne ne se vérifie pas autrement
qu'en la parcourant. `sendTest()` programme donc une notification à cinq secondes - le délai
est le test lui-même, il laisse le temps de verrouiller l'écran. Le résultat rendu à l'appelant
(`TestResult`) distingue ce qui s'est passé : `scheduled`, `inexact` (programmée, mais l'appareil
ne garantit pas l'heure), `denied`, `unsupported` (navigateur : `Capacitor.isNativePlatform()`
est faux, il n'y a rien à tester) et `failed`. L'onglet *Réglages* affiche cette issue dans une
région `aria-live="polite"`, à côté du bouton.

`openExactAlarmSettings()` ouvre l'écran système « Alarmes et rappels » via
`changeExactNotificationSetting()`. Android seulement : avant Android 12 la permission n'existe
pas et le plugin répond « accordé » sans rien ouvrir, ailleurs l'appel lèverait - d'où
`unsupported`, qui ne ment pas sur la raison. À savoir : passer d'accordé à refusé depuis cet
écran fait **redémarrer l'application** et efface les alarmes exactes déjà programmées ; c'est
le système qui l'impose. Au retour, le test reste à refaire : c'est lui qui juge, pas la
permission.

### Décompte permanent hors de l'app

Le widget attend qu'on aille le voir ; celui-ci se pose sur l'écran verrouillé. Une seule
méthode côté web - `LiveStatusService.update()` - reçoit **le même état que le widget**, au
même moment. Elle n'agit que sur Android : iOS n'a ni widget ni Live Activity.

|                 | Android                                                     |
| --------------- | ----------------------------------------------------------- |
| Forme           | Notification permanente (`LiveStatusPlugin.java`, id 3000)  |
| Secondes        | `setUsesChronometer` + `setChronometerCountDown` (API 24)   |
| Cadran          | absent : une notification n'a pas d'image vivante           |
| Canal / réglage | canal `ongoing_v1`, importance basse, sans son ni vibration |

**Elle informe, elle n'alerte pas** : sans cela, le décompte permanent couvrirait les paliers,
qui eux doivent s'entendre. D'où un canal muet et `setOnlyAlertOnce(true)`, qui empêche chaque
réécriture de rejouer l'arrivée de la notification.

### Widget Android d'écran d'accueil

- Écrit en Java (`android/app/src/main/java/.../`) : le module `app` n'a pas le plugin Kotlin,
  et le widget ne valait pas de toucher au Gradle.
- Transport : plugin Capacitor **local** `WidgetBridge` (`WidgetBridgePlugin.java`), enregistré
  dans `MainActivity`, qui écrit l'état JSON dans `SharedPreferences` et demande à
  `AppWidgetManager` de redessiner - même processus.
- Le widget décompte seul entre deux mises à jour ; l'application ne pousse un état qu'aux
  changements (démarrage, pause, fin, arrière-plan, objectif, langue, thème, durée réglée)
  et seulement si le JSON diffère.
- Le contrat de données est le type `WidgetState` côté TypeScript et `WidgetState.java` côté
  Java : **toute évolution doit être faite des deux côtés**.

**Le widget montre le cadran, pas un résumé du cadran.** Un widget ne sait pas exécuter de vue
à lui : `DialBitmap` peint le cadran dans un `Bitmap` - second port de la géométrie de
`dial-geometry.ts` - que `RemoteViews` affiche. La largeur du widget choisit la disposition
(`widget_pomodoro` sous 220 dp, `widget_pomodoro_wide` au-dessus), faute de `RemoteViews`
multi-tailles avant l'API 31.

| Aspect     | Android                                                       |
| ---------- | ------------------------------------------------------------- |
| Dessin     | `Canvas` sur un `Bitmap` (320 px au plus : il voyage par IPC) |
| Secondes   | `Chronometer` en mode compte à rebours (API 24)               |
| Graduation | une alarme `AlarmManager` par minute                          |
| Transport  | `SharedPreferences` + `AppWidgetManager` (même processus)     |

**Deux horloges, et c'est ce qui rend le widget tenable pour la batterie** : le chronomètre
égrène les secondes sans que rien ne le réveille, et l'alarme ne redessine le cadran qu'au
changement de graduation - une minute, ou cinq secondes sur un cadran gradué en secondes.
Le décompte arrêté, l'alarme est annulée : un cadran figé n'a aucune raison de réveiller le
téléphone. `updatePeriodMillis` vaut donc **0** : le système ne réveille rien de lui-même.

Sur Android 12+, l'alarme exacte dépend d'« Alarmes et rappels » ; refusée, le widget retombe
sur une alarme ordinaire et retarde un peu, il ne s'arrête pas. Avant Android 12 - donc sur
Android 9 - la question ne se pose pas : l'alarme exacte est accordée d'office.

### Identité de l'application

`appId` : `com.maximejolivet.pomodorotdah` · `appName` : Pomodoro Accessibilité · `webDir` : `www`.
Icônes et écrans de lancement des deux plateformes sont générés par `make icons`
(`scripts/generate-icons.ts`, rendu par Chromium) depuis `resources/app-icon.svg` et
`resources/app-icon-foreground.svg` - voir « Guide du build mobile », ci-dessous.

### Application de bureau (Electron)

L'application tourne aussi sur macOS et Windows, dans une fenêtre Electron (`electron/`) qui charge le build web (`dist/pomodoro-tdah/browser`).

- **Fenêtre** : 1100 × 800 par défaut, 360 × 600 au minimum. `contextIsolation` est actif et `nodeIntegration` coupé ; les liens externes s'ouvrent dans le navigateur par défaut.
- **Passerelle** : `electron/preload.js` n'expose à la page que `window.electronAPI` : la plateforme et les fonctions de notification (programmer, tout annuler, rappels, test, clic en attente, changement d'état).
- **État de l'application** : la fenêtre est « en arrière-plan » quand elle perd le focus, est réduite ou cachée. Les alertes de session prennent alors le relais, comme avec Capacitor.
- **Notifications** (`electron/notifications.js`) : échéances vérifiées une fois par seconde ; sons système macOS `Glass` (fin de session) et `Ping` (paliers) ; rappels hebdomadaires de routine ; notification de test au bout de cinq secondes ; un clic sur un rappel ramène la fenêtre au premier plan et prévient la page.
- **Livraison** : `electron-builder` produit un DMG macOS (Apple Silicon) et un installeur Windows NSIS x64 dans `release/`. Les installeurs ne sont pas signés : macOS demande une confirmation au premier lancement, Windows SmartScreen avertit.

## Guide du build mobile

```bash
make ios          # première fois seulement
make open-ios     # build + sync + Xcode

make android      # première fois seulement
make open-android # build + sync + Android Studio
```

### Notifications : mise en place, sons et canaux

L'autorisation est demandée au premier démarrage du minuteur, et au premier rappel réglé.
Les alertes (paliers, fin, fin de prolongation, fin de la session enchaînée) sont programmées
quand l'app passe en arrière-plan et annulées au retour, là où les sons de l'app prennent le
relais.

#### Rappels de routine

Une routine peut porter une heure et des jours (⚙︎ → Modes → *Routines* → crayon → *Rappel*).
Ils suivent une autre vie que les alertes de session :

- ils se programment en `schedule.on` (façon cron : un jour, une heure), donc se répètent
  chaque semaine sans que l'app ait à s'exécuter ;
- leurs identifiants partent de 1000, ce qui les met **hors de portée** de l'annulation faite
  à chaque retour au premier plan - sans cela, ouvrir l'app une fois effacerait les rappels ;
- Android les replace après un redémarrage de l'appareil, iOS les garde dans le centre de
  notifications ;
- l'appui ouvre l'app avec la routine armée sur le cadran : rien ne démarre tout seul.

Ils empruntent le carillon de fin, faute de son propre à ce jour.

#### Sons des notifications

Ils sont générés à partir des mêmes motifs que l'app (`src/app/core/helpers/sound-patterns.ts`) :

- **iOS** : l'app écrit elle-même les WAV dans `Library/Sounds` au lancement, rien à faire ;
- **Android** : `make sounds` (appelé par `make sync`) copie les WAV dans
  `android/app/src/main/res/raw`, et l'app crée un canal de notification par son.

Les WAV sortent à une crête de −1 dBFS, la même pour les quatre. C'est volontaire et c'est le
niveau attendu d'un son d'alerte : l'appareil ne fait que **réduire** ce qu'on lui donne, donc un
fichier rendu à mi-échelle arrive irrémédiablement discret, quel que soit le volume réglé. Voir
[« Sons » du Design UI/UX](07_UI_UX_DESIGN.md).

#### Deux volumes à ne pas confondre

Un son de l'app et un son de notification ne passent pas par le même curseur, et c'est la première
chose à vérifier quand « les sons ne sont pas forts » :

| Ce qui joue                                                | Flux Android                        | Réglage                  |
| ---------------------------------------------------------- | ----------------------------------- | ------------------------ |
| Les sons de l'app, au premier plan (Web Audio)             | média                               | Volume **multimédia**    |
| Les notifications, app en arrière-plan ou écran verrouillé | notification (`USAGE_NOTIFICATION`) | Volume **notifications** |

Un multimédia à 20 % garde donc les paliers discrets pendant une session, même si les
notifications, elles, sonnent fort. L'app n'y peut rien : c'est le système qui choisit le flux
d'un son, pas elle.

#### Canaux Android : ce qui est immuable et ce qui ne l'est pas

Un canal de notification est **immuable** après sa création : le recréer ne change ni son
importance ni son son. D'où `CHANNEL_VERSION` dans `notification.service.ts`, qu'il faut
incrémenter pour repartir de canaux neufs (les précédents sont alors supprimés, sinon
l'utilisateur verrait deux fois les mêmes intitulés dans les réglages du téléphone).

Ce qui est figé est l'URI, `android.resource://<package>/raw/<nom>` - un renvoi par **nom**,
résolu à la lecture. **Remplacer le contenu d'un WAV ne demande donc aucun bump** : il suffit de
réinstaller l'APK. Ce qui en demande un, c'est renommer un fichier, changer le son associé à un
canal, ou toucher à son importance.

#### Alarmes exactes et test d'une notification

Sur Android 12+, les alarmes exactes peuvent nécessiter la permission
`SCHEDULE_EXACT_ALARM` dans `AndroidManifest.xml`. L'app n'attend pas la fin d'une session pour
le dire : ⚙︎ → *Réglages* → **Tester une notification** en programme une à cinq secondes - le
temps de verrouiller l'écran - et nomme ce qui manque le cas échéant (autorisation refusée,
alarme exacte absente). Le lien **Autoriser les alarmes exactes** ouvre l'écran système
« Alarmes et rappels » ; sur iOS et dans le navigateur, il annonce que cet écran n'existe pas.

⚠️ Passer d'accordé à refusé depuis cet écran fait **redémarrer l'application** et efface les
alarmes exactes déjà programmées : c'est le système Android qui l'impose, pas l'app.

### Icônes et écrans de lancement

Deux SVG, une commande :

- `resources/app-icon.svg` - l'icône entière, boîtier compris, plein cadre : c'est le système
  qui arrondit les coins (iOS) ;
- `resources/app-icon-foreground.svg` - le cadran seul, sans boîtier, sur fond transparent. Il
  sert à l'icône adaptative d'Android, dont le fond est une couleur (`ic_launcher_background`,
  le bleu du boîtier) et la forme est découpée par le lanceur, et aux écrans de lancement
d'Android.

`make icons` produit tout d'un coup, en passant par Chromium - le même moteur que celui qui
affiche l'app, donc les dégradés et le `mix-blend-mode` du cadran sortent identiques :

| Sortie             | Détail                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| iOS, icône         | `AppIcon-512@2x.png` (1024 px, sans canal alpha : l'App Store le refuse)         |
| iOS, lancement     | rien de généré : `LaunchScreen.storyboard` pose `BootLogo.imageset` (de `favicon.svg`) |
| Android, icônes    | `ic_launcher`, `ic_launcher_round` et `ic_launcher_foreground` sur cinq densités |
| Android, lancement | `splash.png`, portrait et paysage, sur cinq densités                             |
| Web                | `public/apple-touch-icon.png` (180 px)                                           |

Le dessin de l'avant-plan tient dans un disque de 63 unités sur les 108 de la toile, donc à
l'intérieur des 66 unités sûres : aucun masque de lanceur, si serré soit-il, ne mord sur
l'anneau. À vérifier si l'on retouche le SVG.

#### L'ouverture, en trois temps

Sur **iOS** l'ouverture est beige : la même couleur (`#f5f2ea`) sert à l'écran de lancement, à la
WebView et à la page, pour qu'aucune page blanche ne s'affiche pendant le chargement de l'app.

1. **L'écran de lancement du système** (`LaunchScreen.storyboard`) - une image fixe : le logo
   (`BootLogo`, 96 pt) centré sur le beige.
2. **L'écran d'amorçage** - le même logo, centré et de même taille, avec la version de l'app en
   dessous (`v1.0`, lue dans `MARKETING_VERSION`). Une vue native (`SceneDelegate.swift`) recouvre
   la WebView jusqu'à ce que la page ait chargé ; dessous, `src/index.html` affiche déjà le même
   logo et la même version en SVG et CSS en ligne, donc le relais se fait sans saut. La page
   apprend la version par `AppBridgeViewController`. Angular remplace le contenu de `<app-root>`
   dès qu'il démarre.
3. **L'application**, qui reprend son propre thème.

Le logo pulse doucement ; sous `prefers-reduced-motion` il reste immobile. Le fond de la WebView
se règle dans `capacitor.config.ts` (`ios.backgroundColor`) ; la page passe d'elle-même sur un fond
sombre quand le thème sombre est actif.

Sur **Android**, l'écran de lancement ne change pas : noir, avec le cadran (`splash.png`). Sur
Android 12 et au-delà, le système impose son propre écran ; `values-v31/styles.xml` lui donne le
même noir et la même icône, pour que toutes les versions ouvrent pareil. L'écran d'amorçage de la
page (le logo, sans la version) prend ensuite le relais.

## Installation et commandes

**Prérequis :** Node.js 24.15+ (voir `.nvmrc`) · npm 10+ · Xcode (iOS) · Android Studio (Android)

```bash
git clone <url-du-repo> pomodoro-tdah
cd pomodoro-tdah
make install   # npm install
make dev       # http://localhost:4200
```

### Commandes `make`

Lancer `make` seul affiche l'aide.

| Commande                              | Rôle                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `make install`                        | Installe les dépendances                                                           |
| `make dev`                            | Serveur de dev avec rechargement à chaud                                           |
| `make build`                          | Build de production                                                                |
| `make watch`                          | Build de dev en continu                                                            |
| `make test`                           | Tests unitaires (Karma / Jasmine) - aucune spécification à ce jour                 |
| `make test-a11y`                      | Tests d'accessibilité (axe-core + clavier, via Playwright)                         |
| `make sync`                           | Build, copie dans `www/`, `npx cap sync`, puis `make sounds`                       |
| `make sounds`                         | Génère les sons de notification (WAV, crête à −1 dBFS) et les copie dans `res/raw` |
| `make icons`                          | Génère icônes et écrans de lancement (iOS, Android, web) depuis `resources/*.svg`  |
| `make ios` / `make android`           | Ajoute la plateforme native (une seule fois)                                       |
| `make open-ios` / `make open-android` | Sync puis ouvre Xcode / Android Studio                                             |
| `make electron-dev`                   | Build puis lance l'app Electron (macOS)                                            |
| `make electron-dmg` / `electron-win`  | Génère le DMG macOS / l'installeur Windows x64 dans `release/`                     |
| `make clean`                          | Supprime `dist/`, `www/`, `release/` et le cache Angular                                       |

La première exécution de `make test-a11y` demande le navigateur de test :
`npx playwright install chromium`. Les mêmes tests tournent en CI à chaque push
(`.github/workflows/a11y.yml`).

## Build, exécution et intégration continue

### Commandes

Le `Makefile` est le point d'entrée (`make` seul affiche l'aide) : `install`, `dev`, `build`,
`watch`, `test`, `sync`, `sounds`, `icon`, `ios`, `android`, `open-ios`, `open-android`, `clean`.
Les scripts npm correspondants sont `start`, `build`, `watch`, `test`, `test:a11y`.

### Build web

- Builder `@angular-devkit/build-angular:application`, sortie `dist/pomodoro-tdah`.
- Production : hachage des noms de fichiers, budgets **500 ko / 1 Mo** pour le bundle initial et
  **24 ko / 32 ko** par feuille de style de composant.
- Développement : optimisation désactivée, *source maps*.
- Les fichiers de `public/` sont copiés tels quels (favicons, icône Apple).

### Chaîne mobile

`make sync` : build → copie de `dist/pomodoro-tdah/browser` dans `www/` → `npx cap sync` →
`make sounds` (génération des WAV et copie dans `res/raw` si le dossier Android existe).
`make open-ios` / `make open-android` enchaînent `sync` puis l'ouverture de l'IDE natif.

### Intégration continue

Workflow GitHub Actions `.github/workflows/a11y.yml`, déclenché sur les poussées vers `main` et
sur chaque demande de fusion, avec deux jobs sur `ubuntu-latest` :

1. **Build de production** - `npm ci` puis `npm run build`.
2. **Non-régression d'accessibilité** - installation de Chromium par Playwright, `npm run test:a11y`,
   puis dépôt du rapport Playwright en artefact (7 jours de rétention).

La version de Node vient de `.nvmrc` ; le cache npm est activé.

### Déploiement

Le build web est un ensemble de fichiers statiques : n'importe quel hébergement statique convient,
sans variable d'environnement ni service annexe. Les versions mobiles sont produites depuis Xcode
et Android Studio. Il n'existe pas de versions publiées : seule la dernière version de `main` est
maintenue.

## Sécurité et confidentialité

- **Surface d'attaque réduite** : aucun serveur, aucune requête sortante, aucune authentification,
  aucune donnée quittant l'appareil.
- Les seules données stockées sont les préférences, les modes et l'historique, dans le stockage
  local, sans donnée personnelle identifiante.
- Signalement d'une vulnérabilité : **pas d'issue publique** ; utiliser le signalement privé
  GitHub (onglet *Security* → *Report a vulnerability*). Voir `SECURITY.md`.
- Seule la dernière version de `main` reçoit des correctifs.
- Côté natif : permissions limitées aux notifications locales, à l'haptique, au maintien d'écran
  et à l'écriture des sons dans le conteneur de l'application.

## Performance et robustesse

| Réf.      | Exigence                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------- |
| ENF-PER-1 | Budget du bundle initial : alerte à 500 ko, erreur à 1 Mo.                                        |
| ENF-PER-2 | Les deux pages sont chargées à la demande : la page d'accessibilité ne pèse pas sur le démarrage. |
| ENF-PER-3 | La précision du décompte ne dépend pas de la régularité des ticks du navigateur.                  |
| ENF-PER-4 | Une session en cours survit à la navigation entre les deux pages.                                 |
| ENF-PER-5 | Un service indisponible ne bloque jamais l'application.                                           |

**ENF-PER-5** - stockage, notifications, haptique ou maintien d'écran.

## Décisions techniques clés et compromis

### Limites assumées

| Limite                                            | Raison                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Historique plafonné à 500 sessions                | Taille de `localStorage` ; au-delà, l'intérêt statistique est marginal                 |
| Pas d'export de données par l'utilisateur         | Non spécifié à ce jour                                                                 |
| Ni widget ni décompte permanent sur iOS           | Retirés ; seul Android les a                                                           |
| Contrat `WidgetState` dupliqué TypeScript / Java  | Pas de génération de code ; toute évolution se fait des deux côtés                     |
| Pas de tests avec lecteur d'écran réel            | Vérification automatique et revue de code seulement ; écart publié dans la déclaration |
| Tests d'accessibilité sur Chromium seul           | Un seul moteur en CI                                                                   |

### Points de vigilance

- Toute nouvelle couleur doit passer par les jetons de thème et être vérifiée en clair **et** en sombre.
- Tout nouveau texte doit exister dans les sept dictionnaires, sous peine d'erreur de compilation.
- Toute nouvelle alerte doit exister à la fois en son Web Audio et en notification native, sans
  quoi le comportement diffère selon que l'application est au premier plan ou non.
- Tout nouvel état de session doit être porté par `SessionService`, jamais par un composant de page.

### Évolutions envisageables

Export et import des données · audit manuel complet avec lecteur d'écran et
agrandissement à 200 % · mesure du contraste des éléments non textuels sur le rendu · extension
des tests d'accessibilité à d'autres moteurs et à d'autres langues, dont l'arabe en RTL ·
banque de pictogrammes ARASAAC en complément des emoji, pour les usages de CAA (communication
alternative et améliorée) où les symboles sont déjà ceux de la personne.

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# Technical Requirements Document (TRD)

## Platforms and compatibility

| Target   | Requirement                                                                                   |
| -------- | --------------------------------------------------------------------------------------------- |
| Browsers | Modern browsers supporting Web Audio and CSS logical properties                               |
| iOS      | iOS 15 or later                                                                               |
| Android  | Channel-based notifications; the exact alarm permission may be required from Android 12       |
| macOS, Windows | Electron app: macOS DMG (Apple Silicon) and Windows x64 installer |
| Screens  | Mobile-first design; light and dark themes; left-to-right and right-to-left writing direction |

## Technologies

| Area                 | Choice                        | Version                        | Role                                                   |
| -------------------- | ----------------------------- | ------------------------------ | ------------------------------------------------------ |
| Framework            | Angular (standalone, signals) | 22                             | Components, routing, reactivity                        |
| Language             | TypeScript                    | 6                              | Strict typing of the domain                            |
| Asynchronous streams | RxJS                          | 7.8                            | Countdown ticks                                        |
| Styles               | Tailwind CSS + PostCSS        | 4 / 8                          | Utilities, theme tokens                                |
| Native               | Capacitor                     | 8                              | Web ↔ iOS / Android bridge                             |
| Desktop              | Electron, electron-builder    | 44 / 26                        | macOS and Windows app |
| Android widget       | Java, `AppWidgetProvider`     | Android 7+ (API 24)            | Home screen widget                                     |
| Unit tests           | Karma + Jasmine               | 6 / 7                          | Tooling in place, **no specification written to date** |
| Accessibility tests  | Playwright + axe-core         | 1.63 / 4.13                    | RGAA / WCAG regression testing                         |
| Runtime              | Node.js                       | ^24.15.0 (`engines`, `.nvmrc`) | Tooling and scripts                                    |

Capacitor plugins: `@capacitor/app`, `@capacitor/local-notifications`, `@capacitor/haptics`,
`@capacitor/filesystem`, `@capacitor-community/keep-awake`, plus the local Android plugins `WidgetBridge` and `LiveStatus`.

## Native integration

### Local notifications

| Platform | Implementation                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | The application itself writes the WAV files into `Library/Sounds` at launch, via `@capacitor/filesystem`                           |
| Android  | `make sounds` copies the WAV files into `android/app/src/main/res/raw`; the application creates one notification channel per sound |

⚠️ **An Android channel is immutable.** Its sound is fixed at creation: recreating it does not change it. A channel
born from a build made **before** `make sounds` points to a missing `raw` resource and stays silent for ever on that
installation - the notification appears, without a sound. Hence `CHANNEL_VERSION` in `notification.service.ts`: the
identifiers carry `_v<n>`, and incrementing it creates new channels while deleting the previous ones (`deleteChannel`),
so that the same names do not appear twice in the phone's settings.

What is fixed deserves to be precise, lest one bumps for nothing: the channel retains a **URI**,
`android.resource://<package>/raw/<name>` (see `SoundResolver` on the plugin side), a reference by name resolved at
playback.

| What changes                                               | Bump `CHANNEL_VERSION`?                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| The **content** of a WAV file (level, timbre, pattern)     | No - reinstalling the APK is enough, the URI still designates the same resource |
| The **name** of a file, or the sound attached to a channel | Yes                                                                             |
| The **importance** or the vibration of a channel           | Yes                                                                             |
| A channel created while the `raw` resource was missing     | Yes - it is silent for ever                                                     |

**Two audio streams, two volumes.** The channel is created with `USAGE_NOTIFICATION` and
`CONTENT_TYPE_SONIFICATION`: notifications therefore follow Android's **notification** volume, whereas the sounds played
by the application in the foreground go through Web Audio, and so through the **media** volume. The two sliders are
independent, and the application chooses neither. This is the first thing to rule out when a sound report says it is too
quiet - the second being the level of the patterns themselves (see "Sounds" in the [UI/UX design](07_UI_UX_DESIGN.md)).

The alerts (milestones, end, end of extension, end of the chained session) are scheduled when the app goes to the
background and cancelled on return. During a routine, it is the next step that names the end notification ("Next up:
Breakfast"), and no extension is scheduled (RG-17). On Android 12+, exact alarms may require `SCHEDULE_EXACT_ALARM`
in `AndroidManifest.xml`. No effect in the browser.

**Three lifetimes coexist**, and the distinction is vital:

|                  | Session alerts                           | Routine reminders     | Test notification        |
| ---------------- | ---------------------------------------- | --------------------- | ------------------------ |
| **Ids**          | < 1000 (`REMINDER_ID_BASE`)              | ≥ 1000                | 2000 (`TEST_ID`)         |
| **Scheduling**   | on going to the background               | on every change       | on demand                |
| **Cancellation** | all of them, on return to the foreground | never, except in bulk | never                    |
| **Form**         | `schedule.at`, one-off                   | `schedule.on`, weekly | `schedule.at`, after 5 s |

- **Scheduling** - the reminders are rewritten on every change to a routine, the language or the *Sound* setting;
  the test notification is sent from the settings.
- **Cancellation** - neither the return to the foreground nor the rewriting of the reminders reaches the test
  notification (RG-30). The reminders are cancelled only by a bulk rescheduling.
- **Form** - `schedule.on` works like cron (a day, an hour); the test fires at `TEST_DELAY_SECONDS` (5 s).

`cancelPending()> therefore filters on this boundary: without that filter, the first return to the foreground would
erase every reminder (RG-22). The days are converted from ISO 8601 to Capacitor's numbering, which counts from Sunday.
Android reschedules the reminders after a restart (`LocalNotificationRestoreReceiver`); iOS keeps them in the
notification centre.

A tap on a reminder is received by `localNotificationActionPerformed`: `extra.routineId` goes up to `SessionService`,
which **arms** the routine without starting it (RG-21).

### Test notification and exact alarms

Authorisation, channel, sound, display on the locked screen: the chain can only be verified by walking through it.
`sendTest()` therefore schedules a notification five seconds ahead - the delay is the test itself, it leaves time to
lock the screen. The result returned to the caller (`TestResult`) distinguishes what happened: `scheduled`, `inexact`
(scheduled, but the device does not guarantee the time), `denied`, `unsupported` (browser: `Capacitor.isNativePlatform()`
is false, there is nothing to test) and `failed`. The *Settings* tab shows this outcome in an
`aria-live="polite"` region, next to the button.

`openExactAlarmSettings()` opens the system screen "Alarms & reminders" through `changeExactNotificationSetting()`.
Android only: before Android 12 the permission does not exist and the plugin answers "granted" without opening anything,
elsewhere the call would throw - hence `unsupported`, which does not lie about the reason. Note that switching from granted
to refused on this screen **restarts the application** and erases the exact alarms already scheduled; this is imposed by
the system. On return, the test must be run again: it is the test that judges, not the permission.

### Persistent countdown outside the app

The widget waits for you to look at it; this one sits on the locked screen. A single method on the web side -
`LiveStatusService.update()` - receives **the same state as the widget**, at the same moment. It is active on Android
only: iOS has neither a widget nor a Live Activity.

|                   | Android                                                     |
| ----------------- | ----------------------------------------------------------- |
| Form              | Permanent notification (`LiveStatusPlugin.java`, id 3000)   |
| Seconds           | `setUsesChronometer` + `setChronometerCountDown` (API 24)   |
| Dial              | absent: a notification has no live image                    |
| Channel / setting | channel `ongoing_v1`, low importance, no sound or vibration |

**It informs, it does not alert**: otherwise the persistent countdown would cover the milestones, which must be heard.
Hence a silent channel and `setOnlyAlertOnce(true)`, which prevents each rewrite from replaying the arrival of the
notification.

### Android home screen widget

- Written in Java (`android/app/src/main/java/.../`): the `app` module does not have the Kotlin plugin, and the widget was
  not worth touching the Gradle setup.
- Transport: local Capacitor plugin `WidgetBridge` (`WidgetBridgePlugin.java`), registered in `MainActivity`, which writes
  the JSON state into `SharedPreferences` and asks `AppWidgetManager` to redraw - same process.
- The widget counts down on its own between two updates; the application pushes a state only on changes (start,
  pause, end, background, goal, language, theme, set duration) and only if the JSON differs.
- The data contract is the type `WidgetState` on the TypeScript side and `WidgetState.java` on the Java side: **any change
  must be made on both sides**.

**The widget shows the dial, not a summary of it.** A widget cannot run a view of its own: `DialBitmap` paints the dial into
a `Bitmap` - a second port of the geometry of `dial-geometry.ts` - which `RemoteViews` displays. The width of the widget
selects the layout (`widget_pomodoro` below 220 dp, `widget_pomodoro_wide` above), since multi-size `RemoteViews` do not
exist before API 31.

| Aspect     | Android                                                    |
| ---------- | ---------------------------------------------------------- |
| Drawing    | `Canvas` on a `Bitmap` (320 px at most: it travels by IPC) |
| Seconds    | `Chronometer` in countdown mode (API 24)                   |
| Graduation | one `AlarmManager` alarm per minute                        |
| Transport  | `SharedPreferences` + `AppWidgetManager` (same process)    |

**Two clocks, and this is what makes the widget sustainable for the battery**: the chronometer ticks the seconds without
anything waking it, and the alarm redraws the dial only when the graduation changes - a minute, or five seconds on a dial
graduated in seconds. When the countdown stops, the alarm is cancelled: a frozen dial has no reason to wake the phone.
`updatePeriodMillis` is therefore **0**: the system wakes nothing by itself.

On Android 12+, the exact alarm depends on "Alarms & reminders"; if refused, the widget falls back to an ordinary alarm and
is a little late, it does not stop. Before Android 12 - so on Android 9 - the question does not arise: the exact alarm is
granted by default.

### Application identity

`appId`: `com.maximejolivet.pomodorotdah` · `appName`: Pomodoro Accessibilité · `webDir`: `www`.
The icons and launch screens of both platforms are generated by `make icons` (`scripts/generate-icons.ts`, rendered by Chromium)
from `resources/app-icon.svg` and `resources/app-icon-foreground.svg` - see "Mobile build guide", below.

### Desktop app (Electron)

The application also runs on macOS and Windows, in an Electron window (`electron/`) that loads the web build (`dist/pomodoro-tdah/browser`).

- **Window**: 1100 × 800 by default, 360 × 600 at the least. `contextIsolation` is on and `nodeIntegration` off; external links open in the default browser.
- **Bridge**: `electron/preload.js` exposes only `window.electronAPI` to the page: the platform and the notification functions (schedule, cancel all, reminders, test, pending tap, state change).
- **Application state**: the window is "in the background" when it loses focus, is minimised or hidden. Session alerts then take over, as with Capacitor.
- **Notifications** (`electron/notifications.js`): deadlines checked once per second; macOS system sounds `Glass` (end of session) and `Ping` (milestones); weekly routine reminders; a test notification after five seconds; a click on a reminder brings the window to the front and tells the page.
- **Delivery**: `electron-builder` produces a macOS DMG (Apple Silicon) and a Windows NSIS x64 installer in `release/`. The installers are not signed: macOS asks for a confirmation on first launch, Windows SmartScreen warns.

## Mobile build guide

```bash
make ios          # first time only
make open-ios     # build + sync + Xcode

make android      # first time only
make open-android # build + sync + Android Studio
```

### Notifications: setup, sounds and channels

Permission is requested the first time the timer starts, and the first time a reminder is set.
Alerts (milestones, end, end of extension, end of the chained session) are scheduled when the app
goes to the background and cancelled on return, where the app's sounds take over.

#### Routine reminders

A routine can carry a time and days (⚙︎ → Modes → *Routines* → pencil → *Reminder*).
They follow a different life from session alerts:

- they are scheduled as `schedule.on` (cron-like: a day, a time), so they repeat each week without
  the app having to run;
- their identifiers start at 1000, which puts them **out of reach** of the cancellation done on
  every return to the foreground - without this, opening the app once would erase the reminders;
- Android re-schedules them after a device restart, iOS keeps them in the notification centre;
- tapping opens the app with the routine armed on the dial: nothing starts on its own.

They borrow the end chime, as they have no sound of their own yet.

#### Notification sounds

They are generated from the same patterns as the app (`src/app/core/helpers/sound-patterns.ts`):

- **iOS**: the app writes the WAV files into `Library/Sounds` itself at launch; nothing to do;
- **Android**: `make sounds` (called by `make sync`) copies the WAV files into
  `android/app/src/main/res/raw`, and the app creates a notification channel per sound.

The WAV files peak at −1 dBFS, the same for all four. This is deliberate and it is the expected
level for an alert sound: the device only **reduces** what it is given, so a file rendered at
half scale arrives irremediably quiet, whatever the volume setting. See
["Sounds" in the UI/UX design](07_UI_UX_DESIGN.md).

#### Two volumes not to confuse

An app sound and a notification sound do not go through the same slider, and this is the first thing
to check when "the sounds are not loud":

| What plays                                            | Android stream                      | Setting                 |
| ----------------------------------------------------- | ----------------------------------- | ----------------------- |
| The app's sounds, in the foreground (Web Audio)       | media                               | **Media** volume        |
| Notifications, app in the background or locked screen | notification (`USAGE_NOTIFICATION`) | **Notification** volume |

Media at 20 % therefore keeps the milestones quiet during a session, even if notifications ring
loudly. The app cannot change this: the system chooses the stream of a sound, not the app.

#### Android channels: what is immutable and what is not

A notification channel is **immutable** once created: recreating it changes neither its importance
nor its sound. Hence `CHANNEL_VERSION` in `notification.service.ts`, which must be incremented to
start again with new channels (the previous ones are then deleted, otherwise the user would see the
same names twice in the phone's settings).

What is fixed is the URI, `android.resource://<package>/raw/<name>` - a reference by **name**,
resolved at playback. **Replacing the content of a WAV file therefore requires no bump**: reinstalling
the APK is enough. What does require one is renaming a file, changing the sound attached to a
channel, or touching its importance.

#### Exact alarms and testing a notification

On Android 12+, exact alarms may require the `SCHEDULE_EXACT_ALARM` permission in
`AndroidManifest.xml`. The app does not wait for the end of a session to tell you: ⚙︎ → *Settings* →
**Test a notification** schedules one in one to five seconds - enough time to lock the screen - and
names what is missing if necessary (permission refused, exact alarm absent). The **Allow exact
alarms** link opens the system screen "Alarms & reminders"; on iOS and in the browser, it says that
this screen does not exist.

⚠️ Switching from granted to refused on this screen **restarts the application** and erases the exact
alarms already scheduled: this is imposed by Android, not by the app.

### Icons and launch screens

Two SVG files, one command:

- `resources/app-icon.svg` - the whole icon, case included, full bleed: the system rounds the corners
  (iOS);
- `resources/app-icon-foreground.svg` - the dial alone, without the case, on a transparent background.
  It is used for the Android adaptive icon, whose background is a colour (`ic_launcher_background`,
  the blue of the case) and whose shape is cut out by the launcher, and for the Android launch screens.

`make icons` produces everything at once, by going through Chromium - the same engine that displays
the app, so the gradients and the dial's `mix-blend-mode` come out identical:

| Output          | Detail                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| iOS, icon       | `AppIcon-512@2x.png` (1024 px, no alpha channel: the App Store rejects it)        |
| iOS, launch     | none generated: `LaunchScreen.storyboard` uses `BootLogo.imageset` (from `favicon.svg`) |
| Android, icons  | `ic_launcher`, `ic_launcher_round` and `ic_launcher_foreground` at five densities |
| Android, launch | `splash.png`, portrait and landscape, at five densities                           |
| Web             | `public/apple-touch-icon.png` (180 px)                                            |

The foreground drawing fits in a 63-unit disc on the 108-unit canvas, so inside the 66 safe units: no
launcher mask, however tight, bites into the ring. To be checked if the SVG is retouched.

#### Opening, in three steps

On **iOS** the opening is beige: the same colour (`#f5f2ea`) is used by the launch screen, the web view and
the page, so that no white page shows while the app loads.

1. **The system launch screen** (`LaunchScreen.storyboard`) - a fixed image: the logo (`BootLogo`,
   96 pt) centred on beige.
2. **The boot screen** - the same logo, centred and the same size, with the app version under it
   (`v1.0`, read from `MARKETING_VERSION`). A native view (`SceneDelegate.swift`) is laid over the web view
   until the page has loaded; under it, `src/index.html` already shows the same logo and version as inline
   SVG and CSS, so the hand-over has no jump. The page learns the version from `AppBridgeViewController`.
   Angular replaces the content of `<app-root>` once it starts.
3. **The application**, which takes over its own theme.

The logo pulses gently; under `prefers-reduced-motion` it stays still. The web view background is set in
`capacitor.config.ts` (`ios.backgroundColor`); the page switches to a dark background by itself when the
dark theme is on.

On **Android** the launch screen is unchanged: black, with the dial (`splash.png`). On Android 12 and later,
the system imposes its own screen; `values-v31/styles.xml` gives it the same black and the same icon, so that
all versions open the same way. The web boot screen (logo, without the version) then takes over.

## Installation and commands

**Prerequisites:** Node.js 24.15+ (see `.nvmrc`) · npm 10+ · Xcode (iOS) · Android Studio (Android)

```bash
git clone <repo-url> pomodoro-tdah
cd pomodoro-tdah
make install   # npm install
make dev       # http://localhost:4200
```

### `make` commands

Running `make` on its own shows the help.

| Command                               | Role                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `make install`                        | Installs the dependencies                                                               |
| `make dev`                            | Dev server with hot reload                                                              |
| `make build`                          | Production build                                                                        |
| `make watch`                          | Continuous dev build                                                                    |
| `make test`                           | Unit tests (Karma / Jasmine) - no specs to date                                         |
| `make test-a11y`                      | Accessibility tests (axe-core + keyboard, via Playwright)                               |
| `make sync`                           | Build, copy into `www/`, `npx cap sync`, then `make sounds`                             |
| `make sounds`                         | Generates the notification sounds (WAV, peak at −1 dBFS) and copies them into `res/raw` |
| `make icons`                          | Generates icons and launch screens (iOS, Android, web) from `resources/*.svg`           |
| `make ios` / `make android`           | Adds the native platform (once only)                                                    |
| `make open-ios` / `make open-android` | Syncs, then opens Xcode / Android Studio                                                |
| `make electron-dev`                   | Builds then runs the Electron app (macOS)                                 |
| `make electron-dmg` / `electron-win`  | Builds the macOS DMG / the Windows x64 installer into `release/`          |
| `make clean`                          | Removes `dist/`, `www/`, `release/` and the Angular cache                                           |

The first run of `make test-a11y` requires the test browser:
`npx playwright install chromium`. The same tests run in CI on every push
(`.github/workflows/a11y.yml`).

## Build, execution and continuous integration

### Commands

The `Makefile` is the entry point (`make` on its own shows the help): `install`, `dev`, `build`, `watch`, `test`, `sync`,
`sounds`, `icon`, `ios`, `android`, `open-ios`, `open-android`, `clean`. The matching npm scripts are `start`, `build`, `watch`,
`test`, `test:a11y`.

### Web build

- Builder `@angular-devkit/build-angular:application`, output `dist/pomodoro-tdah`.
- Production: hashed file names, budgets of **500 kB / 1 MB** for the initial bundle and **24 kB / 32 kB** per component
  stylesheet.
- Development: optimisation disabled, source maps.
- The files of `public/` are copied as they are (favicons, Apple icon).

### Mobile chain

`make sync`: build → copy of `dist/pomodoro-tdah/browser` into `www/` → `npx cap sync` → `make sounds` (generation of the WAV
files and copy into `res/raw` if the Android folder exists). `make open-ios` / `make open-android` chain `sync` and then open the
native IDE.

### Continuous integration

GitHub Actions workflow `.github/workflows/a11y.yml`, triggered by pushes to `main` and by every merge request, with two jobs on
`ubuntu-latest`:

1. **Production build** - `npm ci` then `npm run build`.
2. **Accessibility regression** - installation of Chromium by Playwright, `npm run test:a11y`, then upload of the Playwright
   report as an artefact (7-day retention).

The Node version comes from `.nvmrc`; the npm cache is enabled.

### Deployment

The web build is a set of static files: any static host will do, with no environment variable and no add-on service. The mobile
versions are produced from Xcode and Android Studio. There are no published versions: only the latest version of `main` is maintained.

## Security and privacy

- **Reduced attack surface**: no server, no outgoing request, no authentication, no data leaving the device.
- The only data stored are preferences, modes and history, in local storage, with no identifying personal data.
- Reporting a vulnerability: **no public issue**; use GitHub's private reporting (*Security* tab → *Report a vulnerability*).
  See `SECURITY.md`.
- Only the latest version of `main` receives fixes.
- On the native side: permissions limited to local notifications, haptics, keeping the screen on, and writing the sounds into
  the application's container.

## Performance and robustness

| Ref.      | Requirement                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| ENF-PER-1 | Initial bundle budget: warning at 500 kB, error at 1 MB.                                |
| ENF-PER-2 | Both pages are loaded on demand: the accessibility page does not weigh on startup.      |
| ENF-PER-3 | The accuracy of the countdown does not depend on the regularity of the browser's ticks. |
| ENF-PER-4 | A session in progress survives navigation between the two pages.                        |
| ENF-PER-5 | An unavailable service never blocks the application.                                    |

**ENF-PER-5** - storage, notifications, haptics or keeping the screen on.

## Key technical decisions and trade-offs

### Accepted limits

| Limit                                                   | Reason                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| History capped at 500 sessions                          | Size of `localStorage`; beyond that, the statistical value is marginal       |
| No data export by the user                              | Not specified to date                                                        |
| No widget or persistent countdown on iOS                | Removed; only Android has them                                               |
| `WidgetState` contract duplicated in TypeScript / Java  | No code generation; any change is made on both sides                         |
| No tests with a real screen reader                      | Automatic checks and code review only; the gap is published in the statement |
| Accessibility tests on Chromium only                    | A single engine in CI                                                        |

### Points of attention

- Any new colour must go through the theme tokens and be checked in light **and** dark.
- Any new text must exist in the seven dictionaries, otherwise it is a compile-time error.
- Any new alert must exist both as a Web Audio sound and as a native notification, otherwise the behaviour differs depending on
  whether the application is in the foreground or not.
- Any new session state must be carried by `SessionService`, never by a page component.

### Possible evolutions

Export and import of data · full manual audit with a screen reader and 200% magnification · measurement of the
contrast of non-text elements on the rendering · extension of the accessibility tests to other engines and to other languages,
including Arabic in RTL · a pictogram bank such as ARASAAC as a complement to emojis, for AAC uses (augmentative and alternative
communication) where the symbols are already those of the person.
