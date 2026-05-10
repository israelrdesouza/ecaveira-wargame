import { supabase } from '../lib/supabase'

export async function getGoalByMonth(userId, mes, ano) {
  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .eq('user_id', userId)
    .eq('mes', Number(mes))
    .eq('ano', Number(ano))
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function upsertGoal(userId, mes, ano, metas) {
  const payload = {
    user_id: userId,
    mes: Number(mes),
    ano: Number(ano),
    meta_suspect: normalizeGoalValue(metas.meta_suspect),
    meta_prospect: normalizeGoalValue(metas.meta_prospect),
    meta_demo: normalizeGoalValue(metas.meta_demo),
    meta_negociacao: normalizeGoalValue(metas.meta_negociacao),
    meta_fechamento: normalizeGoalValue(metas.meta_fechamento),
  }

  const { data, error } = await supabase
    .from('metas')
    .upsert(payload, { onConflict: 'user_id,mes,ano' })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

function normalizeGoalValue(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }

  return Math.trunc(numericValue)
}
