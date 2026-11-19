import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const viteBin = path.resolve(process.cwd(), 'node_modules/vite/bin/vite.js');
const extraArgs = process.argv.slice(2);
const hasHashInPath = process.cwd().includes('#');

if (!hasHashInPath) {
  const child = spawn(process.execPath, [viteBin, ...extraArgs], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
} else {
  console.log(
    '[dev] Se detectó "#" en la ruta del proyecto; iniciando modo compilación continua + preview para compatibilidad total de Vite.'
  );

  const initialBuild = spawnSync(process.execPath, [viteBin, 'build'], { stdio: 'inherit' });
  if (initialBuild.status !== 0) {
    process.exit(initialBuild.status ?? 1);
  }

  const watcher = spawn(process.execPath, [viteBin, 'build', '--watch'], { stdio: 'inherit' });
  const preview = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '--port', '5173', '--strictPort', ...extraArgs],
    { stdio: 'inherit' }
  );

  const shutdown = () => {
    watcher.kill();
    preview.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  preview.on('exit', (code) => {
    watcher.kill();
    process.exit(code ?? 0);
  });
}
