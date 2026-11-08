import { cx } from './util.js';
import { Icon } from './Icon.jsx';
import { Money } from './Money.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { CategoryIcon } from './CategoryIcon.jsx';

export function TransactionRow(p) {
  const kind = p.kind || 'despesa';
  const pendente = p.pending;
  const meta = [p.account, p.method, p.date].filter(Boolean).join(' · ');
  const Tag = p.onClick ? 'button' : 'div';
  return (
    <Tag type={p.onClick ? 'button' : undefined} className={cx('fp-row', p.onClick && 'fp-row--tap', p.className)} onClick={p.onClick}>
      {pendente
        ? <span className="fp-cat-icon fp-cat-icon--pend" style={{ width: 40, height: 40 }}><Icon name="duvida" size={22} /></span>
        : <CategoryIcon icon={p.icon} tone={p.tone} />}
      <span className="fp-row__main">
        <span className="fp-row__title">{p.title}</span>
        <span className="fp-row__meta">
          {pendente
            ? <StatusBadge tone="atencao">A classificar</StatusBadge>
            : (p.category ? <span className="fp-row__cat">{p.category}</span> : null)}
          {meta ? <span>{meta}</span> : null}
        </span>
      </span>
      <span className="fp-row__end">
        <Money value={p.value} kind={kind} />
        {p.installment ? <span className="fp-row__parc">{p.installment}</span> : null}
      </span>
    </Tag>
  );
}
