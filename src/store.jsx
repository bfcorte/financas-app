import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { dadosExemplo, IDS_PENDENTES_EXEMPLO } from './seed.js';
import { formatBRL } from './ds/index.js';

const CHAVE = 'financas-pessoais:v1';

function carregar() {
  try {
    const raw = window.localStorage.getItem(CHAVE);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.versao === 1 && Array.isArray(d.lancs) && Array.isArray(d.cats)) return { ...dadosExemplo(), ...d };
    }
  } catch (e) { /* storage indisponível: segue com os dados de exemplo */ }
  return dadosExemplo();
}

function salvar(d) {
  try { window.localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { /* ignora */ }
}

/* ---------- utilidades ---------- */
export const novoId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const brl = (v) => 'R$ ' + formatBRL(v, { cents: false });
export const num = (s) => Number(String(s || '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0;
export const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const parseData = (iso) => { const p = iso.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); };
export const isoData = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const hojeIso = () => isoData(new Date());
export const ddmm = (iso) => { const p = iso.split('-'); return p[2] + '/' + p[1]; };
export const mesDe = (iso) => iso.slice(0, 7);
export const nomeMes = (ym) => { const p = ym.split('-'); return MESES[Number(p[1]) - 1] + ' ' + p[0]; };
export const mesAnterior = (ym, k = 1) => { const p = ym.split('-'); const d = new Date(Number(p[0]), Number(p[1]) - 1 - k, 1); return isoData(d).slice(0, 7); };
export const somaMes = (ym, k) => mesAnterior(ym, -k);

export function rotuloDia(iso) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const d = parseData(iso);
  const dif = Math.round((hoje - d) / 86400000);
  if (dif === 0) return 'Hoje, ' + ddmm(iso);
  if (dif === 1) return 'Ontem, ' + ddmm(iso);
  return DIAS[d.getDay()] + ', ' + ddmm(iso);
}

export function rotuloQuando(isoDataHora) {
  const d = new Date(isoDataHora);
  const hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const r = rotuloDia(isoData(d));
  if (r.startsWith('Hoje')) return { dia: 'hoje', hora: hh, curto: 'Hoje, ' + hh };
  if (r.startsWith('Ontem')) return { dia: 'ontem', hora: hh, curto: 'Ontem, ' + hh };
  return { dia: 'em ' + ddmm(isoData(d)), hora: hh, curto: ddmm(isoData(d)) + ', ' + hh };
}

export const tipoDoGrupo = (g) => (g === 'entrada' ? 'entrada' : g === 'reserva' ? 'reserva' : 'despesa');
export const NOME_GRUPO = { fixa: 'Fixa', variavel: 'Variável', reserva: 'Reserva', entrada: 'Entrada' };

export function chaveDe(desc) {
  const pal = semAcento(desc).toUpperCase().split(/\s+/).filter((w) => w && !['PIX', 'TED', 'DOC', 'COMPRA', 'PAG', 'PAGTO'].includes(w));
  return (pal[0] || semAcento(desc).toUpperCase()).slice(0, 24);
}

export function regraPara(regras, desc) {
  const d = semAcento(desc).toUpperCase();
  return regras.find((r) => r.chave && d.includes(semAcento(r.chave).toUpperCase())) || null;
}

/* ---------- seletores ---------- */
export function useSeletores(d) {
  return useMemo(() => {
    const catPorId = {};
    d.cats.forEach((c) => { catPorId[c.id] = c; });
    const tipoDe = (l) => { const c = catPorId[l.catId]; return c ? tipoDoGrupo(c.grupo) : (l.tipo || 'despesa'); };
    const pendentes = d.lancs.filter((l) => !catPorId[l.catId]);
    const doMes = (ym) => d.lancs.filter((l) => mesDe(l.data) === ym);
    const ordenar = (lista) => lista.map((l, i) => [l, i]).sort((a, b) => (a[0].data < b[0].data ? 1 : a[0].data > b[0].data ? -1 : a[1] - b[1])).map((x) => x[0]);
    const totais = (lista) => {
      let e = 0, desp = 0, g = 0;
      lista.forEach((l) => { const t = tipoDe(l); if (t === 'entrada') e += l.valor; else if (t === 'reserva') g += l.valor; else desp += l.valor; });
      return { entradas: e, despesas: desp, guardado: g, sobra: e - desp - g };
    };
    const uso = {};
    d.lancs.forEach((l) => { if (l.catId) uso[l.catId] = (uso[l.catId] || 0) + 1; });
    const variaveis = d.cats.filter((c) => c.grupo === 'variavel');
    const maisUsadas = variaveis.map((c, i) => [c, uso[c.id] || 0, i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).slice(0, 3).filter((x) => x[1] > 0).map((x) => x[0]);
    const gruposPicker = (tipo) => {
      if (tipo === 'entrada') return [{ nome: 'Entradas', itens: d.cats.filter((c) => c.grupo === 'entrada') }];
      if (tipo === 'reserva') return [{ nome: 'Reservas', itens: d.cats.filter((c) => c.grupo === 'reserva') }];
      const ids = maisUsadas.map((c) => c.id);
      return [
        { nome: 'Mais usadas', itens: maisUsadas },
        { nome: 'Fixas', itens: d.cats.filter((c) => c.grupo === 'fixa') },
        { nome: 'Variáveis', itens: variaveis.filter((c) => !ids.includes(c.id)) }
      ];
    };
    const meses = Array.from(new Set([...d.lancs.map((l) => mesDe(l.data)), mesDe(hojeIso()), d.mes])).sort().reverse();
    const guardadoMeta = (m) => m.inicial + d.lancs.filter((l) => l.catId === m.catId).reduce((s, l) => s + l.valor, 0);
    return { catPorId, tipoDe, pendentes, doMes, ordenar, totais, maisUsadas, gruposPicker, meses, guardadoMeta };
  }, [d]);
}

/* ---------- contexto ---------- */
const Ctx = createContext(null);

export function DadosProvider({ children }) {
  const [d, setD] = useState(carregar);
  const primeiro = useRef(true);
  useEffect(() => {
    if (primeiro.current) { primeiro.current = false; return; }
    salvar(d);
  }, [d]);

  const up = useCallback((fn) => setD((prev) => ({ ...prev, ...fn(prev) })), []);

  const acoes = useMemo(() => ({
    setMes: (mes) => up(() => ({ mes })),
    addLancs: (novos) => up((p) => ({ lancs: [...novos, ...p.lancs] })),
    updLanc: (id, patch) => up((p) => ({ lancs: p.lancs.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
    delLanc: (id) => up((p) => ({ lancs: p.lancs.filter((l) => l.id !== id) })),
    setEscolha: (id, catId) => up((p) => ({ escolhas: { ...p.escolhas, [id]: catId } })),
    classificar: (id, catId, regra) => up((p) => {
      const cat = p.cats.find((c) => c.id === catId);
      const lancs = p.lancs.map((l) => (l.id === id ? { ...l, catId, tipo: cat ? tipoDoGrupo(cat.grupo) : l.tipo, classificadoEm: Date.now() } : l));
      const escolhas = { ...p.escolhas }; delete escolhas[id];
      let regras = p.regras;
      if (regra && regra.chave) {
        const ex = regras.find((r) => r.chave === regra.chave);
        regras = ex ? regras.map((r) => (r === ex ? { ...r, catId } : r)) : [{ id: novoId('r'), chave: regra.chave, catId, criadaPor: id }, ...regras];
      }
      return { lancs, escolhas, regras };
    }),
    demoReclassificar: () => up((p) => {
      const base = dadosExemplo();
      const exemplo = base.lancs.filter((l) => IDS_PENDENTES_EXEMPLO.includes(l.id));
      const resto = p.lancs.filter((l) => !IDS_PENDENTES_EXEMPLO.includes(l.id));
      return { lancs: [...exemplo, ...resto], regras: p.regras.filter((r) => !IDS_PENDENTES_EXEMPLO.includes(r.criadaPor)), escolhas: {} };
    }),
    salvarCat: (cat) => up((p) => {
      const existe = p.cats.some((c) => c.id === cat.id);
      return { cats: existe ? p.cats.map((c) => (c.id === cat.id ? cat : c)) : [...p.cats, cat] };
    }),
    delCat: (id) => up((p) => ({
      cats: p.cats.filter((c) => c.id !== id),
      regras: p.regras.filter((r) => r.catId !== id),
      lancs: p.lancs.map((l) => (l.catId === id ? { ...l, catId: null, sugestao: 'outros', chave: chaveDe(l.desc) } : l)),
      metas: p.metas.map((m) => (m.catId === id ? { ...m, catId: null } : m))
    })),
    salvarRegra: (r) => up((p) => {
      const existe = p.regras.some((x) => x.id === r.id);
      return { regras: existe ? p.regras.map((x) => (x.id === r.id ? r : x)) : [r, ...p.regras] };
    }),
    delRegra: (id) => up((p) => ({ regras: p.regras.filter((r) => r.id !== id) })),
    salvarMeta: (m, aporte) => up((p) => {
      let cats = p.cats;
      let catId = m.catId;
      let cat = cats.find((c) => c.id === catId);
      if (cat && cat.nome !== m.nome) {
        cats = cats.map((c) => (c.id === catId ? { ...c, nome: m.nome } : c));
      } else if (!cat) {
        const mesmoNome = cats.find((c) => c.grupo === 'reserva' && c.nome === m.nome);
        if (mesmoNome) catId = mesmoNome.id;
        else {
          catId = novoId('c');
          cats = [...cats, { id: catId, nome: m.nome, grupo: 'reserva', icon: 'cofre', tone: 'violet', orc: m.mensal || 0 }];
        }
      }
      const meta = { ...m, catId };
      const existe = p.metas.some((x) => x.id === m.id);
      const metas = existe ? p.metas.map((x) => (x.id === m.id ? meta : x)) : [...p.metas, meta];
      let lancs = p.lancs;
      if (aporte > 0) {
        lancs = [{ id: novoId('l'), data: hojeIso(), desc: m.nome, catId, valor: aporte, conta: 'Itaú', forma: 'Pix', parc: '', origem: 'manual', obs: '', tipo: 'reserva' }, ...lancs];
      }
      return { cats, metas, lancs };
    }),
    delMeta: (id) => up((p) => ({ metas: p.metas.filter((m) => m.id !== id) })),
    toggleAjuste: (k) => up((p) => ({ ajustes: { ...p.ajustes, [k]: !p.ajustes[k] } })),
    importar: () => up((p) => ({ importacao: { ...p.importacao, consultadoEm: new Date().toISOString() } })),
    restaurar: () => setD(dadosExemplo())
  }), [up]);

  const sel = useSeletores(d);
  const valor = useMemo(() => ({ d, ...acoes, sel }), [d, acoes, sel]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useDados = () => useContext(Ctx);
