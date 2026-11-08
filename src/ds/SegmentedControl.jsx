import { cx } from './util.js';

export function SegmentedControl(p) {
  const opts = p.options || [];
  return (
    <div className={cx('fp-seg', p.className)} role="tablist" aria-label={p['aria-label']}>
      {opts.map((o) => {
        const v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label;
        const on = v === p.value;
        return (
          <button key={v} type="button" role="tab" aria-selected={on} className={cx('fp-seg__opt', on && 'is-on')}
            onClick={() => { if (p.onChange) p.onChange(v); }}>{l}</button>
        );
      })}
    </div>
  );
}
