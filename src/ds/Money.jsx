import { cx, formatBRL } from './util.js';

// kind: 'despesa' | 'entrada' | 'reserva' | 'neutro'
export function Money(p) {
  const kind = p.kind || 'neutro';
  const size = p.size || 'linha';
  const txt = formatBRL(p.value, { cents: p.cents });
  const partes = txt.split(',');
  let sinal = '';
  if (p.signed !== false) {
    if (kind === 'despesa') sinal = '−';
    else if (kind === 'entrada') sinal = '+';
  }
  if (kind === 'neutro' && Number(p.value) < 0) sinal = '−';
  return (
    <span className={cx('fp-money', 'fp-money--' + kind, 'fp-money--' + size, p.className)}>
      {sinal ? <span className="fp-money__sinal">{sinal}</span> : null}
      <span className="fp-money__moeda">R$ </span>
      <span>{partes[0]}</span>
      {partes[1] !== undefined ? <span className="fp-money__cent">{',' + partes[1]}</span> : null}
    </span>
  );
}
