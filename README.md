# Alere · Controle de Trade

Aplicação web (React + Vite + Tailwind) para controle de trade da Alere: estoque em loja extraído de mensagens de WhatsApp, dashboards por rede de lojas, controle do Centro de Distribuição (CD).

**Sem login, com banco online (Supabase).** Os dados ficam salvos no Postgres do Supabase e são compartilhados entre todos os dispositivos/navegadores que acessam o app — não há mais backup/restauração manual em JSON.

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (ou use um existente).
2. No SQL Editor do projeto, rode o script `supabase/schema.sql` deste repositório — ele cria as tabelas `estoqueLoja` e `centroDistribuicao`, habilita RLS com acesso aberto (sem login) e liga o Realtime.
3. Copie `.env.example` para `.env` e preencha com as credenciais do projeto (Project Settings → API):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publishable
```

`.env` não é versionado (está no `.gitignore`).

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

## Estrutura

```
src/
  db.js                  Cliente Supabase (createClient) + constantes de tabela
  lib/
    useSupabaseTable.js  Hook: busca uma tabela e mantém em sincronia via Supabase Realtime
    redes.js             Lista das redes de lojas (Zona Sul, HNT, Mambo, Obae, St Marche, Hippo)
    parser.js            Parser da mensagem de WhatsApp
    status.js            Status de validade (Vencido / Alerta 50 dias / Normal / Sem validade)
    snapshot.js          Última visita por loja, totais, alertas de vencimento (live, baseado em hoje)
    evolucao.js          Comparação entre visitas, venda estimada, série temporal
    cd.js                 Agregações do Centro de Distribuição
    csv.js / pdf.js / download.js / format.js
  components/             Layout, sidebar, cards, badges, gráficos (Recharts)
  pages/
    Dashboard.jsx         Um dashboard por rede, em /rede/:redeSlug
    NovoLancamento.jsx    Colar mensagem → processar → revisar → salvar (com seleção de rede)
    Lojas.jsx             Histórico/tabela com filtros (inclui rede), edição e exclusão
    CentroDistribuicao.jsx
    Configuracoes.jsx     Exportações (CSV/PDF) e limpar dados
supabase/
  schema.sql              Script para criar as tabelas no Supabase
```

## Parser de mensagens

Regras (ver `src/lib/parser.js`):

- 1ª linha da mensagem = empresa. Linha `Loja: NN` define a loja.
- Uma linha como `14 unidades 04/10/2026` é um **lote** (quantidade + validade) do produto atual.
- `-` é um lote sem estoque informado/zerado.
- Linhas começando com `#` (ex.: `## Proteico`) são tratadas como comentário/seção e são ignoradas — não definem produto.
- Qualquer outra linha define um novo "produto atual"; os lotes seguintes pertencem a ele até aparecer outro nome de produto.
- Produtos com mais de um lote (duas linhas de quantidade/validade) geram um registro por lote.

Tudo isso cai numa pré-visualização editável em **Novo Lançamento** antes de salvar — então qualquer interpretação errada pode ser corrigida manualmente. Cada lançamento é salvo já vinculado à **rede** escolhida no formulário.

## Status de validade

- `diasParaVencer` e `statusValidade` são gravados no momento do lançamento, em relação à **data da visita** escolhida (registro histórico).
- O **Dashboard** recalcula os alertas (vencido / alerta 50 dias) em relação a **hoje**, mas só sobre o snapshot mais recente de cada loja+produto — para não gerar alarme falso sobre lotes antigos que já podem ter sido repostos/vendidos numa visita mais nova.
- A tabela de **Lojas** (histórico completo) mostra o status como ele era no momento da visita, já que linhas antigas podem não refletir o estoque físico atual.

## Venda estimada

Não há acesso a cupom fiscal. A "venda estimada" é apenas a queda de quantidade do mesmo produto na mesma loja entre duas visitas consecutivas (`src/lib/evolucao.js`). Aumento de quantidade é tratado como reposição/aumento de estoque.

## Dashboards por rede

Cada rede (Zona Sul, HNT, Mambo, Obae, St Marche, Hippo — ver `src/lib/redes.js`) tem seu próprio dashboard em `/rede/<slug>`, com dados filtrados só daquela rede. A raiz `/` redireciona para `/rede/zona-sul`.

## Exportação de dados

- **Exportar CSV** (Lojas, CD e Configurações): usa Papaparse.
- **Gerar PDF**: usa jsPDF + jspdf-autotable; no Dashboard também captura os gráficos via html2canvas.

## Deploy na Vercel

O projeto é 100% estático no frontend (o backend é o Supabase), então qualquer deploy padrão da Vercel funciona:

1. Importe o repositório na Vercel (framework detectado automaticamente como Vite).
2. Configure as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Settings → Environment Variables.
3. Build command: `npm run build` · Output: `dist` (padrão do Vite, não precisa configurar nada).
4. O arquivo `vercel.json` já inclui o rewrite de SPA (`/* → /index.html`) para as rotas do React Router funcionarem em refresh/links diretos.
5. **URL fixa**: configure um domínio de produção (Settings → Domains) ou use a URL `*.vercel.app` do branch de produção (`main`) — ela é fixa e não muda a cada deploy, diferente das URLs de preview geradas para outros branches/PRs.

Como os dados agora ficam no Supabase, todas as pessoas que acessarem a URL veem e editam os mesmos dados em tempo real.
