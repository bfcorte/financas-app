// Teste ponta a ponta do build (dist/) contra a API REAL da planilha, em viewport de iPhone.
// Só cria/edita/apaga registros "TESTE ...". Uso:
//   FINANCAS_CONFIG=apps-script/.segredos.json node scripts/e2e.mjs [--sem-planilha]
// Na etapa de edição manual o teste grava o id em $E2E_TROCA/teste-id.txt e espera $E2E_TROCA/editado.txt.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, access, rm } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = resolve(raiz, 'dist');
const shots = resolve(raiz, 'screenshots');
await mkdir(shots, { recursive: true });
const cfgArq = process.env.FINANCAS_CONFIG;
if (!cfgArq) { console.error('Defina FINANCAS_CONFIG'); process.exit(2); }
const S = JSON.parse(await readFile(cfgArq, 'utf8'));
const SEM_PLANILHA = process.argv.includes('--sem-planilha');
const TROCA = process.env.E2E_TROCA || '/tmp/financas-e2e';
await mkdir(TROCA, { recursive: true });
const SINAL = join(TROCA, 'editado.txt');
await rm(SINAL, { force: true });

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(dist, p)); res.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(4179, r));
const URL0 = 'http://localhost:4179/';

// API direta (para conferir o que ficou na planilha)
const tudo = async () => (await fetch(S.apiUrl + '?acao=tudo&token=' + encodeURIComponent(S.appToken))).json();
const post = async (acao, dados) => (await fetch(S.apiUrl, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ acao, token: S.appToken, dados }) })).json();
const esperar = async (fn, ms = 60000, passo = 2500) => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await new Promise((r) => setTimeout(r, passo)); } };

const falhas = [];
const passos = [];
const ok = (m) => { passos.push(m); console.log('✓ ' + m); };
const CONEXAO = { api: S.apiUrl, token: S.appToken, push: S.pushUrl, ps: S.subscribeSecret, deviceId: 'dev-e2e-playwright' };

async function semAcao(page, tela) {
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
  if (r.length) falhas.push(`[${tela}] sem ação: ${r.join(' | ')}`);
}
const shot = async (page, nome, tema) => { await page.waitForTimeout(300); await page.screenshot({ path: join(shots, `${tema}-${nome}.png`) }); };

async function novoContexto(browser, tema) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: tema, locale: 'pt-BR', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => erros.push('requestfailed: ' + r.url().replace(/token=[^&]+/, 'token=***').slice(0, 140) + ' ' + (r.failure() || {}).errorText));
  return { ctx, page, erros };
}

