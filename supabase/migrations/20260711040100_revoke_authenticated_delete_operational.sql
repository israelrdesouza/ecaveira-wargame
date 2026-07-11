-- Revoga o privilegio de DELETE concedido anteriormente a authenticated em
-- leads, historico_leads e metas (migration 20260711025316).
--
-- Motivo: essas tres tabelas so devem ser apagadas pela funcao
-- public.reiniciar_dados_operacionais (executada por service_role) ou pela
-- Edge Function reset-user-operational-data. Nenhuma tela do frontend
-- apaga essas linhas diretamente pelo client, e nao existe policy de RLS
-- de DELETE para authenticated nessas tabelas - ou seja, o GRANT de DELETE
-- ja era neutralizado pela ausencia de policy, mas mante-lo era um
-- privilegio de tabela mais amplo do que o necessario (violacao do
-- principio de menor privilegio).
--
-- SELECT, INSERT e UPDATE de authenticated NAO sao alterados - continuam
-- exatamente como estavam, preservando leadService.js, goalService.js e
-- demais fluxos legitimos do operador.
--
-- profiles, metas_anuais e notificacoes NAO fazem parte desta migration:
-- metas_anuais ja tem uma policy de DELETE propria (usada por
-- deleteAnnualGoal) e deve continuar podendo ser apagada pelo dono; a
-- revisao de profiles/notificacoes fica fora do escopo desta correcao.
revoke delete on public.leads from authenticated;
revoke delete on public.historico_leads from authenticated;
revoke delete on public.metas from authenticated;

