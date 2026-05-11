import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const inviteRedirectTo = 'https://ecaveira-cockpit.vercel.app/reset-password'

type ResendInvitePayload = {
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
      { success: false, message: 'Apenas administradores ativos podem reenviar convites.' },
      403,
    )
  }

  let payload: ResendInvitePayload

  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, message: 'Payload inválido.' }, 400)
  }

  if (!payload.user_id) {
    return jsonResponse({ success: false, message: 'Usuário inválido.' }, 400)
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select(
      'id, nome, email, cargo, perfil, convite_status, convite_aceito_em, convite_total_envios',
    )
    .eq('id', payload.user_id)
    .maybeSingle()

  if (targetProfileError || !targetProfile) {
    return jsonResponse({ success: false, message: 'Usuário não encontrado.' }, 404)
  }

  if (!targetProfile.email) {
    return jsonResponse({ success: false, message: 'Usuário sem e-mail cadastrado.' }, 400)
  }

  if (targetProfile.convite_status === 'aceito' || targetProfile.convite_aceito_em) {
    return jsonResponse(
      { success: false, message: 'Convite já aceito por este usuário.' },
      400,
    )
  }

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    targetProfile.email,
    {
      data: {
        nome: targetProfile.nome,
        cargo: targetProfile.cargo,
        perfil: targetProfile.perfil,
      },
      redirectTo: inviteRedirectTo,
    },
  )

  if (inviteError) {
    return jsonResponse(
      { success: false, message: normalizeInviteError(inviteError.message) },
      inviteError.message?.toLowerCase().includes('already') ? 409 : 500,
    )
  }

  const now = new Date().toISOString()
  const totalInvites = Number(targetProfile.convite_total_envios ?? 0) + 1
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      convite_status: 'pendente',
      convite_enviado_em: now,
      convite_aceito_em: null,
      convite_total_envios: totalInvites,
      updated_at: now,
    })
    .eq('id', targetProfile.id)

  if (updateError) {
    return jsonResponse(
      {
        success: false,
        message: 'Convite reenviado, mas não foi possível atualizar o perfil.',
      },
      500,
    )
  }

  return jsonResponse(
    {
      success: true,
      message: 'Convite reenviado com sucesso.',
    },
    200,
  )
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

function normalizeInviteError(message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? ''

  if (
    normalizedMessage.includes('already') ||
    normalizedMessage.includes('registered') ||
    normalizedMessage.includes('exists')
  ) {
    return 'E-mail já cadastrado.'
  }

  return 'Não foi possível reenviar o convite.'
}
