grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.profiles,
         public.leads,
         public.historico_leads,
         public.metas,
         public.metas_anuais,
         public.notificacoes
to authenticated;
