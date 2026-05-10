import { supabase } from '../lib/supabase'

export async function getReportData(userId, filters = {}) {
  if (!userId) {
    throw new Error('Usuário não autenticado.')
  }

  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters.dataInicial) {
    query = query.gte('created_at', getStartOfDayISOString(filters.dataInicial))
  }

  if (filters.dataFinal) {
    query = query.lte('created_at', getEndOfDayISOString(filters.dataFinal))
  }

  if (filters.etapa) {
    query = query.eq('etapa_atual', filters.etapa)
  }

  if (filters.produto) {
    query = query.eq('produto', filters.produto)
  }

  if (filters.origem) {
    query = query.eq('origem', filters.origem)
  }

  if (filters.temperatura) {
    query = query.eq('temperatura', filters.temperatura)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data ?? []
}

function getStartOfDayISOString(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
}

function getEndOfDayISOString(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()
}
