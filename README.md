# Finanças Pessoais

PWA de finanças pessoais (React 18 + Vite) para validar o design no iPhone. Os dados são de exemplo e ficam só no aparelho (localStorage).

## Rodar

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # gera dist/
npm run test:e2e   # roda o build no Playwright (390×844, tema claro e escuro)
npm run icons      # regera os ícones PNG a partir de scripts/icone.svg
```

## Estrutura

- `src/ds/` — componentes do design system (Money, Icon, Button, StatusBadge, CategoryIcon, CategoryChip, TransactionRow, KpiCard, BudgetBar, GoalRing, SegmentedControl, TabBar) e `tokens.css` / `bundle.css`.
- `src/screens/` — as 10 telas: Painel, Lançamentos, Detalhe, A classificar, Novo, Orçamento, Metas, Ajustes, Categorias e Regras.
- `src/store.jsx` — estado compartilhado (React context + localStorage). `src/seed.js` — dados de exemplo.
- Rotas por hash: `#/painel`, `#/lancamentos`, `#/detalhe/<id>`, `#/classificar`, `#/novo`, `#/orcamento`, `#/metas`, `#/ajustes`, `#/categorias`, `#/regras`.

## Instalar no iPhone

Abra a URL do GitHub Pages no Safari → Compartilhar → Adicionar à Tela de Início.
