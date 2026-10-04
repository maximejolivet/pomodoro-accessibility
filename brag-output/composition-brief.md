# Hyperframes Composition Brief: Pomodoro Accessibilité

## Objective

Create a short launch-style brag video for Pomodoro Accessibilité, a visual timer designed for neurodivergent minds. The video emphasizes the elegant solution to a real problem: making time concrete and visible instead of abstract and numeric.

## Output

- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080 (16:9)
- Duration: 18 seconds
- With voiceover narration (Kokoro)

## Source Material

- **Project root:** `/Users/maxime/Sites/pomodoro-tdah`
- **Primary files read:** README.md, package.json, timer-page.component.ts/css/html, theme/tokens.css, public/screenshots
- **Product name:** Pomodoro Accessibilité
- **Strongest claim:** "On voit le temps qui reste au lieu de le lire" (You see the time remaining instead of reading it)
- **Key UI to show:** The visual timer dial shrinking, modes editor, routines feature, stats dashboard, home screen widget
- **Copy that must appear verbatim:**
  - "Time doesn't feel like time." (opening hook)
  - "Pomodoro Accessibilité" (title)
  - "For neurodivergent minds." (tagline)
  - "Available on iOS, Android, Web." (platform list)

## Creative Direction

- **Tone preset:** `polished` — serious, elegant, premium product film
- **Creative direction:** Quiet premium product film for accessible design
- **Interpretation:** 
  - Pacing: unhurried, breathing room between scenes
  - Writing: warm, human, genuine acknowledgment of the problem before revealing the solution
  - Visual energy: calm, deliberate motion; no frenetic cuts or overwhelming effects
  - Restraint: the elegance of simplicity; the UI is the hero, not the effects
- **Angle:** For many neurodivergent minds, time is invisible and abstract. Pomodoro Accessibilité makes time visible through a shrinking disk. The video honors the problem seriously, reveals the solution with quiet confidence, and demonstrates the depth of features (modes, routines, accessibility) before landing the promise.
- **Hook (0–2.5s):** Text on gradient background: "Time doesn't feel like time." Voice explains the problem genuinely.
- **Outro (16–18s):** The main timer centered with overlaid text: "Pomodoro Accessibilité," "For neurodivergent minds," "Available on iOS, Android, Web." Voice delivers the final promise warmly.
- **Avoid:**
  - Generic SaaS language ("streamline," "optimize," "empower")
  - Abstract filler visuals — every scene must show real UI or contribute to the story
  - Unrelated visual redesign — use the app's actual colors, typography, and UI
  - Fast-paced cuts or overwhelming motion; maintain calm throughout

## Visual Identity

