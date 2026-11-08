import { useState } from 'react';
import { Money, BudgetBar, SegmentedControl } from '../ds/index.js';
import { useDados, brl, mesAnterior, mesDe, MESES } from '../store.jsx';
import { Tela, Barra } from '../ui.jsx';

const abrev = (ym) => MESES[Number(ym.slice(5)) - 1].slice(0, 3).toLowerCase();

export default function Orcamento() {
  const { d, sel } = useDados();
  const [periodo, setPeriodo] = useState('mes');
  const ano = d.mes.slice(0, 4);
  const meses = periodo === 'mes' ? [d.mes] : periodo === 'tri' ? [d.mes, mesAnterior(d.mes), mesAnterior(d.mes, 2)] : null;
  const mult = periodo === 'mes' ? 1 : periodo === 'tri' ? 3 : 12;
  const noPeriodo = d.lancs.filter((l) => (meses ? meses.includes(mesDe(l.data)) : l.data.startsWith(ano)));
  const real = {};
  noPeriodo.forEach((l) => { if (l.catId) real[l.catId] = (real[l.catId] || 0) + l.valor; });

  const grupos = [['fixa', 'Fixas'], ['variavel', 'Variáveis'], ['reserva', 'Reservas']].map(([g, nome]) => {
    const itens = d.cats.filter((c) => c.grupo === g && (c.orc > 0 || real[c.id] > 0)).map((c) => ({ ...c, o: c.orc * mult, r: Math.round(real[c.id] || 0) }));
    const go = itens.reduce((s, c) => s + c.o, 0), gr = itens.reduce((s, c) => s + c.r, 0);
    return { g, nome, itens, go, gr, totalTxt: brl(gr) + ' de ' + brl(go) };
  }).filter((g) => g.itens.length);

  let o = 0, r = 0;
  grupos.forEach((g) => { if (g.g !== 'reserva') { o += g.go; r += g.gr; } });
  const pct = o > 0 ? Math.round((r / o) * 100) : 0;
  const corBarra = pct > 100 ? 'var(--danger)' : pct >= 80 ? 'var(--amber)' : 'var(--jade)';
  const frase = r > o ? pct + '% usado · passou ' + brl(r - o) + ' do orçado' : pct + '% usado · restam ' + brl(o - r) + ' para despesas';
  const rotulo = periodo === 'mes' ? MESES[Number(d.mes.slice(5)) - 1].toLowerCase() : periodo === 'tri' ? abrev(mesAnterior(d.mes, 2)) + ' a ' + abrev(d.mes) : ano;

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
              <span style={{ fontSize: 14, color: 'var(--on-header-muted)', fontVariantNumeric: 'tabular-nums' }}>de {brl(o)}</span>
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
              {g.itens.map((c) => <BudgetBar key={c.id} name={c.nome} icon={c.icon} tone={c.tone} budget={c.o} spent={c.r} />)}
            </div>
          </section>
        ))}
        <div style={{ padding: '24px 16px 0' }}>
          <a href="#/categorias" className="fp-btn fp-btn--secundario fp-btn--block">Editar categorias e valores</a>
        </div>
      </div>
      <Barra ativa="orcamento" />
    </Tela>
  );
}
