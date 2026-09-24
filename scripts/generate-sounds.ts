/**
 * Génère les sons de notification (WAV) à partir des mêmes motifs que l'app.
 *   node scripts/generate-sounds.ts [dossier]   (défaut : resources/sounds)
 * Android lit ces fichiers dans android/app/src/main/res/raw (voir `make sounds`).
 * iOS n'en a pas besoin : l'app les écrit elle-même dans Library/Sounds au lancement.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOUND_FILES, SOUND_PATTERNS, type SoundId, renderWav } from '../src/app/sound-patterns.ts';

const outDir = process.argv[2] ?? 'resources/sounds';
mkdirSync(outDir, { recursive: true });

for (const id of Object.keys(SOUND_PATTERNS) as SoundId[]) {
  const file = join(outDir, SOUND_FILES[id]);
  writeFileSync(file, renderWav(SOUND_PATTERNS[id]));
  console.log(`✓ ${file}`);
}
