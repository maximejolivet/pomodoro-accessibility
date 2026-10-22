# Politique de sécurité

🇫🇷 Français · [🇬🇧 English](SECURITY.md)

## Versions prises en charge

Pomodoro Accessibilité n'a pas de versions publiées : seule la dernière version de la branche `main`
reçoit des correctifs de sécurité.

## Signaler une vulnérabilité

**Merci de ne pas ouvrir d'issue publique** pour une faille de sécurité.

Utilise le signalement privé de GitHub : onglet **Security** du dépôt, puis
[**Report a vulnerability**](https://github.com/maximejolivet/pomodoro-accessibility/security/advisories/new).

Pour nous aider à reproduire le problème, indique si possible :

- une description de la faille et de son impact ;
- les étapes pour la reproduire ;
- la plateforme (web, iOS, Android), le navigateur ou l'appareil, et le commit ou la date de la version testée ;
- une preuve de concept, si tu en as une.

## Ce que tu peux attendre

Le projet est maintenu à titre indépendant, sans garantie de délai. L'objectif est d'accuser
réception sous 7 jours, de confirmer ou non la faille, puis de publier un correctif et de te
citer dans les notes du correctif si tu le souhaites.

## Périmètre

**Concerné :** le code de l'application (Angular), la configuration Capacitor (iOS, Android,
widget) et les scripts de build de ce dépôt.

**Hors périmètre :**

- les failles des dépendances tierces (Angular, plugins Capacitor…) : à signaler à leurs mainteneurs ;
- l'ingénierie sociale et les attaques nécessitant un accès physique à un appareil déverrouillé ;
- les rapports issus d'un scanner automatique sans impact démontré.

## Données et vie privée

- Pas de compte, pas de serveur : les préférences, modes et historique restent sur l'appareil
  (`localStorage`).
- Au démarrage, l'application charge la police OpenDyslexic depuis `cdn.jsdelivr.net`. C'est la
  seule requête réseau externe de l'application elle-même.
