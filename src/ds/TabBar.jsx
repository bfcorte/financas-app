import { cx } from './util.js';
import { Icon } from './Icon.jsx';

const TABS_PADRAO = [
  { value: 'painel', label: 'Painel', icon: 'painel' },
  { value: 'lancamentos', label: 'Lançamentos', icon: 'lista' },
  { value: 'novo', label: 'Novo', icon: 'mais', fab: true },
  { value: 'orcamento', label: 'Orçamento', icon: 'pizza' },
  { value: 'metas', label: 'Metas', icon: 'alvo' }
];

export function TabBar(p) {
  const tabs = p.tabs || TABS_PADRAO;
  return (
    <nav className={cx('fp-tabbar', p.className)} aria-label="Navegação principal" style={p.style}>
      {tabs.map((t) => {
        const on = t.value === p.value;
        const click = () => { if (p.onChange) p.onChange(t.value); };
        if (t.fab) {
          return (
            <button key={t.value} type="button" className="fp-tabbar__fab" onClick={click} aria-label="Novo lançamento">
              <Icon name="mais" size={26} stroke={2.2} />
            </button>
          );
        }
        return (
          <button key={t.value} type="button" className={cx('fp-tabbar__item', on && 'is-on')} aria-current={on ? 'page' : undefined} onClick={click}>
            <span className="fp-tabbar__ic">
              <Icon name={t.icon} size={24} stroke={on ? 2.1 : 1.75} />
              {t.badge ? <span className="fp-tabbar__badge">{t.badge}</span> : null}
            </span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
TabBar.TABS_PADRAO = TABS_PADRAO;
