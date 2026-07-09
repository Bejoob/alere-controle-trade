-- Alere Controle de Trade — schema Supabase
-- Rode este script inteiro no SQL Editor do seu projeto Supabase (Database > SQL Editor > New query).
-- Os nomes de tabela/coluna usam camelCase entre aspas para espelhar exatamente os campos usados no app.

create table if not exists "estoqueLoja" (
  "id" bigint generated always as identity primary key,
  "origem" text not null default 'LOJA',
  "empresa" text,
  "rede" text not null default 'Zona Sul',
  "loja" text not null,
  "produto" text not null,
  "quantidade" integer not null default 0,
  "validade" date,
  "dataVisita" date not null,
  "diasParaVencer" integer,
  "statusValidade" text,
  "criadoEm" timestamptz not null default now()
);

create index if not exists "estoqueLoja_rede_idx" on "estoqueLoja" ("rede");
create index if not exists "estoqueLoja_loja_idx" on "estoqueLoja" ("loja");
create index if not exists "estoqueLoja_dataVisita_idx" on "estoqueLoja" ("dataVisita");

create table if not exists "centroDistribuicao" (
  "id" bigint generated always as identity primary key,
  "origem" text not null default 'CD',
  "produto" text not null,
  "quantidadeEnviada" integer not null default 0,
  "lojaDestino" text not null,
  "responsavel" text,
  "dataVisita" date not null,
  "diaSemana" text,
  "observacoes" text,
  "criadoEm" timestamptz not null default now()
);

create index if not exists "centroDistribuicao_lojaDestino_idx" on "centroDistribuicao" ("lojaDestino");
create index if not exists "centroDistribuicao_dataVisita_idx" on "centroDistribuicao" ("dataVisita");

-- Acesso aberto (sem login): a chave anon do app tem permissão total de leitura/escrita.
-- Se um dia adicionar login, troque estas políticas por regras baseadas em auth.uid().
alter table "estoqueLoja" enable row level security;
alter table "centroDistribuicao" enable row level security;

drop policy if exists "acesso aberto estoqueLoja" on "estoqueLoja";
create policy "acesso aberto estoqueLoja" on "estoqueLoja" for all using (true) with check (true);

drop policy if exists "acesso aberto centroDistribuicao" on "centroDistribuicao";
create policy "acesso aberto centroDistribuicao" on "centroDistribuicao" for all using (true) with check (true);

-- Habilita realtime (o app escuta mudanças para atualizar a tela automaticamente entre dispositivos).
alter publication supabase_realtime add table "estoqueLoja";
alter publication supabase_realtime add table "centroDistribuicao";
