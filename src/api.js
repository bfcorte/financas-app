// Cliente da API do Apps Script. GET para leitura; POST text/plain (sem preflight) para escrita.
import { lerConexao } from './conexao.js';

export class ErroApi extends Error {
  constructor(msg, tipo) { super(msg); this.tipo = tipo; }
}

async function comTempo(url, opts, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal, redirect: 'follow', cache: 'no-store', credentials: 'omit' });
  } catch (e) {
    throw new ErroApi(e.name === 'AbortError' ? 'A planilha demorou para responder.' : 'Sem conexão com a planilha.', 'rede');
  } finally { clearTimeout(t); }
}

async function ler(resp) {
  let j;
  try { j = await resp.json(); } catch (e) { throw new ErroApi('Resposta inválida da planilha.', 'rede'); }
  if (!j.ok) {
    if (j.erro === 'nao_autorizado') throw new ErroApi('Token inválido. Conecte de novo em Ajustes.', 'auth');
    throw new ErroApi(j.erro || 'Erro na planilha.', 'api');
  }
  return j;
}

export async function apiGet(acao, conexao = lerConexao(), ms = 25000) {
  if (!conexao) throw new ErroApi('Não conectado.', 'auth');
  const url = conexao.api + (conexao.api.includes('?') ? '&' : '?') + 'acao=' + encodeURIComponent(acao) + '&token=' + encodeURIComponent(conexao.token);
  return ler(await comTempo(url, { method: 'GET' }, ms));
}

export async function apiPost(acao, dados, ms = 45000) {
  const c = lerConexao();
  if (!c) throw new ErroApi('Não conectado.', 'auth');
  const corpo = JSON.stringify({ acao, token: c.token, deviceId: c.deviceId, dados });
  return ler(await comTempo(c.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: corpo }, ms));
}
