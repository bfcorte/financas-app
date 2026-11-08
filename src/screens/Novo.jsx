import { useRef, useState } from 'react';
import { Icon, CategoryIcon, SegmentedControl } from '../ds/index.js';
import { useDados, num, novoId, isoData, rotuloDia, mesDe, somaMes, NOME_GRUPO, tipoDoGrupo } from '../store.jsx';
import { navegar } from '../router.js';
import { Tela, Folha, Alca, SeletorCategoria, S } from '../ui.jsx';

function opcoesData() {
  const out = [];
  for (let k = 0; k < 4; k++) { const d = new Date(); d.setDate(d.getDate() - k); const iso = isoData(d); out.push({ v: iso, label: rotuloDia(iso) }); }
  return out;
}

export default function Novo() {
  const { d, sel, addLancs, setMes } = useDados();
  const datas = useRef(opcoesData()).current;
  const [tipo, setTipo] = useState('despesa');
  const padrao = (t) => { const g = sel.gruposPicker(t); return (g.find((x) => x.itens.length) || { itens: [d.cats[0]] }).itens[0].id; };
  const [catPorTipo, setCatPorTipo] = useState(() => ({ despesa: padrao('despesa'), entrada: padrao('entrada'), reserva: padrao('reserva') }));
  const [valor, setValor] = useState('');
  const [desc, setDesc] = useState('');
  const [aberto, setAberto] = useState(false);
  const [campo, setCampo] = useState('');
  const [vals, setVals] = useState({ conta: 'Itaú', forma: 'Pix', data: datas[0].v, parc: 'À vista' });
  const [erro, setErro] = useState('');
  const valorRef = useRef(null);

  const catId = sel.catPorId[catPorTipo[tipo]] ? catPorTipo[tipo] : padrao(tipo);
  const cat = sel.catPorId[catId];
  const cor = { despesa: 'var(--ink)', entrada: 'var(--jade)', reserva: 'var(--violet)' }[tipo];

  const camposDef = [
    { id: 'conta', icon: 'banco', k: 'Conta', opcoes: ['Itaú', 'Cartão Itaú', 'Dinheiro'].map((v) => ({ v, label: v })) },
    { id: 'forma', icon: 'cartao', k: 'Forma', opcoes: ['Pix', 'Débito', 'Crédito', 'Boleto', 'Dinheiro'].map((v) => ({ v, label: v })) },
    { id: 'data', icon: 'calendario', k: 'Data', opcoes: datas },
    { id: 'parc', icon: 'lista', k: 'Parcelas', opcoes: ['À vista', '2x', '3x', '6x', '10x', '12x'].map((v) => ({ v, label: v })) }
  ];
  const campoAtual = camposDef.find((c) => c.id === campo);
  const rotuloCampo = (c) => (c.opcoes.find((o) => o.v === vals[c.id]) || { label: vals[c.id] }).label;

  const salvar = () => {
    const v = num(valor);
    if (!(v > 0)) { setErro('Digite o valor para salvar.'); if (valorRef.current) valorRef.current.focus(); return; }
    const n = vals.parc === 'À vista' ? 1 : parseInt(vals.parc, 10);
    const base = { catId, conta: vals.conta, forma: vals.forma, origem: 'manual', obs: '', tipo: tipoDoGrupo(cat.grupo), desc: desc.trim() || cat.nome };
    const novos = [];
    const parcela = Math.round((v / n) * 100) / 100;
    for (let k = 0; k < n; k++) {
      const dia = vals.data.slice(8);
      const ym = somaMes(mesDe(vals.data), k);
      const ult = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5)), 0).getDate();
      const data = ym + '-' + String(Math.min(Number(dia), ult)).padStart(2, '0');
      novos.push({ ...base, id: novoId('l'), data, valor: k === n - 1 ? Math.round((v - parcela * (n - 1)) * 100) / 100 : parcela, parc: n > 1 ? (k + 1) + '/' + n : '' });
    }
    addLancs(novos);
    setMes(mesDe(vals.data));
    navegar('painel');
  };

  return (
    <Tela fundo="var(--header)">
      <section className="folha" style={{ position: 'absolute', left: 0, right: 0, top: 'var(--top)', bottom: 0, borderRadius: '22px 22px 0 0', background: 'var(--surface)', boxShadow: 'var(--shadow-sheet)', overflow: 'hidden' }}>
        <div className="scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '8px 0 calc(120px + var(--bottom))', scrollbarWidth: 'none' }}>
          <Alca margin="0 auto 6px" />
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="#/painel" style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 17, width: 82 }}>Cancelar</a>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Novo lançamento</h1>
            <span style={{ width: 82 }} />
          </div>
          <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <SegmentedControl value={tipo} onChange={setTipo} aria-label="Tipo de lançamento"
              options={[{ value: 'despesa', label: 'Despesa' }, { value: 'entrada', label: 'Entrada' }, { value: 'reserva', label: 'Reserva' }]} />
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span className="rotulo" style={{ color: 'var(--ink-muted)' }}>Valor</span>
              <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, color: cor }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, opacity: 0.72 }}>R$</span>
                <input ref={valorRef} className="valor" type="text" inputMode="decimal" placeholder="0,00" value={valor}
                  onChange={(e) => { setValor(e.target.value.replace(/[^\d.,]/g, '')); setErro(''); }}
                  style={{ width: 210, border: 0, background: 'transparent', color: 'inherit', fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: '60px', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'left', fontVariantNumeric: 'tabular-nums', padding: 0 }} />
              </span>
              {erro ? <span role="alert" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{erro}</span> : null}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="desc" className="rotulo" style={S.rotulo}>Descrição</label>
              <input id="desc" className="campo" type="text" placeholder="Ex.: Feira de domingo" value={desc} onChange={(e) => setDesc(e.target.value)} style={S.campo} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="rotulo" style={S.rotulo}>Categoria</span>
              <button type="button" onClick={() => setAberto(true)} aria-haspopup="dialog" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', border: 0, borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left', cursor: 'pointer' }}>
                <CategoryIcon icon={cat.icon} tone={cat.tone} size={36} />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{cat.nome}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{NOME_GRUPO[cat.grupo]} · toque para trocar</span>
                </span>
                <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
              </button>
            </div>
            <div style={S.grupoLista}>
              {camposDef.map((c) => (
                <button key={c.id} type="button" onClick={() => setCampo(c.id)} aria-haspopup="dialog" style={S.linhaBotao}>
                  <span style={{ color: 'var(--ink-muted)' }}><Icon name={c.icon} size={20} /></span>
                  <span style={{ flex: 1, fontSize: 15, color: 'var(--ink-muted)' }}>{c.k}</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{rotuloCampo(c)}</span>
                  <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px max(30px, calc(var(--bottom) + 12px))', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
          <button type="button" className="fp-btn fp-btn--primario fp-btn--block" onClick={salvar}>Salvar lançamento</button>
        </div>
      </section>

      {campoAtual ? (
        <Folha onFechar={() => setCampo('')} label={campoAtual.k} className="pb-folha" style={{ padding: '8px 16px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Alca margin="0 auto 4px" />
          <h2 style={{ margin: 0, textAlign: 'center', fontSize: 17, fontWeight: 600 }}>{campoAtual.k}</h2>
          <div style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)' }}>
            {campoAtual.opcoes.map((o) => {
              const on = o.v === vals[campoAtual.id];
              return (
                <button key={o.v} type="button" aria-pressed={on} onClick={() => { setVals({ ...vals, [campoAtual.id]: o.v }); setCampo(''); }} style={S.linhaBotao}>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{o.label}</span>
                  {on ? <span style={{ color: 'var(--jade)' }}><Icon name="check" size={20} stroke={2.2} /></span> : null}
                </button>
              );
            })}
          </div>
        </Folha>
      ) : null}

      {aberto ? (
        <SeletorCategoria grupos={sel.gruposPicker(tipo)} selecionada={catId}
          onEscolher={(id) => { setCatPorTipo({ ...catPorTipo, [tipo]: id }); setAberto(false); }} onFechar={() => setAberto(false)} />
      ) : null}
    </Tela>
  );
}
