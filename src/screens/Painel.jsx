import { useState } from 'react';
import { Icon, Money, KpiCard, CategoryIcon, BudgetBar, TransactionRow } from '../ds/index.js';
import { useDados, brl, nomeMes, mesAnterior, MESES, ddmm, rotuloQuando } from '../store.jsx';
import { Tela, Barra, Folha, Alca } from '../ui.jsx';
import { useTema } from '../tema.js';

export default function Painel() {
  const { d, sel, setMes } = useDados();
  const [mesAberto, setMesAberto] = useState(false);
  const { tema, setPref } = useTema();
  const escuro = tema === 'dark';
  const mes = d.mes;
  const doMes = sel.doMes(mes);
  const t = sel.totais(doMes);
  const ant = sel.totais(sel.doMes(mesAnterior(mes)));
  const nomeAnt = MESES[Number(mesAnterior(mes).slice(5)) - 1].toLowerCase();
  const abrevAnt = nomeAnt.slice(0, 3);

  // Frase do mês
  let frase = t.entradas > 0 ? Math.round((t.sobra / t.entradas) * 100) + '% do que entrou' : 'Nada entrou ainda neste mês';
  if (ant.entradas > 0 && t.entradas > 0) {
    const dif = Math.round(t.sobra - ant.sobra);
    if (dif !== 0) frase += ' · ' + brl(Math.abs(dif)) + (dif > 0 ? ' a mais que ' : ' a menos que ') + nomeAnt;
  }
  if (t.sobra < 0) frase = 'Saiu mais do que entrou · ' + frase;

  const pctEnt = ant.entradas > 0 ? Math.round(((t.entradas - ant.entradas) / ant.entradas) * 100) : null;
  const footEnt = pctEnt === null ? 'sem mês anterior' : (pctEnt >= 0 ? '+' : '−') + Math.abs(pctEnt) + '% vs ' + abrevAnt;
  const footDesp = t.entradas > 0 ? Math.round((t.despesas / t.entradas) * 100) + '% da renda' : '—';

  // Para onde foi: 4 maiores categorias + Outras
  const porCat = {};
  doMes.forEach((l) => { if (sel.tipoDe(l) !== 'despesa') return; const k = sel.catPorId[l.catId] ? l.catId : '_pend'; porCat[k] = (porCat[k] || 0) + l.valor; });
  const ordem = Object.entries(porCat).filter(([k]) => k !== '_pend').sort((a, b) => b[1] - a[1]);
  const top = ordem.slice(0, 4);
  const resto = ordem.slice(4).reduce((s, x) => s + x[1], 0) + (porCat._pend || 0);
  const fatias = top.map(([k, v]) => ({ nome: sel.catPorId[k].nome, icon: sel.catPorId[k].icon, tone: sel.catPorId[k].tone, valor: v }));
  if (resto > 0) fatias.push({ nome: 'Outras', icon: 'sacola', tone: 'nota-200', valor: resto });
  const totalFatias = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  fatias.forEach((f) => { f.w = Math.max(1, Math.round((f.valor / totalFatias) * 100)); f.pct = Math.round((f.valor / totalFatias) * 100) + '%'; });

  // Orçamento: as 3 variáveis mais usadas
  const gasto = (catId) => doMes.filter((l) => l.catId === catId).reduce((s, l) => s + l.valor, 0);
  const orcItens = (sel.maisUsadas.length ? sel.maisUsadas : d.cats.filter((c) => c.grupo === 'variavel').slice(0, 3));

  const ultimos = sel.ordenar(doMes.filter((l) => sel.catPorId[l.catId])).slice(0, 4);
  const pend = sel.pendentes.length;
  const imp = rotuloQuando(d.importacao.quando);

  return (
    <Tela>
      <div className="scroll pb-tab" style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: 112, scrollbarWidth: 'none' }}>
        <section style={{ background: 'var(--header)', color: 'var(--on-header)', padding: 'calc(var(--top) + 14px) 16px 28px', borderRadius: '0 0 22px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <button type="button" onClick={() => setMesAberto(true)} aria-haspopup="dialog" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: 0, border: 0, background: 'none', color: 'var(--on-header)', fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              {nomeMes(mes)}
              <Icon name="saida" size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => setPref(escuro ? 'claro' : 'escuro')} aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
                style={{ width: 40, height: 40, borderRadius: '50%', border: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.1)', color: 'var(--on-header)', cursor: 'pointer' }}>
                <Icon name={escuro ? 'sol' : 'lua'} size={20} />
              </button>
              <a href="#/ajustes" aria-label="Ajustes" style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.1)', color: 'var(--on-header)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>F</a>
            </div>
          </div>
          <span className="rotulo" style={{ color: 'var(--on-header-muted)', textTransform: 'uppercase' }}>Sobrou no mês</span>
          <div style={{ '--ink': 'var(--on-header)' }}>
            <Money value={t.sobra} size="hero" />
          </div>
          <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--on-header-muted)' }}>{frase}</span>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, padding: '16px 16px 0' }}>
          <KpiCard label="Entradas" value={t.entradas} tone="jade" icon="entrada" foot={footEnt} />
          <KpiCard label="Despesas" value={t.despesas} tone="ink" icon="saida" foot={footDesp} />
          <KpiCard label="Guardado" value={t.guardado} tone="violet" icon="cofre" foot={'meta ' + brl(d.metaMensal)} />
        </div>

        {pend > 0 ? (
          <a href="#/classificar" style={{ margin: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'var(--amber-soft)', color: 'var(--ink)' }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--surface-raised)', color: 'var(--amber)' }}>
              <Icon name="duvida" size={20} />
            </span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{pend} {pend === 1 ? 'lançamento' : 'lançamentos'} para classificar</span>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Chegaram do Itaú {imp.dia} às {imp.hora}</span>
            </span>
            <span style={{ color: 'var(--amber)' }}><Icon name="seta" size={20} /></span>
          </a>
        ) : null}

        <section style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="titulo-secao" style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Para onde foi</h2>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fatias.length === 0 ? (
              <span style={{ fontSize: 15, color: 'var(--ink-muted)' }}>Nenhuma despesa em {nomeMes(mes).toLowerCase()}.</span>
            ) : (
              <>
                <div aria-hidden="true" style={{ display: 'flex', gap: 3, height: 12 }}>
                  {fatias.map((f) => <span key={f.nome} style={{ flex: f.w + ' 1 0', borderRadius: 4, background: 'var(--' + f.tone + ')' }} />)}
                </div>
                {fatias.map((f) => (
                  <div key={f.nome} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CategoryIcon icon={f.icon} tone={f.tone} size={32} />
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{f.nome}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right' }}>{f.pct}</span>
                    <Money value={f.valor} cents={false} signed={false} />
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        <section style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 className="titulo-secao" style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Orçamento</h2>
            <a href="#/orcamento" style={{ fontSize: 15, fontWeight: 600, padding: '10px 0' }}>Ver tudo</a>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {orcItens.map((c) => <BudgetBar key={c.id} name={c.nome} icon={c.icon} tone={c.tone} budget={c.orc} spent={Math.round(gasto(c.id))} />)}
          </div>
        </section>

        <section style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 className="titulo-secao" style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Últimos lançamentos</h2>
            <a href="#/lancamentos" style={{ fontSize: 15, fontWeight: 600, padding: '10px 0' }}>Ver todos</a>
          </div>
          {ultimos.length ? (
            <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)' }}>
              {ultimos.map((l) => {
                const c = sel.catPorId[l.catId];
                return (
                  <a key={l.id} href={'#/detalhe/' + l.id} style={{ display: 'block', color: 'inherit' }}>
                    <TransactionRow title={l.desc} category={c.nome} icon={c.icon} tone={c.tone} account={l.conta} method={l.forma} date={ddmm(l.data)} value={l.valor} kind={sel.tipoDe(l)} installment={l.parc} />
                  </a>
                );
              })}
            </div>
          ) : <span style={{ fontSize: 15, color: 'var(--ink-muted)' }}>Nenhum lançamento classificado neste mês.</span>}
        </section>
      </div>

      <Barra ativa="painel" />

      {mesAberto ? (
        <Folha onFechar={() => setMesAberto(false)} label="Escolher mês" className="pb-folha" style={{ padding: '8px 16px 36px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 'calc(100% - var(--top))' }}>
          <Alca margin="0 auto 4px" />
          <h2 style={{ margin: 0, textAlign: 'center', fontSize: 17, fontWeight: 600 }}>Escolher mês</h2>
          <div className="scroll" style={{ borderRadius: 14, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)', scrollbarWidth: 'none' }}>
            {sel.meses.map((m) => {
              const tm = sel.totais(sel.doMes(m));
              const on = m === mes;
              return (
                <button key={m} type="button" onClick={() => { setMes(m); setMesAberto(false); }} aria-pressed={on} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 16px', border: 0, background: 'var(--surface-raised)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left', cursor: 'pointer', flex: 'none' }}>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{nomeMes(m)}</span>
                  <span style={{ fontSize: 14, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{tm.sobra < 0 ? 'faltou ' + brl(-tm.sobra) : 'sobrou ' + brl(tm.sobra)}</span>
                  {on ? <span style={{ color: 'var(--jade)' }}><Icon name="check" size={20} stroke={2.2} /></span> : null}
                </button>
              );
            })}
          </div>
        </Folha>
      ) : null}
    </Tela>
  );
}
