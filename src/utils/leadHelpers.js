// Funcoes puras de leitura/formatacao de lead, compartilhadas por
// LeadsTable.jsx, LeadMobileCard.jsx, EditLeadModal.jsx e Leads.jsx.
// Extraidas para um arquivo proprio (fora de src/components/leads/) porque
// o lint do projeto (react-refresh/only-export-components) nao permite
// misturar exports de funcao com exports de componente no mesmo arquivo.
import { formatDateBR } from './formatters'

export function getLeadCompany(lead) {
  return lead.empresa ?? lead.company ?? 'Lead sem nome'
}

export function getLeadNextContact(lead) {
  const nextContact = lead.proximo_contato ?? lead.next

  if (!nextContact) {
    return 'Sem data definida'
  }

  if (String(nextContact).includes('Hoje') || String(nextContact).includes('Amanhã')) {
    return nextContact
  }

  return formatDateBR(nextContact)
}

export function getLeadPhoneDigits(lead) {
  return onlyDigits(lead?.celular ?? lead?.phone)
}

export function getLeadPloomesLink(lead) {
  return String(
    lead?.link_ploomes ?? lead?.ploomes ?? lead?.ploomes_link ?? lead?.crm_link ?? '',
  ).trim()
}

export function getExternalUrl(value) {
  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `https://${value}`
}

export function isLeadActionTarget(target) {
  return Boolean(target?.closest?.('[data-lead-action]'))
}

// Faixa Unicode de acentos combinantes, construida via codigos de caractere
// para evitar qualquer problema de codificacao do arquivo-fonte.
export const ACCENT_PATTERN = new RegExp(
  String.fromCharCode(0x5b, 0x5c, 0x75, 0x30, 0x33, 0x30, 0x30, 0x2d, 0x5c, 0x75, 0x30, 0x33, 0x36, 0x66, 0x5d),
  'g',
)

export function normalizeStageValue(stage, stageOptions) {
  const normalized = String(stage || 'suspect')
    .normalize('NFD')
    .replace(ACCENT_PATTERN, '')
    .toLowerCase()

  return stageOptions.some((item) => item.value === normalized) ? normalized : 'suspect'
}

export function formatStage(stage, stageOptions) {
  const normalized = normalizeStageValue(stage, stageOptions)
  return stageOptions.find((item) => item.value === normalized)?.label ?? stage
}

export function normalizeTemperatureValue(temperature) {
  const normalized = String(temperature || 'morno')
    .normalize('NFD')
    .replace(ACCENT_PATTERN, '')
    .toLowerCase()

  return ['frio', 'morno', 'quente', 'caveira'].includes(normalized) ? normalized : 'morno'
}

export function formatTemperature(temperature) {
  const normalized = normalizeTemperatureValue(temperature)
  const labels = { frio: 'Frio', morno: 'Morno', quente: 'Quente', caveira: 'Caveira' }
  return labels[normalized] ?? temperature
}

export function openWhatsApp(lead, onActionNotice) {
  const phoneDigits = getLeadPhoneDigits(lead)

  if (!phoneDigits) {
    onActionNotice?.('Celular não informado para este lead.')
    return
  }

  const whatsappPhone = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`
  window.open(
    `https://web.whatsapp.com/send?phone=${whatsappPhone}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export function openPloomes(lead, onActionNotice) {
  const link = getLeadPloomesLink(lead)

  if (!link) {
    onActionNotice?.('Link do Ploomes não informado.')
    return
  }

  window.open(getExternalUrl(link), '_blank', 'noopener,noreferrer')
}

export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}
