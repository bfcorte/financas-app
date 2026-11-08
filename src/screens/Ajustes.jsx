import { useEffect, useState } from 'react';
import { Icon, Button, StatusBadge, CategoryIcon, SegmentedControl } from '../ds/index.js';
import { useDados, rotuloQuando, hhmm } from '../store.jsx';
import { useTema } from '../tema.js';
import { navegar } from '../router.js';
import { estadoPush, ativarPush, desativarPush, suportado, instalado, ehIOS } from '../push.js';
import { lerConexao } from '../conexao.js';
import { Tela, Voltar, Chave, Aviso, useAviso, S } from '../ui.jsx';
import { AcaoConfirmar } from './Detalhe.jsx';

const TIPOS = [
  { k: 'lancamento', t: 'Lançamento novo do Itaú', d: 'Cada lançamento importado (ou um resumo se vierem mais de 3)' },
  { k: 'entrada', t: 'Entrada recebida', d: 'Salário, Pix recebido e outras entradas' },
  { k: 'classificar', t: 'Para classificar', d: 'Quando chega algo sem categoria' },
  { k: 'orcamento', t: 'Orçamento', d: 'Ao passar de 80% e ao estourar, uma vez por mês' },
  { k: 'meta', t: 'Metas', d: 'Ao chegar a 50%, 75% e ao bater a meta' },
  { k: 'claude', t: 'Classificação do Claude', d: 'Resumo da classificação semanal' },
  { k: 'resumo', t: 'Resumos', d: 'Segunda às 9h (semana) e dia 1 (mês)' },
  { k: 'planilha', t: 'Edição direta na planilha', d: 'Quando você muda algo à mão na planilha' },
];
const HORAS = Array.from({ length: 24 }, (_, h) => h);

