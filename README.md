# Alere · Controle de Trade

Aplicação web (React + Vite + Tailwind) para controle de trade da Alere: estoque em loja extraído de mensagens de WhatsApp, dashboard com gráficos, controle do Centro de Distribuição (CD) e backup local em JSON.

**Sem login, sem backend, sem banco online.** Todos os dados ficam salvos apenas neste navegador/dispositivo, no IndexedDB (via Dexie.js). Se você abrir o app em outro computador, celular, outro navegador ou outro domínio, os dados não estarão lá — por isso o app tem backup/restauração em JSON.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).

Para build de produção:

```bash
npm run build
npm run preview   # serve o build localmente para conferir
```

Na primeira execução, se o banco estiver vazio, o app popula automaticamente dados de exemplo (duas lojas, duas visitas cada, e alguns envios do CD) para você já ver o dashboard funcionando. Para limpar e começar do zero, use **Configurações → Limpar todos os dados locais**.

## Estrutura

```
src/
  db.js                 Dexie (IndexedDB): tabelas estoqueLoja e centroDistribuicao
  lib/
    parser.js           parser da mensagem de WhatsApp
    status.js           status de validade (Vencido / Alerta 50 dias / Normal / Sem validade)
    snapshot.js         última visita por loja, totais, alertas de vencimento (live, baseado em hoje)
    evolucao.js         comparação entre visitas, venda estimada, série temporal
    cd.js                agregações do Centro de Distribuição
    csv.js / pdf.js / backup.js / download.js / format.js
    seed.js              dados de exemplo
  components/            layout, sidebar, cards, badges, gráficos (Recharts)
  pages/
    Dashboard.jsx
    NovoLancamento.jsx   colar mensagem → processar → revisar → salvar
    Lojas.jsx            histórico/tabela com filtros, edição e exclusão
    CentroDistribuicao.jsx
    Configuracoes.jsx    backup JSON, exportações, limpar dados
```

## Parser de mensagens

Regras (ver `src/lib/parser.js`):

- 1ª linha da mensagem = empresa. Linha `Loja: NN` define a loja.
- Uma linha como `14 unidades 04/10/2026` é um **lote** (quantidade + validade) do produto atual.
- `-` é um lote sem estoque informado/zerado.
- Linhas começando com `#` (ex.: `## Proteico`) são tratadas como comentário/seção e são ignoradas — não definem produto.
- Qualquer outra linha define um novo "produto atual"; os lotes seguintes pertencem a ele até aparecer outro nome de produto.
- Produtos com mais de um lote (duas linhas de quantidade/validade) geram um registro por lote.

Tudo isso cai numa pré-visualização editável em **Novo Lançamento** antes de salvar — então qualquer interpretação errada pode ser corrigida manualmente.

## Status de validade

- `diasParaVencer` e `statusValidade` são gravados no momento do lançamento, em relação à **data da visita** escolhida (registro histórico).
- O **Dashboard** recalcula os alertas (vencido / alerta 50 dias) em relação a **hoje**, mas só sobre o snapshot mais recente de cada loja+produto — para não gerar alarme falso sobre lotes antigos que já podem ter sido repostos/vendidos numa visita mais nova.
- A tabela de **Lojas** (histórico completo) mostra o status como ele era no momento da visita, já que linhas antigas podem não refletir o estoque físico atual.

## Venda estimada

Não há acesso a cupom fiscal. A "venda estimada" é apenas a queda de quantidade do mesmo produto na mesma loja entre duas visitas consecutivas (`src/lib/evolucao.js`). Aumento de quantidade é tratado como reposição/aumento de estoque.

## Backup e exportação

- **Configurações → Exportar Backup JSON**: baixa um arquivo com todas as tabelas (loja + CD).
- **Importar Backup JSON**: substitui todos os dados atuais pelos do arquivo (pede confirmação).
- **Exportar CSV** (Dashboard, Lojas, CD e Configurações): usa Papaparse.
- **Gerar PDF**: usa jsPDF + jspdf-autotable; no Dashboard também captura os gráficos via html2canvas.
- Um aviso aparece automaticamente no topo do app quando não há backup ou o último tem mais de 7 dias.

## Deploy na Vercel

O projeto é 100% estático (sem servidor/API), então qualquer deploy padrão da Vercel funciona:

1. Importe o repositório na Vercel (framework detectado automaticamente como Vite).
2. Build command: `npm run build` · Output: `dist` (padrão do Vite, não precisa configurar nada).
3. O arquivo `vercel.json` já inclui o rewrite de SPA (`/* → /index.html`) para as rotas do React Router funcionarem em refresh/links diretos.
4. **URL fixa**: configure um domínio de produção (Settings → Domains) ou use a URL `*.vercel.app` do branch de produção (`main`) — ela é fixa e não muda a cada deploy, diferente das URLs de preview geradas para outros branches/PRs.

Como os dados ficam só no navegador, cada pessoa/computador que acessar a URL terá seu próprio banco local, independente um do outro.
