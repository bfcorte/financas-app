import { useState } from 'react';
import { Icon, Button, CategoryIcon } from '../ds/index.js';
import { useDados, novoId, NOME_GRUPO } from '../store.jsx';
import { Tela, Voltar, Folha, Alca, CabecalhoFolha, S } from '../ui.jsx';

export default function Regras({ rota }) {
  const { d, sel, salvarRegra, delRegra } = useDados();
  const [aberto, setAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const filtroCat = sel.catPorId[rota.query.cat] ? rota.query.cat : null;
  const padraoCat = filtroCat || (sel.catPorId.mercado ? 'mercado' : d.cats[0] && d.cats[0].id);
  const [form, setForm] = useState({ chave: '', catId: padraoCat });

  const abrir = (r) => { setEditId(r ? r.id : null); setForm(r ? { chave: r.chave, catId: r.catId } : { chave: '', catId: padraoCat }); setAberto(true); };
  const salvar = () => {
    const chave = form.chave.trim().toUpperCase();
    if (!chave || !sel.catPorId[form.catId]) { setAberto(false); return; }
    salvarRegra({ id: editId || novoId('r'), chave, catId: form.catId });
    setAberto(false);
  };
  const excluir = () => { delRegra(editId); setAberto(false); };
  const lista = d.regras.filter((r) => !filtroCat || r.catId === filtroCat);
  const porGrupo = ['fixa', 'variavel', 'reserva', 'entrada'].map((g) => ({ g, itens: d.cats.filter((c) => c.grupo === g) })).filter((x) => x.itens.length);

  return (
    <Tela>
      <div className="scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 6px) 0 calc(40px + var(--bottom))', scrollbarWidth: 'none' }}>
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Voltar href="#/ajustes">Ajustes</Voltar>
          <button type="button" onClick={() => abrir(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 44, padding: '0 8px', border: 0, background: 'none', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>
            <Icon name="mais" size={20} />
            Nova
          </button>
        </div>
        <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 className="titulo-tela" style={{ margin: 0 }}>Regras</h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--ink-muted)' }}>Quando a descrição do banco tiver a palavra, o lançamento já entra na categoria. O que nenhuma regra pegar vai para o Claude sugerir.</p>
          {filtroCat ? (
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-muted)' }}>
              Mostrando só {sel.catPorId[filtroCat].nome}. <a href="#/regras" style={{ fontWeight: 600 }}>Ver todas</a>
            </p>
          ) : null}
        </div>
        <div style={{ padding: '20px 16px 0' }}>
          {lista.length ? (
            <div style={S.grupoLista}>
              {lista.map((r) => {
                const c = sel.catPorId[r.catId] || { nome: '—', icon: 'sacola', tone: 'nota-200' };
                return (
                  <button key={r.id} type="button" onClick={() => abrir(r)} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '6px 16px', border: 0, background: 'var(--surface-raised)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left', cursor: 'pointer' }}>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ padding: '3px 8px', borderRadius: 8, background: 'var(--surface-sunken)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.chave}</code>
                      <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={16} /></span>
                      <CategoryIcon icon={c.icon} tone={c.tone} size={28} />
                      <span style={{ fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : <p style={{ margin: '8px 4px', fontSize: 15, color: 'var(--ink-muted)' }}>Nenhuma regra ainda. Toque em Nova para criar.</p>}
        </div>
      </div>

      {aberto ? (
        <Folha onFechar={() => setAberto(false)} label={editId ? 'Editar regra' : 'Nova regra'} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: editId ? 470 : 380 }}>
          <Alca />
          <CabecalhoFolha titulo={editId ? 'Editar regra' : 'Nova regra'} onCancelar={() => setAberto(false)} onSalvar={salvar} />
          <div className="pb-folha" style={{ padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="chave" className="rotulo" style={S.rotulo}>Quando a descrição tiver</label>
              <input id="chave" className="campo" type="text" autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={form.chave} onChange={(e) => setForm({ ...form, chave: e.target.value.toUpperCase() })} placeholder="Ex.: DROGASIL"
                style={{ ...S.campo, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', textTransform: 'uppercase' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="cat" className="rotulo" style={S.rotulo}>Classificar como</label>
              <select id="cat" className="campo" value={form.catId} onChange={(e) => setForm({ ...form, catId: e.target.value })} style={S.campo}>
                {porGrupo.map((g) => (
                  <optgroup key={g.g} label={NOME_GRUPO[g.g]}>
                    {g.itens.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            {editId ? <Button variant="perigo" icon="lixo" block onClick={excluir}>Excluir regra</Button> : null}
          </div>
        </Folha>
      ) : null}
    </Tela>
  );
}
