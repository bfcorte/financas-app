// Gera dist/sw.js depois do build com a lista de arquivos para cache-first.
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));

export function swPlugin() {
  let outDir = 'dist';
  return {
    name: 'fp-service-worker',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    generateBundle(_, bundle) {
      const arquivos = Object.keys(bundle);
      const extras = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
      const lista = ['./', ...[...arquivos, ...extras].filter((f) => !f.endsWith('.map')).map((f) => './' + f)];
      const versao = Date.now().toString(36);
      const modelo = readFileSync(resolve(raiz, 'scripts/sw-modelo.js'), 'utf8');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: modelo.replace('__VERSAO__', versao).replace('__ARQUIVOS__', JSON.stringify(lista)) });
    }
  };
}
