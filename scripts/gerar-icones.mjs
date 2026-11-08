// Gera os ícones PNG do PWA a partir de scripts/icone.svg.
// O Chromium do Playwright desenha o SVG com a Bricolage Grotesque (Google Fonts)
// e o sharp redimensiona para cada tamanho.
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const svg = readFileSync(resolve(raiz, 'scripts/icone.svg'), 'utf8');
const saida = resolve(raiz, 'public/icons');
mkdirSync(saida, { recursive: true });

const html = `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&display=swap">
<style>html,body{margin:0;background:#0f2a22}svg{display:block}</style></head>
<body>${svg}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const ok = await page.evaluate(() => document.fonts.check('800 100px "Bricolage Grotesque"'));
if (!ok) throw new Error('Fonte Bricolage Grotesque não carregou');
const base = await page.locator('svg').screenshot({ type: 'png' });
await browser.close();

const alvos = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512]
];
for (const [nome, tam] of alvos) {
  await sharp(base).resize(tam, tam, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(resolve(saida, nome));
  console.log('ok', nome, tam);
}