- **Background:** Soft gradient from light top (#f1f3f2) to light bottom (#d9e0e2); calm, accessible feel
- **Text/Ink:** Dark blue-gray (#2f3336) — high contrast, readable
- **Accent (stats):** Soft purple (#8b6fd6) — used for highlights and focus moments
- **Primary color (dial):** Dusty blue (#a6ccd6 and variations) — the timer dial and UI elements
- **Display font:** Avenir Next or similar modern sans-serif (system fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI')
- **Body font:** Same as display (this is a minimal-text video; copy is short and impactful)
- **Visual references from the project:**
  - The shrinking timer dial (the hero visual)
  - The modes editor with preset mode icons
  - The routines panel showing step-by-step sequences with pictograms
  - The stats dashboard with progress bar and daily tracking
  - The home screen widget with the timer visible
  - Light and dark theme variants to show versatility

## Storyboard

Use the storyboard in `brag-output/brag-plan.md` as the creative contract. Summary:

1. **Hook – The Problem** — 2.5s — Text: "Time doesn't feel like time." Voice explains the challenge for neurodivergent brains. Gradient background. Establish calm tone.
2. **Reveal – The Solution** — 3s — Show the timer page on a phone. The disk is full, user taps to start, disk shrinks. Voice explains the elegance: visual, not numeric.
3. **Features – Modes & Routines** — 5.5s — Three vignettes: (1) Modes sheet showing Pomodoro/Break/Focus presets (1.5–2s); (2) Routines playing through morning routine with icons (1.5–2s); (3) Stats page showing daily goal and 7-day tracking (1.5–2s).
4. **Accessibility & Scope** — 5s — Quick cuts showing dark mode, landscape/table mode, widget on home screen. Text: "Built for accessibility," "For desks, classrooms, teams," "Right on your home screen."
5. **Outro – The Promise** — 2s — Timer page centered. Overlaid text reveals: "Pomodoro Accessibilité," "For neurodivergent minds," "Available on iOS, Android, Web." Music resolves gently.

**Total: 18 seconds.**

## Audio

- **Audio role:** Warm instrumental bed with conversational voiceover narration. Music establishes calm, thoughtful tone; voice drives story and emotional connection.
- **Audio arc:** 
  - 0–2.5s: Music fades in softly, establishing calm. Voice begins gently.
  - 2.5–11s: Music holds steady, slightly warmer as solution and features are revealed.
  - 11–16s: Music holds with subtle progression as scope widens.
  - 16–18s: Music resolves and fades gently as voiceover delivers final promise.
- **Music:** Happy Beats Business Moves Vol. 11 (warm, accessible, calm instrumental — ~1.7 MB, fits the 18s timeline)
  - Path: `<skill-dir>/assets/music/happy-beats-business-moves-vol-11-by-ende-dot-app.mp3`
  - Credit: Ende.app (CC-licensed)
- **Music treatment:** 
  - Fade in softly at 0s (starts at -∞, reaches -6dB by 0.5s)
  - Hold steady at -12dB during voiceover passages
  - Return to -6dB between voiceover sections
  - Fade out gently from 16s to 18s (reaches -∞ by 18s)
  - Allow music to ring slightly into the final frame
- **Music cue guidance:** Cues will be detected at composition time via Hyperframes beats analysis (no Python required). Prefer natural timing for readability; use 1–2 strong cues for major reveals (solution disk appearance, finale text) only if they align naturally.
- **Audio-reactive treatment:** Subtle. Use music RMS/bass energy to:
  - Add soft glow or presence to the hero timer disk as it appears and shrinks
  - Gentle warmth/brightness to background during the features section
  - Subtle presence/emphasis on final text overlays as they appear
  - Avoid: waveform displays, equalizer bars, strobing, heavy pulsing
- **Audio-coupled moments:**
  - 2.5s (Reveal – timer disk appears): subtle audio cue or music swell (no SFX spike; let music carry it)
  - 5.5s → 11s (Features sequence): natural timing for readability; no beat-grid lock (text must hold long enough to read)
  - 16–18s (Final text): let voiceover carry; music fades
- **SFX selection guidance:** 
  - Minimal SFX use to maintain calm, polished tone
  - Consider one very subtle tone or chime when the disk appears (optional; music may be sufficient)
  - Avoid: beeps, clicks, glitches, heavy impacts (these break the calm)
  - SFX should feel like a soft accent to motion, not a UI sound design layer
  - If used, choose from `<skill-dir>/assets/sfx/interface/drop_001.ogg` or similar soft placement sound
- **SFX analysis guidance:** Reference `<skill-dir>/assets/sfx/sfx-analysis.md` for low-frequency-risk files suitable for polished moments. Prefer minimal/none for this video.
- **Exact SFX choice:** Hyperframes may skip SFX entirely if natural timing and music are sufficient (recommended for this polished tone).
- **Audio files:** Copy music into `brag-output/composition/assets/music/` before building. SFX (if chosen) will be copied by Hyperframes.

## Voiceover Script

**Narration: Kokoro voice 'af_heart' (warm, conversational)**

**Scene 1 (0–2.5s):**
> "For many neurodivergent minds, an hour and ten minutes feel the same. Numbers don't help. Neither does watching the clock."

**Scene 2 (2.5–5.5s):**
> "Pomodoro Accessibilité shows you the time remaining as it shrinks. One glance—no reading, no math. Just time you can see."

**Scene 3a (5.5–7.5s):**
> "Create your own modes. Pomodoro. Breaks. Focus sessions. Each one remembers your choices."

**Scene 3b (7.5–9.5s):**
> "Chain timed steps together. A morning routine. A training circuit. A Tabata. Routines can repeat and remind you at a set time."

**Scene 3c (9.5–11s):**
> "Track your focus time. See your streak. Stay accountable to yourself, not a score."

**Scene 4 (11–16s):**
> "It works everywhere. Light mode, dark mode, landscape, portrait. On your phone, your tablet, the web. As a widget, right on your home screen."

**Scene 5 (16–18s):**
> "It's free, open-source, and designed with care. For TDAH, autism, dyslexia. For everyone who needs time made concrete."

**Total script duration:** ~18 seconds (to be verified after Kokoro TTS generation).

## Hyperframes Instructions

Load the Hyperframes domain skills (`hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`) to create the composition in `brag-output/composition/`.

### Key Requirements

- **Show real UI:** Every scene except the opening hook must display actual screenshots or screen recordings from the app. The visual timer dial, modes editor, routines panel, stats dashboard, and widget are the hero visuals.
- **Keep text readable:** Scene durations and text size must allow viewers to read overlaid copy (0.8s for short labels, ~0.3s per word for sentences).
- **Stay within 15–25 seconds:** Currently planned for 18s.
- **Music & SFX layer:** Include the chosen music and voiceover. SFX minimal or absent.
- **Treat audio notes as guidance:** Choose SFX after animation exists; ignore cues that hurt readability.
- **Audio-reactive treatment:** If feasible, extract music data and apply subtle RMS/bass reactivity to hero visuals (hero glow, background warmth, text presence). Avoid waveforms/equalizers.
- **Beat sync:** Cues optional; readability comes first. Use 1–2 strong cues for major reveals if they align naturally (within ±0.15s).
- **Sequential events:** Moments within the features section should respect reading time; do not rush text.
- **Local assets:** All audio (music + voiceover) must be copied into `brag-output/composition/assets/` before render.
- **Run `hyperframes check`:** This is the gate before render; zero errors required.
- **Keep creation & rendering local:** No remote workflows without explicit user request.

## Self-Review Checklist (for Hyperframes)

- [ ] Composition uses current Hyperframes workflow
- [ ] Music file copied to `brag-output/composition/assets/music/`
- [ ] Voiceover generated via Kokoro and wired to composition
- [ ] At least one visual element subtly reacts to music (audio-reactive), or failure documented
- [ ] 1–2 major moments beat-locked or natural timing chosen for readability
- [ ] All text readable at intended duration
- [ ] Real UI shown (timer dial, modes, routines, stats, widget)
- [ ] All copy grounded in project README, UI, or documented features
- [ ] Total duration 15–25 seconds (planned: 18s)
- [ ] `hyperframes check` passes, zero errors

---

**Status:** Ready for Hyperframes composition build.
