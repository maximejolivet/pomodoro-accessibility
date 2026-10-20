# Évolution : application de bureau (macOS et Windows) — spécification fonctionnelle

🇫🇷 Français · [🇬🇧 English](DESKTOP-FONCTIONNEL.md)

[← Retour au README](../../README.FR.md) · [Spécification technique](DESKTOP-TECHNIQUE.FR.md)

## 1. Objet

Pomodoro TDAH est jusqu'ici une application web et mobile (iOS, Android). Cette évolution ajoute une
**application de bureau** installable sur macOS et Windows, avec les mêmes écrans et les mêmes
fonctions, plus des **notifications natives** du système.

L'objectif est de pouvoir utiliser l'app sur l'ordinateur de travail, sans navigateur ni téléphone,
et d'être prévenu d'une fin de session ou d'un rappel de routine même quand la fenêtre n'est pas au
premier plan.

## 2. Périmètre

| Plateforme | Livrable | Architecture | Statut |
|------------|----------|--------------|--------|
| macOS (Apple Silicon) | DMG | arm64 | Généré, testé (lancement, notification) |
| Windows (64 bits) | Installeur `.exe` (NSIS) | x64 | Généré, **non testé sur Windows** |
| macOS (Intel) | DMG | x64 | Non généré (voir §7) |
| Web / iOS / Android | — | — | Inchangés |

Hors périmètre de cette évolution :
- signature et notarisation (aucun certificat disponible) ;
- mise à jour automatique de l'application ;
- notifications quand l'application est entièrement fermée.

## 3. Ce qui ne change pas pour l'utilisateur

Les écrans, les modes, les routines, l'historique, les statistiques, les préférences, la langue et le
thème sont identiques à la version web. Les données (historique, routines, préférences) restent
locales : elles sont stockées dans l'application de bureau, séparément de celles du navigateur.

## 4. Nouveautés fonctionnelles

### 4.1 Installation

- **macOS** : ouvrir le DMG, glisser l'application dans « Applications ». L'application n'étant pas
  signée, au premier lancement il faut faire clic droit → **Ouvrir** (ou autoriser depuis
  Réglages Système → Confidentialité et sécurité).
- **Windows** : lancer l'installeur. SmartScreen affiche un avertissement car l'éditeur n'est pas
  identifié : « Informations complémentaires » → « Exécuter quand même ». L'installation se fait
  pour l'utilisateur courant, sans droits administrateur, et le dossier est modifiable.

### 4.2 Notifications natives

Les notifications passent par le centre de notifications du système (macOS) ou les notifications
Windows.

| Événement | Quand | Comportement |
|-----------|-------|--------------|
| Jalons de session (45, 30, 15 min restantes) | Application en arrière-plan | Notification avec son |
| Fin de session | Application en arrière-plan | Notification avec son |
| Rappel de routine | Chaque semaine, au jour et à l'heure réglés | Notification, même fenêtre cachée |

**Définition de « arrière-plan »** : la fenêtre n'a plus le focus, est réduite ou masquée. Tant que
l'application est au premier plan, les notifications de session ne sont pas envoyées (l'écran
suffit).

**Clic sur une notification de rappel** : la fenêtre remonte au premier plan et la routine
correspondante est armée sur le cadran, prête à démarrer. Comme sur mobile, rien ne démarre seul.

**Application fermée** : aucune notification. Si l'application a été fermée puis rouverte après un
clic sur un rappel, la routine est tout de même armée au démarrage.

**Sons** :
- macOS : son système « Ping » pour les jalons, « Glass » pour la fin et les rappels ;
- Windows : son système par défaut ;
- les sons propres à l'application ne sont pas utilisés sur le bureau.

Si le son est coupé dans les réglages de l'app, les notifications arrivent silencieuses.

### 4.3 Affichage en portrait

En mode portrait (fenêtre haute, ou téléphone en portrait), le cadran est plus petit qu'avant :
- largeur maximale de 420 px (au lieu de 560 px) ;
- marges latérales de 48 px (au lieu de 16 px).

Le mode paysage et le mode table ne changent pas.

## 5. Parcours de test

À faire sur chaque plateforme cible :

1. Installer et lancer l'application.
2. Démarrer une session, puis cliquer dans une autre fenêtre : vérifier que le décompte continue.
3. Attendre un jalon ou la fin (ou une session courte) avec l'app en arrière-plan : une notification
   doit apparaître avec son.
4. Vérifier que le **mode Concentration / Ne pas déranger** est désactivé, sinon rien ne s'affiche.
5. Vérifier que l'application figure dans les réglages de notifications du système, avec
   l'autorisation accordée et le style « Bannières ».
6. Créer une routine avec un rappel dans quelques minutes, garder l'app ouverte en arrière-plan,
   puis cliquer sur la notification : la fenêtre doit remonter et la routine être armée.
7. En portrait, vérifier que le cadran ne déborde pas et que les commandes restent accessibles.

## 6. Limites connues

- **Pas de bouton de test de notification dans l'interface.** Les textes existent dans les
  traductions, mais aucun écran ne les utilise. Le test se fait par une session ou une routine.
- **Pas de notification application fermée** (voir §4.2).
- **Affichage des notifications non vérifié visuellement** : sur macOS, leur envoi et leur
  enregistrement ont été confirmés dans le journal système, mais aucune capture d'écran n'a été faite.
- **Windows non testé** sur une machine réelle à la date de cette évolution.
- **Pas de signature** : avertissements macOS et Windows à l'installation.
- **Le mode Concentration** supprime les notifications, comme sur les autres plateformes.

## 7. Décisions à prendre

- **macOS Intel** : générer aussi un DMG x64 (`--x64`) ou un DMG universel si des Mac Intel doivent
  être servis.
- **Windows ARM** : ajouter `--arm64` au script si nécessaire.
- **Signature** : un certificat Apple Developer (99 $/an) et un certificat de signature de code
  Windows supprimeraient les avertissements et permettraient la notarisation.
- **Bouton de test** : l'ajouter dans les réglages permettrait de vérifier les notifications sans
  attendre une fin de session.
