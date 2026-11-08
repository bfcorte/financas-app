import { useEffect, useState } from 'react';
import { Icon, Button, CategoryIcon, SegmentedControl } from '../ds/index.js';
import { useDados, brl, num, PLURAL_GRUPO } from '../store.jsx';
import { Tela, Voltar, Folha, Alca, CabecalhoFolha, Aviso, useAviso, S } from '../ui.jsx';

const TONS = ['nota-2', 'nota-5', 'nota-10', 'nota-20', 'nota-50', 'nota-100', 'nota-200', 'jade', 'violet'];
const NOMES_TOM = { 'nota-2': 'Azul-acinzentado (R$ 2)', 'nota-5': 'Violeta (R$ 5)', 'nota-10': 'Vermelho (R$ 10)', 'nota-20': 'Amarelo (R$ 20)', 'nota-50': 'Laranja (R$ 50)', 'nota-100': 'Azul (R$ 100)', 'nota-200': 'Sépia (R$ 200)', jade: 'Jade (entradas)', violet: 'Violeta-claro (reservas)' };
const ICONES = ['casa', 'mercado', 'garfo', 'carro', 'saude', 'pata', 'lazer', 'sacola', 'escola', 'pessoa', 'tv', 'cartao', 'raio', 'cofre', 'entrada', 'transferencia', 'banco', 'calendario'];
const AJUDA = {
  Fixa: 'Fixa: mesmo valor todo mês (aluguel, pensão, parcelas).',
  'Variável': 'Variável: muda de mês para mês (mercado, gasolina, projetos por demanda).',
  Reserva: 'Reserva: dinheiro guardado. Entra nas Metas.',
  Entrada: 'Entrada: o que você recebe (salário, projetos).',
  'Transferência': 'Transferência: entre contas ou pagamento de fatura. Fica fora dos totais.'
};
const ORDEM = ['Fixa', 'Variável', 'Reserva', 'Entrada', 'Transferência'];
const regrasTxt = (n) => (n === 0 ? 'Sem regra automática' : n === 1 ? '1 regra automática' : n + ' regras automáticas');

