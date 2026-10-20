# Evolution: dependency security (Snyk)

🇬🇧 English · [🇫🇷 Français](SECURITE-DEPENDANCES.FR.md)

[← Back to the README](../../README.md) · [Technical specification](DESKTOP-TECHNIQUE.md)

## 1. Purpose

Set up vulnerability scanning of the npm dependencies with **Snyk**, and fix the two vulnerabilities that had
no direct fix through an update of the parent package.

## 2. Tool

- Snyk CLI **1.1308.1**, installed globally: `npm install -g snyk`.
- Authentication: `snyk auth` (interactive, once per machine).
- Scan: `snyk test` at the project root (read-only).
- `snyk fix` is not available without enabling the beta feature in the Snyk account (error `SNYK-CLI-0000`).
  The fixes were therefore made by hand.

## 3. Results

| State | Vulnerabilities | Path |
|-------|-----------------|------|
| Before | 2 (1 HIGH, 1 MEDIUM) | — |
| After zod | 1 (MEDIUM, uuid) | — |
| After uuid | **0** across 116 dependencies | — |

### 3.1 zod 4.6.5 — HIGH (SNYK-JS-ZOD-20510278)

- Problem: unbounded or unthrottled resource allocation.
- Path: `@angular/forms@22.2.0` → `zod@4.6.5`.
- Fix: `4.6.6`.
- Action: `overrides.zod = "^4.6.6"` in `package.json`. Resolved to **4.6.7**, on all copies
  (`@angular/cli`, `@angular/forms`, `@modelcontextprotocol`).
- Checks: `npm run build` OK; `snyk test` without zod.

### 3.2 uuid 7.0.3 — MEDIUM (SNYK-JS-UUID-16133035)

- Problem: incorrect validation of an index, position or offset.
- Path: `@capacitor/cli@8.5.2` → `xcode@3.0.1` → `uuid@7.0.3`.
- Fix: `11.1.1` or `14.0.0`.
- Action: `overrides.uuid = "^11.1.1"`. Choice of **11.x**: `xcode` only uses `uuid.v4()`, present in both
  versions. Moving to 14 would have been one more major version jump with no benefit for this use.
- Checks:
  - `snyk test`: 0 issues;
  - `npm run build` OK;
  - `xcode` parsed the real file `ios/App/App.xcodeproj/project.pbxproj` (16 objects) and generated a UUID
    with `generateUuid()`.
- **Not verified**: a full Xcode build, which was not run on this machine.

## 4. Points of attention

- The `overrides` force one version for all copies of a package. With each update of Angular or Capacitor,
  check that they are still needed: an override that has become useless can block a future update.
- `npm install` reported `allow-scripts` for `snyk`, `fsevents`, `lmdb` and `msgpackr-extract`: their install
  scripts do not run without explicit authorisation. For Electron, the binary was not present after the
  installation: it was downloaded by hand (`node node_modules/electron/install.js`).
- `npm audit` also displayed warnings. They were not handled in this evolution: Snyk is the reference here.

## 5. Verification procedure

```bash
snyk auth                 # once per machine
snyk test                 # at the project root
npm run build             # after any dependency change
```

For a future fix:
1. Read the dependency path in the `snyk test` output (`introduced by …`).
2. If the parent can be updated without breaking changes, do that first.
3. Otherwise, add a targeted `overrides` entry, then check the build and the tests.
4. Run `snyk test` again.
