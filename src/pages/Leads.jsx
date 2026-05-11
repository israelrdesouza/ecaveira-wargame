import {
  ExternalLink,
  Filter,
  Flame,
  Link,
  Loader2,
  MessageCircle,
  Save,
  Search,
  SlidersHorizontal,
  Thermometer,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { mockLeads } from '../data/mockData'
import { getLeads, moveLeadStage, updateLead } from '../services/leadService'
import { ORIGINS, PRODUCTS, TEMPERATURES } from '../utils/constants'
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
  formatPhoneBR,
} from '../utils/formatters'

const FUNNEL_STAGES = [
  { label: 'Suspect', value: 'suspect' },
  { label: 'Prospect', value: 'prospect' },
  { label: 'Demo', value: 'demo' },
  { label: 'Negociação', value: 'negociacao' },
  { label: 'Fechado', value: 'fechado' },
  { label: 'Perdido', value: 'perdido' },
  { label: 'Congelado', value: 'congelado' },
]

const STAGE_FILTERS = [
  { label: 'Todos', value: '' },
  ...FUNNEL_STAGES,
]
const TEMPERATURE_FILTERS = [
  { label: 'Frio', value: 'frio' },
  { label: 'Morno', value: 'morno' },
  { label: 'Quente', value: 'quente' },
  { label: 'Caveira', value: 'caveira' },
]
const SORT_OPTIONS = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Mais antigos', value: 'oldest' },
  { label: 'Próximo contato', value: 'nextContact' },
  { label: 'Maior valor', value: 'highestValue' },
  { label: 'Menor valor', value: 'lowestValue' },
  { label: 'Empresa A-Z', value: 'companyAz' },
]
const cleanedCommercialFields = new Set(['empresa', 'contato', 'produto_outro', 'origem_outro'])
const uppercaseCommercialFields = new Set(['proxima_acao', 'observacao'])

