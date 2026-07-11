-- eCaveira WarGame - schema inicial reconstruido
-- Projeto Supabase: lymkdrqboitvrozsgwbf
-- Gerado a partir da engenharia reversa do frontend (src/) e das Edge Functions (supabase/functions/).
-- NAO aplicar automaticamente: revisar e rodar manualmente via Supabase CLI/painel.

-- =========================================================================
-- Extensoes
-- =========================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- =========================================================================
-- Funcao utilitaria: updated_at automatico
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- Tabela: profiles
-- 1:1 com auth.users. NAO existe trigger de criacao automatica:
-- o profile e criado explicitamente pela Edge Function create-user.
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  cargo text,
  perfil text not null default 'operador'
    constraint profiles_perfil_check check (perfil in ('admin', 'operador')),
  ativo boolean not null default true,
  convite_status text not null default 'pendente'
    constraint profiles_convite_status_check check (convite_status in ('pendente', 'aceito', 'expirado')),
  convite_enviado_em timestamptz,
  convite_aceito_em timestamptz,
  convite_total_envios integer not null default 0,
  ultimo_login_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_key on public.profiles (lower(email));

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- =========================================================================
-- Funcao utilitaria: checa se o usuario autenticado e admin ativo.
-- security definer para evitar recursao de RLS ao consultar profiles
-- dentro das proprias policies de profiles.
-- =========================================================================
create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and perfil = 'admin'
      and ativo = true
  );
$$;

-- =========================================================================
-- Tabela: leads
-- =========================================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  empresa text not null,
  contato text not null,
  celular text not null,
  email text,
  produto text not null,
  origem text not null,
  temperatura text not null default 'morno'
    constraint leads_temperatura_check check (temperatura in ('frio', 'morno', 'quente', 'caveira')),
  etapa_atual text not null default 'suspect'
    constraint leads_etapa_atual_check check (
      etapa_atual in ('suspect', 'prospect', 'demo', 'negociacao', 'fechado', 'perdido', 'congelado')
    ),
  proximo_contato date,
  proxima_acao text,
  observacao text,
  link_ploomes text,
  valor_estimado numeric(14, 2),
  data_suspect date,
  data_prospect date,
  data_demo date,
  data_negociacao date,
  data_fechamento date,
  data_perdido date,
  data_congelado date,
  ultima_acao text,
  ultima_acao_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_user_id_idx on public.leads (user_id);
create index leads_user_id_etapa_atual_idx on public.leads (user_id, etapa_atual);
create index leads_created_at_idx on public.leads (created_at);

create trigger set_leads_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

-- =========================================================================
-- Tabela: historico_leads
-- =========================================================================
create table public.historico_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  lead_id uuid not null references public.leads (id) on delete cascade,
  tipo text not null
    constraint historico_leads_tipo_check check (tipo in ('criacao', 'edicao', 'movimentacao')),
  descricao text not null,
  etapa_origem text
    constraint historico_leads_etapa_origem_check check (
      etapa_origem is null
      or etapa_origem in ('suspect', 'prospect', 'demo', 'negociacao', 'fechado', 'perdido', 'congelado')
    ),
  etapa_destino text
    constraint historico_leads_etapa_destino_check check (
      etapa_destino is null
      or etapa_destino in ('suspect', 'prospect', 'demo', 'negociacao', 'fechado', 'perdido', 'congelado')
    ),
  created_at timestamptz not null default now()
);

create index historico_leads_lead_id_idx on public.historico_leads (lead_id);
create index historico_leads_user_id_idx on public.historico_leads (user_id);

-- =========================================================================
-- Tabela: metas (metas mensais por usuario)
-- =========================================================================
create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  mes integer not null constraint metas_mes_check check (mes between 1 and 12),
  ano integer not null constraint metas_ano_check check (ano between 2000 and 2100),
  meta_suspect integer not null default 0,
  meta_prospect integer not null default 0,
  meta_demo integer not null default 0,
  meta_negociacao integer not null default 0,
  meta_fechamento integer not null default 0,
  meta_financeira numeric(14, 2) not null default 0,
  resultado_referencia numeric(14, 2) not null default 0,
  fechamentos_referencia integer not null default 0,
  ticket_medio_referencia numeric(14, 2) not null default 0,
  dias_uteis integer not null default 0,
  taxa_suspect_prospect numeric(6, 2) not null default 0,
  taxa_prospect_demo numeric(6, 2) not null default 0,
  taxa_demo_negociacao numeric(6, 2) not null default 0,
  taxa_negociacao_fechamento numeric(6, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint metas_user_mes_ano_key unique (user_id, mes, ano)
);

