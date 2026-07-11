# Reconstrucao do banco - eCaveira WarGame

Projeto novo: `lymkdrqboitvrozsgwbf` (`https://lymkdrqboitvrozsgwbf.supabase.co`)

Este diretorio contem as migrations versionadas para reconstruir o schema
apagado. Nada aqui foi aplicado ainda - e apenas o SQL revisado, pronto para
ser rodado manualmente quando autorizado.

## Ordem de reconstrucao recomendada

1. **Revisar** `20260708120000_initial_schema.sql` com o arquiteto do projeto
   (tabelas, checks, RLS) antes de aplicar em qualquer ambiente.
2. **Aplicar a migration** no projeto novo (`lymkdrqboitvrozsgwbf`) via
   Supabase CLI (`supabase db push` ou `supabase migration up`) ou colando o
   SQL no editor do painel - o que for combinado.
3. **Reconfigurar variaveis de ambiente** (fora deste repositorio):
   - Frontend (`.env.local` e Vercel): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Edge Functions (Supabase): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`
4. **Deploy das Edge Functions existentes** (`supabase/functions/*`) sem
   alterar o codigo delas - elas usam `service_role`, que ignora RLS.
5. **Criar o primeiro usuario admin manualmente**, pois nao ha trigger
   automatico de criacao de profile a partir de `auth.users` (por decisao de
   negocio, o profile so e criado pelas Edge Functions). Sem esse primeiro
   admin, ninguem consegue convidar outros usuarios:
   - Criar o usuario no Auth (painel ou `auth.admin.createUser`).
   - Inserir manualmente a linha em `profiles` com `perfil = 'admin'`,
     `ativo = true`, `convite_status = 'aceito'`.
6. **Confirmar o dominio de redirect** usado nas Edge Functions
   (`https://ecaveira-cockpit.vercel.app/reset-password`, hardcoded em
   `create-user` e `resend-user-invite`) - se o dominio mudou, isso exige
   alteracao de codigo, fora do escopo desta etapa.
7. **Testar o fluxo ponta a ponta** antes de considerar concluido: login,
   criar usuario via Admin, aceitar convite, criar lead, mover etapa, salvar
   metas, notificacao de convite aceito.

## Observacoes importantes

- Os dados antigos (leads, metas, usuarios reais) **nao sao recuperaveis** -
  esta migration recria apenas a estrutura, nao os registros.
- `notificacoes.select` esta restrito a admins ativos, espelhando o
  comportamento atual do frontend (`Sidebar.jsx` so busca notificacoes
  quando `isAdmin`). Se o comportamento pretendido for diferente, avisar
  antes de aplicar.
