# Évolution : application de bureau (macOS et Windows) — spécification technique

🇫🇷 Français · [🇬🇧 English](DESKTOP-TECHNIQUE.md)

[← Retour au README](../../README.FR.md) · [Spécification fonctionnelle](DESKTOP-FONCTIONNEL.FR.md)

## 1. Architecture

L'application Angular existante est emballée dans **Electron 44** (Chromium + Node.js). Le code
Angular ne change pas de structure : il est compilé par `ng build` puis chargé par Electron depuis
le système de fichiers.

```
┌────────────────────────── Electron ──────────────────────────┐
│  Process principal (electron/main.js, notifications.js)      │
│   • fenêtre, cycle de vie, relais de l'état de la fenêtre     │
│   • planificateur des notifications (tick 1 s)                │
│   • Notification native (macOS / Windows)                     │
│                 ▲ ipcMain.handle / webContents.send           │
│                 │                                             │
│  Preload (electron/preload.js) — contextBridge                │
│   • window.electronAPI.notifications                          │
│                 ▲                                             │
│  Renderer : Angular (dist/pomodoro-tdah/browser)              │
│   • NotificationService → pont si Electron, sinon Capacitor   │
│   • AppStateService → état actif (Electron ou Capacitor)      │
└──────────────────────────────────────────────────────────────┘
```

Le code web, iOS et Android n'est pas modifié : les services détectent la plateforme et choisissent
le chemin. `Capacitor.isNativePlatform()` reste faux sous Electron, donc les plugins Capacitor
restent inactifs (haptique, Live Activities, widget, keep-awake).

## 2. Fichiers

| Fichier | Rôle |
|---------|------|
| `electron/main.js` | Création de la fenêtre, relais de l'état actif, initialisation des notifications, identifiant Windows |
| `electron/notifications.js` | Planificateur (alertes de session, rappels hebdomadaires, tests), affichage, gestion du clic |
| `electron/preload.js` | API exposée au renderer : `electronAPI.notifications.*` |
| `src/app/core/helpers/electron.ts` | Types du pont et accès `electronApi()` |
| `src/app/core/services/app-state.service.ts` | Flux `isActive$` (Capacitor `appStateChange` ou événements Electron) |
| `src/app/core/services/notification.service.ts` | Branchements Electron dans les méthodes existantes |
| `src/app/core/services/session.service.ts` | Abonnement à `AppStateService` à la place de `App.addListener` |
| `src/app/features/timer/sheet/routines-panel.component.ts` | `isNative` vrai sous Electron (message « web » masqué) |
| `src/app/features/timer/dial/timer-dial.component.css` | Règle portrait du cadran |
| `src/app/app.config.ts` | Routage par hash quand l'app est servie en `file:` |
| `build/icon.icns`, `build/icon.ico` | Icônes macOS et Windows, générées depuis `resources/app-icon.svg` |
| `package.json` | `main`, scripts, configuration `build` (electron-builder) |
| `Makefile` | Cibles `electron-dev`, `electron-dmg`, `electron-win` |

## 3. Contrat IPC

Requêtes (`ipcRenderer.invoke` → `ipcMain.handle`) :

| Canal | Arguments | Retour |
|-------|-----------|--------|
| `notif:schedule` | `alerts: Alert[]`, `withSound` | — (remplace les alertes de session) |
| `notif:cancelAll` | — | — |
| `notif:scheduleReminders` | `reminders[]`, `withSound` | — (remplace tous les rappels) |
| `notif:test` | `title`, `body`, `withSound` | `'scheduled' \| 'unsupported'` (délai 5 s) |
| `notif:takePendingTap` | — | `routineId \| null` |

Événements (`webContents.send` → `ipcRenderer.on`) :

| Canal | Charge utile | Émis quand |
|-------|--------------|------------|
| `notif:reminderTapped` | `routineId` | Clic sur un rappel, fenêtre ouverte |
| `app:state` | `isActive: boolean` | `focus`/`restore` → `true` ; `blur`/`minimize`/`hide` → `false` |

