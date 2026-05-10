import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const allowedProfiles = new Set(['admin', 'operador'])

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

  const normalizedPayload = {
    nome: normalizeText(payload.nome),
    email: normalizeEmail(payload.email),
    cargo: normalizeText(payload.cargo) || null,
    perfil: payload.perfil,
    ativo: payload.ativo !== false,
  }

  const validationError = validatePayload(normalizedPayload)

  if (validationError) {
    return jsonResponse({ success: false, message: validationError }, 400)
  }

  const emailAlreadyExists = await authEmailExists(adminClient, normalizedPayload.email)

  if (emailAlreadyExists) {
    return jsonResponse({ success: false, message: 'E-mail já cadastrado.' }, 409)
  }

  const temporaryPassword = generateTemporaryPassword()

  const { data: createdUserData, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email: normalizedPayload.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        nome: normalizedPayload.nome,
        cargo: normalizedPayload.cargo,
        perfil: normalizedPayload.perfil,
        primeiro_acesso: true,
      },
    })

  if (createUserError || !createdUserData.user) {
    return jsonResponse(
      {
        success: false,
        message: normalizeCreateUserError(createUserError?.message),
      },
      createUserError?.message?.toLowerCase().includes('already') ? 409 : 500,
    )
  }

  const { error: profileError } = await adminClient.from('profiles').upsert(
    {
      id: createdUserData.user.id,
      nome: normalizedPayload.nome,
      email: normalizedPayload.email,
      cargo: normalizedPayload.cargo,
      perfil: normalizedPayload.perfil,
      ativo: normalizedPayload.ativo,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (profileError) {
    return jsonResponse(
      {
        success: false,
        message:
          'Usuário criado no Auth, mas não foi possível atualizar o perfil. Verifique a tabela profiles.',
      },
      500,
    )
  }

  return jsonResponse(
    {
      success: true,
      message: 'Usuário criado com sucesso.',
      temporaryPassword,
      user: {
        id: createdUserData.user.id,
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

  return ''
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

function normalizeText(value?: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

function normalizeEmail(value?: string) {
  return String(value ?? '').trim().toLowerCase()
}

function generateTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%&*?'
  const all = `${upper}${lower}${numbers}${symbols}`

  const required = [
    pickRandom(upper),
    pickRandom(lower),
    pickRandom(numbers),
    pickRandom(symbols),
  ]

  const remaining = Array.from({ length: 12 }, () => pickRandom(all))

  return shuffle([...required, ...remaining]).join('')
}

function pickRandom(source: string) {
  const random = new Uint32Array(1)
  crypto.getRandomValues(random)
  return source[random[0] % source.length]
}

function shuffle(values: string[]) {
  const copy = [...values]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const random = new Uint32Array(1)
    crypto.getRandomValues(random)

    const swapIndex = random[0] % (index + 1)
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }

  return copy
}

function normalizeCreateUserError(message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? ''

  if (
    normalizedMessage.includes('already') ||
    normalizedMessage.includes('registered') ||
    normalizedMessage.includes('exists')
  ) {
    return 'E-mail já cadastrado.'
  }

  if (normalizedMessage.includes('password')) {
    return 'Não foi possível criar a senha provisória do usuário.'
  }

  return 'Erro ao criar usuário.'
}