create trigger set_metas_updated_at
  before update on public.metas
  for each row
  execute function public.set_updated_at();

-- =========================================================================
-- Tabela: metas_anuais
-- =========================================================================
create table public.metas_anuais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  ano integer not null constraint metas_anuais_ano_check check (ano between 2000 and 2100),
  meta_financeira_padrao numeric(14, 2) not null default 0,
  vigente_ate date,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint metas_anuais_user_ano_key unique (user_id, ano)
);

create trigger set_metas_anuais_updated_at
  before update on public.metas_anuais
  for each row
  execute function public.set_updated_at();

-- =========================================================================
-- Tabela: notificacoes
-- user_id aceita null e usa ON DELETE SET NULL (delete-user ja faz o
-- unlink manual antes de excluir o profile; a FK reforca a garantia).
-- =========================================================================
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null
    constraint notificacoes_tipo_check check (
      tipo in (
        'convite_aceito',
        'usuario_criado',
        'usuario_excluido',
        'dados_reiniciados',
        'sistema'
      )
    ),
  titulo text not null,
  mensagem text not null,
  user_id uuid references public.profiles (id) on delete set null,
  lida boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index notificacoes_user_id_idx on public.notificacoes (user_id);
create index notificacoes_lida_idx on public.notificacoes (lida);

create trigger set_notificacoes_updated_at
  before update on public.notificacoes
  for each row
  execute function public.set_updated_at();

-- =========================================================================
-- RLS: habilitar em todas as tabelas de aplicacao
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.historico_leads enable row level security;
alter table public.metas enable row level security;
alter table public.metas_anuais enable row level security;
alter table public.notificacoes enable row level security;

-- =========================================================================
-- Policies: profiles
-- INSERT/DELETE nao sao liberados para authenticated: so as Edge Functions
-- (service role, que ignora RLS) criam/removem profiles.
-- =========================================================================
create policy profiles_select_own_or_admin
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_active_admin());

create policy profiles_update_own_or_admin
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_active_admin())
  with check (id = auth.uid() or public.is_active_admin());

-- =========================================================================
-- Policies: leads (estritamente por dono, sem excecao de admin)
-- =========================================================================
create policy leads_select_own
  on public.leads for select
  to authenticated
  using (user_id = auth.uid());

create policy leads_insert_own
  on public.leads for insert
  to authenticated
  with check (user_id = auth.uid());

create policy leads_update_own
  on public.leads for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sem policy de DELETE: exclusoes operacionais so ocorrem via Edge Function
-- reset-user-operational-data, que usa service role (ignora RLS).

-- =========================================================================
-- Policies: historico_leads (so leitura/insercao pelo proprio dono)
-- =========================================================================
create policy historico_leads_select_own
  on public.historico_leads for select
  to authenticated
  using (user_id = auth.uid());

create policy historico_leads_insert_own
  on public.historico_leads for insert
  to authenticated
  with check (user_id = auth.uid());

-- Sem policy de UPDATE/DELETE: historico e imutavel no client;
-- exclusoes so ocorrem via Edge Function com service role.

-- =========================================================================
-- Policies: metas
-- =========================================================================
create policy metas_select_own
  on public.metas for select
  to authenticated
  using (user_id = auth.uid());

create policy metas_insert_own
  on public.metas for insert
  to authenticated
  with check (user_id = auth.uid());

create policy metas_update_own
  on public.metas for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- Policies: metas_anuais (inclui delete, usado por deleteAnnualGoal)
-- =========================================================================
create policy metas_anuais_select_own
  on public.metas_anuais for select
  to authenticated
  using (user_id = auth.uid());

create policy metas_anuais_insert_own
  on public.metas_anuais for insert
  to authenticated
  with check (user_id = auth.uid());

create policy metas_anuais_update_own
  on public.metas_anuais for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy metas_anuais_delete_own
  on public.metas_anuais for delete
  to authenticated
  using (user_id = auth.uid());

-- =========================================================================
-- Policies: notificacoes
-- Hoje so admins ativos listam/leem notificacoes (Sidebar.jsx so chama
-- listUnreadNotifications quando isAdmin). O INSERT e feito pelo proprio
-- usuario ao aceitar convite (createInviteAcceptedNotification), sempre
-- com user_id = auth.uid() (o proprio usuario que esta aceitando).
-- =========================================================================
create policy notificacoes_select_admin
  on public.notificacoes for select
  to authenticated
  using (public.is_active_admin());

create policy notificacoes_insert_own
  on public.notificacoes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy notificacoes_update_admin
  on public.notificacoes for update
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- Sem policy de DELETE: nenhuma exclusao de notificacoes e feita pelo client.
