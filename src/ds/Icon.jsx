import { cx } from './util.js';

/* 24px, traço 1.75, currentColor */
const P = {
    casa: 'M3.5 10.5 12 4l8.5 6.5M5.5 9v10.5h13V9M10 19.5v-5h4v5',
    mercado: 'M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L20 8H6.2M9.5 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01',
    garfo: 'M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M16.5 21V3c-2 1.2-3 3.6-3 7 0 1.7.9 2.8 3 3',
    carro: 'M4 16.5V12l2-5h12l2 5v4.5M4 16.5h16M4 16.5V19h3v-2.5M17 16.5V19h3v-2.5M7.5 13.5h.01M16.5 13.5h.01M4 12h16',
    saude: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10ZM9 12h2l1-2 1.2 3.5L14 12h1.5',
    pata: 'M12 20c-2.8 0-5-1.4-5-3.4 0-1.8 2.2-4.6 5-4.6s5 2.8 5 4.6c0 2-2.2 3.4-5 3.4ZM6 11.5a1.6 2 0 1 0 0-.01M18 11.5a1.6 2 0 1 0 0-.01M9.2 7.5a1.6 2.1 0 1 0 0-.01M14.8 7.5a1.6 2.1 0 1 0 0-.01',
    lazer: 'M4 6.5h16v11H4zM10 9.5v5l4-2.5z',
    sacola: 'M5 8h14l-1 12H6L5 8ZM9 8V6.5a3 3 0 0 1 6 0V8',
    escola: 'M3 9.5 12 5l9 4.5-9 4.5-9-4.5ZM7 11.5v4c1.3 1.3 3 2 5 2s3.7-.7 5-2v-4M21 9.5v5',
    pessoa: 'M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5',
    cofre: 'M4 6h16v13H4zM4 16h16M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6.5 19v1.5M17.5 19v1.5',
    cartao: 'M3 6.5h18v11H3zM3 10h18M6.5 14.5h4',
    entrada: 'M12 19V5M6 11l6-6 6 6',
    saida: 'M12 5v14M6 13l6 6 6-6',
    transferencia: 'M4 8h14l-3.5-3.5M20 16H6l3.5 3.5',
    raio: 'M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z',
    tv: 'M3.5 6h17v11h-17zM8.5 20.5h7M12 17v3.5',
    duvida: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.6-2.4 2.1-2.4 3.6M12 16.8h.01',
    mais: 'M12 5v14M5 12h14',
    painel: 'M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z',
    lista: 'M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
    alvo: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 12h.01',
    pizza: 'M12 3v9h9a9 9 0 1 1-9-9ZM15 3.5a9 9 0 0 1 5.5 5.5H15z',
    ajustes: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5',
    check: 'M5 12.5 10 17.5 19 7',
    alerta: 'M12 4 2.8 19.5h18.4L12 4ZM12 10v4.2M12 17h.01',
    x: 'M6 6l12 12M18 6 6 18',
    voltar: 'M15 5l-7 7 7 7',
    seta: 'M9 5l7 7-7 7',
    busca: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
    filtro: 'M4 6h16M7 12h10M10 18h4',
    sync: 'M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1M18.5 3.5v4h-4M5.5 20.5v-4h4',
    banco: 'M3.5 9.5 12 4.5l8.5 5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3.5 19.5h17',
    calendario: 'M4 6h16v14H4zM4 10h16M8.5 3.5v4M15.5 3.5v4',
    lixo: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13'
};

export function Icon(p) {
  const size = p.size || 24;
  return (
    <svg
      className={cx('fp-icon', p.className)} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={p.stroke || 1.75} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={p.label ? undefined : 'true'} role={p.label ? 'img' : undefined} aria-label={p.label}
    >
      <path d={P[p.name] || P.duvida} />
    </svg>
  );
}
Icon.names = Object.keys(P);
