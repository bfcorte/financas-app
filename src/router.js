import { useEffect, useState } from 'react';

export const TELAS = ['painel', 'lancamentos', 'detalhe', 'classificar', 'novo', 'orcamento', 'metas', 'ajustes', 'categorias', 'regras'];

function ler() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const [caminho, qs] = h.split('?');
  const partes = caminho.split('/').filter(Boolean);
  const tela = TELAS.includes(partes[0]) ? partes[0] : 'painel';
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  return { tela, param: partes[1] ? decodeURIComponent(partes[1]) : '', query, chave: h };
}

export function useRota() {
  const [rota, setRota] = useState(ler);
  useEffect(() => {
    const on = () => setRota(ler());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return rota;
}

export function navegar(caminho, { substituir = false } = {}) {
  const alvo = '#/' + caminho.replace(/^#?\/?/, '');
  if (substituir) {
    window.history.replaceState(null, '', alvo);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = alvo;
  }
}
