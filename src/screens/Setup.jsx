import { useState } from 'react';
import { Icon, Button } from '../ds/index.js';
import { useDados } from '../store.jsx';
import { apiGet } from '../api.js';
import { salvarConexao, lerConexao, urlValida } from '../conexao.js';
import { navegar } from '../router.js';
import { Tela, S } from '../ui.jsx';

export default function Setup() {
  const { conectar, conexao } = useDados();
  const atual = lerConexao();
  const [api, setApi] = useState(atual ? atual.api : '');
  const [token, setToken] = useState('');
  const [testando, setTestando] = useState(false);
  const [erro, setErro] = useState('');

  const testar = async () => {
    setErro('');
    let u = api.trim(), t = token.trim(), extra = {};
    // aceita o link de configuração inteiro colado no primeiro campo
    if (/[?&]token=/.test(u)) {
      const q = new URLSearchParams(u.slice(u.indexOf('?') + 1));
      u = (q.get('api') || '').trim();
      t = (q.get('token') || '').trim();
      const push = q.get('push'), ps = q.get('ps');
      if (push && urlValida(push) && ps) extra = { push, ps };
    }
    if (!urlValida(u) || !/script\.google(usercontent)?\.com/.test(new URL(u).hostname)) { setErro('Cole a URL do Aplicativo da Web (termina em /exec).'); return; }
    if (t.length < 20) { setErro('Cole o token completo.'); return; }
    setTestando(true);
    try {
      await apiGet('versao', { api: u, token: t }, 20000);
      const c = salvarConexao({ api: u, token: t, ...extra });
      conectar(c);
      navegar('painel', { substituir: true });
    } catch (e) {
      setErro(e.tipo === 'auth' ? 'Token inválido: confira o link ou o token.' : (e.message || 'Não consegui conectar.'));
    } finally { setTestando(false); }
  };

  return (
    <Tela>
      <div className="scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'calc(var(--top) + 6px) 0 calc(40px + var(--bottom))', scrollbarWidth: 'none' }}>
        {conexao ? (
          <div style={{ padding: '0 8px' }}>
            <a href="#/ajustes" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, height: 44, padding: '0 8px', fontSize: 17, fontWeight: 500 }}>
              <Icon name="voltar" size={22} />Ajustes
            </a>
          </div>
        ) : <div style={{ height: 44 }} />}
        <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--jade-soft)', color: 'var(--jade)' }}>
              <Icon name="lista" size={30} />
            </span>
            <h1 className="titulo-tela" style={{ margin: 0 }}>Conectar à planilha</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: '22px', color: 'var(--ink-muted)' }}>
              O app lê e escreve na sua planilha Finanças Pessoais. A URL e o token ficam guardados só neste aparelho.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="api" className="rotulo" style={S.rotulo}>URL da API ou link de configuração</label>
            <input id="api" className="campo" type="url" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder="https://script.google.com/macros/s/…/exec" value={api} onChange={(e) => setApi(e.target.value)} style={S.campo} />
            <span style={{ margin: '0 4px', fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>Colou o link de configuração inteiro? Pode deixar o token em branco.</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="token" className="rotulo" style={S.rotulo}>Token</label>
            <input id="token" className="campo" type="password" autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="off"
              placeholder="Token de acesso" value={token} onChange={(e) => setToken(e.target.value)} style={S.campo} />
          </div>
          {erro ? (
            <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 14, background: 'var(--danger-soft)', fontSize: 14, lineHeight: '20px' }}>
              <span style={{ color: 'var(--danger)', paddingTop: 1 }}><Icon name="alerta" size={20} /></span>
              <span>{erro}</span>
            </div>
          ) : null}
          <Button block icon={testando ? undefined : 'check'} onClick={testar} disabled={testando}>{testando ? 'Testando conexão…' : 'Conectar'}</Button>
          <p style={{ margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)', textAlign: 'center' }}>
            No app instalado, cole aqui o link de configuração: ele já traz a URL, o token e as notificações.
          </p>
        </div>
      </div>
    </Tela>
  );
}
