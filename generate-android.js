const { TwaManifest, TwaGenerator, BufferedLog, ConsoleLog } = require('@bubblewrap/core');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const projectDir = __dirname;
const targetDir = path.join(projectDir, 'android');
const manifestFile = path.join(projectDir, 'twa-manifest.json');

async function main() {
  const twaManifest = await TwaManifest.fromFile(manifestFile);
  twaManifest.generatorApp = 'bubblewrap';
  twaManifest.signingKey.path = path.join(targetDir, twaManifest.signingKey.path);

  if (fs.existsSync(targetDir)) {
    const generator2 = new TwaGenerator();
    await generator2.removeTwaProject(targetDir);
  }

  const generator = new TwaGenerator();
  const log = new BufferedLog(new ConsoleLog('Generating TWA'));
  await generator.createTwaProject(targetDir, twaManifest, log, (current, total) => {
    process.stdout.write(`\rProgress: ${Math.round(current / total * 100)}%`);
  });
  log.flush();

  const savedManifest = path.join(targetDir, 'twa-manifest.json');
  await twaManifest.saveToFile(savedManifest);

  const checksum = crypto.createHash('sha1')
    .update(await fs.promises.readFile(savedManifest))
    .digest('hex');
  await fs.promises.writeFile(path.join(targetDir, 'manifest-checksum.txt'), checksum);

  console.log('\nAndroid project generated successfully at android/');
}
main().catch(err => { console.error(err); process.exit(1); });
