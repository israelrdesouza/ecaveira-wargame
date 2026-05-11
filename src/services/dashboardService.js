import { supabase } from '../lib/supabase'

const stageMetrics = [
  {
    key: 'suspects',
    label: 'Suspects',
    goalField: 'meta_suspect',
    dateField: 'data_suspect',
  },
  {
    key: 'prospects',
    label: 'Prospects',
    goalField: 'meta_prospect',
    dateField: 'data_prospect',
  },
  {
    key: 'demos',
    label: 'Demos',
    goalField: 'meta_demo',
    dateField: 'data_demo',
  },
  {
    key: 'negociacoes',
    label: 'Negociações',
    goalField: 'meta_negociacao',
    dateField: 'data_negociacao',
  },
  {
    key: 'fechamentos',
    label: 'Fechamentos',
    goalField: 'meta_fechamento',
    dateField: 'data_fechamento',
  },
]

const inactiveStages = new Set(['fechado', 'perdido'])
const revenueStages = new Set(['negociacao', 'demo', 'prospect'])
const periodDateFields = [
  'data_suspect',
  'data_prospect',
  'data_demo',
  'data_negociacao',
  'data_fechamento',
]

export async function getDashboardData(userId, mes, ano) {
  const numericMonth = Number(mes)
  const numericYear = Number(ano)

  const [{ data: goal, error: goalError }, { data: leads, error: leadsError }] =
    await Promise.all([
      supabase
        .from('metas')
        .select('*')
        .eq('user_id', userId)
        .eq('mes', numericMonth)
        .eq('ano', numericYear)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('*')
        .eq('user_id', userId),
    ])

  if (goalError) {
    throw goalError
  }

  if (leadsError) {
    throw leadsError
  }

  const safeLeads = leads ?? []
  const stageResults = stageMetrics.map((metric) => {
    const realizado = countByDateInMonth(
      safeLeads,
      metric.dateField,
      numericMonth,
      numericYear,
    )
    const meta = Number(goal?.[metric.goalField] ?? 0)
    const faltante = Math.max(meta - realizado, 0)
    const percentual = meta > 0 ? Math.round((realizado / meta) * 100) : 0

    return {
      ...metric,
      realizado,
      meta,
      faltante,
      percentual,
    }
  })

  const today = getTodayISODate()
  const activeLeads = safeLeads.filter((lead) => !inactiveStages.has(lead.etapa_atual))
  const periodLeads = safeLeads.filter((lead) =>
    hasAnyDateInMonth(lead, numericMonth, numericYear),
  )
  const activePeriodLeads = periodLeads.filter(
    (lead) => !inactiveStages.has(lead.etapa_atual),
  )
  const overdueFollowUps = activeLeads.filter(
    (lead) =>
      lead.proximo_contato &&
      lead.proximo_contato < today &&
      isDateInMonth(lead.proximo_contato, numericMonth, numericYear),
  )
  const caveiraLeads = activePeriodLeads.filter((lead) => lead.temperatura === 'caveira')
  const todayMissionLeads = activeLeads.filter(
    (lead) =>
      lead.proximo_contato === today &&
      isDateInMonth(lead.proximo_contato, numericMonth, numericYear),
  )
  const revenueInPlay = periodLeads
    .filter((lead) => revenueStages.has(lead.etapa_atual))
    .reduce((total, lead) => total + Number(lead.valor_estimado || 0), 0)

  return {
    goal,
    leads: safeLeads,
    stages: stageResults,
    auxiliary: {
      overdueFollowUps: overdueFollowUps.length,
      caveiraLeads: caveiraLeads.length,
      todayMission: todayMissionLeads.length,
      revenueInPlay,
      operationalRisk: overdueFollowUps.length,
    },
    lists: {
      overdueFollowUps,
      caveiraLeads,
      todayMissionLeads,
      priorityTargets: getPriorityTargets(periodLeads),
    },
  }
}

function countByDateInMonth(leads, field, month, year) {
  return leads.filter((lead) => isDateInMonth(lead[field], month, year)).length
}

function isDateInMonth(value, month, year) {
  if (!value) {
    return false
  }

  const [dateYear, dateMonth] = String(value).slice(0, 10).split('-').map(Number)

  return dateYear === year && dateMonth === month
}

function hasAnyDateInMonth(lead, month, year) {
  return periodDateFields.some((field) => isDateInMonth(lead[field], month, year))
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function getPriorityTargets(leads) {
  return leads
    .filter((lead) => !inactiveStages.has(lead.etapa_atual))
    .sort((first, second) => {
      const firstValue = Number(first.valor_estimado || 0)
      const secondValue = Number(second.valor_estimado || 0)
      return secondValue - firstValue
    })
    .slice(0, 3)
}
