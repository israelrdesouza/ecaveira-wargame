-- RPC transacional para reiniciar dados operacionais de um usuario.
-- Substitui os deletes independentes feitos antes pela Edge Function
-- reset-user-operational-data, que nao eram atomicos (falha no meio do
-- processo podia deixar dados apagados parcialmente).
--
-- Semantica de negocio (fixada por decisao de arquitetura):
-- - leads sao selecionados por created_at (nao pelas datas de etapa);
-- - o periodo nao representa movimentacoes por etapa;
-- - metas mensais sao removidas pelo mes/ano selecionado;
-- - metas_anuais, notificacoes, profiles e auth.users sao sempre preservados;
-- - historico_leads e removido junto com os leads selecionados;
-- - toda a operacao roda dentro da mesma transacao: ou apaga tudo, ou nada.
--
-- SECURITY INVOKER (padrao): nao ha necessidade de SECURITY DEFINER, pois
-- esta funcao so pode ser chamada por service_role (ver GRANT/REVOKE ao
-- final), que ja possui privilegios de tabela suficientes e ja ignora RLS
-- por conta do atributo BYPASSRLS do proprio papel. Usar SECURITY DEFINER
-- aqui seria privilegio desnecessario.
create or replace function public.reiniciar_dados_operacionais(
  p_target_user_id uuid,
  p_mode text,
  p_year integer,
  p_months integer[] default null
)
returns table (
  leads_apagados integer,
  historico_apagado integer,
  metas_apagadas integer
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_months integer[];
  v_start timestamptz;
  v_end timestamptz;
  v_lead_ids uuid[];
  v_leads_count integer := 0;
  v_historico_count integer := 0;
  v_metas_count integer := 0;
begin
  -- =======================================================================
  -- Validacao (aborta a transacao inteira em caso de erro)
  -- =======================================================================
  if p_target_user_id is null then
    raise exception 'target_user_id e obrigatorio';
  end if;

  if p_mode is null or p_mode not in ('year', 'months') then
    raise exception 'mode invalido: use year ou months';
  end if;

  if p_year is null or p_year < 2000 or p_year > 2100 then
    raise exception 'year fora do intervalo permitido (2000-2100)';
  end if;

  if p_mode = 'months' then
    if p_months is null or array_length(p_months, 1) is null then
      raise exception 'months e obrigatorio quando mode = months';
    end if;

    if exists (
      select 1
      from unnest(p_months) as m
      where m is null or m < 1 or m > 12
    ) then
      raise exception 'months contem valores fora do intervalo permitido (1-12)';
    end if;

    select array_agg(distinct m order by m)
    into v_months
    from unnest(p_months) as m;

    if v_months is null or array_length(v_months, 1) = 0 then
      raise exception 'months nao pode ser vazio';
    end if;
  else
    v_months := null;
  end if;

  -- =======================================================================
  -- Calculo do intervalo de datas (UTC, mesma convencao ja usada antes)
  -- =======================================================================
  if p_mode = 'year' then
    v_start := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC');
    v_end := make_timestamptz(p_year + 1, 1, 1, 0, 0, 0, 'UTC');
  end if;

  -- =======================================================================
  -- Selecao dos leads do usuario dentro do periodo (por created_at)
  -- =======================================================================
  select coalesce(array_agg(id), array[]::uuid[])
  into v_lead_ids
  from public.leads
  where user_id = p_target_user_id
    and (
      (p_mode = 'year' and created_at >= v_start and created_at < v_end)
      or (
        p_mode = 'months'
        and extract(year from created_at at time zone 'UTC') = p_year
        and extract(month from created_at at time zone 'UTC')::int = any (v_months)
      )
    );

  -- =======================================================================
  -- Exclusao: historico_leads -> leads -> metas, nesta ordem
  -- =======================================================================
  delete from public.historico_leads
  where user_id = p_target_user_id
    and lead_id = any (v_lead_ids);
  get diagnostics v_historico_count = row_count;

  delete from public.leads
  where user_id = p_target_user_id
    and id = any (v_lead_ids);
  get diagnostics v_leads_count = row_count;

  if p_mode = 'year' then
    delete from public.metas
    where user_id = p_target_user_id
      and ano = p_year;
  else
    delete from public.metas
    where user_id = p_target_user_id
      and ano = p_year
      and mes = any (v_months);
  end if;
  get diagnostics v_metas_count = row_count;

  -- metas_anuais, notificacoes, profiles e auth.users nunca sao tocados
  -- por esta funcao.

  return query
    select v_leads_count, v_historico_count, v_metas_count;
end;
$$;

comment on function public.reiniciar_dados_operacionais(uuid, text, integer, integer[]) is
  'Reinicia dados operacionais (leads, historico_leads, metas) de um usuario '
  'em um periodo (ano inteiro ou meses especificos), de forma atomica. '
  'Preserva metas_anuais, notificacoes, profiles e auth.users. '
  'Uso restrito a service_role - a Edge Function reset-user-operational-data '
  'ja valida que o chamador e admin ativo antes de invocar esta funcao.';

-- =========================================================================
-- Restricao de execucao: somente service_role
-- =========================================================================
revoke all on function public.reiniciar_dados_operacionais(uuid, text, integer, integer[])
  from public;

grant execute on function public.reiniciar_dados_operacionais(uuid, text, integer, integer[])
  to service_role;

