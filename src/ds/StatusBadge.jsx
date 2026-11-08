import { cx } from './util.js';
import { Icon } from './Icon.jsx';

// tone: 'ok' | 'atencao' | 'estourou' | 'reserva' | 'neutro'
const TONE_ICON = { ok: 'check', atencao: 'alerta', estourou: 'alerta', reserva: 'cofre', neutro: null };

export function StatusBadge(p) {
  const tone = p.tone || 'neutro';
  const ic = p.icon === false ? null : (p.icon || TONE_ICON[tone]);
  return (
    <span className={cx('fp-badge', 'fp-badge--' + tone, p.className)}>
      {ic ? <Icon name={ic} size={14} stroke={2.2} /> : null}
      {p.children}
    </span>
  );
}
