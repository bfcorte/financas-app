import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { formatBRL } from './ds/index.js';
import { apiGet, apiPost, ErroApi } from './api.js';
import { lerConexao, lerCache, salvarCache, apagarConexao } from './conexao.js';

/* ---------- utilidades ---------- */
export const brl = (v) => 'R$ ' + formatBRL(v, { cents: false });
export const num = (s) => {
  const t = String(s == null ? '' : s).replace(/\s|R\$/g, '');
  if (/,/.test(t)) return Number(t.replace(/\./g, '').replace(',', '.')) || 0;
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, '')) || 0;
  return Number(t) || 0;
};
export const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const parseData = (iso) => { const p = String(iso).split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); };
export const isoData = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const hojeIso = () => isoData(new Date());
export const mesHoje = () => hojeIso().slice(0, 7);
export const ddmm = (iso) => { const p = String(iso).split('-'); return p[2] + '/' + p[1]; };
export const mesDe = (iso) => String(iso).slice(0, 7);
export const nomeMes = (ym) => { const p = ym.split('-'); return MESES[Number(p[1]) - 1] + ' ' + p[0]; };
export const mesAnterior = (ym, k = 1) => { const p = ym.split('-'); const d = new Date(Number(p[0]), Number(p[1]) - 1 - k, 1); return isoData(d).slice(0, 7); };
export const somaMes = (ym, k) => mesAnterior(ym, -k);
export const hhmm = (ms) => { const d = new Date(ms); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

export function rotuloDia(iso) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const d = parseData(iso);
  const dif = Math.round((hoje - d) / 86400000);
  if (dif === 0) return 'Hoje, ' + ddmm(iso);
  if (dif === 1) return 'Ontem, ' + ddmm(iso);
  return DIAS[d.getDay()] + ', ' + ddmm(iso);
}

export function rotuloQuando(isoDataHora) {
  if (!isoDataHora) return null;
  const d = new Date(isoDataHora);
  if (isNaN(d)) return null;
  const hh = hhmm(d.getTime());
  const r = rotuloDia(isoData(d));
  if (r.startsWith('Hoje')) return { dia: 'hoje', hora: hh, curto: 'Hoje, ' + hh };
  if (r.startsWith('Ontem')) return { dia: 'ontem', hora: hh, curto: 'Ontem, ' + hh };
  return { dia: 'em ' + ddmm(isoData(d)), hora: hh, curto: ddmm(isoData(d)) + ', ' + hh };
}

export const GRUPOS = ['Fixa', 'Variável', 'Reserva', 'Entrada', 'Transferência'];
export const PLURAL_GRUPO = { Fixa: 'Fixas', 'Variável': 'Variáveis', Reserva: 'Reservas', Entrada: 'Entradas', 'Transferência': 'Transferências' };
export const tipoDoGrupo = (g) => (g === 'Entrada' ? 'entrada' : g === 'Reserva' ? 'reserva' : g === 'Transferência' ? 'transferencia' : 'despesa');
export const kindMoney = (t) => (t === 'transferencia' ? 'neutro' : t);

// Palavra-chave sugerida para uma regra a partir da descrição do banco
export function chaveDe(desc) {
  let s = semAcento(desc).toUpperCase().replace(/\s+/g, ' ').trim();
  s = s.replace(/^(COMPRA (NO )?(DEBITO|CREDITO|CARTAO)|PIX (ENVIADO|RECEBIDO|TRANSF|QRS|QR)?|TRANSF(ERENCIA)?( ENVIADA| RECEBIDA)?|TED|DOC|PAG(TO|AMENTO)?( DE)?|BOLETO|DEB(ITO)? AUT(OR|OMATICO)?)\s+/, '');
  const pal = s.split(' ').filter((w) => w && !/^\d+$/.test(w));
  return (pal.slice(0, 2).join(' ') || s).slice(0, 30);
}

export function regraPara(regras, desc) {
  const d = semAcento(desc).toUpperCase();
  return regras.find((r) => r.chave && d.includes(semAcento(r.chave).toUpperCase())) || null;
}

/* ---------- seletores sobre os dados reais ---------- */
const VAZIO = { versao: 0, lancamentos: [], categorias: [], regras: [], metas: [], contas: [], formas: [], prefs: {}, status: {} };