async function rodarLeitura(browser, tema) {
  const { ctx, page, erros } = await novoContexto(browser, tema);
  // 1) Sem conexão configurada: tela "Conectar à planilha"; dados inválidos dão erro
  await page.goto(URL0 + '#/painel');
  await expect(page.getByRole('heading', { name: 'Conectar à planilha' })).toBeVisible();
  await shot(page, 'setup', tema);
  await page.locator('#api').fill('https://script.google.com/macros/s/exemplo-invalido/exec');
  await page.locator('#token').fill('token-de-teste-invalido-123456');
  await page.getByRole('button', { name: 'Conectar' }).click();
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 30000 });
  await semAcao(page, 'setup');
  erros.length = 0; // o erro de CORS da URL inválida acima é esperado
  ok(tema + ': setup recusa conexão inválida');

  // 2) Link de configuração (#/setup?...): salva no aparelho e limpa a URL
  const q = new URLSearchParams({ api: CONEXAO.api, token: CONEXAO.token, push: CONEXAO.push, ps: CONEXAO.ps }).toString();
  await page.goto(URL0 + '#/setup?' + q);
  await page.reload();
  await expect(page.getByText('Sobrou no mês')).toBeVisible({ timeout: 60000 });
  expect(page.url()).not.toContain('token=');
  ok(tema + ': link de configuração conecta e some da URL');

  // 3) Painel com dados reais e troca de mês
  await page.waitForTimeout(1500);
  await shot(page, 'painel', tema);
  await semAcao(page, 'painel');
  const btnMes = page.getByRole('button', { name: /\d{4}$/ }).first();
  const mesAtual = (await btnMes.textContent()).trim();
  await btnMes.click();
  const dlg = page.getByRole('dialog', { name: 'Escolher mês' });
  await expect(dlg).toBeVisible();
  await shot(page, 'painel-mes', tema);
  const outros = dlg.getByRole('button').filter({ hasNotText: mesAtual });
  if (await outros.count()) {
    const alvo = (await outros.first().locator('span').first().textContent()).trim();
    await outros.first().click();
    await expect(page.getByRole('button', { name: new RegExp(alvo) })).toBeVisible();
    await shot(page, 'painel-outro-mes', tema);
    await page.getByRole('button', { name: new RegExp(alvo) }).click();
    await page.getByRole('dialog').getByRole('button', { name: new RegExp(mesAtual) }).click();
  } else { await page.keyboard.press('Escape'); }
  ok(tema + ': painel com dados reais, trocar mês');

  // 4) Lançamentos: buscar, filtrar, abrir detalhe
  await page.locator('.fp-tabbar').getByRole('button', { name: /Lançamentos$/ }).click();
  await expect(page.locator('h1')).toHaveText('Lançamentos');
  await shot(page, 'lancamentos', tema);
  await semAcao(page, 'lancamentos');
  const linhas = page.locator('.fp-row');
  const n0 = await linhas.count();
  await page.getByPlaceholder('Buscar por descrição ou categoria').fill('zzqqxx');
  await expect(page.getByText('Nenhum lançamento com “zzqqxx”.')).toBeVisible();
  await page.getByPlaceholder('Buscar por descrição ou categoria').fill('');
  await page.getByRole('tab', { name: 'Entradas' }).click();
  const nEnt = await linhas.count();
  expect(await page.locator('.fp-row .fp-money--despesa').count()).toBe(0);
  await page.getByRole('tab', { name: 'Despesas' }).click();
  expect(await page.locator('.fp-row .fp-money--entrada').count()).toBe(0);
  await page.getByRole('tab', { name: 'Tudo' }).click();
  expect(await linhas.count()).toBe(n0);
  ok(tema + `: lançamentos buscar/filtrar (${n0} no mês, ${nEnt} entradas)`);
  if (n0) {
    await page.locator('a[href^="#/detalhe/"]').first().click();
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible();
    await shot(page, 'detalhe', tema);
    await semAcao(page, 'detalhe');
    ok(tema + ': abrir detalhe');
  }

  // 5) Demais telas renderizam e não têm botão sem ação
  for (const t of ['orcamento', 'metas', 'ajustes', 'categorias', 'regras', 'classificar', 'novo']) {
    await page.goto(URL0 + '#/' + t);
    await page.waitForTimeout(800);
    await shot(page, t, tema);
    await semAcao(page, t);
  }
  await page.goto(URL0 + '#/orcamento');
  for (const p of ['3 meses', 'Ano', 'Mês']) await page.getByRole('tab', { name: p }).click();
  ok(tema + ': demais telas sem botão sem ação');

  // 6) Offline: mostra o cache com a faixa e bloqueia edição
  await page.goto(URL0 + '#/painel');
  await expect(page.getByText('Sobrou no mês')).toBeVisible();
  await page.waitForTimeout(1000);
  await ctx.setOffline(true);
  await page.reload().catch(() => {});
  await expect(page.getByText(/Sem conexão: mostrando dados de \d\d:\d\d/)).toBeVisible({ timeout: 30000 });
  await shot(page, 'offline', tema);
  await page.evaluate(() => { location.hash = '#/novo'; });
  await page.getByPlaceholder('0,00').fill('1,00');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByText('Sem conexão: não dá para lançar agora.')).toBeVisible();
  await ctx.setOffline(false);
  ok(tema + ': offline mostra cache e bloqueia edição');

  // Sem rolagem horizontal; inputs com fonte >= 16px
  for (const t of ['painel', 'lancamentos', 'novo', 'metas', 'ajustes', 'categorias']) {
    await page.goto(URL0 + '#/' + t);
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({ larg: document.documentElement.scrollWidth, pequenos: [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]), select, textarea')].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16).length }));
    if (r.larg > 390) falhas.push(`[${tema}/${t}] rolagem horizontal: ${r.larg}px`);
    if (r.pequenos) falhas.push(`[${tema}/${t}] ${r.pequenos} campo(s) com fonte < 16px`);
  }
  // ERR_ABORTED = requisição cortada por recarregar/navegar; o resto do offline é esperado no passo 6
  const filtrados = erros.filter((e) => !/ERR_INTERNET_DISCONNECTED|ERR_ABORTED|Failed to fetch|ERR_NAME_NOT_RESOLVED|status of 4\d\d/.test(e));
  if (filtrados.length) falhas.push(`[${tema}] console:\n  ` + filtrados.join('\n  '));
  await ctx.close();
}

