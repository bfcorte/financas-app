import { DadosProvider } from './store.jsx';
import { useRota } from './router.js';
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

const MAPA = { painel: Painel, lancamentos: Lancamentos, detalhe: Detalhe, classificar: Classificar, novo: Novo, orcamento: Orcamento, metas: Metas, ajustes: Ajustes, categorias: Categorias, regras: Regras };

export default function App() {
  const rota = useRota();
  const T = MAPA[rota.tela] || Painel;
  return (
    <DadosProvider>
      <div className="app">
        <T key={rota.chave} rota={rota} />
      </div>
    </DadosProvider>
  );
}