function Leads() {
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [movingLeadId, setMovingLeadId] = useState(null)
  const [editingLead, setEditingLead] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedTemperature, setSelectedTemperature] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState('recent')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const hasRealLeads = leads.length > 0
  const sourceLeads = error && !hasRealLeads ? mockLeads : leads
  const displayedLeads = useMemo(
    () =>
      getFilteredAndSortedLeads(sourceLeads, {
        selectedStage,
        selectedTemperature,
        searchTerm,
        sortOption,
      }),
    [sourceLeads, searchTerm, selectedStage, selectedTemperature, sortOption],
  )
  const hasActiveFilters = Boolean(selectedStage || selectedTemperature || searchTerm.trim())
  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortOption)?.label ?? 'Ordenar'

  useEffect(() => {
    let isMounted = true

    async function loadLeads() {
      setIsLoading(true)
      setError('')

      try {
        const data = await getLeads()

        if (isMounted) {
          setLeads(data)
        }
      } catch (leadError) {
        if (isMounted) {
          setError(leadError.message || 'Não foi possível carregar os leads.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadLeads()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleMoveStage(lead, novaEtapa) {
    const etapaAtual = normalizeStageValue(lead.etapa_atual ?? lead.stage)

    if (!lead.id || novaEtapa === etapaAtual) {
      return
    }

    setMovingLeadId(lead.id)
    setError('')
    setFeedback('')

    try {
      const updatedLead = await moveLeadStage(lead, novaEtapa, lead.user_id)
      setLeads((current) =>
        current.map((item) => (item.id === updatedLead.id ? updatedLead : item)),
      )
      setFeedback(`Lead movido para ${formatStage(novaEtapa)}.`)
    } catch (leadError) {
      setError(leadError.message || 'Não foi possível mover o lead de etapa.')
    } finally {
      setMovingLeadId(null)
    }
  }

  async function handleSaveEdit(form) {
    if (!editingLead || savingEdit) {
      return
    }

    setSavingEdit(true)
    setEditError('')
    setFeedback('')

    try {
      const updatedLead = await updateLead(editingLead, form, editingLead.user_id)
      setLeads((current) =>
        current.map((item) => (item.id === updatedLead.id ? updatedLead : item)),
      )
      setEditingLead(null)
      setFeedback('Lead atualizado com sucesso.')
    } catch (leadError) {
      setEditError(leadError.message || 'Não foi possível atualizar o lead.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
            Radar de oportunidades
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Leads
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
            Priorize por etapa, temperatura e próximo contato. Ações visuais
            preparadas para WhatsApp, Ploomes e movimentação de pipeline.
          </p>
        </div>
        <div className="rounded-md border border-red-500/20 bg-red-950/25 px-3 py-2 text-sm font-black text-red-200">
          {isLoading ? 'Carregando alvos...' : `${displayedLeads.length} alvos no radar`}
        </div>
      </header>

      <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="flex h-11 min-w-0 items-center gap-3 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500/50">
            <Search size={18} className="shrink-0 text-zinc-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por empresa, pessoa ou contato"
              className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
            />
          </label>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 text-sm font-black text-zinc-200 transition hover:border-red-500/40 hover:text-white"
          >
            <Filter size={17} />
            Filtros
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen((current) => !current)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-500 lg:w-auto"
            >
              <SlidersHorizontal size={17} />
              Ordenar
            </button>
            {isSortOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-md border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50">
                <div className="border-b border-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600">
                  {selectedSortLabel}
                </div>
                {SORT_OPTIONS.map((option) => {
                  const selected = option.value === sortOption

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortOption(option.value)
                        setIsSortOpen(false)
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-bold transition ${
                        selected
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {option.label}
                      {selected && <span className="text-xs">Ativo</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <FilterGroup
            items={STAGE_FILTERS}
            active={selectedStage}
            onSelect={(value) => setSelectedStage(value)}
          />
          <FilterGroup
            items={TEMPERATURE_FILTERS}
            active={selectedTemperature}
            onSelect={(value) =>
              setSelectedTemperature((current) => (current === value ? '' : value))
            }
            subtle
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-950/20 p-4 text-sm font-semibold text-red-100">
          {hasRealLeads
            ? error
            : 'Não foi possível carregar os leads reais agora. Exibindo fallback visual.'}
        </div>
      )}

      {feedback && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 p-4 text-sm font-semibold text-emerald-100">
          {feedback}
        </div>
      )}

      {!isLoading && !error && !hasRealLeads && !hasActiveFilters ? (
        <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-8 text-center shadow-xl shadow-black/20 backdrop-blur">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
            <Flame size={23} />
          </div>
          <h2 className="mt-4 text-lg font-black text-white">
            Nenhum lead cadastrado ainda. Cadastre seu primeiro alvo.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-zinc-500">
            Assim que um lead for salvo no Supabase, ele aparecerá neste radar.
          </p>
        </div>
      ) : !isLoading && displayedLeads.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-8 text-center shadow-xl shadow-black/20 backdrop-blur">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
            <Search size={23} />
          </div>
          <h2 className="mt-4 text-lg font-black text-white">
            Nenhum lead encontrado com os filtros selecionados.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-zinc-500">
            Ajuste a busca, etapa, temperatura ou ordenação para consultar outros alvos.
          </p>
        </div>
      ) : (
        <LeadTable
          leads={displayedLeads}
          isLoading={isLoading}
          movingLeadId={movingLeadId}
          onMoveStage={handleMoveStage}
          onActionNotice={(message) => {
            setFeedback(message)
            setError('')
          }}
          onOpenLead={(lead) => {
            setEditingLead(lead)
            setEditError('')
          }}
        />
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          error={editError}
          isSaving={savingEdit}
          onClose={() => {
            if (!savingEdit) {
              setEditingLead(null)
              setEditError('')
            }
          }}
          onSave={handleSaveEdit}
        />
      )}
    </section>
  )
}

function LeadTable({
  leads,
  isLoading,
  movingLeadId,
  onMoveStage,
  onOpenLead,
  onActionNotice,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/20 backdrop-blur">
      <div className="hidden grid-cols-[1.2fr_0.85fr_0.7fr_0.8fr_0.65fr_1.35fr] gap-4 border-b border-white/10 bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-zinc-600 lg:grid">
        <span>Lead</span>
        <span>Contato</span>
        <span>Etapa</span>
        <span>Temperatura</span>
        <span>Valor</span>
        <span>Ações</span>
      </div>

      <div className="divide-y divide-white/10">
        {isLoading ? (
          <div className="p-4 text-sm font-semibold text-zinc-500">
            Carregando leads...
          </div>
        ) : (
          leads.map((lead) => (
            <article
              key={lead.id ?? getLeadCompany(lead)}
              onClick={(event) => {
                if (isLeadActionTarget(event.target) || !lead.id) return

                if (window.matchMedia('(max-width: 1023px)').matches) {
                  onOpenLead(lead)
                }
              }}
              onDoubleClick={(event) => {
                if (isLeadActionTarget(event.target) || !lead.id) return
                onOpenLead(lead)
              }}
              className="grid cursor-pointer gap-4 p-4 transition hover:bg-white/[0.025] lg:grid-cols-[1.2fr_0.85fr_0.7fr_0.8fr_0.65fr_1.35fr] lg:items-center"
            >
              <div className="min-w-0">
                <h2 className="truncate font-black text-white">
                  {getLeadCompany(lead)}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  Próximo contato: {getLeadNextContact(lead)}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
                  Origem: {lead.origem ?? lead.origin ?? 'Não informada'}
                </p>
                {lead.ultima_acao_em && (
                  <p className="mt-1 text-xs font-semibold text-zinc-600">
                    Última ação: {formatDateTimeBR(lead.ultima_acao_em)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-extrabold text-zinc-200">
                  {lead.contato ?? lead.contact ?? 'Sem contato'}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  {formatPhoneBR(lead.celular ?? lead.phone)}
                </p>
              </div>

              <span className="w-fit rounded-md border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-black text-zinc-200">
                {formatStage(lead.etapa_atual ?? lead.stage)}
              </span>

              <Temperature value={formatTemperature(lead.temperatura ?? lead.temp)} />

              <p className="text-sm font-black text-white">
                {formatCurrencyBRL(lead.valor_estimado ?? lead.value)}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                <StageSelect
                  lead={lead}
                  isMoving={movingLeadId === lead.id}
                  onMoveStage={onMoveStage}
                />
                <ActionButton
                  tone="green"
                  icon={MessageCircle}
                  label="WhatsApp"
                  disabled={!getLeadPhoneDigits(lead)}
                  title={
                    getLeadPhoneDigits(lead)
                      ? 'Abrir WhatsApp'
                      : 'Celular não informado'
                  }
                  onClick={() => openWhatsApp(lead, onActionNotice)}
                />
                <ActionButton
                  tone="red"
                  icon={ExternalLink}
                  label="Abrir Ploomes"
                  title="Abrir Ploomes"
                  onClick={() => openPloomes(lead, onActionNotice)}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

function openWhatsApp(lead, onActionNotice) {
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

function openPloomes(lead, onActionNotice) {
  const link = getLeadPloomesLink(lead)

  if (!link) {
    onActionNotice?.('Link do Ploomes não informado.')
    return
  }

  window.open(getExternalUrl(link), '_blank', 'noopener,noreferrer')
}

function getLeadPhoneDigits(lead) {
  return onlyDigits(lead?.celular ?? lead?.phone)
}

function getLeadPloomesLink(lead) {
  return String(
    lead?.link_ploomes ??
      lead?.ploomes ??
      lead?.ploomes_link ??
      lead?.crm_link ??
      '',
  ).trim()
}

function getExternalUrl(value) {
  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `https://${value}`
}

function getFilteredAndSortedLeads(leads, filters) {
  const { selectedStage, selectedTemperature, searchTerm, sortOption } = filters
  const normalizedSearch = normalizeSearchValue(searchTerm)

  return [...(leads ?? [])]
    .filter((lead) => {
      if (selectedStage && normalizeStageValue(lead.etapa_atual ?? lead.stage) !== selectedStage) {
        return false
      }

      if (
        selectedTemperature &&
        normalizeTemperatureValue(lead.temperatura ?? lead.temp) !== selectedTemperature
      ) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return getLeadSearchText(lead).includes(normalizedSearch)
    })
    .sort((leadA, leadB) => compareLeads(leadA, leadB, sortOption))
}

function getLeadSearchText(lead) {
  return normalizeSearchValue(
    [
      getLeadCompany(lead),
      lead.contato ?? lead.contact,
      lead.celular ?? lead.phone,
      formatPhoneBR(lead.celular ?? lead.phone),
      lead.produto ?? lead.product,
      lead.origem ?? lead.origin,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

function normalizeSearchValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function compareLeads(leadA, leadB, sortOption) {
  switch (sortOption) {
    case 'oldest':
      return compareDates(getLeadCreatedAt(leadA), getLeadCreatedAt(leadB), 'asc')
    case 'nextContact':
      return compareNullableDates(getLeadRawNextContact(leadA), getLeadRawNextContact(leadB))
    case 'highestValue':
      return getLeadEstimatedValue(leadB) - getLeadEstimatedValue(leadA)
    case 'lowestValue':
      return getLeadEstimatedValue(leadA) - getLeadEstimatedValue(leadB)
    case 'companyAz':
      return getLeadCompany(leadA).localeCompare(getLeadCompany(leadB), 'pt-BR', {
        sensitivity: 'base',
      })
    case 'recent':
    default:
      return compareDates(getLeadCreatedAt(leadA), getLeadCreatedAt(leadB), 'desc')
  }
}

function compareDates(valueA, valueB, direction = 'asc') {
  const dateA = getDateTime(valueA)
  const dateB = getDateTime(valueB)
  const fallbackA = Number.isFinite(dateA) ? dateA : 0
  const fallbackB = Number.isFinite(dateB) ? dateB : 0

  return direction === 'desc' ? fallbackB - fallbackA : fallbackA - fallbackB
}

function compareNullableDates(valueA, valueB) {
  const hasValueA = Boolean(valueA)
  const hasValueB = Boolean(valueB)

  if (!hasValueA && !hasValueB) return 0
  if (!hasValueA) return 1
  if (!hasValueB) return -1

  return compareDates(valueA, valueB, 'asc')
}

function getDateTime(value) {
  if (!value) {
    return Number.NaN
  }

  const date = new Date(value)
  return date.getTime()
}

function getLeadCreatedAt(lead) {
  return lead.created_at ?? lead.createdAt ?? lead.created ?? ''
}

function getLeadRawNextContact(lead) {
  return lead.proximo_contato ?? lead.next ?? ''
}

function getLeadEstimatedValue(lead) {
  const value = lead.valor_estimado ?? lead.value ?? 0

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const normalizedValue = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const numericValue = Number(normalizedValue)

  return Number.isFinite(numericValue) ? numericValue : 0
}

export function EditLeadModal({ lead, error, isSaving, onClose, onSave }) {
  const [originalForm] = useState(() => getEditFormFromLead(lead))
  const [form, setForm] = useState(originalForm)
  const [isEditing, setIsEditing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirmAction, setConfirmAction] = useState(null)
  const hasChanges = hasFormChanges(form, originalForm)
  const isReadOnly = !isEditing || isSaving

  function updateField(event) {
    if (isReadOnly) {
      return
    }

    const { name, value } = event.target
    const nextValue = normalizeFieldValue(name, value)

    setForm((current) => {
      const nextForm = { ...current, [name]: nextValue }

      if (name === 'produto' && value !== 'Outro') {
        nextForm.produto_outro = ''
      }

      if (name === 'origem' && value !== 'Outro') {
        nextForm.origem_outro = ''
      }

      return nextForm
    })

    setFieldErrors((current) => {
      const nextErrors = { ...current }
      delete nextErrors[name]
      return nextErrors
    })
  }

  function requestClose() {
    if (isEditing && hasChanges) {
      setConfirmAction('discard-close')
      return
    }

    onClose()
  }

  function cancelEdit() {
    if (hasChanges) {
      setConfirmAction('discard-edit')
      return
    }

    setFieldErrors({})
    setIsEditing(false)
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!isEditing || isSaving || !hasChanges) {
      return
    }

    const validationErrors = validateEditForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    setConfirmAction('save')
  }

  function confirmDiscard() {
    setConfirmAction(null)
    setFieldErrors({})

    if (confirmAction === 'discard-close') {
      onClose()
      return
    }

    setForm(originalForm)
    setIsEditing(false)
  }

  function confirmSave() {
    setConfirmAction(null)
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl rounded-lg border border-white/10 bg-zinc-950 shadow-2xl shadow-black">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              {isEditing ? 'Editar lead' : 'Detalhes do lead'}
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              {getLeadCompany(lead)}
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              {isEditing
                ? 'Ajuste os dados comerciais mantendo o histórico do lead.'
                : 'Revise os dados antes de liberar qualquer alteração.'}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar edição"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <EditField
              label="Empresa/Pessoa"
              name="empresa"
              value={form.empresa}
              onChange={updateField}
              placeholder="Digite o nome da empresa e/ou pessoa"
              error={fieldErrors.empresa}
              required
              disabled={isReadOnly}
            />
            <EditField
              label="Contato"
              name="contato"
              value={form.contato}
              onChange={updateField}
              placeholder="Digite o nome do contato"
              error={fieldErrors.contato}
              required
              disabled={isReadOnly}
            />
            <EditField
              label="Celular"
              name="celular"
              value={form.celular}
              onChange={updateField}
              placeholder="(27) 99999-9999"
              error={fieldErrors.celular}
              required
              disabled={isReadOnly}
            />
            <EditField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="Opcional"
              disabled={isReadOnly}
            />
            <EditSelect
              label="Produto"
              name="produto"
              value={form.produto}
              onChange={updateField}
              options={PRODUCTS}
              error={fieldErrors.produto}
              required
              disabled={isReadOnly}
            />
            {form.produto === 'Outro' && (
              <EditField
                label="Produto"
                name="produto_outro"
                value={form.produto_outro}
                onChange={updateField}
                placeholder="Digite o produto"
                error={fieldErrors.produto_outro}
                required
                disabled={isReadOnly}
              />
            )}
            <EditSelect
              label="Origem"
              name="origem"
              value={form.origem}
              onChange={updateField}
              options={ORIGINS}
              error={fieldErrors.origem}
              required
              disabled={isReadOnly}
            />
            {form.origem === 'Outro' && (
              <EditField
                label="Origem"
                name="origem_outro"
                value={form.origem_outro}
                onChange={updateField}
                placeholder="Digite a origem"
                error={fieldErrors.origem_outro}
                required
                disabled={isReadOnly}
              />
            )}
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                <Thermometer size={14} />
                Temperatura
              </span>
              <select
                name="temperatura"
                value={form.temperatura}
                onChange={updateField}
                disabled={isReadOnly}
                className={getInputClassName(fieldErrors.temperatura, isReadOnly)}
                required
              >
                {TEMPERATURES.map((temperature) => (
                  <option key={temperature}>{temperature}</option>
                ))}
              </select>
            </label>
            <EditField
              label="Próximo contato"
              name="proximo_contato"
              type="date"
              value={form.proximo_contato}
              onChange={updateField}
              disabled={isReadOnly}
            />
            <EditField
              label="Próxima ação"
              name="proxima_acao"
              value={form.proxima_acao}
              onChange={updateField}
              placeholder="Ex: ligar amanhã, enviar proposta, agendar demo"
              disabled={isReadOnly}
            />
            <EditField
              label="Link do Ploomes/CRM Vendas"
              name="link_ploomes"
              value={form.link_ploomes}
              onChange={updateField}
              icon={Link}
              placeholder="Cole aqui o link do Ploomes ou CRM Vendas"
              disabled={isReadOnly}
            />
            <EditField
              label="Valor estimado"
              name="valor_estimado"
              value={form.valor_estimado}
              onChange={updateField}
              placeholder="Ex: 549,90"
              disabled={isReadOnly}
            />
            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                Observação curta
              </span>
              <textarea
                name="observacao"
                value={form.observacao}
                onChange={updateField}
                disabled={isReadOnly}
                rows={4}
                className={`w-full resize-none rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-70 ${
                  isReadOnly ? 'text-zinc-300' : ''
                }`}
                placeholder="Digite uma observação rápida sobre o lead"
              />
            </label>
          </div>

          {confirmAction && (
            <div className="mt-5 rounded-lg border border-red-500/25 bg-red-950/20 p-4">
              <p className="text-sm font-black text-red-100">
                {confirmAction === 'save'
                  ? 'Deseja salvar as alterações deste lead?'
                  : 'Existem alterações não salvas. Deseja sair sem salvar?'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-black text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continuar editando
                </button>
                {confirmAction === 'save' ? (
                  <button
                    type="button"
                    onClick={confirmSave}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                    Salvar alterações
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={confirmDiscard}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Sair sem salvar
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-md border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          {Object.values(fieldErrors).some(Boolean) && (
            <div className="mt-5 rounded-md border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
              Preencha os campos obrigatórios antes de salvar.
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-zinc-500">
              {isEditing
                ? 'A edição será registrada no histórico do lead.'
                : 'Duplo clique no desktop ou toque no mobile abre este painel.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-black text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancelar edição
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !hasChanges}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {isSaving ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={requestClose}
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-black text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmAction(null)
                      setIsEditing(true)
                    }}
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function StageSelect({ lead, isMoving, onMoveStage }) {
  const currentStage = normalizeStageValue(lead.etapa_atual ?? lead.stage)

  return (
    <label
      data-lead-action
      className="relative inline-flex h-10 w-full min-w-[138px] items-center rounded-md border border-white/10 bg-black/20 text-xs font-black text-zinc-300 transition focus-within:border-red-500/40 hover:border-zinc-500/50 hover:text-white sm:w-auto"
    >
      {isMoving && (
        <Loader2 size={14} className="ml-2 shrink-0 animate-spin text-red-300" />
      )}
      <select
        value={currentStage}
        disabled={isMoving || !lead.id}
        onChange={(event) => onMoveStage(lead, event.target.value)}
        className="h-full w-full rounded-md bg-transparent px-3 text-xs font-black text-zinc-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {FUNNEL_STAGES.map((stage) => (
          <option key={stage.value} value={stage.value} className="bg-zinc-950">
            {stage.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FilterGroup({ items, active, onSelect, subtle = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const label = typeof item === 'string' ? item : item.label
        const value = typeof item === 'string' ? item : item.value
        const selected = value === active

        return (
          <button
            key={value || label}
            type="button"
            onClick={() => onSelect?.(value)}
            className={`rounded-md border px-3 py-2 text-xs font-black transition ${
              selected
                ? 'border-red-500/40 bg-red-600 text-white shadow-lg shadow-red-950/25'
                : subtle
                  ? 'border-white/10 bg-black/20 text-zinc-400 hover:border-red-500/30 hover:text-white'
                : 'border-white/10 bg-black/30 text-zinc-400 hover:border-red-500/30 hover:text-white'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function Temperature({ value }) {
  const warm = value === 'Caveira' || value === 'Quente'

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-black ${
        warm
          ? 'border-red-500/30 bg-red-950/30 text-red-200'
          : 'border-zinc-600/30 bg-zinc-800/50 text-zinc-300'
      }`}
    >
      <Flame size={13} />
      {value}
    </span>
  )
}

function ActionButton({
  icon: Icon,
  label,
  tone = 'zinc',
  onClick,
  disabled = false,
  title,
}) {
  const tones = {
    zinc: 'border-white/10 bg-black/20 text-zinc-300 hover:border-zinc-500/50 hover:text-white',
    red: 'border-red-500/25 bg-red-950/20 text-red-200 hover:border-red-400/45',
    green:
      'border-emerald-500/25 bg-emerald-950/20 text-emerald-200 hover:border-emerald-400/45',
  }

  return (
    <button
      type="button"
      data-lead-action
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-10 w-full min-w-[138px] items-center justify-center gap-2 rounded-md border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto ${tones[tone]}`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

function isLeadActionTarget(target) {
  return Boolean(target?.closest?.('[data-lead-action]'))
}

function EditField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  icon: Icon,
  error = false,
  required = false,
  disabled = false,
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <span className={getFieldWrapperClassName(error)}>
        {Icon && <Icon size={16} className="shrink-0 text-zinc-500" />}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:text-zinc-300"
        />
      </span>
    </label>
  )
}

function EditSelect({
  label,
  name,
  value,
  onChange,
  options,
  error = false,
  required = false,
  disabled = false,
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={getInputClassName(error, disabled)}
      >
        {options.map((option) => (
          <option key={option} className="bg-zinc-950">
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function getLeadCompany(lead) {
  return lead.empresa ?? lead.company ?? 'Lead sem nome'
}

function getLeadNextContact(lead) {
  const nextContact = lead.proximo_contato ?? lead.next

  if (!nextContact) {
    return 'Sem data definida'
  }

  if (String(nextContact).includes('Hoje') || String(nextContact).includes('Amanhã')) {
    return nextContact
  }

  return formatDateBR(nextContact)
}

function normalizeStageValue(stage) {
  const normalized = String(stage || 'suspect')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return FUNNEL_STAGES.some((item) => item.value === normalized)
    ? normalized
    : 'suspect'
}

function formatStage(stage) {
  const normalized = normalizeStageValue(stage)
  return FUNNEL_STAGES.find((item) => item.value === normalized)?.label ?? stage
}

function formatTemperature(temperature) {
  const normalized = normalizeTemperatureValue(temperature)
  const temperatureLabels = {
    frio: 'Frio',
    morno: 'Morno',
    quente: 'Quente',
    caveira: 'Caveira',
  }

  return temperatureLabels[normalized] ?? temperature
}

function normalizeTemperatureValue(temperature) {
  const normalized = String(temperature || 'morno')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return ['frio', 'morno', 'quente', 'caveira'].includes(normalized)
    ? normalized
    : 'morno'
}

function getEditFormFromLead(lead) {
  const product = getOptionOrOther(lead.produto, PRODUCTS)
  const origin = getOptionOrOther(lead.origem, ORIGINS)

  return {
    empresa: lead.empresa ?? '',
    contato: lead.contato ?? '',
    celular: formatPhoneMask(lead.celular ?? ''),
    email: lead.email ?? '',
    produto: product.option,
    produto_outro: product.other,
    origem: origin.option,
    origem_outro: origin.other,
    temperatura: formatTemperature(lead.temperatura ?? 'morno'),
    proximo_contato: lead.proximo_contato ?? '',
    proxima_acao: lead.proxima_acao ?? '',
    observacao: lead.observacao ?? '',
    link_ploomes: lead.link_ploomes ?? '',
    valor_estimado: lead.valor_estimado ?? '',
  }
}

function hasFormChanges(form, originalForm) {
  return JSON.stringify(getComparableEditForm(form)) !== JSON.stringify(getComparableEditForm(originalForm))
}

function getComparableEditForm(form) {
  return {
    empresa: String(form.empresa ?? '').trim(),
    contato: String(form.contato ?? '').trim(),
    celular: onlyDigits(form.celular),
    email: String(form.email ?? '').trim(),
    produto: form.produto,
    produto_outro: String(form.produto_outro ?? '').trim(),
    origem: form.origem,
    origem_outro: String(form.origem_outro ?? '').trim(),
    temperatura: form.temperatura,
    proximo_contato: String(form.proximo_contato ?? '').slice(0, 10),
    proxima_acao: String(form.proxima_acao ?? '').trim(),
    observacao: String(form.observacao ?? '').trim(),
    link_ploomes: String(form.link_ploomes ?? '').trim(),
    valor_estimado: String(form.valor_estimado ?? '').trim(),
  }
}

function getOptionOrOther(value, options) {
  if (!value) {
    return { option: options[0], other: '' }
  }

  const found = options.find((option) => option.toLowerCase() === String(value).toLowerCase())

  return found
    ? { option: found, other: '' }
    : { option: 'Outro', other: sanitizeCommercialText(value) }
}

function normalizeFieldValue(name, value) {
  if (name === 'celular') {
    return formatPhoneMask(value)
  }

  if (cleanedCommercialFields.has(name)) {
    return sanitizeCommercialText(value)
  }

  if (uppercaseCommercialFields.has(name)) {
    return value.toLocaleUpperCase('pt-BR')
  }

  return value
}

function sanitizeCommercialText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trimStart()
    .toLocaleUpperCase('pt-BR')
}

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function formatPhoneMask(value) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 2) {
    return digits ? `(${digits}` : ''
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function validateEditForm(form) {
  const errors = {}

  if (!form.empresa.trim()) errors.empresa = true
  if (!form.contato.trim()) errors.contato = true
  if (!onlyDigits(form.celular)) errors.celular = true
  if (!form.produto) errors.produto = true
  if (form.produto === 'Outro' && !form.produto_outro.trim()) errors.produto_outro = true
  if (!form.origem) errors.origem = true
  if (form.origem === 'Outro' && !form.origem_outro.trim()) errors.origem_outro = true
  if (!form.temperatura) errors.temperatura = true

  return errors
}

function getFieldWrapperClassName(error) {
  return `flex h-11 items-center gap-2 rounded-md border bg-black/30 px-3 transition focus-within:border-red-500 ${
    error ? 'border-red-500/70 ring-1 ring-red-500/40' : 'border-white/10'
  }`
}

function getInputClassName(error, disabled = false) {
  return `h-11 w-full rounded-md border bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-70 ${
    error ? 'border-red-500/70 ring-1 ring-red-500/40' : 'border-white/10'
  } ${disabled ? 'text-zinc-300' : ''}`
}

export default Leads
