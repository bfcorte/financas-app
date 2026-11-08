import { useRef, useState } from 'react';
import { Icon, SegmentedControl, TransactionRow, formatBRL } from '../ds/index.js';
import { useDados, nomeMes, rotuloDia, kindMoney } from '../store.jsx';
import { Tela, Barra, Aviso, useAviso, Vazio } from '../ui.jsx';

const LIMIAR = 70;

export default function Lancamentos() {
  const { d, sel, mes, importarAgora, buscarTudo, online } = useDados();
  const [filtro, setFiltro] = useState('tudo');
  const [busca, setBusca] = useState('');
  const [aviso, mostrarAviso] = useAviso(4000);
  const [importando, setImportando] = useState(false);
  const [puxar, setPuxar] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const scrollRef = useRef(null);
  const toque = useRef(null);

  const q = busca.toLowerCase().trim();
  const lista = sel.ordenar(sel.doMes(mes))
    .filter((l) => { const k = sel.tipoDe(l); return filtro === 'tudo' || (filtro === 'entradas' ? k === 'entrada' : k !== 'entrada'); })
    .filter((l) => !q || (l.desc + ' ' + (l.cat || 'A classificar')).toLowerCase().includes(q));

  const dias = [];
  lista.forEach((l) => {
    let g = dias.length && dias[dias.length - 1].data === l.data ? dias[dias.length - 1] : null;
    if (!g) { g = { data: l.data, dia: rotuloDia(l.data), itens: [] }; dias.push(g); }
    g.itens.push(l);
  });
  const total = lista.reduce((s, l) => { const t = sel.tipoDe(l); return t === 'entrada' ? s + l.valor : t === 'transferencia' ? s : s - l.valor; }, 0);
  const totalTxt = (total < 0 ? '−' : '+') + 'R$ ' + formatBRL(total);

  const sincronizar = async () => {
    if (importando) return;
    setImportando(true);
    const r = await importarAgora();
    setImportando(false);
    if (r) mostrarAviso(r.novos ? (r.novos === 1 ? 'Itaú consultado agora. Chegou 1 lançamento novo.' : 'Itaú consultado agora. Chegaram ' + r.novos + ' lançamentos novos.') : 'Itaú consultado agora. Nada novo.');
  };

  // puxar para baixo atualiza
  const onStart = (e) => { if (scrollRef.current && scrollRef.current.scrollTop <= 0) toque.current = e.touches[0].clientY; };
  const onMove = (e) => {
    if (toque.current == null) return;
    const dy = e.touches[0].clientY - toque.current;
    if (dy > 0 && scrollRef.current.scrollTop <= 0) setPuxar(Math.min(dy * 0.5, 110)); else setPuxar(0);
  };
  const onEnd = async () => {
    const ativar = puxar >= LIMIAR;
    toque.current = null;
    setPuxar(0);
    if (ativar && !atualizando) {
      setAtualizando(true);
      try { await buscarTudo(); } catch (e) { /* a faixa de conexão já avisa */ }
      setAtualizando(false);
    }
  };
  const altIndicador = atualizando ? 48 : puxar;

  return (
    <Tela>
      <div ref={scrollRef} className="scroll pb-tab" onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 14px) 0 112px', scrollbarWidth: 'none' }}>
        <div aria-hidden={!atualizando} style={{ height: altIndicador, overflow: 'hidden', display: 'grid', placeItems: 'center', color: 'var(--jade)', transition: puxar ? 'none' : 'height .2s ease' }}>
          <span className={atualizando ? 'girando' : ''} style={{ display: 'flex', transform: 'rotate(' + (puxar / LIMIAR) * 180 + 'deg)', opacity: Math.min(1, altIndicador / LIMIAR) }}>
            <Icon name="sync" size={22} />
          </span>
          {atualizando ? <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }} role="status">Atualizando</span> : null}
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="titulo-tela" style={{ margin: 0 }}>Lançamentos</h1>
            <button type="button" onClick={sincronizar} disabled={importando || !online} aria-label="Importar do Itaú agora" className={importando ? 'girando' : ''}
              style={{ width: 44, height: 44, borderRadius: '50%', border: 0, display: 'grid', placeItems: 'center', background: 'var(--jade-soft)', color: 'var(--jade)', cursor: 'pointer', opacity: online ? 1 : 0.5 }}>
              <Icon name="sync" size={22} />
            </button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 12px', borderRadius: 14, background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}>
            <Icon name="busca" size={20} />
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Buscar lançamento</span>
            <input className="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por descrição ou categoria"
              style={{ flex: 1, minWidth: 0, height: 40, border: 0, background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 16, outline: 'none' }} />
          </label>
          {importando ? <Aviso>Consultando o Itaú… pode levar até um minuto.</Aviso> : aviso ? <Aviso>{aviso}</Aviso> : null}
          <SegmentedControl value={filtro} onChange={setFiltro} aria-label="Filtrar lançamentos"
            options={[{ value: 'tudo', label: 'Tudo' }, { value: 'despesas', label: 'Despesas' }, { value: 'entradas', label: 'Entradas' }]} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 2px 0' }}>
            <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{nomeMes(mes)} · {lista.length} {lista.length === 1 ? 'lançamento' : 'lançamentos'}</span>
            <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{totalTxt}</span>
          </div>
        </div>

        {dias.map((g) => (
          <section key={g.data} style={{ padding: '18px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={{ margin: '0 4px', color: 'var(--ink-muted)' }}>{g.dia}</h2>
            <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)' }}>
              {g.itens.map((l) => {
                const c = sel.catPorNome[l.cat] || {};
                const href = l.cat ? '#/detalhe/' + l.id : '#/classificar?id=' + l.id;
                return (
                  <a key={l.id} href={href} style={{ display: 'block', color: 'inherit' }}>
                    <TransactionRow title={l.desc} category={l.cat} icon={c.icon} tone={c.tone} account={l.conta} method={l.forma}
                      value={l.valor} kind={kindMoney(sel.tipoDe(l))} installment={l.parc} pending={!l.cat} />
                  </a>
                );
              })}
            </div>
          </section>
        ))}

        {lista.length === 0 ? (
          <div style={{ padding: '24px 16px 0' }}>
            {q ? <p style={{ margin: '16px 8px 0', textAlign: 'center', fontSize: 15, color: 'var(--ink-muted)' }}>Nenhum lançamento com “{busca}”.</p>
              : <Vazio icon="lista" titulo={'Nenhum lançamento em ' + nomeMes(mes).toLowerCase()} texto="Troque o mês no Painel, importe do Itaú ou lance à mão no botão +." />}
          </div>
        ) : null}
      </div>
      <Barra ativa="lancamentos" />
    </Tela>
  );
}
