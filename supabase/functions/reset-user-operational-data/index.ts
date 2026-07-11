import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type ResetMode = 'year' | 'months'

type ResetPayload = {
  user_id?: string
  year?: number
  mode?: ResetMode
  months?: number[]
}

type ResetRpcResult = {
  leads_apagados: number
  historico_apagado: number
  metas_apagadas: number
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
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY')

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
    console.error('reset-user-operational-data caller profile lookup failed', {
      callerId: caller.id,
      code: callerProfileError?.code,
      message: callerProfileError?.message,
      profileFound: Boolean(callerProfile),
    })
    return jsonResponse(
      { success: false, message: 'Perfil do usuário autenticado não encontrado.' },
      403,
    )
  }

  if (callerProfile.perfil !== 'admin' || callerProfile.ativo !== true) {
    return jsonResponse(
      {
        success: false,
        message: 'Apenas administradores ativos podem reiniciar dados operacionais.',
      },
      403,
    )
  }

  let payload: ResetPayload

  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, message: 'Payload inválido.' }, 400)
  }

  const validation = validatePayload(payload)

  if (validation) {
    return jsonResponse({ success: false, message: validation }, 400)
  }

  const targetUserId = String(payload.user_id).trim()
  const year = Number(payload.year)
  const mode = payload.mode as ResetMode
  const months = mode === 'months' ? normalizeMonths(payload.months) : null

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', targetUserId)
    .maybeSingle()

  if (targetProfileError || !targetProfile) {
    return jsonResponse({ success: false, message: 'Usuário selecionado não encontrado.' }, 404)
  }

  const { data: rpcData, error: rpcError } = await adminClient
    .rpc('reiniciar_dados_operacionais', {
      p_target_user_id: targetUserId,
      p_mode: mode,
      p_year: year,
      p_months: months,
    })
    .maybeSingle<ResetRpcResult>()

  if (rpcError || !rpcData) {
    console.error('reset-user-operational-data reiniciar_dados_operacionais rpc failed', {
      targetUserId,
      mode,
      year,
      code: rpcError?.code,
      message: rpcError?.message,
    })
    return jsonResponse(
      { success: false, message: 'Não foi possível reiniciar os dados operacionais.' },
      500,
    )
  }

  return jsonResponse(
    {
      success: true,
      message: 'Dados operacionais reiniciados com sucesso.',
      deleted: {
        historico_leads: rpcData.historico_apagado,
        leads: rpcData.leads_apagados,
        metas: rpcData.metas_apagadas,
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

function validatePayload(payload: ResetPayload) {
  if (!payload.user_id || !String(payload.user_id).trim()) {
    return 'Usuário é obrigatório.'
  }

  if (!Number.isInteger(Number(payload.year)) || Number(payload.year) < 2000 || Number(payload.year) > 2100) {
    return 'Ano inválido.'
  }

  if (payload.mode !== 'year' && payload.mode !== 'months') {
    return 'Modo de período inválido.'
  }

  if (payload.mode === 'months') {
    if (!Array.isArray(payload.months)) {
      return 'Meses inválidos.'
    }

    const hasInvalidMonth = payload.months.some(
      (month) => !Number.isInteger(Number(month)) || Number(month) < 1 || Number(month) > 12,
    )

    if (hasInvalidMonth) {
      return 'Meses inválidos.'
    }

    const months = normalizeMonths(payload.months)

    if (months.length === 0) {
      return 'Selecione pelo menos um mês.'
    }
  }

  return ''
}

function normalizeMonths(months?: number[]) {
  return [...new Set(months ?? [])]
    .map(Number)
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
    .sort((first, second) => first - second)
}
