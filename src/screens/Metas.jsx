import { useState } from 'react';
import { Icon, Button, KpiCard, GoalRing } from '../ds/index.js';
import { useDados, brl, num, novoId } from '../store.jsx';
import { Tela, Barra, Folha, Alca, CabecalhoFolha, S } from '../ui.jsx';

const faltam = (saved, target, mensal) => {
  if (target <= 0) return '';
  if (saved >= target) return 'Meta batida';
  if (mensal <= 0) return 'Defina quanto guardar por mês para ver o prazo';
  const n = Math.ceil((target - saved) / mensal);
  return brl(mensal) + ' por mês · faltam ' + n + (n === 1 ? ' mês' : ' meses');
};

export default function Metas() {
  const { d, sel, salvarMeta, delMeta } = useDados();
  const [aberto, setAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome: '', target: '', mensal: '', aporte: '', saved: 0, aportado: 0 });

  const metas = d.metas.map((m) => ({ ...m, saved: sel.guardadoMeta(m) }));
  const total = metas.reduce((s, m) => s + m.saved, 0);
  const noMes = sel.totais(sel.doMes(d.mes)).guardado;
  const editando = editId !== null;

  const abrir = (m) => {
    setEditId(m ? m.id : null);
    setForm({ nome: m ? m.nome : '', target: m && m.target ? String(m.target) : '', mensal: m && m.mensal ? String(m.mensal) : '', aporte: '', saved: m ? m.saved : 0, aportado: 0 });
    setAberto(true);
  };
  const setF = (p) => setForm((f) => ({ ...f, ...p }));
  const guardar = () => { const v = num(form.aporte); if (!v) return; setF({ saved: form.saved + v, aportado: form.aportado + v, aporte: '' }); };
  const salvar = () => {
    if (!form.nome.trim() || !num(form.target)) { setAberto(false); return; }
    const atual = d.metas.find((m) => m.id === editId);
    const base = atual || { id: novoId('m'), catId: null, inicial: 0 };
    salvarMeta({ ...base, nome: form.nome.trim(), target: num(form.target), mensal: num(form.mensal) }, form.aportado);
    setAberto(false);
  };
  const excluir = () => { delMeta(editId); setAberto(false); };

  return (
    <Tela>
      <div className="scroll pb-tab" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 14px) 0 112px', scrollbarWidth: 'none' }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="titulo-tela" style={{ margin: 0 }}>Metas</h1>
            <Button variant="secundario" size="sm" icon="mais" onClick={() => abrir(null)}>Nova meta</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <KpiCard label="Guardado no mês" value={noMes} tone="violet" icon="cofre" foot={'Meta do mês ' + brl(d.metaMensal)} />
            <KpiCard label="Total guardado" value={total} tone="violet" icon="alvo" foot={'Em ' + metas.length + (metas.length === 1 ? ' meta' : ' metas')} />
          </div>
          {metas.length ? (
            <div style={S.grupoLista}>
              {metas.map((m) => (
                <button key={m.id} type="button" onClick={() => abrir(m)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, border: 0, background: 'var(--surface-raised)', color: 'var(--ink)', textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <GoalRing name={m.nome} saved={m.saved} target={m.target} foot={faltam(m.saved, m.target, m.mensal)} size={76} />
                  </span>
                  <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
                </button>
              ))}
            </div>
          ) : <p style={{ margin: '8px 4px', fontSize: 15, color: 'var(--ink-muted)' }}>Nenhuma meta ainda. Toque em Nova meta para começar.</p>}
          <section style={{ padding: 16, borderRadius: 14, background: 'var(--violet-soft)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--violet)', paddingTop: 1 }}><Icon name="raio" size={20} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 14, lineHeight: '20px' }}>
              <strong style={{ fontWeight: 600 }}>Como o app conta</strong>
              <span style={{ color: 'var(--ink-muted)' }}>Todo lançamento do grupo Reserva entra na meta com o mesmo nome. Os Pix do cofrinho das crianças já caem em Mesada filhos sozinhos.</span>
            </span>
          </section>
        </div>
      </div>
      <Barra ativa="metas" />

      {aberto ? (
        <Folha onFechar={() => setAberto(false)} label={editando ? 'Meta' : 'Nova meta'} style={{ maxHeight: 'min(780px, calc(100% - var(--top) - 8px))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Alca />
          <CabecalhoFolha titulo={editando ? 'Meta' : 'Nova meta'} onCancelar={() => setAberto(false)} onSalvar={salvar} />
          <div className="scroll pb-folha" style={{ overflowY: 'auto', overflowX: 'hidden', padding: '10px 16px 36px', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {editando ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <GoalRing saved={form.saved} target={num(form.target) || 1} size={120} strokeWidth={12} />
                  <span style={{ fontSize: 15, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{brl(form.saved)} de {brl(num(form.target))}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 14, background: 'var(--violet-soft)' }}>
                  <label htmlFor="aporte" className="rotulo" style={{ color: 'var(--violet)' }}>Guardar agora</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, height: 48, padding: '0 14px', borderRadius: 12, background: 'var(--surface-raised)' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>R$</span>
                      <input id="aporte" className="campo" type="text" inputMode="decimal" value={form.aporte} onChange={(e) => setF({ aporte: e.target.value })} placeholder="100" style={S.inputLimpo} />
                    </span>
                    <Button icon="mais" onClick={guardar}>Guardar</Button>
                  </div>
                  <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>
                    {form.aportado ? 'Ao salvar, lança uma Reserva de ' + brl(form.aportado) + ' com o nome da meta.' : 'Lança uma Reserva com o nome da meta na planilha.'}
                  </span>
                </div>
              </>
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="nome" className="rotulo" style={S.rotulo}>Nome da meta</label>
              <input id="nome" className="campo" type="text" value={form.nome} onChange={(e) => setF({ nome: e.target.value })} placeholder="Ex.: Entrada do terreno" style={S.campo} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="alvo" className="rotulo" style={S.rotulo}>Quanto quer juntar</label>
                <span style={S.campoValor}>
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>R$</span>
                  <input id="alvo" className="campo" type="text" inputMode="decimal" value={form.target} onChange={(e) => setF({ target: e.target.value })} placeholder="10.000" style={S.inputLimpo} />
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="mensal" className="rotulo" style={S.rotulo}>Guardar por mês</label>
                <span style={S.campoValor}>
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>R$</span>
                  <input id="mensal" className="campo" type="text" inputMode="decimal" value={form.mensal} onChange={(e) => setF({ mensal: e.target.value })} placeholder="500" style={S.inputLimpo} />
                </span>
              </div>
            </div>
            <span style={{ margin: '-8px 4px 0', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>{faltam(form.saved, num(form.target), num(form.mensal))}</span>
            {editando ? <Button variant="perigo" icon="lixo" block onClick={excluir}>Excluir meta</Button> : null}
          </div>
        </Folha>
      ) : null}
    </Tela>
  );
}
