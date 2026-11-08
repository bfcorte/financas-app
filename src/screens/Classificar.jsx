import { useState } from 'react';
import { Icon, Money, CategoryIcon, StatusBadge, Button } from '../ds/index.js';
import { useDados, rotuloDia, chaveDe } from '../store.jsx';
import { Tela, Voltar, SeletorCategoria, Chave, S } from '../ui.jsx';

export default function Classificar({ rota }) {
  const { d, sel, classificar } = useDados();
  const [fila, setFila] = useState(() => sel.ordenar(sel.pendentes).map((l) => l.id));
  const [idx, setIdx] = useState(() => Math.max(0, fila.indexOf(rota.query.id || '')));
  const [escolhas, setEscolhas] = useState({});
  const [regra, setRegra] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const item = d.lancamentos.find((l) => l.id === fila[idx]);
  const temItem = idx < fila.length && !!item;
  const sug = item ? sel.sugestaoDe(item) : null;
  const escolha = item ? (escolhas[item.id] || (sug ? sug.cat : '')) : '';
  const cat = escolha ? sel.catPorNome[escolha] : null;
  const chave = item ? chaveDe(item.desc) : '';
  const restantes = sel.pendentes.length;

  const avancar = () => { setIdx((i) => i + 1); setRegra(true); setAberto(false); };
  const onClassificar = async () => {
    if (!item || !escolha) { setAberto(true); return; }
    if (item.cat) { avancar(); return; } // já classificado em outro lugar
    setEnviando(true);
    const r = await classificar(item.id, escolha, regra ? { chave } : null);
    setEnviando(false);
    if (r) avancar();
  };

  return (
    <Tela>
      <div className="scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 6px) 0 calc(40px + var(--bottom))', scrollbarWidth: 'none' }}>
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Voltar href="#/painel">Painel</Voltar>
          <span style={{ padding: '0 12px', fontSize: 14, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{temItem ? (idx + 1) + ' de ' + fila.length : ''}</span>
        </div>
        <div style={{ padding: '4px 16px 0' }}>
          <h1 className="titulo-tela" style={{ margin: 0 }}>A classificar</h1>
        </div>

        {temItem ? (
          <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
              {fila.map((id, k) => <span key={id} style={{ flex: '1 1 0', height: 4, borderRadius: 2, background: 'var(--' + (k < idx ? 'jade' : k === idx ? 'amber' : 'surface-sunken') + ')' }} />)}
            </div>
            <section style={{ padding: '22px 18px', borderRadius: 22, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
              <span style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--amber-soft)', color: 'var(--amber)' }}>
                <Icon name="duvida" size={30} />
              </span>
              <h2 style={{ margin: '6px 0 0', fontSize: 18, lineHeight: '24px', fontWeight: 600 }}>{item.desc}</h2>
              <Money value={item.valor} kind="despesa" size="hero" />
              <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{[item.conta, item.forma, rotuloDia(item.data)].filter(Boolean).join(' · ')}</span>
            </section>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="rotulo" style={S.rotulo}>Categoria</span>
              <button type="button" onClick={() => setAberto(true)} aria-haspopup="dialog" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, padding: '8px 16px', border: 0, borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left', cursor: 'pointer' }}>
                {cat ? <CategoryIcon icon={cat.icon} tone={cat.tone} size={36} />
                  : <span className="fp-cat-icon fp-cat-icon--pend" style={{ width: 36, height: 36 }}><Icon name="duvida" size={20} /></span>}
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{cat ? cat.nome : 'Escolher categoria'}</span>
                  {cat && sug && escolha === sug.cat
                    ? <StatusBadge tone="ok" icon="raio">{sug.fonte === 'claude' ? 'Sugerida pelo Claude' : 'Sugerida pela regra'}</StatusBadge>
                    : cat && sug ? <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Escolhida por você · sugestão era {sug.cat}</span>
                      : <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{cat ? 'Escolhida por você' : 'Sem sugestão · toque para escolher'}</span>}
                </span>
                <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
              </button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', cursor: 'pointer' }}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Lembrar para os próximos</span>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Cria a regra “{chave}” → {cat ? cat.nome : '…'}</span>
              </span>
              <Chave checked={regra} onChange={() => setRegra(!regra)} label="Criar regra" />
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Button icon="check" block onClick={onClassificar} disabled={enviando}>{cat ? 'Classificar como ' + cat.nome : 'Escolher categoria'}</Button>
              <Button variant="fantasma" block onClick={avancar}>Pular por agora</Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '80px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <span style={{ width: 80, height: 80, borderRadius: '50%', display: 'grid', placeItems: 'center', background: restantes ? 'var(--amber-soft)' : 'var(--jade-soft)', color: restantes ? 'var(--amber)' : 'var(--jade)' }}>
              <Icon name={restantes ? 'duvida' : 'check'} size={40} stroke={2.2} />
            </span>
            <h2 className="titulo-secao" style={{ margin: '8px 0 0' }}>{restantes ? (restantes === 1 ? '1 ficou para depois' : restantes + ' ficaram para depois') : 'Tudo classificado'}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: '22px', color: 'var(--ink-muted)', maxWidth: 280 }}>
              {restantes ? 'Os que você pulou continuam em A classificar. ' : fila.length ? 'Os lançamentos já foram para a planilha. As regras novas valem para os próximos. ' : 'Nada esperando classificação agora. '}
            </p>
            <a className="fp-btn fp-btn--primario" href="#/painel" style={{ marginTop: 12, minWidth: 220, color: 'var(--on-jade)' }}>Voltar ao Painel</a>
            {restantes ? (
              <button type="button" onClick={() => { setFila(sel.ordenar(sel.pendentes).map((l) => l.id)); setIdx(0); }} style={{ height: 44, border: 0, background: 'none', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Classificar os que ficaram</button>
            ) : null}
          </div>
        )}
      </div>

      {aberto && temItem ? (
        <SeletorCategoria grupos={sel.gruposPicker('todas')} selecionada={escolha}
          onEscolher={(c) => { setEscolhas({ ...escolhas, [item.id]: c }); setAberto(false); }} onFechar={() => setAberto(false)} />
      ) : null}
    </Tela>
  );
}
