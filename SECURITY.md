# Security Policy

🇬🇧 English · [🇫🇷 Français](SECURITY.FR.md)

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
