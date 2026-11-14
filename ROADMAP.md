# Roadmap

What is open on Pomodoro Accessibilité, in rough priority order. Nothing here is a promise or a date: it is
the list of known loose ends, so they are not forgotten.

This is the live list behind the "Next step" of the [implementation plan](docs/09_IMPLEMENTATION_PLAN.md).
Items are picked up as described in the [Kanban](docs/10_KANBAN.md); the requirements they touch are in the
[PRD](docs/02_PRD.md) and the stories in the [epics](docs/08_EPICS.md). The whole set is indexed in
[`docs/00_INDEX.md`](docs/00_INDEX.md).

## To verify by hand

Things the automated checks cannot confirm. See the open questions of the
[project brief](docs/01_PROJECT_BRIEF.md) and the native setup in the [TRD](docs/04_TRD.md).

- [ ] `cap open ios` and `cap open android` still open the IDE now that `open` is overridden to v11
      (`package.json` → `overrides`). It works through `require(esm)`, which needs Node 24 or newer.
- [ ] The dial on a real phone and a real tablet: the case was widened to 8 px from the screen edges, its
      height is capped by the screen, and the control buttons were shrunk to 72 / 52 px.
- [ ] The mode name chip (`.readout-mode`) in every theme and every colour of the modes.

## Dependencies

Tracked in the Renovate dashboard ([#15](https://github.com/maximejolivet/pomodoro-accessibility/issues/15)).
The versions in use are listed in the [TRD](docs/04_TRD.md).

- [ ] **`@axe-core/playwright` 4.14**: pinned to `~4.13` because 4.14 adds `label-content-name-mismatch`,
      which fails 9 accessibility tests. Fix the accessible names (visible text must be part of the name),
      then lift the pin.
- [ ] **`minimatch` advisories** (6 moderate, `npm audit`): they come from `electron-builder` and only
      affect the desktop build. Upgrade `electron-builder` once a release fixes them without a breaking change.
- [ ] **Renovate config migration**: let Renovate open its migration PR for `renovate.json`.
- [x] Merge the open Gradle updates ([#13](https://github.com/maximejolivet/pomodoro-accessibility/pull/13),
      [#14](https://github.com/maximejolivet/pomodoro-accessibility/pull/14)).
- [ ] Major upgrades, one at a time, each with a full test run: Electron 45, TypeScript 7, `uuid` 14
      (also drop the `overrides` entry), Gradle and the Android Gradle plugin 9, Node 26
      (`engines`, `.nvmrc` and the CI workflow change together).

## Tests

How the checks run, and what they cover, is in the [TRD](docs/04_TRD.md) ("Quality and tests").

- [ ] There are no unit tests: `ng test` has nothing to run. The only suite is Playwright
      (`npm run test:a11y`, 61 tests). Start with the session service, where the timing rules live.
- [x] The two "voile d'amorçage" tests described the animated boot screen removed on 2 October (`#boot`,
      `.boot-ring`) and passed because nothing was there. They now cover the boot logo (`.boot-logo`): it
      goes away once the app is ready, pulses, and stops under `prefers-reduced-motion`.
- [ ] Move the vibration tests off the dynamic `import()` race for good, for example by preloading the
      haptics plugin when the app starts.

## Dial and layout

The dial and the case are described in the [UI/UX design](docs/07_UI_UX_DESIGN.md) ("Dial rendering"); the
stories are E1 in the [epics](docs/08_EPICS.md).

- [ ] A larger dial on phones. The case is now almost full width, so the next gain is inside it: smaller
      paddings around the bezel (4.2 % and 4.5 %), with the progress ring realigned.
- [ ] Short screens (360 × 640 and below): the accessibility button still overlaps the bottom of the case.
- [ ] Landscape and desktop: the dial is limited by the window height (about 406 px at 1024 × 768).

## Documentation

The documentation lives in [`docs/`](docs/00_INDEX.md).

- [ ] The PRD keeps gaps in its requirement numbering after the dial lock was removed (EF-ROU-11,
      EF-PRE-13, ENF-A11-14). Renumber them, or keep the gaps on purpose and say so.
- [x] Update the screenshots and descriptions if any still show the lock button.

## Housekeeping

The branch flow is written down in the [Kanban](docs/10_KANBAN.md) ("Flow rules").

- [ ] `develop` tracks `origin/main`, so a plain `git pull` is ambiguous. Run
      `git branch -u origin/develop`.
- [ ] Decide how `main` is merged back into `develop` after a release, so the two branches stop diverging.
