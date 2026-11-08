import { useState } from 'react';
import { Icon, Button, KpiCard, GoalRing } from '../ds/index.js';
import { useDados, brl, num, isoData } from '../store.jsx';
import { Tela, Barra, Folha, Alca, CabecalhoFolha, Aviso, useAviso, Vazio, S } from '../ui.jsx';

const faltam = (saved, target, mensal) => {
  if (target <= 0) return '';
  if (saved >= target) return 'Meta batida';
  if (mensal <= 0) return 'Defina quanto guardar por mês para ver o prazo';
  const n = Math.ceil((target - saved) / mensal);
  return brl(mensal) + ' por mês · faltam ' + n + (n === 1 ? ' mês' : ' meses');
};

// A planilha guarda o prazo; o app pergunta "quanto guardar por mês" e converte em prazo.
const prazoPara = (alvo, guardado, mensal) => {
  if (!(mensal > 0) || !(alvo > guardado)) return '';
  const n = Math.ceil((alvo - guardado) / mensal);
  const d = new Date();
  return isoData(new Date(d.getFullYear(), d.getMonth() + n + 1, 0));
};

export default function Metas() {
  const { d, sel, mes, criarMeta, editarMeta, excluirMeta, guardarNaMeta } = useDados();
  const [aberto, setAberto] = useState(false);
  const [editNome, setEditNome] = useState(null);
  const [form, setForm] = useState({ nome: '', target: '', mensal: '', inicial: '', aporte: '' });
  const [aviso, mostrarAviso] = useAviso(3000);

  const metas = d.metas;
  const total = metas.reduce((s, m) => s + (m.guardado || 0), 0);
  const metaMes = metas.reduce((s, m) => s + (m.porMes || 0), 0);
  const noMes = sel.totais(sel.doMes(mes)).guardado;
  const editando = editNome !== null;
  const atual = editando ? metas.find((m) => m.nome === editNome) : null;
  const guardadoAtual = atual ? atual.guardado : num(form.inicial);

  const abrir = (m) => {
    setEditNome(m ? m.nome : null);
    setForm({ nome: m ? m.nome : '', target: m && m.alvo ? String(m.alvo) : '', mensal: m && m.porMes ? String(Math.round(m.porMes)) : '', inicial: m && m.inicial ? String(m.inicial) : '', aporte: '' });
    setAberto(true);
  };
  const setF = (p) => setForm((f) => ({ ...f, ...p }));

  const guardar = async () => {
    const v = num(form.aporte);
    if (!v || !atual) return;
    setF({ aporte: '' });
    const r = await guardarNaMeta(atual.nome, v);
    if (r) mostrarAviso('Guardado ' + brl(v) + ' em ' + atual.nome + '. Lançado como Reserva na planilha.');
  };
  const salvar = async () => {
    const nome = form.nome.trim(), alvo = num(form.target);
    if (!nome || !(alvo > 0)) { setAberto(false); return; }
    const mensal = num(form.mensal);
    const mudouMensal = !atual || Math.round(mensal) !== Math.round(atual.porMes || 0);
    const prazo = mudouMensal ? prazoPara(alvo, guardadoAtual, mensal) : (atual.prazo || '');
    const m = { nome, alvo, inicial: num(form.inicial), prazo };
    setAberto(false);
    const r = editando ? await editarMeta(editNome, m) : await criarMeta(m);
    if (r) mostrarAviso(editando ? 'Meta atualizada na planilha.' : 'Meta criada na planilha.');
  };
  const excluir = async () => { setAberto(false); const r = await excluirMeta(editNome); if (r) mostrarAviso('Meta excluída.'); };

  return (
    <Tela>
      <div className="scroll pb-tab" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 14px) 0 112px', scrollbarWidth: 'none' }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="titulo-tela" style={{ margin: 0 }}>Metas</h1>
            <Button variant="secundario" size="sm" icon="mais" onClick={() => abrir(null)}>Nova meta</Button>
          </div>
          {aviso ? <Aviso>{aviso}</Aviso> : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <KpiCard label="Guardado no mês" value={noMes} tone="violet" icon="cofre" foot={metaMes > 0 ? 'Meta do mês ' + brl(metaMes) : 'Sem meta mensal'} />
            <KpiCard label="Total guardado" value={total} tone="violet" icon="alvo" foot={'Em ' + metas.length + (metas.length === 1 ? ' meta' : ' metas')} />
          </div>
          {metas.length ? (
            <div style={S.grupoLista}>
              {metas.map((m) => (
                <button key={m.nome} type="button" onClick={() => abrir(m)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, border: 0, background: 'var(--surface-raised)', color: 'var(--ink)', textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <GoalRing name={m.nome} saved={m.guardado} target={m.alvo} foot={faltam(m.guardado, m.alvo, m.porMes)} size={76} />
                  </span>
                  <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
                </button>
              ))}
            </div>
          ) : (
            <Vazio icon="alvo" titulo="Nenhuma meta ainda" texto="Crie uma meta para juntar dinheiro. Cada Reserva lançada com o nome da meta entra nela."
              acao={<Button variant="secundario" size="sm" icon="mais" onClick={() => abrir(null)}>Criar meta</Button>} />
          )}
          <section style={{ padding: 16, borderRadius: 14, background: 'var(--violet-soft)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--violet)', paddingTop: 1 }}><Icon name="raio" size={20} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 14, lineHeight: '20px' }}>
              <strong style={{ fontWeight: 600 }}>Como o app conta</strong>
              <span style={{ color: 'var(--ink-muted)' }}>Toda meta é uma categoria do grupo Reserva com o mesmo nome. Cada lançamento nessa categoria entra no total guardado.</span>
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
            {editando && atual ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <GoalRing saved={atual.guardado} target={num(form.target) || atual.alvo || 1} size={120} strokeWidth={12} />
                  <span style={{ fontSize: 15, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{brl(atual.guardado)} de {brl(num(form.target) || atual.alvo)}</span>
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
                  <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>Lança uma Reserva com o nome da meta na planilha.</span>
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
            <span style={{ margin: '-8px 4px 0', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>{faltam(guardadoAtual, num(form.target), num(form.mensal))}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="inicial" className="rotulo" style={S.rotulo}>Já tinha guardado antes</label>
              <span style={S.campoValor}>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>R$</span>
                <input id="inicial" className="campo" type="text" inputMode="decimal" value={form.inicial} onChange={(e) => setF({ inicial: e.target.value })} placeholder="0" style={S.inputLimpo} />
              </span>
            </div>
            {editando ? <Button variant="perigo" icon="lixo" block onClick={excluir}>Excluir meta</Button> : null}
          </div>
        </Folha>
      ) : null}
    </Tela>
  );
}
