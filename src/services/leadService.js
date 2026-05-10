import { supabase } from '../lib/supabase'

const stageDateFields = {
  prospect: 'data_prospect',
  demo: 'data_demo',
  negociacao: 'data_negociacao',
  fechado: 'data_fechamento',
  perdido: 'data_perdido',
  congelado: 'data_congelado',
}

const stageLabels = {
  suspect: 'Suspect',
  prospect: 'Prospect',
  demo: 'Demo',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
  congelado: 'Congelado',
}

const standardFunnel = ['suspect', 'prospect', 'demo', 'negociacao', 'fechado']

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeTemperature(value) {
  return String(value || 'morno').trim().toLowerCase()
}

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function sanitizeCommercialText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('pt-BR')
}

function normalizeOptionalText(value) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function normalizeDateOnly(value) {
  if (!value) {
    return null
  }

  return String(value).slice(0, 10)
}

function parseEstimatedValue(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const normalized = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const numericValue = Number(normalized)

  return Number.isFinite(numericValue) ? numericValue : null
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error('Usuário não autenticado.')
  }

  return data.user.id
}

function resolveProduct(form) {
  return form.product === 'Outro'
    ? sanitizeCommercialText(form.productOther)
    : normalizeOptionalText(form.product)
}

function resolveSource(form) {
  return form.source === 'Outro'
    ? sanitizeCommercialText(form.sourceOther)
    : normalizeOptionalText(form.source)
}

function mapFormToLeadPayload(form, userId) {
  const now = new Date().toISOString()
  const empresa = sanitizeCommercialText(form.name)
  const contato = sanitizeCommercialText(form.contact)
  const celular = onlyDigits(form.phone)
  const produto = resolveProduct(form)
  const origem = resolveSource(form)
  const temperatura = normalizeTemperature(form.temperature)

  if (!empresa || !contato || !celular || !produto || !origem || !temperatura) {
    throw new Error('Preencha os campos obrigatórios antes de salvar.')
  }

  return {
    user_id: userId,
    empresa,
    contato,
    celular,
    email: normalizeOptionalText(form.email),
    produto,
    origem,
    temperatura,
    proximo_contato: normalizeDateOnly(form.nextContact),
    proxima_acao: normalizeOptionalText(form.nextAction),
    observacao: normalizeOptionalText(form.note),
    link_ploomes: normalizeOptionalText(form.crmLink),
    valor_estimado: parseEstimatedValue(form.estimatedValue),
    etapa_atual: 'suspect',
    data_suspect: getTodayISODate(),
    ultima_acao: 'Lead cadastrado',
    ultima_acao_em: now,
  }
}

function mapEditFormToLeadPayload(form) {
  const now = new Date().toISOString()
  const empresa = sanitizeCommercialText(form.empresa)
  const contato = sanitizeCommercialText(form.contato)
  const celular = onlyDigits(form.celular)
  const produto = resolveProduct({
    product: form.produto,
    productOther: form.produto_outro,
  })
  const origem = resolveSource({
    source: form.origem,
    sourceOther: form.origem_outro,
  })
  const temperatura = normalizeTemperature(form.temperatura)

  if (!empresa || !contato || !celular || !produto || !origem || !temperatura) {
    throw new Error('Preencha os campos obrigatórios antes de salvar.')
  }

  return {
    empresa,
    contato,
    celular,
    email: normalizeOptionalText(form.email),
    produto,
    origem,
    temperatura,
    proximo_contato: normalizeDateOnly(form.proximo_contato),
    proxima_acao: normalizeOptionalText(form.proxima_acao),
    observacao: normalizeOptionalText(form.observacao),
    link_ploomes: normalizeOptionalText(form.link_ploomes),
    valor_estimado: parseEstimatedValue(form.valor_estimado),
    ultima_acao: 'Lead editado',
    ultima_acao_em: now,
  }
}

export async function createLead(form) {
  const userId = await getCurrentUserId()
  const payload = mapFormToLeadPayload(form, userId)

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert(payload)
    .select('*')
    .single()

  if (leadError) {
    throw leadError
  }

  const { error: historyError } = await supabase.from('historico_leads').insert({
    user_id: userId,
    lead_id: lead.id,
    tipo: 'criacao',
    descricao: 'Lead cadastrado como Suspect',
    etapa_destino: 'suspect',
  })

  if (historyError) {
    throw historyError
  }

  return lead
}

export async function getLeads() {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function updateLead(lead, form, userId) {
  const resolvedUserId = userId || (await getCurrentUserId())
  const payload = mapEditFormToLeadPayload(form)

  const { data: updatedLead, error: updateError } = await supabase
    .from('leads')
    .update(payload)
    .eq('id', lead.id)
    .eq('user_id', resolvedUserId)
    .select('*')
    .single()

  if (updateError) {
    throw updateError
  }

  const { error: historyError } = await supabase.from('historico_leads').insert({
    user_id: resolvedUserId,
    lead_id: lead.id,
    tipo: 'edicao',
    descricao: 'Dados do lead atualizados',
  })

  if (historyError) {
    throw historyError
  }

  return updatedLead
}

export async function moveLeadStage(lead, novaEtapa, userId) {
  const resolvedUserId = userId || (await getCurrentUserId())
  const now = new Date().toISOString()
  const etapaOrigem = normalizeStage(lead.etapa_atual || 'suspect')
  const etapaDestino = normalizeStage(novaEtapa)
  const dateField = stageDateFields[etapaDestino]
  const updates = {
    etapa_atual: etapaDestino,
    ultima_acao: `Movido para ${stageLabels[etapaDestino]}`,
    ultima_acao_em: now,
  }

  if (dateField) {
    updates[dateField] = getTodayISODate()
  }

  const { data: updatedLead, error: updateError } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', lead.id)
    .eq('user_id', resolvedUserId)
    .select('*')
    .single()

  if (updateError) {
    throw updateError
  }

  const { error: historyError } = await supabase.from('historico_leads').insert({
    user_id: resolvedUserId,
    lead_id: lead.id,
    tipo: 'movimentacao',
    descricao: getStageMovementDescription(etapaOrigem, etapaDestino),
    etapa_origem: etapaOrigem,
    etapa_destino: etapaDestino,
  })

  if (historyError) {
    throw historyError
  }

  return updatedLead
}

function normalizeStage(stage) {
  return String(stage || 'suspect')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getStageMovementDescription(etapaOrigem, etapaDestino) {
  const origemLabel = stageLabels[etapaOrigem] ?? etapaOrigem
  const destinoLabel = stageLabels[etapaDestino] ?? etapaDestino
  const skippedStages = getSkippedStages(etapaOrigem, etapaDestino)
  const baseDescription = `Lead movido de ${origemLabel} para ${destinoLabel}.`

  if (skippedStages.length === 0) {
    return baseDescription
  }

  const skippedLabels = skippedStages.map((stage) => stageLabels[stage] ?? stage)
  const skippedText =
    skippedLabels.length === 1
      ? `etapa pulada: ${skippedLabels[0]}.`
      : `etapas puladas: ${skippedLabels.join(', ')}.`

  return `${baseDescription} Atenção: ${skippedText}`
}

function getSkippedStages(etapaOrigem, etapaDestino) {
  const origemIndex = standardFunnel.indexOf(etapaOrigem)
  const destinoIndex = standardFunnel.indexOf(etapaDestino)

  if (origemIndex === -1 || destinoIndex === -1 || destinoIndex <= origemIndex + 1) {
    return []
  }

  return standardFunnel.slice(origemIndex + 1, destinoIndex)
}
