import { useState } from 'react';
import { Icon, SegmentedControl, TransactionRow, formatBRL } from '../ds/index.js';
import { useDados, nomeMes, rotuloDia, rotuloQuando } from '../store.jsx';
import { Tela, Barra, Aviso, useAviso } from '../ui.jsx';

export default function Lancamentos() {
  const { d, sel, importar } = useDados();
  const [filtro, setFiltro] = useState('tudo');
  const [busca, setBusca] = useState('');
  const [aviso, mostrarAviso] = useAviso(3000);

  const q = busca.toLowerCase().trim();
  const lista = sel.ordenar(sel.doMes(d.mes))
    .filter((l) => { const k = sel.tipoDe(l); return filtro === 'tudo' || (filtro === 'entradas' ? k === 'entrada' : k !== 'entrada'); })
    .filter((l) => { const c = sel.catPorId[l.catId]; return !q || (l.desc + ' ' + (c ? c.nome : 'A classificar')).toLowerCase().includes(q); });

  const dias = [];
  lista.forEach((l) => {
    let g = dias.length && dias[dias.length - 1].data === l.data ? dias[dias.length - 1] : null;
    if (!g) { g = { data: l.data, dia: rotuloDia(l.data), itens: [] }; dias.push(g); }
    g.itens.push(l);
  });
  const total = lista.reduce((s, l) => s + (sel.tipoDe(l) === 'entrada' ? l.valor : -l.valor), 0);
  const totalTxt = (total < 0 ? '−' : '+') + 'R$ ' + formatBRL(total);
  const imp = rotuloQuando(d.importacao.quando);

  const sincronizar = () => { importar(); mostrarAviso(`Itaú consultado agora. Nada novo desde ${imp.hora}.`); };

  return (
    <Tela>
      <div className="scroll pb-tab" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 14px) 0 112px', scrollbarWidth: 'none' }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="titulo-tela" style={{ margin: 0 }}>Lançamentos</h1>
            <button type="button" onClick={sincronizar} aria-label="Importar do Itaú agora" style={{ width: 44, height: 44, borderRadius: '50%', border: 0, display: 'grid', placeItems: 'center', background: 'var(--jade-soft)', color: 'var(--jade)', cursor: 'pointer' }}>
              <Icon name="sync" size={22} />
            </button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 12px', borderRadius: 14, background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}>
            <Icon name="busca" size={20} />
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Buscar lançamento</span>
            <input className="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por descrição ou categoria"
              style={{ flex: 1, minWidth: 0, height: 40, border: 0, background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 16, outline: 'none' }} />
          </label>
          {aviso ? <Aviso>{aviso}</Aviso> : null}
          <SegmentedControl value={filtro} onChange={setFiltro} aria-label="Filtrar lançamentos"
            options={[{ value: 'tudo', label: 'Tudo' }, { value: 'despesas', label: 'Despesas' }, { value: 'entradas', label: 'Entradas' }]} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 2px 0' }}>
            <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{nomeMes(d.mes)} · {lista.length} {lista.length === 1 ? 'lançamento' : 'lançamentos'}</span>
            <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{totalTxt}</span>
          </div>
        </div>

        {dias.map((g) => (
          <section key={g.data} style={{ padding: '18px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={{ margin: '0 4px', color: 'var(--ink-muted)' }}>{g.dia}</h2>
            <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)' }}>
              {g.itens.map((l) => {
                const c = sel.catPorId[l.catId];
                const href = c ? '#/detalhe/' + l.id : '#/classificar?id=' + l.id;
                return (
                  <a key={l.id} href={href} style={{ display: 'block', color: 'inherit' }}>
                    <TransactionRow title={l.desc} category={c ? c.nome : ''} icon={c ? c.icon : ''} tone={c ? c.tone : ''} account={l.conta} method={l.forma}
                      value={l.valor} kind={sel.tipoDe(l)} installment={l.parc} pending={!c} />
                  </a>
                );
              })}
            </div>
          </section>
        ))}

        {lista.length === 0 ? (
          <p style={{ margin: '40px 24px 0', textAlign: 'center', fontSize: 15, color: 'var(--ink-muted)' }}>
            {q ? <>Nenhum lançamento com “{busca}”.</> : 'Nenhum lançamento neste mês.'}
          </p>
        ) : null}
      </div>
      <Barra ativa="lancamentos" />
    </Tela>
  );
}
