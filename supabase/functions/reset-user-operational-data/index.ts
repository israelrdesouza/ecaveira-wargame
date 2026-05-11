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

type DateRange = {
  start: string
  end: string
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
  const months = mode === 'months' ? normalizeMonths(payload.months) : []

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', targetUserId)
    .maybeSingle()

  if (targetProfileError || !targetProfile) {
    return jsonResponse({ success: false, message: 'Usuário selecionado não encontrado.' }, 404)
  }

  const ranges = mode === 'year'
    ? [getYearRange(year)]
    : months.map((month) => getMonthRange(year, month))
  let leadIds: string[]

  try {
    leadIds = await getLeadIdsForRanges(adminClient, targetUserId, ranges)
  } catch {
    return jsonResponse(
      { success: false, message: 'Não foi possível identificar os leads do período.' },
      500,
    )
  }
  let deletedHistoryCount = 0
  let deletedLeadsCount = 0

  for (const chunk of chunkArray(leadIds, 100)) {
    const { count: historyCount, error: historyError } = await adminClient
      .from('historico_leads')
      .delete({ count: 'exact' })
      .eq('user_id', targetUserId)
      .in('lead_id', chunk)

    if (historyError) {
      return jsonResponse(
        { success: false, message: 'Não foi possível apagar o histórico dos leads.' },
        500,
      )
    }

    deletedHistoryCount += historyCount ?? 0

    const { count: leadsCount, error: leadsError } = await adminClient
      .from('leads')
      .delete({ count: 'exact' })
      .eq('user_id', targetUserId)
      .in('id', chunk)

    if (leadsError) {
      return jsonResponse(
        { success: false, message: 'Não foi possível apagar os leads do período.' },
        500,
      )
    }

    deletedLeadsCount += leadsCount ?? 0
  }

  const metasDelete = adminClient
    .from('metas')
    .delete({ count: 'exact' })
    .eq('user_id', targetUserId)
    .eq('ano', year)

  const { count: metasCount, error: metasError } =
    mode === 'year'
      ? await metasDelete
      : await metasDelete.in('mes', months)

  if (metasError) {
    return jsonResponse(
      { success: false, message: 'Não foi possível apagar as metas mensais do período.' },
      500,
    )
  }

  return jsonResponse(
    {
      success: true,
      message: 'Dados operacionais reiniciados com sucesso.',
      deleted: {
        historico_leads: deletedHistoryCount,
        leads: deletedLeadsCount,
        metas: metasCount ?? 0,
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

function getYearRange(year: number): DateRange {
  return {
    start: `${year}-01-01T00:00:00.000Z`,
    end: `${year + 1}-01-01T00:00:00.000Z`,
  }
}

function getMonthRange(year: number, month: number): DateRange {
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1

  return {
    start: `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`,
    end: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`,
  }
}

async function getLeadIdsForRanges(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  ranges: DateRange[],
) {
  const ids = new Set<string>()

  for (const range of ranges) {
    const { data, error } = await adminClient
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', range.start)
      .lt('created_at', range.end)

    if (error) {
      throw error
    }

    for (const lead of data ?? []) {
      if (lead.id) {
        ids.add(lead.id)
      }
    }
  }

  return [...ids]
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}
