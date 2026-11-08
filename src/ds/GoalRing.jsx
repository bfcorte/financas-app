import { cx, formatBRL } from './util.js';
import { Money } from './Money.jsx';

export function GoalRing(p) {
  const size = p.size || 88, sw = p.strokeWidth || 9;
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, (Number(p.saved) || 0) / (Number(p.target) || 1)));
  return (
    <div className={cx('fp-goal', p.className)}>
      <div className="fp-goal__ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--violet-soft)" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--violet)" strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform={'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'} />
        </svg>
        <span className="fp-goal__pct">{Math.round(pct * 100) + '%'}</span>
      </div>
      {p.name ? (
        <div className="fp-goal__txt">
          <span className="fp-goal__name">{p.name}</span>
          <span className="fp-goal__nums"><Money value={p.saved} kind="neutro" cents={false} signed={false} />{' de R$ ' + formatBRL(p.target, { cents: false })}</span>
          {p.foot ? <span className="fp-goal__foot">{p.foot}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