Le `sound` des alertes est un `SoundId` (`milestone45`, `milestone30`, `milestone15`, `end`) ; le
process principal le traduit en son système macOS (`Glass` pour `end`, `Ping` sinon).

## 4. Planificateur (`electron/notifications.js`)

- **Alertes de session** : tableau remplacé à chaque `schedule`, vidé par `cancelAll`. Une alerte est
  tirée quand `Date.now() >= at`. Les alertes déjà passées à la programmation sont ignorées.
- **Rappels** : chaque rappel porte un `nextAt`, calculé par `nextOccurrence` (jour ISO 1–7, heure,
  minute, heure locale). Après tir, `nextAt` est recalculé à partir de l'instant présent : un réveil
  de veille ne provoque pas de rafale de notifications.
- **Tests** : tir après 5 s, non annulés par `cancelAll`.
- **Tick** : `setInterval` de 1 s, arrêté à `before-quit`.
- **Références** : les objets `Notification` sont gardés dans un `Set` jusqu'à `click` ou `close`,
  pour éviter qu'ils soient ramassés avant d'être affichés.
- **Clic** : `focusApp(routineId)`. Si la fenêtre existe et a fini de charger, l'événement part
  directement. Sinon, l'identifiant est gardé dans `pendingTap` et repris par le renderer via
  `takePendingTap` au démarrage de `NotificationService.setup()`.

Le calcul de `nextOccurrence` a été vérifié sur des cas simples, dont le passage à l'heure d'hiver.

## 5. Renderer