export default function Categorias({ rota }) {
  const { d, criarCategoria, editarCategoria, excluirCategoria } = useDados();
  const [aberto, setAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome: '', grupo: 'Variável', icon: 'sacola', tone: 'nota-200', orc: '' });
  const [aviso, mostrarAviso] = useAviso(3000);

  const nRegras = (nome) => d.regras.filter((r) => r.cat === nome).length;
  const nLancs = (nome) => d.lancamentos.filter((l) => l.cat === nome).length;
  const abrir = (c) => {
    setEditId(c ? c.nome : null);
    setForm(c ? { ...c, orc: c.orc ? String(c.orc) : '' } : { nome: '', grupo: 'Variável', icon: 'sacola', tone: 'nota-200', orc: '' });
    setAberto(true);
  };
  useEffect(() => { if (rota.query.nova) abrir(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const grupos = ORDEM.map((g) => {
    const itens = d.categorias.filter((c) => c.grupo === g);
    const total = itens.reduce((s, c) => s + c.orc, 0);
    return { g, nome: PLURAL_GRUPO[g], itens, totalTxt: g === 'Transferência' ? '' : (g === 'Entrada' ? 'previsto ' : 'orçado ') + brl(total) };
  }).filter((g) => g.itens.length);

  const setF = (p) => setForm((f) => ({ ...f, ...p }));
  const salvar = async () => {
    const nome = form.nome.trim();
    if (!nome) { setAberto(false); return; }
    if ((!editId || editId !== nome) && d.categorias.some((c) => c.nome === nome)) { mostrarAviso('Já existe uma categoria com esse nome.'); return; }
    const c = { nome, grupo: form.grupo, icon: form.icon, tone: form.tone, orc: num(form.orc) };
    setAberto(false);
    const r = editId ? await editarCategoria(editId, c) : await criarCategoria(c);
    if (r) mostrarAviso(editId ? 'Categoria atualizada na planilha.' : 'Categoria criada na planilha.');
  };
  const excluir = async () => {
    setAberto(false);
    const r = await excluirCategoria(editId);
    if (r) mostrarAviso(r.voltaram ? 'Categoria excluída. ' + r.voltaram + (r.voltaram === 1 ? ' lançamento voltou' : ' lançamentos voltaram') + ' para A classificar.' : 'Categoria excluída.');
  };
  const editando = editId !== null;
  const nl = editando ? nLancs(editId) : 0;

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
          <h1 className="titulo-tela" style={{ margin: 0 }}>Categorias</h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--ink-muted)' }}>Toque numa categoria para editar. Tudo aqui atualiza a aba Orçamento da planilha.</p>
          {aviso ? <Aviso style={{ marginTop: 8 }}>{aviso}</Aviso> : null}
        </div>
        {grupos.map((g) => (
          <section key={g.g} style={{ padding: '22px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px' }}>
              <h2 className="rotulo" style={{ margin: 0, color: 'var(--ink-muted)' }}>{g.nome}</h2>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{g.totalTxt}</span>
            </div>
            <div style={S.grupoLista}>
              {g.itens.map((c) => (
                <button key={c.nome} type="button" onClick={() => abrir(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '6px 16px', border: 0, background: 'var(--surface-raised)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left', cursor: 'pointer' }}>
                  <CategoryIcon icon={c.icon} tone={c.tone} size={36} />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{c.nome}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{regrasTxt(nRegras(c.nome))}</span>
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{c.orc ? brl(c.orc) : '—'}</span>
                  <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {aberto ? (
        <Folha onFechar={() => setAberto(false)} label={editando ? 'Editar categoria' : 'Nova categoria'} style={{ height: 'min(760px, calc(100% - var(--top) - 8px))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Alca />
          <CabecalhoFolha titulo={editando ? 'Editar categoria' : 'Nova categoria'} onCancelar={() => setAberto(false)} onSalvar={salvar} />
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 16px calc(32px + var(--bottom))', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 4 }}>
              <CategoryIcon icon={form.icon} tone={form.tone} size={64} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="nome" className="rotulo" style={S.rotulo}>Nome</label>
              <input id="nome" className="campo" type="text" value={form.nome} onChange={(e) => setF({ nome: e.target.value })} placeholder="Ex.: Farmácia" style={S.campo} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="rotulo" style={S.rotulo}>Grupo</span>
              <SegmentedControl className="seg-5" value={form.grupo} onChange={(v) => setF({ grupo: v })} aria-label="Grupo"
                options={[{ value: 'Fixa', label: 'Fixa' }, { value: 'Variável', label: 'Variável' }, { value: 'Reserva', label: 'Reserva' }, { value: 'Entrada', label: 'Entrada' }, { value: 'Transferência', label: 'Transf.' }]} />
              <span style={{ margin: '0 4px', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>{AJUDA[form.grupo]}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="orc" className="rotulo" style={S.rotulo}>Orçado por mês</label>
              <span style={S.campoValor}>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>R$</span>
                <input id="orc" className="campo" type="text" inputMode="decimal" value={form.orc} onChange={(e) => setF({ orc: e.target.value })} placeholder="0" style={{ ...S.inputLimpo, fontVariantNumeric: 'tabular-nums' }} />
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="rotulo" style={S.rotulo}>Cor</span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {TONS.map((t) => {
                  const on = t === form.tone;
                  return <button key={t} type="button" className="op" onClick={() => setF({ tone: t })} aria-label={NOMES_TOM[t]} aria-pressed={on}
                    style={{ width: 44, height: 44, borderRadius: '50%', border: 0, cursor: 'pointer', background: 'var(--' + t + ')', boxShadow: on ? '0 0 0 3px var(--surface), 0 0 0 5px var(--' + t + ')' : 'none' }} />;
                })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="rotulo" style={S.rotulo}>Ícone</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8 }}>
                {ICONES.map((n) => {
                  const on = n === form.icon;
                  return (
                    <button key={n} type="button" className="op" onClick={() => setF({ icon: n })} aria-label={n} aria-pressed={on}
                      style={{ height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', cursor: 'pointer', border: on ? '2px solid var(--jade)' : '1px solid var(--line)', background: on ? 'var(--jade-soft)' : 'var(--surface-raised)', color: on ? 'var(--jade)' : 'var(--ink)' }}>
                      <Icon name={n} size={22} />
                    </button>
                  );
                })}
              </div>
            </div>
            <a href={editando ? '#/regras?cat=' + encodeURIComponent(editId) : '#/regras'} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '6px 16px', borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', color: 'var(--ink)', flex: 'none' }}>
              <span style={{ color: 'var(--jade)' }}><Icon name="raio" size={20} /></span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>Regras desta categoria</span>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{editando ? regrasTxt(nRegras(editId)) + ' · toque para ver' : 'Crie uma regra para classificar sozinho'}</span>
              </span>
              <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
            </a>
            {editando ? (
              <>
                <Button variant="perigo" icon="lixo" block onClick={excluir}>Excluir categoria</Button>
                <span style={{ margin: '-10px 4px 0', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)', textAlign: 'center' }}>
                  {nl === 0 ? 'Nenhum lançamento usa esta categoria.' : nl === 1 ? 'O lançamento dela volta para A classificar.' : 'Os ' + nl + ' lançamentos dela voltam para A classificar.'}
                </span>
              </>
            ) : null}
          </div>
        </Folha>
      ) : null}
    </Tela>
  );
}