export default function Ajustes() {
  const { d, importarAgora, importacaoDiaria, salvarPrefs, notificarTeste, desconectar, online, atualizadoEm, sincronizando, erroAuth } = useDados();
  const [importando, setImportando] = useState(false);
  const [resultadoImp, setResultadoImp] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, mostrarAviso] = useAviso(4000);
  const [push, setPush] = useState({ suportado: suportado(), permissao: 'default', ativo: false });
  const [ocupadoPush, setOcupadoPush] = useState(false);
  const { pref, setPref } = useTema();
  const st = d.status || {};
  const prefs = d.prefs || {};
  const imp = rotuloQuando(st.ultimaImportacao);
  const conexao = lerConexao();
  const pushConfigurado = !!(conexao && conexao.push);

  useEffect(() => { estadoPush().then(setPush).catch(() => {}); }, []);

  const importar = async () => {
    setImportando(true);
    const r = await importarAgora();
    setImportando(false);
    if (r) setResultadoImp(r.novos ? (r.novos === 1 ? 'Chegou 1 lançamento novo' : 'Chegaram ' + r.novos + ' lançamentos novos') : 'Nada novo agora');
  };

  const ligarPush = async () => {
    setOcupadoPush(true);
    try {
      await ativarPush();
      setPush(await estadoPush());
      mostrarAviso('Notificações ativadas neste aparelho.');
    } catch (e) { mostrarAviso(e.message || 'Não consegui ativar.'); }
    setOcupadoPush(false);
  };
  const desligarPush = async () => {
    setOcupadoPush(true);
    await desativarPush();
    setPush(await estadoPush());
    setOcupadoPush(false);
    mostrarAviso('Notificações desativadas neste aparelho.');
  };
  const teste = async () => { const r = await notificarTeste(); if (r) mostrarAviso('Notificação de teste enviada.'); };

  const sair = async () => {
    setConfirmar(false);
    if (push.ativo) await desativarPush();
    desconectar();
    navegar('setup', { substituir: true });
  };

  const itauStatus = !st.pluggyConfigurado ? ['neutro', 'Não configurado'] : /LOGIN_ERROR|OUTDATED|WAITING/.test(st.pluggyStatus || '') ? ['atencao', 'Atenção'] : ['ok', 'Conectado'];
  const precisaInstalar = ehIOS() && !instalado();

  return (
    <Tela>
      <div className="scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 6px) 0 calc(40px + var(--bottom))', scrollbarWidth: 'none' }}>
        <div style={{ padding: '0 8px' }}><Voltar href="#/painel" inline>Painel</Voltar></div>
        <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h1 className="titulo-tela" style={{ margin: 0 }}>Ajustes</h1>
          {aviso ? <Aviso>{aviso}</Aviso> : null}

          <section style={{ padding: '18px 16px', borderRadius: 22, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'var(--jade-soft)', color: 'var(--jade)' }}>
                <Icon name="banco" size={26} />
              </span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Itaú · Open Finance</span>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Conta corrente e cartão, via Meu Pluggy</span>
              </span>
              <StatusBadge tone={itauStatus[0]}>{itauStatus[1]}</StatusBadge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--surface-sunken)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="rotulo" style={{ color: 'var(--ink-muted)' }}>Última importação</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{imp ? imp.curto : 'Ainda não registrada'}</span>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--surface-sunken)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="rotulo" style={{ color: 'var(--ink-muted)' }}>Trouxe</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{st.trouxe == null ? '—' : st.trouxe + (st.trouxe === 1 ? ' lançamento' : ' lançamentos')}</span>
              </div>
            </div>
            <Button variant="secundario" icon="sync" block onClick={importar} disabled={importando || !online || !st.pluggyConfigurado}>
              {importando ? 'Consultando o Itaú…' : resultadoImp || 'Importar agora'}
            </Button>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Automação</h2>
            <div style={S.grupoLista}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)', cursor: 'pointer' }}>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>Importar todo dia</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Por volta das 7h</span>
                </span>
                <Chave checked={!!st.importacaoDiaria} onChange={() => importacaoDiaria(!st.importacaoDiaria)} label="Importar todo dia" />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)' }}>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>Classificar com o Claude</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Toda segunda · o que ficar em dúvida vai para A classificar</span>
                </span>
                <StatusBadge tone={st.claudeConfigurado ? 'ok' : 'neutro'} icon={st.claudeConfigurado ? undefined : false}>{st.claudeConfigurado ? 'Chave configurada' : 'Sem chave'}</StatusBadge>
              </div>
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Notificações</h2>
            {!pushConfigurado ? (
              <div style={{ ...S.card, padding: '14px 16px', fontSize: 14, lineHeight: '20px', color: 'var(--ink-muted)' }}>Este aparelho foi conectado sem o servidor de notificações. Abra o link de configuração de novo para ativar.</div>
            ) : !push.suportado || precisaInstalar ? (
              <div style={{ ...S.card, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--jade)', paddingTop: 1 }}><Icon name="mais" size={20} /></span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, lineHeight: '20px' }}>
                  <strong style={{ fontWeight: 600 }}>Instale o app para receber notificações</strong>
                  <span style={{ color: 'var(--ink-muted)' }}>No Safari, toque em Compartilhar → Adicionar à Tela de Início. Depois abra o Finanças pelo ícone e volte aqui.</span>
                </span>
              </div>
            ) : push.permissao === 'denied' ? (
              <div style={{ ...S.card, padding: '14px 16px', fontSize: 14, lineHeight: '20px', color: 'var(--ink-muted)' }}>As notificações estão bloqueadas. Libere em Ajustes do iPhone → Notificações → Finanças.</div>
            ) : !push.ativo ? (
              <Button block icon="raio" onClick={ligarPush} disabled={ocupadoPush}>{ocupadoPush ? 'Ativando…' : 'Ativar notificações'}</Button>
            ) : (
              <>
                <div style={S.grupoLista}>
                  {TIPOS.map((x) => (
                    <label key={x.k} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)', cursor: 'pointer' }}>
                      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 500 }}>{x.t}</span>
                        <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{x.d}</span>
                      </span>
                      <Chave checked={prefs[x.k] !== false && (x.k !== 'planilha' || !!prefs.planilha)} onChange={() => salvarPrefs({ [x.k]: !(prefs[x.k] !== false && (x.k !== 'planilha' || !!prefs.planilha)) })} label={x.t} />
                    </label>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)' }}>
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>Problemas</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Importação falhou, conexão do Itaú expirada, erro na API</span>
                    </span>
                    <StatusBadge tone="neutro" icon={false}>Sempre ligado</StatusBadge>
                  </div>
                </div>
                <div style={S.grupoLista}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)', cursor: 'pointer' }}>
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>Horário silencioso</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Segura as notificações (menos problemas) e entrega depois</span>
                    </span>
                    <Chave checked={!!prefs.silencioso} onChange={() => salvarPrefs({ silencioso: !prefs.silencioso })} label="Horário silencioso" />
                  </label>
                  {prefs.silencioso ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)' }}>
                      <span style={{ flex: 1, fontSize: 15, color: 'var(--ink-muted)' }}>Das</span>
                      <select aria-label="Início do silêncio" className="campo" value={prefs.silencioInicio ?? 22} onChange={(e) => salvarPrefs({ silencioInicio: Number(e.target.value) })} style={{ ...S.campo, height: 44, boxShadow: 'none', background: 'var(--surface-sunken)' }}>
                        {HORAS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}h</option>)}
                      </select>
                      <span style={{ fontSize: 15, color: 'var(--ink-muted)' }}>às</span>
                      <select aria-label="Fim do silêncio" className="campo" value={prefs.silencioFim ?? 7} onChange={(e) => salvarPrefs({ silencioFim: Number(e.target.value) })} style={{ ...S.campo, height: 44, boxShadow: 'none', background: 'var(--surface-sunken)' }}>
                        {HORAS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}h</option>)}
                      </select>
                    </div>
                  ) : null}
                </div>
                <Button variant="secundario" icon="check" block onClick={teste}>Enviar notificação de teste</Button>
                <Button variant="fantasma" block onClick={desligarPush} disabled={ocupadoPush}>Desativar neste aparelho</Button>
              </>
            )}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Aparência</h2>
            <SegmentedControl value={pref} onChange={setPref} aria-label="Tema"
              options={[{ value: 'auto', label: 'Automático' }, { value: 'claro', label: 'Claro' }, { value: 'escuro', label: 'Escuro' }]} />
            <span style={{ margin: '0 4px', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>
              {pref === 'auto' ? 'Segue o tema do iPhone.' : pref === 'claro' ? 'Sempre claro.' : 'Sempre escuro.'}
            </span>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Organização</h2>
            <div style={S.grupoLista}>
              {[
                { icon: 'pizza', tone: 'nota-100', k: 'Categorias', dd: 'Criar, editar, grupo, cor e valor orçado', v: String(d.categorias.length), href: '#/categorias' },
                { icon: 'raio', tone: 'nota-20', k: 'Regras de classificação', dd: 'Palavra na descrição → categoria', v: String(d.regras.length), href: '#/regras' },
              ].map((l) => (
                <a key={l.k} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)', color: 'var(--ink)' }}>
                  <CategoryIcon icon={l.icon} tone={l.tone} size={32} />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{l.k}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{l.dd}</span>
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{l.v}</span>
                  <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
                </a>
              ))}
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Planilha</h2>
            <div style={S.grupoLista}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)', color: 'var(--ink)' }}>
                <CategoryIcon icon="lista" tone="jade" size={32} />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>Finanças Pessoais</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    {erroAuth ? 'Token recusado' : !online ? 'Sem conexão' : sincronizando ? 'Sincronizando…' : atualizadoEm ? 'Conectado · atualizado às ' + hhmm(atualizadoEm) : 'Conectado'}
                  </span>
                </span>
                <StatusBadge tone={erroAuth ? 'estourou' : online ? 'ok' : 'atencao'}>{erroAuth ? 'Erro' : online ? 'Em dia' : 'Offline'}</StatusBadge>
              </div>
              {st.planilhaUrl ? (
                <a href={st.planilhaUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 16px', background: 'var(--surface-raised)', color: 'var(--ink)' }}>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Abrir a planilha</span>
                  <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
                </a>
              ) : null}
            </div>
            <Button variant="perigo" block onClick={() => setConfirmar(true)}>Desconectar deste aparelho</Button>
            <span style={{ margin: '0 4px', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>Apaga a URL, o token e os dados guardados neste aparelho. A planilha não muda.</span>
          </section>
        </div>
      </div>

      {confirmar ? (
        <AcaoConfirmar texto="Desconectar este aparelho da planilha? Para voltar, você vai precisar da URL e do token (ou do link de configuração)."
          acao="Desconectar" onAcao={sair} onCancelar={() => setConfirmar(false)} />
      ) : null}
    </Tela>
  );
}
