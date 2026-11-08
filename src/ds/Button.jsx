import { cx } from './util.js';
import { Icon } from './Icon.jsx';

export function Button(p) {
  const variant = p.variant || 'primario';
  return (
    <button
      type={p.type || 'button'}
      className={cx('fp-btn', 'fp-btn--' + variant, p.block && 'fp-btn--block', p.size === 'sm' && 'fp-btn--sm', p.className)}
      disabled={p.disabled} onClick={p.onClick} aria-label={p['aria-label']} style={p.style}
    >
      {p.icon ? <Icon name={p.icon} size={p.size === 'sm' ? 18 : 20} /> : null}
      {p.children ? <span>{p.children}</span> : null}
    </button>
  );
}
