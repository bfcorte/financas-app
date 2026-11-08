import { useEffect, useRef, useState } from 'react';
import { Icon, CategoryIcon, TabBar } from './ds/index.js';
import { useDados } from './store.jsx';
import { navegar } from './router.js';

/* Contêiner de tela: substitui a moldura 390×844 do mockup. */
export function Tela({ children, fundo = 'var(--surface)' }) {
  return (
    <div className="tela" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: fundo, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
      {children}
    </div>
  );
}

export function Barra({ ativa }) {
  const { sel } = useDados();
  const n = sel.pendentes.length;
  const tabs = TabBar.TABS_PADRAO.map((t) => (t.value === 'lancamentos' ? { ...t, badge: n || null } : t));
  return (
    <TabBar
      tabs={tabs} value={ativa} className="tabbar-fixa"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5 }}
      onChange={(v) => navegar(v)}
    />
  );
}

export function Voltar({ href, children, inline }) {
  return (
    <a href={href} style={{ display: inline ? 'inline-flex' : 'flex', alignItems: 'center', gap: 2, height: 44, padding: '0 8px', fontSize: 17, fontWeight: 500 }}>
      <Icon name="voltar" size={22} />
      {children}
    </a>
  );
}

/* Fundo escurecido + folha que sobe de baixo */
export function Folha({ onFechar, label, style, children, className = '' }) {
  useEsc(onFechar);
  return (
    <>
      <button type="button" aria-label="Fechar" onClick={onFechar} className="veu"
        style={{ position: 'absolute', inset: 0, border: 0, background: 'rgba(6,16,12,0.45)', cursor: 'pointer', zIndex: 20 }} />
      <section role="dialog" aria-modal="true" aria-label={label} className={'folha ' + className}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: '22px 22px 0 0', background: 'var(--surface)', boxShadow: 'var(--shadow-sheet)', zIndex: 21, ...style }}>
        {children}
      </section>
    </>
  );
}

export function Alca({ margin = '8px auto 4px' }) {
  return <div aria-hidden="true" style={{ width: 36, height: 5, borderRadius: 3, background: 'var(--line)', margin }} />;
}

export function useEsc(fn) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const on = (e) => { if (e.key === 'Escape' && ref.current) ref.current(); };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);
}

/* Cabeçalho de folha: [Cancelar] Título [Salvar] */
export function CabecalhoFolha({ titulo, onCancelar, onSalvar }) {
  return (
    <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {onCancelar
        ? <button type="button" onClick={onCancelar} style={{ width: 90, height: 44, border: 0, background: 'none', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 17, textAlign: 'left', paddingLeft: 8, cursor: 'pointer' }}>Cancelar</button>
        : <span style={{ width: 82 }} />}
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{titulo}</h2>
      {onSalvar
        ? <button type="button" onClick={onSalvar} style={{ width: 90, height: 44, border: 0, background: 'none', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 700, textAlign: 'right', paddingRight: 8, cursor: 'pointer' }}>Salvar</button>
        : <span style={{ width: 90 }} />}
    </div>
  );
}

/* Folha "Categoria" com busca e grupos (Detalhe, Classificar, Novo) */
export function SeletorCategoria({ grupos, selecionada, onEscolher, onFechar, label = 'Escolher categoria', novaCategoria = true }) {
  const [busca, setBusca] = useState('');
  const q = busca.toLowerCase();
  const lista = grupos
    .map((g) => ({ ...g, itens: g.itens.filter((c) => !q || c.nome.toLowerCase().includes(q)) }))
    .filter((g) => g.itens.length);
  return (
    <Folha onFechar={onFechar} label={label} style={{ height: 'min(640px, calc(100% - var(--top) - 8px))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Alca />
      <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ width: 82 }} />
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Categoria</h2>
        <button type="button" onClick={onFechar} style={{ width: 82, height: 44, border: 0, background: 'none', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600, textAlign: 'right', paddingRight: 8, cursor: 'pointer' }}>OK</button>
      </div>
      <label style={{ margin: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 12px', borderRadius: 14, background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}>
        <Icon name="busca" size={20} />
        <input className="campo" type="search" placeholder="Buscar categoria" aria-label="Buscar categoria" value={busca} onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 0, height: 40, border: 0, background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 16, outline: 'none' }} />
      </label>
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px calc(32px + var(--bottom))', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {lista.map((g) => (
          <div key={g.nome} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="rotulo" style={{ margin: '0 4px', color: 'var(--ink-muted)' }}>{g.nome}</span>
            <div style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)' }}>
              {g.itens.map((c) => (
                <button key={c.id} type="button" onClick={() => onEscolher(c.id)} aria-pressed={c.id === selecionada}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 16px', border: 0, background: 'var(--surface-raised)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left', cursor: 'pointer' }}>
                  <CategoryIcon icon={c.icon} tone={c.tone} size={32} />
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{c.nome}</span>
                  {c.id === selecionada ? <span style={{ color: 'var(--jade)' }}><Icon name="check" size={22} stroke={2.2} /></span> : null}
                </button>
              ))}
            </div>
          </div>
        ))}
        {lista.length === 0 ? <p style={{ margin: '16px 8px', textAlign: 'center', fontSize: 15, color: 'var(--ink-muted)' }}>Nenhuma categoria com “{busca}”.</p> : null}
        {novaCategoria ? (
          <a href="#/categorias?nova=1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, border: '1px dashed var(--line)', borderRadius: 14, color: 'var(--jade)', fontSize: 15, fontWeight: 600, flex: 'none' }}>
            <Icon name="mais" size={20} />
            Nova categoria
          </a>
        ) : null}
      </div>
    </Folha>
  );
}

/* Aviso verde que some sozinho */
export function useAviso(ms = 3000) {
  const [txt, setTxt] = useState('');
  const t = useRef(null);
  useEffect(() => () => clearTimeout(t.current), []);
  const mostrar = (s) => { setTxt(s); clearTimeout(t.current); t.current = setTimeout(() => setTxt(''), ms); };
  return [txt, mostrar];
}

export function Aviso({ children, style }) {
  return (
    <div role="status" className="aviso" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--jade-soft)', color: 'var(--ink)', fontSize: 14, ...style }}>
      <span style={{ color: 'var(--jade)' }}><Icon name="check" size={20} stroke={2.2} /></span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

export function Chave({ checked, onChange, label }) {
  return (
    <span className="sw"><input type="checkbox" checked={!!checked} onChange={onChange} aria-label={label} /><span /></span>
  );
}

/* Estilos repetidos dos mockups */
export const S = {
  campo: { height: 50, padding: '0 14px', border: 0, borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 16 },
  campoValor: { display: 'flex', alignItems: 'center', gap: 6, height: 50, padding: '0 14px', borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)' },
  inputLimpo: { flex: 1, minWidth: 0, height: 44, border: 0, background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 16, outline: 'none' },
  rotulo: { margin: '0 4px', color: 'var(--ink-muted)' },
  grupoLista: { borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)' },
  linhaBotao: { display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 16px', border: 0, background: 'var(--surface-raised)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left', cursor: 'pointer' },
  card: { borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)' }
};
