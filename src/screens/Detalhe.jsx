import { useState } from 'react';
import { Icon, Money, CategoryIcon, StatusBadge, Button, formatBRL } from '../ds/index.js';
import { useDados, num, parseData, DIAS, MESES, NOME_GRUPO, tipoDoGrupo, regraPara, chaveDe, novoId } from '../store.jsx';
import { navegar } from '../router.js';
import { Tela, Voltar, Folha, Alca, CabecalhoFolha, SeletorCategoria, Aviso, useAviso, useEsc, S } from '../ui.jsx';

export default function Detalhe({ rota }) {
  const { d, sel, updLanc, delLanc, salvarRegra } = useDados();
  const [catAberto, setCatAberto] = useState(false);
  const [pergunta, setPergunta] = useState(null);
  const [editAberto, setEditAberto] = useState(false);
  const [form, setForm] = useState({ desc: '', valor: '', data: '' });
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, mostrarAviso] = useAviso(3000);

  let L = d.lancs.find((l) => l.id === rota.param && sel.catPorId[l.catId]);
  if (!L && !rota.param) {
    const doMes = sel.ordenar(sel.doMes(d.mes)).filter((l) => sel.catPorId[l.catId]);
    L = doMes.find((l) => regraPara(d.regras, l.desc)) || doMes[0];
  }

  if (!L) {
    return (
      <Tela>
        <div style={{ padding: 'calc(var(--top) + 6px) 8px 0' }}><Voltar href="#/lancamentos">Lançamentos</Voltar></div>
        <p style={{ margin: '60px 24px 0', textAlign: 'center', fontSize: 15, color: 'var(--ink-muted)' }}>Este lançamento não existe mais.</p>
      </Tela>
    );
  }

  const cat = sel.catPorId[L.catId];
  const tipo = sel.tipoDe(L);
  const auto = L.origem === 'auto';
  const regra = regraPara(d.regras, L.desc);
  const regraCat = regra ? sel.catPorId[regra.catId] : null;
  const p = L.data.split('-');
  const dt = parseData(L.data);
  const campos = [
    { k: 'Grupo', v: NOME_GRUPO[cat.grupo] },
    { k: 'Data', v: DIAS[dt.getDay()] + ', ' + p[2] + '/' + p[1] + '/' + p[0] },
    { k: 'Conta', v: L.conta === 'Itaú' ? 'Itaú · conta corrente' : L.conta === 'Cartão Itaú' ? 'Cartão Itaú · crédito' : L.conta },
    { k: 'Forma', v: L.forma + (L.parc ? ' · parcela ' + L.parc : '') },
    { k: 'Mês de referência', v: MESES[dt.getMonth()] + ' ' + p[0] },
    { k: 'Origem', v: auto ? 'Open Finance (Pluggy)' : 'Lançado no app' }
  ];

  const escolher = (catId) => {
    setCatAberto(false);
    if (catId === L.catId) return;
    const nova = sel.catPorId[catId];
    updLanc(L.id, { catId, tipo: tipoDoGrupo(nova.grupo) });
    if (regra && regra.catId === catId) { mostrarAviso('Categoria trocada. A regra já apontava para ' + nova.nome + '.'); return; }
    setPergunta({ catId, nome: nova.nome, regra, chave: regra ? regra.chave : chaveDe(L.desc) });
  };
  const regraSim = () => {
    const q = pergunta; setPergunta(null);
    if (q.regra) { salvarRegra({ ...q.regra, catId: q.catId }); mostrarAviso('Categoria e regra atualizadas na planilha.'); }
    else { salvarRegra({ id: novoId('r'), chave: q.chave, catId: q.catId }); mostrarAviso('Categoria trocada e regra criada.'); }
  };
  const regraNao = () => { setPergunta(null); mostrarAviso('Categoria trocada só neste lançamento.'); };

  const abrirEditar = () => { setForm({ desc: L.desc, valor: formatBRL(L.valor), data: L.data }); setEditAberto(true); };
  const salvarEdicao = () => {
    updLanc(L.id, { desc: form.desc.trim() || L.desc, valor: num(form.valor) || L.valor, data: /^\d{4}-\d{2}-\d{2}$/.test(form.data) ? form.data : L.data });
    setEditAberto(false);
    mostrarAviso('Lançamento atualizado na planilha.');
  };
  const excluir = () => { delLanc(L.id); navegar('lancamentos', { substituir: true }); };

  return (
    <Tela>
      <div className="scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 6px) 0 calc(40px + var(--bottom))', scrollbarWidth: 'none' }}>
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Voltar href="#/lancamentos">Lançamentos</Voltar>
          <button type="button" onClick={abrirEditar} style={{ height: 44, padding: '0 8px', border: 0, background: 'none', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>Editar</button>
        </div>

        <section style={{ padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <CategoryIcon icon={cat.icon} tone={cat.tone} size={64} />
          <h1 style={{ margin: '6px 0 0', fontSize: 18, lineHeight: '24px', fontWeight: 600 }}>{L.desc}</h1>
          <Money value={L.valor} kind={tipo} size="hero" />
          <div style={{ display: 'flex', gap: 6 }}>
            {auto ? <StatusBadge tone="neutro" icon="banco">Automático · Itaú</StatusBadge> : <StatusBadge tone="neutro" icon="mais">Manual</StatusBadge>}
            <StatusBadge tone="ok">Classificado</StatusBadge>
          </div>
        </section>

        {aviso ? <Aviso style={{ margin: '0 16px 16px' }}>{aviso}</Aviso> : null}

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={S.grupoLista}>
            <button type="button" onClick={() => setCatAberto(true)} aria-haspopup="dialog" style={S.linhaBotao}>
              <span style={{ flex: 1, color: 'var(--ink-muted)', fontSize: 15 }}>Categoria</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{cat.nome}</span>
              <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
            </button>
            {campos.map((c) => (
              <div key={c.k} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 16px', background: 'var(--surface-raised)' }}>
                <span style={{ flex: 1, color: 'var(--ink-muted)', fontSize: 15 }}>{c.k}</span>
                <span style={{ fontSize: 15, fontWeight: 500, textAlign: 'right' }}>{c.v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="obs" className="rotulo" style={S.rotulo}>Observação</label>
            <textarea id="obs" className="campo" rows={2} value={L.obs || ''} onChange={(e) => updLanc(L.id, { obs: e.target.value })} placeholder="Ex.: compra do mês, churrasco de sábado"
              style={{ resize: 'none', padding: '12px 14px', border: 0, borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: '22px' }} />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: 'var(--jade-soft)', color: 'var(--ink)' }}>
            <span style={{ color: 'var(--jade)', paddingTop: 1 }}><Icon name="raio" size={20} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 14, lineHeight: '20px' }}>
              <strong style={{ fontWeight: 600 }}>{regra ? 'Regra aplicada' : 'Sem regra'}</strong>
              <span style={{ color: 'var(--ink-muted)' }}>
                {regra ? <>Toda descrição com “{regra.chave}” vira {regraCat ? regraCat.nome : '—'}. </> : <>Nenhuma regra pega esta descrição. </>}
                <a href="#/regras" style={{ fontWeight: 600 }}>Ver regras</a>
              </span>
            </span>
          </div>

          <Button variant="perigo" icon="lixo" block onClick={() => setConfirmar(true)}>Excluir lançamento</Button>
        </div>
      </div>

      {catAberto ? (
        <SeletorCategoria label="Trocar categoria" grupos={sel.gruposPicker(tipo)} selecionada={L.catId} onEscolher={escolher} onFechar={() => setCatAberto(false)} novaCategoria={false} />
      ) : null}

      {pergunta ? (
        <Alerta label={pergunta.regra ? 'Atualizar regra' : 'Criar regra'} onFechar={regraNao}>
          <div style={{ padding: '20px 18px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{pergunta.regra ? 'Atualizar a regra também?' : 'Criar uma regra também?'}</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--ink-muted)' }}>Os próximos lançamentos com “{pergunta.chave}” vão entrar como {pergunta.nome}.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)', borderTop: '1px solid var(--line)' }}>
            <button type="button" onClick={regraSim} style={{ height: 48, border: 0, background: 'var(--surface-raised)', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>{pergunta.regra ? 'Sim, atualizar regra' : 'Sim, criar regra'}</button>
            <button type="button" onClick={regraNao} style={{ height: 48, border: 0, background: 'var(--surface-raised)', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 16, cursor: 'pointer' }}>Só este lançamento</button>
          </div>
        </Alerta>
      ) : null}

      {editAberto ? (
        <Folha onFechar={() => setEditAberto(false)} label="Editar lançamento" style={{ display: 'flex', flexDirection: 'column' }}>
          <Alca />
          <CabecalhoFolha titulo="Editar lançamento" onCancelar={() => setEditAberto(false)} onSalvar={salvarEdicao} />
          <div className="pb-folha" style={{ padding: '10px 16px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="edesc" className="rotulo" style={S.rotulo}>Descrição</label>
              <input id="edesc" className="campo" type="text" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} style={S.campo} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="evalor" className="rotulo" style={S.rotulo}>Valor</label>
                <span style={S.campoValor}>
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>R$</span>
                  <input id="evalor" className="campo" type="text" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={S.inputLimpo} />
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="edata" className="rotulo" style={S.rotulo}>Data</label>
                <input id="edata" className="campo" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} style={{ ...S.campo, padding: '0 12px', width: '100%' }} />
              </div>
            </div>
            <span style={{ margin: '0 4px', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>
              {auto ? 'Veio do Itaú: a edição muda só a planilha, o banco continua igual.' : 'Lançado no app: a edição muda a planilha.'}
            </span>
          </div>
        </Folha>
      ) : null}

      {confirmar ? (
        <AcaoConfirmar
          texto={<>Excluir “{L.desc}” da planilha? Isso não dá para desfazer.{auto ? ' Se ele vier de novo do banco, não será importado outra vez.' : ''}</>}
          acao="Excluir lançamento" onAcao={excluir} onCancelar={() => setConfirmar(false)} />
      ) : null}
    </Tela>
  );
}

export function Alerta({ label, onFechar, children }) {
  useEsc(onFechar);
  return (
    <div className="veu" style={{ position: 'absolute', inset: 0, background: 'rgba(6,16,12,0.45)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 30 }}>
      <section role="alertdialog" aria-modal="true" aria-label={label} className="pop" style={{ width: '100%', maxWidth: 300, borderRadius: 22, background: 'var(--surface-raised)', overflow: 'hidden', textAlign: 'center' }}>
        {children}
      </section>
    </div>
  );
}

export function AcaoConfirmar({ texto, acao, onAcao, onCancelar, perigo = true }) {
  useEsc(onCancelar);
  return (
    <div className="veu" onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
      style={{ position: 'absolute', inset: 0, background: 'rgba(6,16,12,0.45)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 10px max(30px, calc(var(--bottom) + 8px))', gap: 8, zIndex: 30 }}>
      <section role="alertdialog" aria-modal="true" aria-label={acao} className="folha" style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <p style={{ margin: 0, padding: '16px 18px', textAlign: 'center', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>{texto}</p>
        <button type="button" onClick={onAcao} style={{ display: 'grid', placeItems: 'center', height: 56, border: 0, borderTop: '1px solid var(--line)', background: 'var(--surface-raised)', color: perigo ? 'var(--danger)' : 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, cursor: 'pointer' }}>{acao}</button>
      </section>
      <button type="button" className="folha" onClick={onCancelar} style={{ height: 56, border: 0, borderRadius: 16, background: 'var(--surface-raised)', color: 'var(--jade)', fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
    </div>
  );
}
