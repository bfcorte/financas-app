// Configuração da conexão: fica só neste aparelho (localStorage). Nada disso vai para o repositório.
const CHAVE = 'financas:conexao';
const CACHE = 'financas:cache';

function ler(k) { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
function gravar(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignora */ } }

function novoDeviceId() {
  try { return 'dev-' + crypto.randomUUID(); } catch (e) { return 'dev-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
}

export function lerConexao() {
  const c = ler(CHAVE);
  return c && c.api && c.token ? c : null;
}

export function salvarConexao(c) {
  const atual = ler(CHAVE) || {};
  const nova = { ...atual, ...c, deviceId: atual.deviceId || c.deviceId || novoDeviceId() };
  gravar(CHAVE, nova);
  return nova;
}

export function apagarConexao() {
  gravar(CHAVE, null);
  gravar(CACHE, null);
}

export function lerCache() { return ler(CACHE); }
export function salvarCache(dados) { gravar(CACHE, { dados, em: Date.now() }); }

export function urlValida(u) {
  try { const x = new URL(u); return x.protocol === 'https:'; } catch (e) { return false; }
}
