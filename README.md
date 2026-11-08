# Finanças Pessoais

PWA de finanças pessoais (React 18 + Vite) ligado a uma planilha do Google por uma API em Apps Script (código em repositório privado). O app não guarda dados no código: na primeira abertura ele pede a URL da API e o token, que ficam só no aparelho.

## Rodar

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # gera dist/
npm run icons      # regera os ícones PNG a partir de scripts/icone.svg
FINANCAS_CONFIG=<arquivo local com a configuração> node scripts/e2e.mjs   # teste contra a API real
```

## Como funciona

- `src/api.js` — GET `versao` / `tudo`; POST `text/plain` (sem preflight) para as escritas.
- `src/store.jsx` — dados da planilha, atualização otimista (desfaz se falhar), polling de versão a cada 5 s, cache para abrir offline.
- `src/conexao.js` — URL e token salvos só neste aparelho. Também aceita `#/setup?api=…&token=…&push=…&ps=…` (o fragmento não vai para servidor nenhum).
- `src/push.js` + `scripts/sw-modelo.js` — notificações Web Push (no iPhone, só com o app na Tela de Início).
- `src/ds/` — componentes do design system.

## Instalar no iPhone

Abra o link de configuração no Safari → Compartilhar → Adicionar à Tela de Início.
