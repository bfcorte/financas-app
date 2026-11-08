import { cx, formatBRL } from './util.js';
import { Money } from './Money.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { CategoryIcon } from './CategoryIcon.jsx';

export function BudgetBar(p) {
  const orcado = Number(p.budget) || 0, real = Number(p.spent) || 0;
  const pct = orcado > 0 ? real / orcado : 0;
  const tone = pct > 1 ? 'estourou' : pct >= 0.8 ? 'atencao' : 'ok';
  const restante = orcado - real;
  const status = tone === 'estourou' ? 'Passou ' + 'R$ ' + formatBRL(-restante, { cents: false })
    : 'Restam R$ ' + formatBRL(restante, { cents: false });
  return (
    <div className={cx('fp-budget', 'fp-budget--' + tone, p.className)}>
      <div className="fp-budget__head">
        {p.icon ? <CategoryIcon icon={p.icon} tone={p.tone} size={32} /> : null}
        <span className="fp-budget__name">{p.name}</span>
        <span className="fp-budget__nums">
          <Money value={real} kind="neutro" cents={false} signed={false} />
          <span className="fp-budget__de">{' de R$ ' + formatBRL(orcado, { cents: false })}</span>
        </span>
      </div>
      <div className="fp-budget__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label={p.name}>
        <span className="fp-budget__fill" style={{ width: Math.min(pct, 1) * 100 + '%' }} />
      </div>
      <div className="fp-budget__foot">
        <StatusBadge tone={tone} icon={tone === 'ok' ? false : undefined}>{Math.round(pct * 100) + '%'}</StatusBadge>
        <span>{status}</span>
      </div>
    </div>
  );
}
