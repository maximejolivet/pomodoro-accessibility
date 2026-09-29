# Build mobile (iOS / Android)

[← Retour au README](../README.md)

```bash
make ios          # première fois seulement
make open-ios     # build + sync + Xcode

make android      # première fois seulement
make open-android # build + sync + Android Studio
```

## Notifications locales

L'autorisation est demandée au premier démarrage du minuteur, et au premier rappel réglé.
Les alertes (paliers, fin, fin de prolongation, fin de la session enchaînée) sont programmées
quand l'app passe en arrière-plan et annulées au retour, là où les sons de l'app prennent le
relais.

### Rappels de routine

Une routine peut porter une heure et des jours (⚙︎ → Modes → *Routines* → crayon → *Rappel*).
Ils suivent une autre vie que les alertes de session :

- ils se programment en `schedule.on` (façon cron : un jour, une heure), donc se répètent
  chaque semaine sans que l'app ait à s'exécuter ;
- leurs identifiants partent de 1000, ce qui les met **hors de portée** de l'annulation faite
  à chaque retour au premier plan — sans cela, ouvrir l'app une fois effacerait les rappels ;
- Android les replace après un redémarrage de l'appareil, iOS les garde dans le centre de
  notifications ;
- l'appui ouvre l'app avec la routine armée sur le cadran : rien ne démarre tout seul.

Ils empruntent le carillon de fin, faute de son propre à ce jour.

### Sons des notifications

Ils sont générés à partir des mêmes motifs que l'app (`src/app/core/helpers/sound-patterns.ts`) :

- **iOS** : l'app écrit elle-même les WAV dans `Library/Sounds` au lancement, rien à faire ;
- **Android** : `make sounds` (appelé par `make sync`) copie les WAV dans
  `android/app/src/main/res/raw`, et l'app crée un canal de notification par son.

Sur Android 12+, les alarmes exactes peuvent nécessiter la permission
`SCHEDULE_EXACT_ALARM` dans `AndroidManifest.xml`. L'app n'attend pas la fin d'une session pour
le dire : ⚙︎ → *Réglages* → **Tester une notification** en programme une à cinq secondes — le
temps de verrouiller l'écran — et nomme ce qui manque le cas échéant (autorisation refusée,
alarme exacte absente). Le lien **Autoriser les alarmes exactes** ouvre l'écran système
« Alarmes et rappels » ; sur iOS et dans le navigateur, il annonce que cet écran n'existe pas.

⚠️ Passer d'accordé à refusé depuis cet écran fait **redémarrer l'application** et efface les
alarmes exactes déjà programmées : c'est le système Android qui l'impose, pas l'app.

## Décompte permanent

Pendant une session, le temps restant se pose hors de l'app :

- **Android** — une notification permanente et muette, dont le chronomètre s'égrène tout
  seul. Canal `ongoing_v1`, importance basse : elle ne doit jamais couvrir les paliers. Elle
  marche depuis Android 7 (le compte à rebours du chronomètre date de l'API 24) ; avant, elle
  affiche le temps restant figé.
- **iOS** — une Live Activity, écran verrouillé et Dynamic Island, à partir d'**iOS 16.2**.
  Elle exige `NSSupportsLiveActivities` dans `App/Info.plist` (déjà posé) et que l'utilisateur
  n'ait pas coupé les activités en direct dans les réglages du système.

⚠️ Sur iOS, le cadran d'une Live Activity est **figé entre deux mises à jour** : seul le
chiffre court tout seul. L'animer demanderait un serveur de notifications push, que cette app
n'a pas — et n'aura pas, elle ne parle à personne.

## Widgets d'écran d'accueil

### iOS

L'extension `PomodoroWidget` (SwiftUI, iOS 17+) lit l'état écrit par l'app dans l'App Group
`group.com.maximejolivet.pomodorotdah` (plugin local `WidgetBridge`, enregistré par
`MainViewController`).

Sur un appareil, choisir son équipe dans *Signing & Capabilities* pour les cibles **App** et
**PomodoroWidget** : Xcode crée alors l'App Group. Le décompte du widget avance seul ; l'app
ne le met à jour qu'aux changements (démarrage, pause, fin, passage en arrière-plan,
objectif, langue, thème, durée réglée).

