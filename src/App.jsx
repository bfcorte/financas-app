import { useEffect } from 'react';
import { DadosProvider, useDados } from './store.jsx';
import { useRota, navegar } from './router.js';
import { lerConexao, salvarConexao, urlValida } from './conexao.js';
import { ToastGlobal, FaixaOffline, Carregando } from './ui.jsx';
import Painel from './screens/Painel.jsx';
import Lancamentos from './screens/Lancamentos.jsx';
import Detalhe from './screens/Detalhe.jsx';
import Classificar from './screens/Classificar.jsx';
import Novo from './screens/Novo.jsx';
import Orcamento from './screens/Orcamento.jsx';
import Metas from './screens/Metas.jsx';
import Ajustes from './screens/Ajustes.jsx';
import Categorias from './screens/Categorias.jsx';
import Regras from './screens/Regras.jsx';
import Setup from './screens/Setup.jsx';

const MAPA = { painel: Painel, lancamentos: Lancamentos, detalhe: Detalhe, classificar: Classificar, novo: Novo, orcamento: Orcamento, metas: Metas, ajustes: Ajustes, categorias: Categorias, regras: Regras, setup: Setup };

// Link de configuração: #/setup?api=...&token=...&push=...&ps=...  (o fragmento não vai para servidor nenhum)
function consumirLinkDeSetup() {
  const h = window.location.hash || '';
  if (!h.startsWith('#/setup?')) return false;
  const q = new URLSearchParams(h.slice(h.indexOf('?') + 1));
  const api = q.get('api'), token = q.get('token');
  if (!api || !token || !urlValida(api)) return false;
  const c = { api, token };
  const push = q.get('push'), ps = q.get('ps');
  if (push && urlValida(push) && ps) { c.push = push; c.ps = ps; }
  salvarConexao(c);
  window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/painel');
  return true;
}
const veioDoLink = consumirLinkDeSetup();

function Telas() {
  const rota = useRota();
  const { conexao, conectar, carregado } = useDados();
  useEffect(() => { if (veioDoLink && !conexao) conectar(lerConexao()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!conexao || rota.tela === 'setup') return <Setup rota={rota} />;
  if (!carregado) return <><Carregando /><FaixaOffline /></>;
  const T = MAPA[rota.tela] || Painel;
  return (
    <>
      <T key={rota.chave} rota={rota} />
      <FaixaOffline />
      <ToastGlobal />
    </>
  );
}

export default function App() {
  return (
    <DadosProvider>
      <div className="app">
        <Telas />
      </div>
    </DadosProvider>
  );
}

export { navegar };
