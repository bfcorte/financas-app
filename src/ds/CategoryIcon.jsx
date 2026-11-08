import { cx } from './util.js';
import { Icon } from './Icon.jsx';

// tone: 'nota-2' … 'nota-200' | 'jade' | 'violet' | 'amber'
export function CategoryIcon(p) {
  const size = p.size || 40;
  return (
    <span className={cx('fp-cat-icon', p.className)} style={{ width: size, height: size, '--fp-cat': 'var(--' + (p.tone || 'nota-200') + ')' }}>
      <Icon name={p.icon || 'sacola'} size={Math.round(size * 0.55)} />
    </span>
  );
}
