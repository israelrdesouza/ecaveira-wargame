import { ORIGINS, PRODUCTS, STAGES, TEMPERATURES } from '../utils/constants'

export const dashboardMetrics = [
  {
    label: 'Suspects',
    value: 48,
    meta: 'de 60',
    detail: '12 novos alvos entraram no radar esta semana.',
    icon: 'Radar',
    accent: 'cyan',
    progress: 80,
  },
  {
    label: 'Prospects',
    value: 31,
    meta: 'de 45',
    detail: '18 contatos em cadência ativa e prontos para avanço.',
    icon: 'Crosshair',
    accent: 'zinc',
    progress: 69,
  },
  {
    label: 'Demos',
    value: 9,
    meta: 'de 16',
    detail: '4 agendas confirmadas nas próximas 48 horas.',
    icon: 'CalendarClock',
    accent: 'amber',
    progress: 56,
  },
  {
    label: 'Negociações',
    value: 7,
    meta: 'ativas',
    detail: 'R$ 84.500 em proposta aberta no campo.',
    icon: 'Handshake',
    accent: 'amber',
    progress: 58,
  },
  {
    label: 'Fechamentos',
    value: 3,
    meta: 'mês',
    detail: 'Meta mensal em 60%, com duas decisões pendentes.',
    icon: 'Trophy',
    accent: 'green',
    progress: 60,
  },
  {
    label: 'Follow-ups vencidos',
    value: 6,
    meta: 'hoje',
    detail: 'Prioridade máxima antes de abrir novas frentes.',
    icon: 'AlertTriangle',
    accent: 'red',
    progress: 86,
  },
  {
    label: 'Leads Caveira',
    value: 14,
    meta: 'quentes',
    detail: 'Oportunidades com urgência, fit e dor clara.',
    icon: 'Flame',
    accent: 'red',
    progress: 70,
  },
  {
    label: 'Missão do Dia',
    value: 22,
    meta: 'ações',
    detail: 'Ligações, mensagens e propostas críticas.',
    icon: 'BadgeCheck',
    accent: 'zinc',
    progress: 38,
  },
]

export const dashboardStatusCards = [
  {
    label: 'Receita em jogo',
    value: 172000,
    formatter: 'currency',
  },
  {
    label: 'Velocidade do funil',
    value: 'Boa',
  },
  {
    label: 'Risco operacional',
    value: '6 pendências',
    danger: true,
  },
]

export const pipelineOverview = [
  { stage: 'Suspect', total: 48, progress: 90 },
  { stage: 'Prospect', total: 31, progress: 68 },
  { stage: 'Demo', total: 9, progress: 42 },
  { stage: 'Negociação', total: 7, progress: 34 },
  { stage: 'Fechamento', total: 3, progress: 18 },
]

export const dailyMissionTasks = [
  'Resgatar 6 follow-ups vencidos antes das 11h',
  'Converter 3 prospects quentes para demo',
  'Enviar proposta revisada para negociações acima de R$ 10k',
  'Abrir 12 novos suspects com origem qualificada',
]

export const priorityTargets = [
  {
    name: 'Clínica Vitta',
    stage: 'Negociação',
    value: 27500,
    next: 'Retorno final hoje, 17:20',
    danger: 'Decisor pediu comparação com concorrente',
  },
  {
    name: 'Rede Forte Atacadista',
    stage: 'Demo',
    value: 42000,
    next: 'Demonstração amanhã, 09:30',
    danger: 'Alto valor, janela curta de decisão',
  },
  {
    name: 'Alpha Contabilidade',
    stage: 'Prospect',
    value: 18000,
    next: 'WhatsApp hoje, 15:00',
    danger: 'Lead quente esperando proposta objetiva',
  },
]

export const mockLeads = [
  {
    company: 'Alpha Contabilidade',
    contact: 'Marina Costa',
    phone: '11998341102',
    stage: 'Prospect',
    temp: 'Quente',
    value: 18000,
    next: 'Hoje, 15:00',
    origin: 'Indicação',
  },
  {
    company: 'Rede Forte Atacadista',
    contact: 'Bruno Almeida',
    phone: '31987204431',
    stage: 'Demo',
    temp: 'Morno',
    value: 42000,
    next: 'Amanhã, 09:30',
    origin: 'Outbound',
  },
  {
    company: 'Clínica Vitta',
    contact: 'Patrícia Lima',
    phone: '21976519090',
    stage: 'Negociação',
    temp: 'Caveira',
    value: 27500,
    next: 'Hoje, 17:20',
    origin: 'CRM Vendas',
  },
  {
    company: 'Mecânica Torres',
    contact: 'Rafael Torres',
    phone: '41991245511',
    stage: 'Suspect',
    temp: 'Frio',
    value: 9800,
    next: 'Sexta, 10:00',
    origin: 'Lista fria',
  },
]

export const goalPreviewCards = [
  {
    label: 'Taxa Demo',
    value: 29,
    helper: 'Prospect para demo',
  },
  {
    label: 'Taxa Negociação',
    value: 18,
    helper: 'Demo para proposta',
  },
  {
    label: 'Fechamento alvo',
    value: 12,
    helper: 'Base do mês',
  },
]

export const stageOptions = ['Todos', ...STAGES]
export const temperatureOptions = TEMPERATURES
export const productOptions = PRODUCTS
export const originOptions = ORIGINS
