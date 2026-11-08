import { useState } from 'react';
import { Money, BudgetBar, SegmentedControl, CategoryIcon, StatusBadge } from '../ds/index.js';
import { useDados, brl, mesAnterior, MESES } from '../store.jsx';
import { Tela, Barra, Vazio } from '../ui.jsx';

const abrev = (ym) => MESES[Number(ym.slice(5)) - 1].slice(0, 3).toLowerCase();

export default function Orcamento() {
  const { d, mes } = useDados();
  const [periodo, setPeriodo] = useState('mes');
  const ano = mes.slice(0, 4);
  const meses = periodo === 'mes' ? [mes] : periodo === 'tri' ? [mes, mesAnterior(mes), mesAnterior(mes, 2)] : null;
  const mult = periodo === 'mes' ? 1 : periodo === 'tri' ? 3 : 12;
  const noPeriodo = d.lancamentos.filter((l) => (meses ? meses.includes(l.mes) : String(l.mes).startsWith(ano)));
  const real = {};
  noPeriodo.forEach((l) => { if (l.cat) real[l.cat] = (real[l.cat] || 0) + l.valor; });

  const grupos = [['Fixa', 'Fixas'], ['Variável', 'Variáveis'], ['Reserva', 'Reservas']].map(([g, nome]) => {
    const itens = d.categorias.filter((c) => c.grupo === g && (c.orc > 0 || real[c.nome] > 0)).map((c) => ({ ...c, o: c.orc * mult, r: Math.round(real[c.nome] || 0) }));
    const go = itens.reduce((s, c) => s + c.o, 0), gr = itens.reduce((s, c) => s + c.r, 0);
    return { g, nome, itens, go, gr, totalTxt: go > 0 ? brl(gr) + ' de ' + brl(go) : brl(gr) };
  }).filter((g) => g.itens.length);

  let o = 0, r = 0;
  grupos.forEach((g) => { if (g.g !== 'Reserva') { o += g.go; r += g.gr; } });
  const pct = o > 0 ? Math.round((r / o) * 100) : 0;
  const semOrcamento = o === 0;
  const corBarra = pct > 100 ? 'var(--danger)' : pct >= 80 ? 'var(--amber)' : 'var(--jade)';
  const frase = semOrcamento ? 'Nenhum valor orçado ainda: defina em Categorias' : r > o ? pct + '% usado · passou ' + brl(r - o) + ' do orçado' : pct + '% usado · restam ' + brl(o - r) + ' para despesas';
  const rotulo = periodo === 'mes' ? MESES[Number(mes.slice(5)) - 1].toLowerCase() : periodo === 'tri' ? abrev(mesAnterior(mes, 2)) + ' a ' + abrev(mes) : ano;

  return (
    <Tela>
      <div className="scroll pb-tab" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 14px) 0 112px', scrollbarWidth: 'none' }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 className="titulo-tela" style={{ margin: 0 }}>Orçamento</h1>
          <SegmentedControl value={periodo} onChange={setPeriodo} aria-label="Período"
            options={[{ value: 'mes', label: 'Mês' }, { value: 'tri', label: '3 meses' }, { value: 'ano', label: 'Ano' }]} />
          <section style={{ padding: '18px 16px', borderRadius: 22, background: 'var(--header)', color: 'var(--on-header)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="rotulo" style={{ color: 'var(--on-header-muted)' }}>Gasto do orçado · {rotulo}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, '--ink': 'var(--on-header)' }}>
              <Money value={r} size="card" cents={false} signed={false} />
              <span style={{ fontSize: 14, color: 'var(--on-header-muted)', fontVariantNumeric: 'tabular-nums' }}>{semOrcamento ? 'gasto no período' : 'de ' + brl(o)}</span>
            </div>
            <div aria-hidden="true" style={{ height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: Math.min(pct, 100) + '%', borderRadius: 8, background: corBarra }} />
            </div>
            <span style={{ fontSize: 14, color: 'var(--on-header-muted)' }}>{frase}</span>
          </section>
        </div>
        {grupos.map((g) => (
          <section key={g.g} style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px' }}>
              <h2 className="titulo-secao" style={{ margin: 0 }}>{g.nome}</h2>
              <span style={{ fontSize: 14, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{g.totalTxt}</span>
            </div>
            <div style={{ padding: 16, borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 18 }}>
 {g.itens.map((c) => (c.o > 0
                ? <BudgetBar key={c.nome} name={c.nome} icon={c.icon} tone={c.tone} budget={c.o} spent={c.r} />
                : (
                  <div key={c.nome} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CategoryIcon icon={c.icon} tone={c.tone} size={32} />
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</span>
                      <span><StatusBadge tone="neutro" icon={false}>Sem orçamento</StatusBadge></span>
                    </span>
                    <span style={{ fontSize: 14 }}><Money value={c.r} cents={false} signed={false} /></span>
                  </div>
                )))}
            </div>
          </section>
        ))}
        {grupos.length === 0 ? <div style={{ padding: '24px 16px 0' }}><Vazio icon="pizza" titulo="Nada para mostrar" texto="Nenhuma categoria com valor orçado ou gasto neste período." /></div> : null}
        <div style={{ padding: '24px 16px 0' }}>
          <a href="#/categorias" className="fp-btn fp-btn--secundario fp-btn--block">Editar categorias e valores</a>
        </div>
      </div>
      <Barra ativa="orcamento" />
    </Tela>
  );
}
