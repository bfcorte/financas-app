// Teste ponta a ponta do build (dist/) num viewport de iPhone, nos dois temas.
// Uso: npm run build && node scripts/e2e.mjs
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = resolve(raiz, 'dist');
const shots = resolve(raiz, 'screenshots');
await mkdir(shots, { recursive: true });

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const buf = await readFile(join(dist, p));
    res.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(4179, r));
const URL0 = 'http://localhost:4179/';

const falhas = [];
const passos = [];
const ok = (m) => { passos.push(m); };

async function semAcao(page, tela) {
  // Todo botão precisa ter onClick (ou estar dentro de label/form); todo link precisa de href.
  const r = await page.evaluate(() => {
    const ruins = [];
    document.querySelectorAll('button, a').forEach((el) => {
      if (el.tagName === 'A') { if (!el.getAttribute('href')) ruins.push('a: ' + el.textContent.trim()); return; }
      const k = Object.keys(el).find((x) => x.startsWith('__reactProps'));
      const props = k ? el[k] : {};
      if (!props.onClick && el.type !== 'submit') ruins.push('button: ' + (el.getAttribute('aria-label') || el.textContent.trim()));
    });
    return ruins;
  });
  if (r.length) falhas.push(`[${tela}] elementos sem ação: ${r.join(' | ')}`);
}

async function shot(page, nome, tema) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(shots, `${tema}-${nome}.png`) });
}

