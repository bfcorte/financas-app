import { useState } from 'react';
import { Icon, Button, StatusBadge, CategoryIcon } from '../ds/index.js';
import { useDados, rotuloQuando } from '../store.jsx';
import { Tela, Voltar, Chave, Aviso, useAviso, S } from '../ui.jsx';
import { AcaoConfirmar } from './Detalhe.jsx';

export default function Ajustes() {
  const { d, toggleAjuste, importar, restaurar } = useDados();
  const [importado, setImportado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, mostrarAviso] = useAviso(3000);
  const imp = rotuloQuando(d.importacao.quando);
  const t = d.importacao.trouxe;

  const toggles = [
    { k: 'diaria', t: 'Importar todo dia', d: 'Por volta das 7h' },
    { k: 'claude', t: 'Classificar com o Claude', d: 'Toda segunda, 8h57 · o que ficar em dúvida vai para A classificar' },
    { k: 'aviso', t: 'Avisar quando chegar lançamento', d: 'Notificação no iPhone' }
  ];
  const links = [
    { icon: 'pizza', tone: 'nota-100', k: 'Categorias', d: 'Criar, editar, grupo, cor e valor orçado', v: String(d.cats.length), href: '#/categorias' },
    { icon: 'raio', tone: 'nota-20', k: 'Regras de classificação', d: 'Palavra na descrição → categoria', v: String(d.regras.length), href: '#/regras' }
  ];

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
              <StatusBadge tone="ok">Conectado</StatusBadge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--surface-sunken)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="rotulo" style={{ color: 'var(--ink-muted)' }}>Última importação</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{imp.curto}</span>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--surface-sunken)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="rotulo" style={{ color: 'var(--ink-muted)' }}>Trouxe</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t} {t === 1 ? 'lançamento' : 'lançamentos'}</span>
              </div>
            </div>
            <Button variant="secundario" icon="sync" block onClick={() => { importar(); setImportado(true); }}>{importado ? 'Nada novo desde ' + imp.hora : 'Importar agora'}</Button>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Automação</h2>
            <div style={S.grupoLista}>
              {toggles.map((x) => (
                <label key={x.k} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)', cursor: 'pointer' }}>
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{x.t}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{x.d}</span>
                  </span>
                  <Chave checked={d.ajustes[x.k]} onChange={() => toggleAjuste(x.k)} label={x.t} />
                </label>
              ))}
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Organização</h2>
            <div style={S.grupoLista}>
              {links.map((l) => (
                <a key={l.k} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', background: 'var(--surface-raised)', color: 'var(--ink)' }}>
                  <CategoryIcon icon={l.icon} tone={l.tone} size={32} />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{l.k}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{l.d}</span>
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{l.v}</span>
                  <span style={{ color: 'var(--ink-muted)' }}><Icon name="seta" size={18} /></span>
                </a>
              ))}
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Planilha</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 16px', borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', color: 'var(--ink)' }}>
              <CategoryIcon icon="lista" tone="jade" size={32} />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>Conexão com a planilha: em breve</span>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Por enquanto os dados ficam só neste aparelho</span>
              </span>
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="rotulo" style={S.rotulo}>Dados</h2>
            <Button variant="perigo" icon="sync" block onClick={() => setConfirmar(true)}>Restaurar dados de exemplo</Button>
            <span style={{ margin: '0 4px', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>Apaga o que você mudou neste aparelho e volta aos lançamentos, categorias, regras e metas de exemplo.</span>
          </section>
        </div>
      </div>

      {confirmar ? (
        <AcaoConfirmar texto="Restaurar os dados de exemplo? Tudo o que você lançou, classificou ou editou neste aparelho será apagado."
          acao="Restaurar dados" onAcao={() => { restaurar(); setConfirmar(false); setImportado(false); mostrarAviso('Dados de exemplo restaurados.'); }} onCancelar={() => setConfirmar(false)} />
      ) : null}
    </Tela>
  );
}