export function useSeletores(d, mes) {
  return useMemo(() => {
    const catPorNome = {};
    d.categorias.forEach((c) => { catPorNome[c.nome] = c; });
    const tipoDe = (l) => (l.cat ? tipoDoGrupo(l.grupo || (catPorNome[l.cat] || {}).grupo) : 'despesa');
    const pendentes = d.lancamentos.filter((l) => !l.cat);
    const doMes = (ym) => d.lancamentos.filter((l) => l.mes === ym);
    const ordenar = (lista) => lista.map((l, i) => [l, i]).sort((a, b) => (a[0].data < b[0].data ? 1 : a[0].data > b[0].data ? -1 : b[1] - a[1])).map((x) => x[0]);
    const totais = (lista) => {
      let e = 0, desp = 0, g = 0;
      lista.forEach((l) => { const t = tipoDe(l); if (t === 'entrada') e += l.valor; else if (t === 'reserva') g += l.valor; else if (t === 'despesa') desp += l.valor; });
      return { entradas: e, despesas: desp, guardado: g, sobra: e - desp - g };
    };
    const contagem = (lista) => { const u = {}; lista.forEach((l) => { if (l.cat) u[l.cat] = (u[l.cat] || 0) + 1; }); return u; };
    const usoMes = contagem(doMes(mes));
    const usoTotal = contagem(d.lancamentos);
    const despesaCats = d.categorias.filter((c) => c.grupo === 'Fixa' || c.grupo === 'Variável');
    const maisUsadas = despesaCats.map((c, i) => [c, usoMes[c.nome] || 0, usoTotal[c.nome] || 0, i])
      .filter((x) => x[1] > 0 || x[2] > 0)
      .sort((a, b) => b[1] - a[1] || b[2] - a[2] || a[3] - b[3]).slice(0, 3).map((x) => x[0]);
    const doGrupo = (g) => d.categorias.filter((c) => c.grupo === g);
    const gruposPicker = (tipo) => {
      if (tipo === 'entrada') return [{ nome: 'Entradas', itens: doGrupo('Entrada') }];
      if (tipo === 'reserva') return [{ nome: 'Reservas', itens: doGrupo('Reserva') }];
      const ids = maisUsadas.map((c) => c.nome);
      const base = [
        { nome: 'Mais usadas', itens: maisUsadas },
        { nome: 'Fixas', itens: doGrupo('Fixa').filter((c) => !ids.includes(c.nome)) },
        { nome: 'Variáveis', itens: doGrupo('Variável').filter((c) => !ids.includes(c.nome)) },
      ];
      if (tipo === 'despesa') return base.concat([{ nome: 'Transferências', itens: doGrupo('Transferência') }]);
      return base.concat([
        { nome: 'Reservas', itens: doGrupo('Reserva') },
        { nome: 'Entradas', itens: doGrupo('Entrada') },
        { nome: 'Transferências', itens: doGrupo('Transferência') },
      ]);
    };
    const meses = Array.from(new Set([...d.lancamentos.map((l) => l.mes).filter(Boolean), mesHoje()])).sort().reverse();
    const sugestaoDe = (l) => {
      const m = /sugerida pelo claude\s*[:\-–]?\s*([^\n;|]+)/i.exec(l.obs || '');
      if (m && catPorNome[m[1].trim()]) return { cat: m[1].trim(), fonte: 'claude' };
      if (l.catManual && catPorNome[l.catManual]) return { cat: l.catManual, fonte: 'claude' };
      const r = regraPara(d.regras, l.desc);
      if (r && catPorNome[r.cat]) return { cat: r.cat, fonte: 'regra' };
      return null;
    };
    return { catPorNome, tipoDe, pendentes, doMes, ordenar, totais, maisUsadas, gruposPicker, meses, sugestaoDe };
  }, [d, mes]);
}

/* ---------- contexto: sincronização com a planilha ---------- */
const Ctx = createContext(null);
const POLL_MS = 5000;

function lerMesSalvo() { try { return window.localStorage.getItem('financas:mes') || ''; } catch (e) { return ''; } }

