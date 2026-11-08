import { cx } from './util.js';
import { Icon } from './Icon.jsx';
import { Money } from './Money.jsx';

export function KpiCard(p) {
  const tone = p.tone || 'ink';
  return (
    <div className={cx('fp-kpi', 'fp-kpi--' + tone, p.className)}>
      <span className="fp-kpi__top">
        {p.icon ? <span className="fp-kpi__icon"><Icon name={p.icon} size={16} stroke={2} /></span> : null}
        <span className="rotulo">{p.label}</span>
      </span>
      <span className="fp-kpi__valor"><Money value={p.value} kind="neutro" size="card" cents={false} signed={false} /></span>
      {p.foot ? <span className="fp-kpi__foot">{p.foot}</span> : null}
    </div>
  );
}
