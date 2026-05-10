import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type DeleteUserPayload = {
  user_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonResponse({ success: true }, 200)
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Método não permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse(
      {
        success: false,
        message: 'Função não configurada. Verifique as variáveis de ambiente.',
      },
      500,
    )
  }

  const authorization = req.headers.get('Authorization') ?? ''

  if (!authorization.startsWith('Bearer ')) {
    return jsonResponse({ success: false, message: 'Usuário não autenticado.' }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser()

  if (callerError || !caller) {
    return jsonResponse({ success: false, message: 'Usuário não autenticado.' }, 401)
  }

  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('profiles')
    .select('id, perfil, ativo')
    .eq('id', caller.id)
    .maybeSingle()

  if (callerProfileError || !callerProfile) {
    return jsonResponse(
      { success: false, message: 'Perfil do usuário autenticado não encontrado.' },
      403,
    )
  }

  if (callerProfile.perfil !== 'admin' || callerProfile.ativo !== true) {
    return jsonResponse(
      { success: false, message: 'Apenas administradores ativos podem excluir usuários.' },
      403,
    )
  }

  let payload: DeleteUserPayload

  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, message: 'Payload inválido.' }, 400)
  }

  const targetUserId = payload.user_id?.trim()

  if (!targetUserId) {
    return jsonResponse({ success: false, message: 'Usuário inválido.' }, 400)
  }

  if (targetUserId === caller.id) {
    return jsonResponse(
      { success: false, message: 'Você não pode excluir seu próprio acesso.' },
      400,
    )
  }

  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetUserId)

  if (deleteAuthError) {
    return jsonResponse(
      { success: false, message: 'Não foi possível excluir o usuário.' },
      500,
    )
  }

  const { error: deleteProfileError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', targetUserId)

  if (deleteProfileError) {
    return jsonResponse(
      { success: false, message: 'Usuário removido do Auth, mas o perfil não foi removido.' },
      500,
    )
  }

  return jsonResponse({ success: true, message: 'Usuário excluído com sucesso.' }, 200)
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
