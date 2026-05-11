import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const allowedProfiles = new Set(['admin', 'operador'])
const inviteRedirectTo = 'https://ecaveira-cockpit.vercel.app/reset-password'

type CreateUserPayload = {
  nome?: string
  email?: string
  cargo?: string
  perfil?: 'admin' | 'operador'
  ativo?: boolean
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
      { success: false, message: 'Apenas administradores ativos podem criar usuários.' },
      403,
    )
  }

  let payload: CreateUserPayload

  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, message: 'Payload inválido.' }, 400)
  }

  if (typeof payload.ativo !== 'boolean') {
    return jsonResponse(
      { success: false, message: 'Status ativo deve ser verdadeiro ou falso.' },
      400,
    )
  }

  const normalizedPayload = {
    nome: normalizeText(payload.nome),
    email: normalizeEmail(payload.email),
    cargo: normalizeText(payload.cargo) || null,
    perfil: payload.perfil,
    ativo: payload.ativo,
  }

  const validationError = validatePayload(normalizedPayload)

  if (validationError) {
    return jsonResponse({ success: false, message: validationError }, 400)
  }

  const emailAlreadyExists =
    (await profileEmailExists(adminClient, normalizedPayload.email)) ||
    (await authEmailExists(adminClient, normalizedPayload.email))

  if (emailAlreadyExists) {
    return jsonResponse({ success: false, message: 'E-mail já cadastrado.' }, 409)
  }

  const { data: invitedUserData, error: inviteUserError } =
    await adminClient.auth.admin.inviteUserByEmail(normalizedPayload.email, {
      data: {
        nome: normalizedPayload.nome,
        cargo: normalizedPayload.cargo,
        perfil: normalizedPayload.perfil,
      },
      redirectTo: inviteRedirectTo,
    })

  if (inviteUserError || !invitedUserData.user) {
    return jsonResponse(
      {
        success: false,
        message: normalizeInviteUserError(inviteUserError?.message),
      },
      inviteUserError?.message?.toLowerCase().includes('already') ? 409 : 500,
    )
  }

  const now = new Date().toISOString()

  const { error: profileError } = await adminClient.from('profiles').upsert(
    {
      id: invitedUserData.user.id,
      nome: normalizedPayload.nome,
      email: normalizedPayload.email,
      cargo: normalizedPayload.cargo,
      perfil: normalizedPayload.perfil,
      ativo: normalizedPayload.ativo,
      convite_status: 'pendente',
      convite_enviado_em: now,
      convite_aceito_em: null,
      convite_total_envios: 1,
      updated_at: now,
    },
    { onConflict: 'id' },
  )

  if (profileError) {
    return jsonResponse(
      {
        success: false,
        message:
          'Convite enviado, mas não foi possível atualizar o perfil. Verifique a tabela profiles.',
      },
      500,
    )
  }

  return jsonResponse(
    {
      success: true,
      message: 'Convite enviado com sucesso para o usuário.',
      user: {
        id: invitedUserData.user.id,
        email: normalizedPayload.email,
        nome: normalizedPayload.nome,
        cargo: normalizedPayload.cargo,
        perfil: normalizedPayload.perfil,
        ativo: normalizedPayload.ativo,
      },
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

function validatePayload(payload: {
  nome: string
  email: string
  perfil?: 'admin' | 'operador'
  ativo?: boolean
}) {
  if (!payload.nome) {
    return 'Nome é obrigatório.'
  }

  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return 'Informe um e-mail válido.'
  }

  if (!payload.perfil || !allowedProfiles.has(payload.perfil)) {
    return 'Perfil é obrigatório.'
  }

  if (typeof payload.ativo !== 'boolean') {
    return 'Status ativo deve ser verdadeiro ou falso.'
  }

  return ''
}

async function profileEmailExists(adminClient: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    return false
  }

  return Boolean(data)
}

async function authEmailExists(adminClient: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (error) {
    return false
  }

  return data.users.some((user) => user.email?.toLowerCase() === email)
}

function normalizeText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function normalizeEmail(value?: string | null) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeInviteUserError(message = '') {
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('already') ||
    normalizedMessage.includes('registered') ||
    normalizedMessage.includes('exists')
  ) {
    return 'E-mail já cadastrado.'
  }

  if (normalizedMessage.includes('rate limit')) {
    return 'Limite de envio de convites atingido. Aguarde alguns minutos e tente novamente.'
  }

  return 'Não foi possível enviar o convite.'
}