- `NotificationService` : le champ `electron` est `electronApi()?.notifications ?? null`.
  `available` vaut `Capacitor.isNativePlatform() || electron !== null`. Dans chaque méthode privée
  (`doSchedule`, `doScheduleReminders`, `doSendTest`, `cancelPending`), la branche Electron est
  placée en tête et renvoie directement. `ensurePermission()` renvoie `true` (macOS et Windows
  gèrent l'autorisation dans les réglages système).
- `setup()` branche l'événement `reminderTapped` sur le sujet RxJS existant et reprend l'éventuel
  clic en attente.
- `AppStateService` remplace l'écoute directe de `App` dans `SessionService`. Le comportement est
  le même : à la mise en arrière-plan, les alertes sont programmées ; au retour, elles sont annulées.

## 6. Build et packaging

Scripts :

```bash
npm run electron:dev        # ng build --base-href ./ && electron .
npm run electron:build      # ng build --base-href ./ && electron-builder --mac dmg --publish never
npm run electron:build:win  # ng build --base-href ./ && electron-builder --win nsis --x64 --publish never
```

Points importants :

- **`--base-href ./`** : indispensable en `file://`, sinon les chemins des assets sont faux.
- **Routage** : `app.config.ts` passe en hash routing si `window.location.protocol === 'file:'`.
  Sans cela, un rechargement sur `/accessibility` échouerait.
- **`files`** : `electron/**/*`, `dist/pomodoro-tdah/browser/**/*`, `package.json`.
- **Sortie** : `release/` (ignoré par git).

### 6.1 macOS

- `mac.target: dmg`, architecture arm64 par défaut.
- `mac.identity: "-"` : signature ad-hoc.
- `mac.hardenedRuntime: false` : le hardened runtime avec une signature ad-hoc empêche le lancement
  des frameworks Electron, qui ne partagent pas l'identité de l'app.

**Constat important** : sans `identity: "-"`, l'app était signée par Electron d'origine avec
`Identifier=Electron` et `Info.plist=not bound`. macOS ne pouvait pas associer les notifications à
l'application. Vérification : `codesign -dv` et `codesign --verify --deep --strict`.

**Constat important, autorisation** : au premier essai, l'app lancée directement depuis le binaire
(`Contents/MacOS/...`) a reçu `didGrant: 0 hasError: 1` et macOS l'a enregistrée comme `Denied`.
Relancée avec `open` (LaunchServices), la demande aboutit (`didGrant: 1 hasError: 0`). Pour tester,
toujours lancer l'app via `open` ou par double-clic. La commande `log show` permet de suivre les
lignes `com.apple.UserNotifications`.

### 6.2 Windows

- `win.target: nsis`, `--x64` forcé dans le script. Sans ce flag, electron-builder prend
  l'architecture de l'hôte (arm64 sur Mac Apple Silicon), ce qui a été constaté.
- `win.icon: build/icon.ico` (16 à 256 px).
- `nsis` : installation par utilisateur (`perMachine: false`), dossier modifiable, raccourci
  « Pomodoro TDAH », données conservées à la désinstallation.
- `app.setAppUserModelId('com.maxime.pomodoro-tdah')` dans `main.js`, uniquement sous `win32`. La
  valeur doit correspondre à `build.appId`.
- Build réalisé depuis macOS : l'installeur est généré (`signtool` ignoré faute de certificat).

## 7. Tests et vérifications réalisés

| Vérification | Résultat |
|--------------|----------|
| `npm run build` (Angular) après chaque changement | OK |
| `npx tsc -p tsconfig.app.json --noEmit` | OK |
| Planificateur avec module `electron` simulé : alerte passée ignorée, fin tirée avec son `Glass` | OK |
| `nextOccurrence` sur trois cas (lundi, dimanche à venir, dimanche déjà passé avec passage d'heure) | OK |
| `npm run electron:build` (DMG) | OK |
| Lancement de l'app packagée, pas d'erreur au démarrage | OK |
| Pont `electronAPI` appelé depuis la page (via le port de débogage distant) | OK, plateforme `darwin` |
| Notification reçue par le centre de notifications macOS (journal) | OK après relance via `open` |
| `npm run electron:build:win` | OK, installeur x64 généré, contenu vérifié |
| Installeur Windows lancé sur Windows | **Non fait** |
| Affichage visuel des notifications | **Non vérifié** |
| Clic sur une notification (macOS) | **Non vérifié** |

### 7.1 Reproduire la vérification du pont

Le port de débogage distant permet d'appeler le pont depuis un script, sans cliquer dans l'interface :

```bash
open -n "release/mac-arm64/Pomodoro TDAH.app" --args --remote-debugging-port=9222
# puis, avec la WebSocket de la page (liste sur http://127.0.0.1:9222/json/list) :
# Runtime.evaluate → window.electronAPI.notifications.test('Titre', 'Corps', true)
```

Ne pas laisser ce port ouvert hors de ces tests.

## 8. Limites et dette technique

- **Pas de bouton de test** : `settings.notifTest*` existe dans les traductions, mais aucun composant
  ne l'utilise. Ajouter un bouton permettrait de vérifier les notifications sans session.
- **Sons personnalisés non utilisés** sur le bureau : `sound` n'accepte que des sons système macOS, et
  Windows ignore cette option.
- **Pas de persistance des rappels côté process principal** : ils sont renvoyés par le renderer à
  chaque démarrage. Sans fenêtre ouverte, aucune reprogrammation n'a lieu, donc les rappels ne
  survivent pas à la fermeture complète de l'app.
- **Taille du paquet** : le DMG contient les dépendances Capacitor (≈ 275 Mo), inutiles sous Electron.
  Les exclure via `build.files` ou une liste d'exclusion réduirait le paquet.
- **Pas de signature ni de notarisation.**
- **Dépendance Electron et electron-builder** : versions `44.9.0` et `26.15.3`, à mettre à jour
  régulièrement.
- **Lockfile** : le `package-lock.json` a fortement grossi à cause des dépendances Electron.
- **Scripts d'installation bloqués** : `allow-scripts` a empêché le téléchargement du binaire Electron ;
  il a été lancé à la main (`node node_modules/electron/install.js`).

## 9. Maintenance

- Après un changement dans `electron/` : `npm run electron:dev` pour un essai rapide.
- Après un changement Angular : `npm run electron:build` (ou `make electron-dmg`), qui recompile
  `dist/` avant le packaging.
- Ne jamais tester le DMG en lançant le binaire à la main pour les notifications : passer par
  `open` ou un double-clic.