async function rodarEscrita(browser, tema) {
  const { ctx, page, erros } = await novoContexto(browser, tema);
  await ctx.addInitScript((c) => { try { if (!localStorage.getItem('financas:conexao')) localStorage.setItem('financas:conexao', JSON.stringify(c)); } catch (e) {} }, CONEXAO);
  const tab = (n) => page.locator('.fp-tabbar').getByRole('button', { name: new RegExp(n + '$') });
  await page.goto(URL0 + '#/painel');
  await expect(page.getByText('Sobrou no mês')).toBeVisible({ timeout: 60000 });

  // ---------- lançamento TESTE APP ----------
  await tab('Novo lançamento').click();
  await page.getByPlaceholder('0,00').fill('1,00');
  await page.locator('#desc').fill('TESTE APP');
  await page.getByRole('button', { name: /toque para trocar|Escolher categoria/ }).click();
  const pick = page.getByRole('dialog', { name: 'Escolher categoria' });
  await pick.getByRole('searchbox').fill('Mercado');
  await pick.getByRole('button', { name: 'Mercado', exact: true }).click();
  await shot(page, 'novo-teste', tema);
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByText('Lançamento salvo na planilha.')).toBeVisible({ timeout: 60000 });
  const criado = await esperar(async () => (await tudo()).lancamentos.find((l) => l.desc === 'TESTE APP'));
  if (!criado) throw new Error('TESTE APP não apareceu na planilha');
  expect(criado.valor).toBe(1); expect(criado.cat).toBe('Mercado'); expect(criado.origem).toBe('Manual'); expect(criado.id.startsWith('man-')).toBe(true);
  ok('planilha: TESTE APP criado pelo app (R$ 1,00, Mercado, Manual, ' + criado.data + ')');

  await page.goto(URL0 + '#/detalhe/' + criado.id);
  await expect(page.locator('h1')).toHaveText('TESTE APP', { timeout: 30000 });
  await page.getByRole('button', { name: 'Editar' }).click();
  await page.locator('#evalor').fill('2,50');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Lançamento atualizado na planilha.')).toBeVisible({ timeout: 60000 });
  expect(await esperar(async () => (await tudo()).lancamentos.find((l) => l.id === criado.id && l.valor === 2.5))).toBeTruthy();
  ok('planilha: valor editado para R$ 2,50');

  await page.getByRole('button', { name: /Categoria\s*Mercado/ }).click();
  const tc = page.getByRole('dialog', { name: 'Trocar categoria' });
  await tc.getByRole('searchbox').fill('Compras');
  await tc.getByRole('button', { name: 'Compras', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 60000 });
  await shot(page, 'detalhe-regra', tema);
  await page.getByRole('button', { name: 'Só este lançamento' }).click();
  expect(await esperar(async () => (await tudo()).lancamentos.find((l) => l.id === criado.id && l.cat === 'Compras'))).toBeTruthy();
  ok('planilha: categoria trocada para Compras (pergunta da regra respondida)');

  // ---------- edição direta na planilha → app em ~10s ----------
  if (!SEM_PLANILHA) {
    await writeFile(join(TROCA, 'teste-id.txt'), criado.id);
    console.log('AGUARDANDO_EDICAO_MANUAL');
    const sinal = await esperar(async () => { try { await access(SINAL); return true; } catch { return false; } }, 20 * 60000, 1000);
    if (!sinal) throw new Error('Edição manual não sinalizada');
    const t0 = Number((await readFile(SINAL, 'utf8')).trim()) || Date.now();
    await expect(page.locator('h1')).toHaveText('TESTE APP EDITADO', { timeout: 30000 });
    const seg = Math.round((Date.now() - t0) / 100) / 10;
    ok('tempo real: edição feita na planilha apareceu no app em ' + seg + 's');
    if (seg > 15) falhas.push('edição manual demorou ' + seg + 's para aparecer');
  }

  await page.getByRole('button', { name: 'Excluir lançamento' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir lançamento' }).click();
  await expect(page.locator('h1')).toHaveText('Lançamentos');
  expect(await esperar(async () => !(await tudo()).lancamentos.some((l) => l.id === criado.id))).toBeTruthy();
  await expect(page.getByText(/TESTE APP/)).toHaveCount(0, { timeout: 20000 });
  ok('planilha e app: TESTE APP excluído dos dois lados');

  // ---------- categoria e regra de teste ----------
  await page.goto(URL0 + '#/categorias');
  await page.getByRole('button', { name: 'Nova' }).click();
  await page.locator('#nome').fill('TESTE CAT APP');
  await page.locator('#orc').fill('10');
  await page.getByRole('button', { name: 'Violeta (R$ 5)' }).click();
  await page.getByRole('button', { name: 'lazer', exact: true }).click();
  await shot(page, 'categorias-nova', tema);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Categoria criada na planilha.')).toBeVisible({ timeout: 60000 });
  const cat = await esperar(async () => (await tudo()).categorias.find((c) => c.nome === 'TESTE CAT APP'));
  expect(!!(cat && cat.orc === 10 && cat.grupo === 'Variável' && cat.icon === 'lazer' && cat.tone === 'nota-5')).toBe(true);
  ok('planilha: categoria TESTE CAT APP criada (Orçamento + aba App)');

  await page.getByRole('button', { name: /TESTE CAT APP/ }).click();
  await page.locator('#nome').fill('TESTE CAT APP 2');
  await page.locator('#orc').fill('20');
  await page.getByRole('button', { name: 'Salvar' }).click();
  expect(await esperar(async () => (await tudo()).categorias.find((c) => c.nome === 'TESTE CAT APP 2' && c.orc === 20))).toBeTruthy();
  ok('planilha: categoria renomeada e orçamento alterado');

  await page.goto(URL0 + '#/regras');
  await page.getByRole('button', { name: 'Nova' }).click();
  await page.locator('#chave').fill('teste regra app');
  await page.locator('#cat').selectOption({ label: 'TESTE CAT APP 2' });
  await page.getByRole('button', { name: 'Salvar' }).click();
  expect(await esperar(async () => (await tudo()).regras.find((r) => r.chave === 'TESTE REGRA APP' && r.cat === 'TESTE CAT APP 2'))).toBeTruthy();
  ok('planilha: regra TESTE REGRA APP criada');
  await page.getByRole('button', { name: /TESTE REGRA APP/ }).click();
  await page.locator('#chave').fill('TESTE REGRA APP 2');
  await page.getByRole('button', { name: 'Salvar' }).click();
  expect(await esperar(async () => (await tudo()).regras.find((r) => r.chave === 'TESTE REGRA APP 2'))).toBeTruthy();
  ok('planilha: regra editada');
  await page.getByRole('button', { name: /TESTE REGRA APP 2/ }).click();
  await page.getByRole('button', { name: 'Excluir regra' }).click();
  expect(await esperar(async () => !(await tudo()).regras.some((r) => r.chave.startsWith('TESTE REGRA')))).toBeTruthy();
  ok('planilha: regra excluída');

  await page.goto(URL0 + '#/categorias');
  await page.getByRole('button', { name: /TESTE CAT APP 2/ }).click();
  await page.getByRole('button', { name: 'Excluir categoria' }).click();
  expect(await esperar(async () => !(await tudo()).categorias.some((c) => c.nome.startsWith('TESTE CAT')))).toBeTruthy();
  ok('planilha: categoria excluída');

  const filtrados = erros.filter((e) => !/status of 4\d\d/.test(e));
  if (filtrados.length) falhas.push(`[${tema}/escrita] console:\n  ` + filtrados.join('\n  '));
  await ctx.close();
}

const browser = await chromium.launch();
try {
  if (!process.argv.includes('--so-escrita')) {
    for (const tema of ['light', 'dark']) {
      try { await rodarLeitura(browser, tema); } catch (e) { falhas.push(`[${tema}] ${e.message.split('\n').slice(0, 6).join(' ')}`); }
    }
  }
  if (!process.argv.includes('--so-leitura')) {
    try { await rodarEscrita(browser, 'light'); } catch (e) { falhas.push(`[escrita] ${e.message.split('\n').slice(0, 6).join(' ')}`); }
  }
} finally {
  // limpeza de segurança: nada de TESTE fica na planilha
  try {
    const t = await tudo();
    for (const l of t.lancamentos.filter((x) => /^TESTE APP/.test(x.desc))) await post('excluirLancamento', { id: l.id });
    for (const r of t.regras.filter((x) => /^TESTE REGRA/.test(x.chave))) await post('excluirRegra', { chave: r.chave });
    for (const c of t.categorias.filter((x) => /^TESTE CAT/.test(x.nome))) await post('excluirCategoria', { nome: c.nome });
  } catch (e) { falhas.push('limpeza: ' + e.message); }
  await browser.close();
  server.close();
}
console.log('\nPassos OK: ' + passos.length);
if (falhas.length) { console.log('\nFALHAS:\n' + falhas.join('\n')); process.exit(1); }
console.log('Tudo certo.');
