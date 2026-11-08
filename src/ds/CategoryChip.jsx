import { cx } from './util.js';
import { Icon } from './Icon.jsx';

export function CategoryChip(p) {
  return (
    <button
      type="button" className={cx('fp-chip', p.selected && 'is-selected', p.className)}
      aria-pressed={!!p.selected} onClick={p.onClick}
      style={{ '--fp-cat': 'var(--' + (p.tone || 'nota-200') + ')' }}
    >
      {p.icon ? <span className="fp-chip__icon"><Icon name={p.icon} size={16} /></span> : null}
      <span>{p.children}</span>
      {p.selected ? <Icon name="check" size={16} stroke={2.2} /> : null}
    </button>
  );
}