Le widget affiche **le cadran de l'app**, redessiné en SwiftUI à partir des mêmes constantes
que `src/app/features/timer/dial-geometry.ts` et des mêmes couleurs que `src/theme/` : le disque
s'y vide graduation par graduation, sans réveiller l'app. Toucher à la géométrie ou à la palette
d'un côté demande donc le même geste de l'autre.

### Android

Rien à configurer : le widget est un `AppWidgetProvider` du module `app`, déclaré dans le
manifeste, disponible dès l'installation (appui long sur l'écran d'accueil → Widgets). Le cadran
y est peint dans un bitmap par `DialBitmap.java`, à partir des mêmes constantes ; deux
dispositions selon la largeur posée, 2×2 et 4×2.

L'état passe par `WidgetBridgePlugin.java`, jumeau du plugin Swift, enregistré dans
`MainActivity`. Le décompte avance seul (`Chronometer`), le disque se vide sur une alarme à la
minute, annulée dès que le décompte s'arrête.

## Icônes et écrans de lancement

Deux SVG, une commande :

- `resources/app-icon.svg` — l'icône entière, boîtier compris, plein cadre : c'est le système
  qui arrondit les coins (iOS) ;
- `resources/app-icon-foreground.svg` — le cadran seul, sans boîtier, sur fond transparent. Il
  sert à l'icône adaptative d'Android, dont le fond est une couleur (`ic_launcher_background`,
  le bleu du boîtier) et la forme est découpée par le lanceur, et aux écrans de lancement.

`make icons` produit tout d'un coup, en passant par Chromium — le même moteur que celui qui
affiche l'app, donc les dégradés et le `mix-blend-mode` du cadran sortent identiques :

| Sortie | Détail |
| --- | --- |
| iOS, icône | `AppIcon-512@2x.png` (1024 px, sans canal alpha : l'App Store le refuse) |
| iOS, lancement | `Splash.imageset`, 2732 × 2732 aux trois échelles |
| Android, icônes | `ic_launcher`, `ic_launcher_round` et `ic_launcher_foreground` sur cinq densités |
| Android, lancement | `splash.png`, portrait et paysage, sur cinq densités |
| Web | `public/apple-touch-icon.png` (180 px) |

Le dessin de l'avant-plan tient dans un disque de 63 unités sur les 108 de la toile, donc à
l'intérieur des 66 unités sûres : aucun masque de lanceur, si serré soit-il, ne mord sur
l'anneau. À vérifier si l'on retouche le SVG.

### L'ouverture, en trois temps

Le fond est **noir** partout : il vaut pour les deux thèmes, et il n'envoie aucun éclair blanc
à qui ouvre l'app dans le noir.

1. **L'écran de lancement du système** — une image fixe. Android ne sait pas l'animer avant la
   version 12, et Apple l'interdit : c'est le cadran posé sur le noir, rien de plus.
2. **Le voile d'amorçage** (`src/index.html`) — dès la première ligne de HTML, sur le même
   noir, l'anneau du cadran se met à tourner autour de sa face. Style et SVG en ligne : il
   s'affiche avant tout téléchargement. `main.ts` le retire une fois l'app prête, y compris
   **si le démarrage échoue** — un voile resté en place laisserait un écran noir muet.
3. **L'application**, qui reprend son propre thème.

Sous `prefers-reduced-motion`, l'anneau se fige et le fondu disparaît : il reste un logo, pas
un moulin. Sur Android 12 et au-delà, le système impose son propre écran ; `values-v31/styles.xml`
lui donne le même noir et la même icône, pour que toutes les versions ouvrent pareil.