async function rodar(tema) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: tema, locale: 'pt-BR', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) erros.push('requestfailed: ' + r.url()); });
  const tab = (nome) => page.locator('.fp-tabbar').getByRole('button', { name: new RegExp(nome + '$') });
  const ir = async (h) => { await page.goto(URL0 + '#/' + h); await page.waitForTimeout(150); };

  await page.goto(URL0);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(tema);
  ok('tema ' + tema);

  // Todas as rotas abrem direto
  for (const t of ['painel', 'lancamentos', 'detalhe', 'classificar', 'novo', 'orcamento', 'metas', 'ajustes', 'categorias', 'regras']) {
    await ir(t);
    await expect(page.locator('.tela')).toBeVisible();
    await semAcao(page, t);
    await shot(page, t, tema);
  }
  ok('rotas diretas + screenshots');

  // ---------- Painel ----------
  await ir('painel');
  await expect(page.getByText('Sobrou no mês')).toBeVisible();
  await expect(page.locator('.fp-tabbar__badge')).toHaveText('3');
  await page.getByRole('button', { name: /Novembro 2026/ }).click();
  await expect(page.getByRole('dialog', { name: 'Escolher mês' })).toBeVisible();
  await semAcao(page, 'painel/mes');
  await shot(page, 'painel-mes', tema);
  await page.getByRole('dialog').getByRole('button', { name: /Outubro 2026/ }).click();
  await expect(page.getByRole('button', { name: /Outubro 2026/ })).toBeVisible();
  await expect(page.getByText('Para onde foi')).toBeVisible();
  await page.getByRole('button', { name: /Outubro 2026/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Novembro 2026/ }).click();
  await expect(page.getByRole('button', { name: /Novembro 2026/ })).toBeVisible();
  ok('painel: trocar mês');
  await page.getByRole('link', { name: 'Ver tudo' }).click(); await expect(page.locator('h1')).toHaveText('Orçamento');
  await ir('painel'); await page.getByRole('link', { name: 'Ver todos' }).click(); await expect(page.locator('h1')).toHaveText('Lançamentos');
  await ir('painel'); await page.getByRole('link', { name: 'Ajustes' }).click(); await expect(page.locator('h1')).toHaveText('Ajustes');
  ok('painel: links');

  // ---------- Classificar ----------
  await ir('painel');
  await page.getByRole('link', { name: /3 lançamentos para classificar/ }).click();
  await expect(page.getByText('1 de 3')).toBeVisible();
  await expect(page.getByText('Sugerida pelo Claude')).toBeVisible();
  await page.getByRole('button', { name: /Sugerida pelo Claude/ }).click();
  const dlg = page.getByRole('dialog', { name: 'Escolher categoria' });
  await expect(dlg).toBeVisible();
  await semAcao(page, 'classificar/categoria');
  await shot(page, 'classificar-categoria', tema);
  await dlg.getByRole('searchbox').fill('laz');
  await expect(dlg.getByRole('button', { name: 'Mercado' })).toHaveCount(0);
  await dlg.getByRole('button', { name: 'Lazer' }).click();
  await expect(page.getByText('Escolhida por você · sugestão era Outros')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Criar regra' }).uncheck({ force: true });
  await page.getByRole('button', { name: 'Classificar como Lazer' }).click();
  await expect(page.getByText('2 de 3')).toBeVisible();
  await page.getByRole('button', { name: 'Classificar como Cuidados pessoais' }).click();
  await expect(page.getByText('3 de 3')).toBeVisible();
  await page.getByRole('button', { name: 'Pular por agora' }).click();
  await expect(page.getByText('1 ficou para depois')).toBeVisible();
  await expect(page.locator('.fp-tabbar__badge')).toHaveCount(0); // sem tab bar aqui
  await page.getByRole('button', { name: 'Classificar os que ficaram' }).click();
  await expect(page.getByText('1 de 1')).toBeVisible();
  await page.getByRole('button', { name: 'Classificar como Compras' }).click();
  await expect(page.getByText('Tudo classificado')).toBeVisible();
  await shot(page, 'classificar-fim', tema);
  await page.getByRole('link', { name: 'Voltar ao Painel' }).click();
  await expect(page.getByText(/para classificar/)).toHaveCount(0);
  await expect(page.locator('.fp-tabbar__badge')).toHaveCount(0);
  ok('classificar 3 itens, badge zerado');
  await ir('regras');
  await expect(page.getByText('STUDIO PILATES')).toBeVisible();
  await expect(page.getByText('ZP*ARR')).toBeVisible();
  await expect(page.getByText('DESCENDENCIA')).toHaveCount(0);
  ok('classificar: regras criadas só com o interruptor ligado');
  await ir('classificar');
  await expect(page.getByText('Tudo classificado')).toBeVisible();
  await page.getByRole('button', { name: 'Ver de novo (demonstração)' }).click();
  await expect(page.getByText('1 de 3')).toBeVisible();
  await ir('painel');
  await expect(page.locator('.fp-tabbar__badge')).toHaveText('3');
  ok('classificar: demonstração de novo');

  // ---------- Lançamentos ----------
  await tab('Lançamentos').click();
  await expect(page.locator('h1')).toHaveText('Lançamentos');
  const busca = page.getByPlaceholder('Buscar por descrição ou categoria');
  await busca.fill('sonda');
  await expect(page.locator('.fp-row')).toHaveCount(1);
  await busca.fill('xyzw');
  await expect(page.getByText('Nenhum lançamento com “xyzw”.')).toBeVisible();
  await busca.fill('');
  await page.getByRole('tab', { name: 'Entradas' }).click();
  await expect(page.locator('.fp-row')).toHaveCount(1);
  await expect(page.getByText('+R$ 7.450,00', { exact: true }).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Despesas' }).click();
  expect(await page.locator('.fp-money--entrada').count()).toBe(0);
  await page.getByRole('tab', { name: 'Tudo' }).click();
  await page.getByRole('button', { name: 'Importar do Itaú agora' }).click();
  await expect(page.getByText(/Itaú consultado agora/)).toBeVisible();
  await shot(page, 'lancamentos-aviso', tema);
  ok('lançamentos: buscar, filtrar, importar');
  await page.locator('a[href^="#/classificar?id="]').first().click();
  await expect(page.locator('h1')).toHaveText('A classificar');
  ok('lançamentos: pendente abre A classificar');

  // ---------- Detalhe ----------
  await ir('lancamentos');
  await page.getByRole('link', { name: /Sonda Supermercados/ }).click();
  await expect(page.locator('h1')).toHaveText('Sonda Supermercados');
  await expect(page.getByText('Toda descrição com “SONDA” vira Mercado.')).toBeVisible();
  await page.getByRole('button', { name: /Categoria\s*Mercado/ }).click();
  const tc = page.getByRole('dialog', { name: 'Trocar categoria' });
  await tc.getByRole('button', { name: 'Alimentação fora' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Atualizar regra' })).toBeVisible();
  await shot(page, 'detalhe-regra', tema);
  await page.getByRole('button', { name: 'Sim, atualizar regra' }).click();
  await expect(page.getByText('Categoria e regra atualizadas na planilha.')).toBeVisible();
  await expect(page.getByText('Toda descrição com “SONDA” vira Alimentação fora.')).toBeVisible();
  await page.getByRole('button', { name: /Categoria\s*Alimentação fora/ }).click();
  await page.getByRole('dialog', { name: 'Trocar categoria' }).getByRole('button', { name: 'Mercado' }).click();
  await page.getByRole('button', { name: 'Só este lançamento' }).click();
  await expect(page.getByText('Categoria trocada só neste lançamento.')).toBeVisible();
  ok('detalhe: trocar categoria + pergunta da regra');
  await page.locator('#obs').fill('compra do mês');
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByRole('dialog', { name: 'Editar lançamento' })).toBeVisible();
  await semAcao(page, 'detalhe/editar');
  await shot(page, 'detalhe-editar', tema);
  await page.locator('#edesc').fill('Sonda Teste');
  await page.locator('#evalor').fill('600,50');
  await page.locator('#edata').fill('2026-11-04');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('h1')).toHaveText('Sonda Teste');
  await expect(page.getByText('Lançamento atualizado na planilha.')).toBeVisible();
  await expect(page.getByText('Qua, 04/11/2026')).toBeVisible();
  const urlDet = page.url();
  await page.reload();
  await expect(page.locator('#obs')).toHaveValue('compra do mês');
  await expect(page.locator('h1')).toHaveText('Sonda Teste');
  ok('detalhe: editar + observação persistem');
  await page.getByRole('button', { name: 'Excluir lançamento' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Excluir lançamento' })).toBeVisible();
  await shot(page, 'detalhe-excluir', tema);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir lançamento' }).click();
  await expect(page.locator('h1')).toHaveText('Lançamentos');
  await expect(page.getByText('Sonda Teste')).toHaveCount(0);
  await page.goto(urlDet);
  await expect(page.getByText('Este lançamento não existe mais.')).toBeVisible();
  ok('detalhe: excluir');

  // ---------- Novo ----------
  await ir('painel');
  await tab('Novo lançamento').click();
  await expect(page.getByRole('heading', { name: 'Novo lançamento' })).toBeVisible();
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByText('Digite o valor para salvar.')).toBeVisible();
  await page.getByRole('tab', { name: 'Entrada' }).click();
  await expect(page.getByText('Salário', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Reserva' }).click();
  await expect(page.getByText('Reserva de emergência', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Despesa' }).click();
  await page.getByPlaceholder('0,00').fill('123,45');
  await page.locator('#desc').fill('Teste E2E');
  await page.getByRole('button', { name: /toque para trocar/ }).click();
  await page.getByRole('dialog', { name: 'Escolher categoria' }).getByRole('button', { name: 'Lazer' }).click();
  await page.getByRole('button', { name: /Conta/ }).click();
  await semAcao(page, 'novo/conta');
  await shot(page, 'novo-conta', tema);
  await page.getByRole('dialog', { name: 'Conta' }).getByRole('button', { name: 'Dinheiro' }).click();
  await page.getByRole('button', { name: /Forma/ }).click();
  await page.getByRole('dialog', { name: 'Forma' }).getByRole('button', { name: 'Crédito' }).click();
  await page.getByRole('button', { name: /Data/ }).click();
  await page.getByRole('dialog', { name: 'Data' }).getByRole('button', { name: /Ontem/ }).click();
  await page.getByRole('button', { name: /Parcelas/ }).click();
  await page.getByRole('dialog', { name: 'Parcelas' }).getByRole('button', { name: '3x' }).click();
  await shot(page, 'novo-preenchido', tema);
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByText('Sobrou no mês')).toBeVisible();
  await tab('Lançamentos').click();
  await expect(page.getByText('Teste E2E')).toBeVisible();
  await expect(page.locator('.fp-row', { hasText: 'Teste E2E' }).getByText('1/3')).toBeVisible();
  await expect(page.locator('.fp-row', { hasText: 'Teste E2E' }).getByText('R$ 41,15')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Teste E2E')).toBeVisible();
  ok('novo: criar lançamento parcelado, aparece na lista e persiste');
  await ir('novo');
  await page.getByRole('link', { name: 'Cancelar' }).click();
  await expect(page.getByText('Sobrou no mês')).toBeVisible();
  ok('novo: cancelar');

  // ---------- Orçamento ----------
  await tab('Orçamento').click();
  await expect(page.getByText('Gasto do orçado · novembro')).toBeVisible();
  await page.getByRole('tab', { name: '3 meses' }).click();
  await expect(page.getByText('Gasto do orçado · set a nov')).toBeVisible();
  await page.getByRole('tab', { name: 'Ano' }).click();
  await expect(page.getByText('Gasto do orçado · 2026')).toBeVisible();
  await page.getByRole('tab', { name: 'Mês' }).click();
  await page.getByRole('link', { name: 'Editar categorias e valores' }).click();
  await expect(page.locator('h1')).toHaveText('Categorias');
  ok('orçamento: períodos e link');

  // ---------- Metas ----------
  await ir('metas');
  await page.getByRole('button', { name: 'Nova meta' }).click();
  await expect(page.getByRole('dialog', { name: 'Nova meta' })).toBeVisible();
  await shot(page, 'metas-nova', tema);
  await page.locator('#nome').fill('Notebook');
  await page.locator('#alvo').fill('5.000');
  await page.locator('#mensal').fill('500');
  await expect(page.getByText('R$ 500 por mês · faltam 10 meses')).toBeVisible();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Notebook')).toBeVisible();
  await expect(page.getByText('Em 4 metas')).toBeVisible();
  await page.getByRole('button', { name: /Notebook/ }).click();
  await page.locator('#aporte').fill('200');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('R$ 200 de R$ 5.000')).toBeVisible();
  await shot(page, 'metas-editar', tema);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('.fp-goal', { hasText: 'Notebook' }).getByText('4%')).toBeVisible();
  await ir('lancamentos');
  await expect(page.locator('.fp-row', { hasText: 'Notebook' }).first()).toBeVisible();
  await ir('metas');
  await page.getByRole('button', { name: /Notebook/ }).click();
  await page.getByRole('button', { name: 'Excluir meta' }).click();
  await expect(page.getByText('Em 3 metas')).toBeVisible();
  await page.getByRole('button', { name: /Viagem de férias/ }).click();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  ok('metas: nova, guardar dinheiro, excluir');

  // ---------- Ajustes ----------
  await ir('ajustes');
  const sw = page.getByRole('checkbox', { name: 'Avisar quando chegar lançamento' });
  await expect(sw).not.toBeChecked();
  await sw.check({ force: true });
  await page.getByRole('checkbox', { name: 'Importar todo dia' }).uncheck({ force: true });
  await page.getByRole('checkbox', { name: 'Classificar com o Claude' }).uncheck({ force: true });
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Avisar quando chegar lançamento' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Importar todo dia' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Importar todo dia' }).check({ force: true });
  await page.getByRole('checkbox', { name: 'Classificar com o Claude' }).check({ force: true });
  await page.getByRole('button', { name: 'Importar agora' }).click();
  await expect(page.getByRole('button', { name: 'Nada novo desde 07:02' })).toBeVisible();
  await expect(page.getByText('Conexão com a planilha: em breve')).toBeVisible();
  expect(await page.locator('a[href*="docs.google"]').count()).toBe(0);
  ok('ajustes: toggles persistem, importar agora');

  // ---------- Categorias ----------
  await page.getByRole('link', { name: /Categorias/ }).click();
  await page.getByRole('button', { name: 'Nova' }).click();
  await page.locator('#nome').fill('Farmácia');
  await page.locator('#orc').fill('150');
  await page.getByRole('button', { name: 'Vermelho (R$ 10)' }).click();
  await page.getByRole('button', { name: 'saude', exact: true }).click();
  await shot(page, 'categorias-nova', tema);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('button', { name: /Farmácia/ })).toBeVisible();
  await ir('novo');
  await page.getByRole('button', { name: /toque para trocar/ }).click();
  await page.getByRole('dialog').getByRole('searchbox').fill('farm');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Farmácia' })).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: 'Nova categoria' }).click();
  await expect(page.getByRole('dialog', { name: 'Nova categoria' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await ir('regras');
  await page.getByRole('button', { name: 'Nova' }).click();
  await expect(page.locator('#cat option', { hasText: 'Farmácia' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Cancelar' }).click();
  ok('categorias: criar e aparecer nos seletores');
  await ir('categorias');
  await page.getByRole('button', { name: /Farmácia/ }).click();
  await page.getByRole('tab', { name: 'Fixa' }).click();
  await page.locator('#nome').fill('Farmácia e drogaria');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('button', { name: /Farmácia e drogaria/ })).toBeVisible();
  await page.getByRole('button', { name: /Farmácia e drogaria/ }).click();
  await page.getByRole('button', { name: 'Excluir categoria' }).click();
  await expect(page.getByText('Farmácia e drogaria')).toHaveCount(0);
  await page.getByRole('button', { name: /Petshop/ }).click();
  await page.getByRole('link', { name: /Regras desta categoria/ }).click();
  await expect(page.getByText('Mostrando só Petshop.')).toBeVisible();
  await expect(page.getByText('VETCARE')).toBeVisible();
  await page.getByRole('link', { name: 'Ver todas' }).click();
  ok('categorias: editar, excluir, regras da categoria');

  // ---------- Regras ----------
  await ir('regras');
  await page.getByRole('button', { name: 'Nova' }).click();
  await page.locator('#chave').fill('drogasil');
  await expect(page.locator('#chave')).toHaveValue('DROGASIL');
  await page.locator('#cat').selectOption({ label: 'Saúde' });
  await shot(page, 'regras-nova', tema);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('button', { name: /DROGASIL/ })).toBeVisible();
  await page.getByRole('button', { name: /DROGASIL/ }).click();
  await page.locator('#cat').selectOption({ label: 'Compras' });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('button', { name: /DROGASIL.*Compras/ })).toBeVisible();
  await page.getByRole('button', { name: /DROGASIL/ }).click();
  await page.getByRole('button', { name: 'Excluir regra' }).click();
  await expect(page.getByText('DROGASIL')).toHaveCount(0);
  ok('regras: criar, editar, excluir');

  // ---------- Categoria excluída devolve lançamentos ----------
  await ir('categorias');
  await page.getByRole('button', { name: /Petshop/ }).click();
  await page.getByRole('button', { name: 'Excluir categoria' }).click();
  await ir('painel');
  await expect(page.locator('.fp-tabbar__badge')).toHaveText('5');
  ok('categorias: excluir devolve para A classificar');

  // ---------- Restaurar ----------
  await ir('ajustes');
  await page.getByRole('button', { name: 'Restaurar dados de exemplo' }).click();
  await shot(page, 'ajustes-restaurar', tema);
  await page.getByRole('button', { name: 'Restaurar dados', exact: true }).click();
  await expect(page.getByText('Dados de exemplo restaurados.')).toBeVisible();
  await ir('painel');
  await expect(page.locator('.fp-tabbar__badge')).toHaveText('3');
  await ir('lancamentos');
  await expect(page.getByText('Teste E2E')).toHaveCount(0);
  ok('ajustes: restaurar dados de exemplo');

  // ---------- Tab bar e voltar ----------
  for (const [t, h] of [['Painel', null], ['Lançamentos', 'Lançamentos'], ['Orçamento', 'Orçamento'], ['Metas', 'Metas']]) {
    await tab(t).click();
    if (h) await expect(page.locator('h1')).toHaveText(h); else await expect(page.getByText('Sobrou no mês')).toBeVisible();
  }
  for (const [rota, link, alvo] of [['detalhe', 'Lançamentos', 'Lançamentos'], ['classificar', 'Painel', null], ['categorias', 'Ajustes', 'Ajustes'], ['regras', 'Ajustes', 'Ajustes'], ['ajustes', 'Painel', null]]) {
    await ir(rota);
    await page.getByRole('link', { name: link, exact: true }).first().click();
    if (alvo) await expect(page.locator('h1')).toHaveText(alvo); else await expect(page.getByText('Sobrou no mês')).toBeVisible();
  }
  ok('tab bar e voltar');

  // Sem rolagem horizontal; inputs com fonte >= 16px
  for (const t of ['painel', 'lancamentos', 'novo', 'metas', 'categorias']) {
    await ir(t);
    const r = await page.evaluate(() => ({ larg: document.documentElement.scrollWidth, pequenos: [...document.querySelectorAll('input, select, textarea')].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16).length }));
    if (r.larg > 390) falhas.push(`[${t}] rolagem horizontal: ${r.larg}px`);
    if (r.pequenos) falhas.push(`[${t}] ${r.pequenos} campo(s) com fonte < 16px`);
  }

  // PWA
  const man = await page.evaluate(async () => (await fetch('./manifest.webmanifest')).json());
  expect(man.display).toBe('standalone');
  for (const i of man.icons) { const s = await page.evaluate(async (src) => (await fetch(src)).status, i.src); expect(s).toBe(200); }
  ok('manifest e ícones');

  if (erros.length) falhas.push(`[${tema}] console: \n  ` + erros.join('\n  '));
  await browser.close();
}

try {
  for (const tema of ['light', 'dark']) {
    try { await rodar(tema); } catch (e) { falhas.push(`[${tema}] ${e.message.split('\n').slice(0, 6).join(' ')}`); }
  }
} finally {
  server.close();
}
console.log('Passos OK (' + passos.length + '):\n- ' + passos.join('\n- '));
if (falhas.length) { console.log('\nFALHAS:\n' + falhas.join('\n')); process.exit(1); }
console.log('\nTudo certo nos dois temas.');
