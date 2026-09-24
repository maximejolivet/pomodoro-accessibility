# Politique de sécurité

🇫🇷 Français · [🇬🇧 English](#security-policy)

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

---

# Security Policy

## Supported versions

Pomodoro Accessibilité has no published releases: only the latest version of the `main` branch receives
security fixes.

## Reporting a vulnerability

**Please do not open a public issue** for a security vulnerability.

Use GitHub's private reporting: the repository's **Security** tab, then
[**Report a vulnerability**](https://github.com/maximejolivet/pomodoro-accessibility/security/advisories/new).

To help reproduce the problem, please include, if possible:

- a description of the vulnerability and its impact;
- the steps to reproduce it;
- the platform (web, iOS, Android), the browser or device, and the commit or date of the version tested;
- a proof of concept, if you have one.

## What to expect

This is an independently maintained project with no guaranteed response time. The goal is to
acknowledge your report within 7 days, confirm or dismiss the issue, then publish a fix and
credit you in the fix notes if you wish.

## Scope

**In scope:** the application code (Angular), the Capacitor configuration (iOS, Android,
widget) and the build scripts in this repository.

**Out of scope:**

- vulnerabilities in third-party dependencies (Angular, Capacitor plugins…): report them to their maintainers;
- social engineering and attacks that require physical access to an unlocked device;
- automated scanner reports without a demonstrated impact.

## Data and privacy

- No account, no server: preferences, modes and history stay on the device (`localStorage`).
- On startup, the app loads the OpenDyslexic font from `cdn.jsdelivr.net`. This is the only
  external network request made by the application itself.