export function DadosProvider({ children }) {
  const [conexao, setConexao] = useState(lerConexao);
  const cache0 = useRef(lerCache()).current;
  const [d, setD] = useState(() => (cache0 && cache0.dados ? cache0.dados : null));
  const [atualizadoEm, setAtualizadoEm] = useState(() => (cache0 ? cache0.em : null));
  const [online, setOnline] = useState(true);
  const [erroAuth, setErroAuth] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [toast, setToast] = useState(null);
  const [mes, setMesState] = useState(() => lerMesSalvo() || mesHoje());
  const pendentes = useRef(0);
  const dRef = useRef(d);
  dRef.current = d;
  const buscando = useRef(null);
  const tToast = useRef(null);

  const avisar = useCallback((texto, tipo = 'erro') => {
    setToast({ texto, tipo, id: Date.now() });
    clearTimeout(tToast.current);
    tToast.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const aplicarTudo = useCallback((j) => {
    const dados = { ...VAZIO, ...j };
    delete dados.ok;
    setD(dados);
    setAtualizadoEm(Date.now());
    salvarCache(dados);
  }, []);

  const buscarTudo = useCallback(async () => {
    if (!lerConexao()) return;
    if (buscando.current) return buscando.current;
    const p = (async () => {
      setSincronizando(true);
      try {
        const j = await apiGet('tudo');
        setOnline(true); setErroAuth(false);
        if (pendentes.current === 0) aplicarTudo(j);
      } catch (e) {
        if (e.tipo === 'auth') setErroAuth(true); else setOnline(false);
        throw e;
      } finally {
        setSincronizando(false);
        buscando.current = null;
      }
    })();
    buscando.current = p;
    return p;
  }, [aplicarTudo]);

  const checarVersao = useCallback(async () => {
    if (!lerConexao() || pendentes.current > 0 || buscando.current) return;
    try {
      const j = await apiGet('versao', undefined, 15000);
      setOnline(true); setErroAuth(false);
      if (!dRef.current || j.versao !== dRef.current.versao) await buscarTudo().catch(() => {});
    } catch (e) {
      if (e.tipo === 'auth') setErroAuth(true); else setOnline(false);
    }
  }, [buscarTudo]);

  // primeira carga + polling com o app visível + volta para o app
  useEffect(() => {
    if (!conexao) return undefined;
    buscarTudo().catch(() => {});
    const id = setInterval(() => { if (document.visibilityState === 'visible') checarVersao(); }, POLL_MS);
    const vis = () => { if (document.visibilityState === 'visible') checarVersao(); };
    const on = () => checarVersao();
    const off = () => setOnline(false);
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [conexao, buscarTudo, checarVersao]);

  /* Executa uma ação: aplica na tela na hora, envia, e desfaz se falhar. */
  const executar = useCallback(async (acao, dados, otimista, opts = {}) => {
    if (!online && !opts.forcar) { avisar('Sem conexão: não dá para editar agora.'); return null; }
    const antes = dRef.current;
    if (otimista && antes) setD(otimista(antes));
    pendentes.current++;
    try {
      const r = await apiPost(acao, dados, opts.tempo || 45000);
      setOnline(true);
      return r;
    } catch (e) {
      if (otimista && antes) setD(antes);
      if (e.tipo === 'rede') setOnline(false);
      if (e.tipo === 'auth') setErroAuth(true);
      avisar(opts.erro ? opts.erro + ' ' + e.message : e.message);
      return null;
    } finally {
      pendentes.current--;
      if (pendentes.current === 0) buscarTudo().catch(() => {});
    }
  }, [online, avisar, buscarTudo]);

  const setMes = useCallback((m) => { setMesState(m); try { window.localStorage.setItem('financas:mes', m); } catch (e) { /* ignora */ } }, []);

  /* ----- ações (cada uma com sua atualização otimista) ----- */
  const acoes = useMemo(() => {
    const L = (fn) => (s) => ({ ...s, lancamentos: fn(s.lancamentos) });
    const grupoDe = (s, cat) => ((s.categorias.find((c) => c.nome === cat) || {}).grupo || '');
    return {
      criarLancamentos: (itens) => executar('criarLancamento', { itens }, (s) => ({
        ...s, lancamentos: [...s.lancamentos, ...itens.map((it, i) => ({ id: 'tmp-' + Date.now() + '-' + i, catManual: it.cat, grupo: grupoDe(s, it.cat), mes: it.data.slice(0, 7), origem: 'Manual', ...it }))],
      })),
      editarLancamento: (id, campos, msg) => executar('editarLancamento', { id, campos }, L((ls) => ls.map((l) => {
        if (l.id !== id) return l;
        const n = { ...l, ...campos };
        if ('cat' in campos) { n.catManual = campos.cat; n.cat = campos.cat; }
        if ('data' in campos) n.mes = campos.data.slice(0, 7);
        return n;
      })), { erro: msg }),
      classificar: (id, cat, regra) => executar('classificar', { id, cat, criarRegra: !!regra, chave: regra ? regra.chave : '' }, (s) => ({
        ...s,
        lancamentos: s.lancamentos.map((l) => (l.id === id ? { ...l, cat, catManual: cat, grupo: grupoDe(s, cat) } : l)),
        regras: regra && !s.regras.some((r) => r.chave === regra.chave) ? [...s.regras, { chave: regra.chave, cat }] : s.regras,
      })),
      trocarCategoria: (id, cat) => executar('editarLancamento', { id, campos: { cat } }, (s) => ({
        ...s, lancamentos: s.lancamentos.map((l) => (l.id === id ? { ...l, cat, catManual: cat, grupo: grupoDe(s, cat) } : l)),
      })),
      excluirLancamento: (id) => executar('excluirLancamento', { id }, L((ls) => ls.filter((l) => l.id !== id))),
      criarCategoria: (c) => executar('criarCategoria', c, (s) => ({ ...s, categorias: [...s.categorias, c] })),
      editarCategoria: (nomeAntigo, c) => executar('editarCategoria', { nomeAntigo, ...c }, (s) => ({
        ...s,
        categorias: s.categorias.map((x) => (x.nome === nomeAntigo ? c : x)),
        lancamentos: s.lancamentos.map((l) => (l.cat === nomeAntigo ? { ...l, cat: c.nome, grupo: c.grupo } : l)),
        regras: s.regras.map((r) => (r.cat === nomeAntigo ? { ...r, cat: c.nome } : r)),
      })),
      excluirCategoria: (nome) => executar('excluirCategoria', { nome }, (s) => ({
        ...s,
        categorias: s.categorias.filter((x) => x.nome !== nome),
        regras: s.regras.filter((r) => r.cat !== nome),
        lancamentos: s.lancamentos.map((l) => (l.cat === nome ? { ...l, cat: '', catManual: '', grupo: '' } : l)),
      })),
      criarRegra: (r) => executar('criarRegra', r, (s) => ({ ...s, regras: [...s.regras, r] })),
      editarRegra: (chaveAntiga, r) => executar('editarRegra', { chaveAntiga, ...r }, (s) => ({ ...s, regras: s.regras.map((x) => (x.chave === chaveAntiga ? r : x)) })),
      excluirRegra: (chave) => executar('excluirRegra', { chave }, (s) => ({ ...s, regras: s.regras.filter((x) => x.chave !== chave) })),
      criarMeta: (m) => executar('criarMeta', m, (s) => ({ ...s, metas: [...s.metas, { guardado: m.inicial || 0, porMes: 0, ...m }] })),
      editarMeta: (nomeAntigo, m) => executar('editarMeta', { nomeAntigo, ...m }, (s) => ({ ...s, metas: s.metas.map((x) => (x.nome === nomeAntigo ? { ...x, ...m } : x)) })),
      excluirMeta: (nome) => executar('excluirMeta', { nome }, (s) => ({ ...s, metas: s.metas.filter((x) => x.nome !== nome) })),
      guardarNaMeta: (nome, valor) => executar('guardarNaMeta', { nome, valor }, (s) => ({
        ...s,
        metas: s.metas.map((x) => (x.nome === nome ? { ...x, guardado: x.guardado + valor } : x)),
        lancamentos: [...s.lancamentos, { id: 'tmp-' + Date.now(), data: hojeIso(), desc: 'Guardado: ' + nome, cat: nome, catManual: nome, grupo: 'Reserva', mes: mesHoje(), valor, conta: '', forma: 'Transferência', parc: '', obs: '', origem: 'Manual' }],
      })),
      importarAgora: () => executar('importarAgora', {}, null, { tempo: 170000 }),
      importacaoDiaria: (ligar) => executar(ligar ? 'ativarImportacaoDiaria' : 'desativarImportacaoDiaria', {}, (s) => ({ ...s, status: { ...s.status, importacaoDiaria: ligar } })),
      salvarPrefs: (prefs) => executar('salvarPreferencias', { prefs }, (s) => ({ ...s, prefs: { ...s.prefs, ...prefs } })),
      notificarTeste: () => executar('notificarTeste', {}, null),
    };
  }, [executar]);

  const conectar = useCallback((c) => { setConexao(c); setErroAuth(false); }, []);
  const desconectar = useCallback(() => { apagarConexao(); setD(null); setConexao(null); }, []);

  const dados = d || VAZIO;
  const sel = useSeletores(dados, mes);
  const valor = useMemo(() => ({
    d: dados, carregado: !!d, sel, mes, setMes, online, erroAuth, sincronizando, atualizadoEm, conexao,
    conectar, desconectar, buscarTudo, avisar, toast, ...acoes,
  }), [dados, d, sel, mes, setMes, online, erroAuth, sincronizando, atualizadoEm, conexao, conectar, desconectar, buscarTudo, avisar, toast, acoes]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useDados = () => useContext(Ctx);
export { ErroApi };
