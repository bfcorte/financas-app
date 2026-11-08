// Tema: 'auto' segue o iPhone; 'claro' e 'escuro' fixam. Fica salvo à parte dos dados,
// para não ser apagado por "Restaurar dados de exemplo".
import { useEffect, useState } from 'react';

const CHAVE = 'financas-pessoais:tema';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function lerPref() {
  try { const v = window.localStorage.getItem(CHAVE); if (v === 'claro' || v === 'escuro') return v; } catch (e) { /* ignora */ }
  return 'auto';
}

export function temaAplicado(pref = lerPref()) {
  if (pref === 'claro') return 'light';
  if (pref === 'escuro') return 'dark';
  return media().matches ? 'dark' : 'light';
}

function aplicar() {
  document.documentElement.setAttribute('data-theme', temaAplicado());
  window.dispatchEvent(new Event('fp-tema'));
}

export function setPref(pref) {
  try {
    if (pref === 'auto') window.localStorage.removeItem(CHAVE);
    else window.localStorage.setItem(CHAVE, pref);
  } catch (e) { /* ignora */ }
  aplicar();
}

export function iniciarTema() {
  const m = media();
  const on = () => { if (lerPref() === 'auto') aplicar(); };
  if (m.addEventListener) m.addEventListener('change', on); else if (m.addListener) m.addListener(on);
  aplicar();
}

export function useTema() {
  const [estado, setEstado] = useState(() => ({ pref: lerPref(), tema: temaAplicado() }));
  useEffect(() => {
    const on = () => setEstado({ pref: lerPref(), tema: temaAplicado() });
    window.addEventListener('fp-tema', on);
    return () => window.removeEventListener('fp-tema', on);
  }, []);
  return { ...estado, setPref };
}
