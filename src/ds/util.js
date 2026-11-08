export function cx(...args) {
  return args.filter(Boolean).join(' ');
}

/* ---------- formatação ---------- */
export function formatBRL(valor, opts) {
  opts = opts || {};
  const n = Math.abs(Number(valor) || 0);
  const semCentavos = opts.cents === false;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: semCentavos ? 0 : 2, maximumFractionDigits: semCentavos ? 0 : 2 });
}
