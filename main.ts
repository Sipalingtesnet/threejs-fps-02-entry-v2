/**
 * FROSTLINE — Tactical FPS Make.fun Entry Build Script
 */
import { writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-threejs.ts';

async function main() {
  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || join(__dirname, 'out');
  
  mkdirSync(outputDir, { recursive: true });

  const gameSrc = join(__dirname, 'game');
  const gameDest = join(outputDir, 'game');
  if (existsSync(gameSrc)) {
    cpSync(gameSrc, gameDest, { recursive: true });
  }

  const screenshotsSrc = join(__dirname, 'screenshots');
  const screenshotsDest = join(outputDir, 'screenshots');
  if (existsSync(screenshotsSrc)) {
    cpSync(screenshotsSrc, screenshotsDest, { recursive: true });
  }

  const dossierBytes = buildDossier(__dirname, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });

  writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
  console.log(`Dossier written to ${join(outputDir, 'dossier.json')} (${dossierBytes.length} bytes).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
