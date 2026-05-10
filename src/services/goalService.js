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
    meta_financeira: normalizeDecimalValue(metas.meta_financeira),
    resultado_referencia: normalizeDecimalValue(metas.resultado_referencia),
    fechamentos_referencia: normalizeGoalValue(metas.fechamentos_referencia),
    ticket_medio_referencia: normalizeDecimalValue(metas.ticket_medio_referencia),
    dias_uteis: normalizeGoalValue(metas.dias_uteis),
    taxa_suspect_prospect: normalizeDecimalValue(metas.taxa_suspect_prospect),
    taxa_prospect_demo: normalizeDecimalValue(metas.taxa_prospect_demo),
    taxa_demo_negociacao: normalizeDecimalValue(metas.taxa_demo_negociacao),
    taxa_negociacao_fechamento: normalizeDecimalValue(metas.taxa_negociacao_fechamento),
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

export async function getAnnualGoal(userId, ano) {
  const { data, error } = await supabase
    .from('metas_anuais')
    .select('*')
    .eq('user_id', userId)
    .eq('ano', Number(ano))
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function upsertAnnualGoal(userId, annualGoalOrYear, maybeAnnualGoal) {
  const annualGoal = maybeAnnualGoal ?? annualGoalOrYear
  const ano = maybeAnnualGoal ? annualGoalOrYear : annualGoal.ano
  const payload = {
    user_id: userId,
    ano: Number(ano),
    meta_financeira_padrao: normalizeDecimalValue(annualGoal.meta_financeira_padrao),
    vigente_ate: annualGoal.vigente_ate || null,
    observacao: annualGoal.observacao || null,
  }

  const { data, error } = await supabase
    .from('metas_anuais')
    .upsert(payload, { onConflict: 'user_id,ano' })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteAnnualGoal(userId, ano) {
  const { error } = await supabase
    .from('metas_anuais')
    .delete()
    .eq('user_id', userId)
    .eq('ano', Number(ano))

  if (error) {
    throw error
  }
}

function normalizeGoalValue(value) {
  const numericValue = parseLocalizedNumber(value)

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }

  return Math.trunc(numericValue)
}

function normalizeDecimalValue(value) {
  const numericValue = parseLocalizedNumber(value)

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }

  return numericValue
}

function parseLocalizedNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  const cleanValue = String(value ?? '')
    .trim()
    .replace(/[^\d,.-]/g, '')
  const normalizedValue = cleanValue.includes(',')
    ? cleanValue.replace(/\./g, '').replace(',', '.')
    : cleanValue

  return Number(normalizedValue)
}
