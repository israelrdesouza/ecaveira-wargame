import { useEffect, useMemo, useState } from 'react'
import EditLeadModal from '../components/leads/EditLeadModal'
import LeadMobileCard from '../components/leads/LeadMobileCard'
import LeadsEmptyState from '../components/leads/LeadsEmptyState'
import LeadsHeader from '../components/leads/LeadsHeader'
import LeadsTable from '../components/leads/LeadsTable'
import LeadsToolbar from '../components/leads/LeadsToolbar'
import { getLeads, moveLeadStage, updateLead } from '../services/leadService'
import { formatPhoneBR } from '../utils/formatters'
import {
  ACCENT_PATTERN,
  formatStage,
  getLeadCompany,
  normalizeStageValue,
  normalizeTemperatureValue,
} from '../utils/leadHelpers'

const FUNNEL_STAGES = [
  { label: 'Suspect', value: 'suspect' },
  { label: 'Prospect', value: 'prospect' },
  { label: 'Demo', value: 'demo' },
  { label: 'Negociação', value: 'negociacao' },
  { label: 'Fechado', value: 'fechado' },
  { label: 'Perdido', value: 'perdido' },
  { label: 'Congelado', value: 'congelado' },
]

const STAGE_FILTERS = [{ label: 'Todos', value: '' }, ...FUNNEL_STAGES]
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

function Leads({ onNavigate }) {
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

  const hasRealLeads = leads.length > 0
  const hasActiveFilters = Boolean(selectedStage || selectedTemperature || searchTerm.trim())
  const activeFilterCount = (selectedStage ? 1 : 0) + (selectedTemperature ? 1 : 0)

  const displayedLeads = useMemo(
    () =>
      getFilteredAndSortedLeads(leads, {
        selectedStage,
        selectedTemperature,
        searchTerm,
        sortOption,
      }),
    [leads, searchTerm, selectedStage, selectedTemperature, sortOption],
  )

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

  function clearFilters() {
    setSelectedStage('')
    setSelectedTemperature('')
    setSearchTerm('')
  }

  function handleActionNotice(message) {
    setFeedback(message)
    setError('')
  }

  function openLeadDetails(lead) {
    setEditingLead(lead)
    setEditError('')
  }

  function closeEditModal() {
    if (!savingEdit) {
      setEditingLead(null)
      setEditError('')
    }
  }

  async function handleMoveStage(lead, novaEtapa) {
    const etapaAtual = normalizeStageValue(lead.etapa_atual ?? lead.stage, FUNNEL_STAGES)

    if (!lead.id || novaEtapa === etapaAtual || movingLeadId === lead.id) {
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
      setFeedback(`Lead movido para ${formatStage(novaEtapa, FUNNEL_STAGES)}.`)
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
      <LeadsHeader
        resultCount={displayedLeads.length}
        isLoading={isLoading}
        onCreateLead={() => onNavigate('newLead')}
      />

      <LeadsToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortOption={sortOption}
        onSortChange={setSortOption}
        sortOptions={SORT_OPTIONS}
        stageOptions={STAGE_FILTERS}
        temperatureOptions={TEMPERATURE_FILTERS}
        selectedStage={selectedStage}
        onSelectStage={setSelectedStage}
        selectedTemperature={selectedTemperature}
        onSelectTemperature={(value) =>
          setSelectedTemperature((current) => (current === value ? '' : value))
        }
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      {error && !isLoading && hasRealLeads && (
        <div className="rounded-lg border border-red-500/25 bg-red-950/20 p-4 text-sm font-semibold text-red-100">
          {error}
        </div>
      )}

      {feedback && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 p-4 text-sm font-semibold text-emerald-100">
          {feedback}
        </div>
      )}

      {isLoading ? (
        <LeadsEmptyState variant="loading" />
      ) : error && !hasRealLeads ? (
        <LeadsEmptyState variant="error" errorMessage={error} />
      ) : !hasRealLeads && !hasActiveFilters ? (
        <LeadsEmptyState variant="empty" />
      ) : displayedLeads.length === 0 ? (
        <LeadsEmptyState variant="no-results" onClearFilters={clearFilters} />
      ) : (
        <>
          <div className="hidden lg:block">
            <LeadsTable
              leads={displayedLeads}
              stageOptions={FUNNEL_STAGES}
              movingLeadId={movingLeadId}
              onMoveStage={handleMoveStage}
              onOpenLead={openLeadDetails}
              onActionNotice={handleActionNotice}
            />
          </div>
          <div className="grid gap-3 lg:hidden">
            {displayedLeads.map((lead) => (
              <LeadMobileCard
                key={lead.id ?? getLeadCompany(lead)}
                lead={lead}
                stageOptions={FUNNEL_STAGES}
                isMoving={movingLeadId === lead.id}
                onMoveStage={handleMoveStage}
                onOpenLead={openLeadDetails}
                onActionNotice={handleActionNotice}
              />
            ))}
          </div>
        </>
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          error={editError}
          isSaving={savingEdit}
          onClose={closeEditModal}
          onSave={handleSaveEdit}
        />
      )}
    </section>
  )
}

function getFilteredAndSortedLeads(leads, filters) {
  const { selectedStage, selectedTemperature, searchTerm, sortOption } = filters
  const normalizedSearch = normalizeSearchValue(searchTerm)

  return [...(leads ?? [])]
    .filter((lead) => {
      if (
        selectedStage &&
        normalizeStageValue(lead.etapa_atual ?? lead.stage, FUNNEL_STAGES) !== selectedStage
      ) {
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
    .replace(ACCENT_PATTERN, '')
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

// Dashboard.jsx importa `EditLeadModal` a partir deste arquivo
// (`import { EditLeadModal } from './Leads'`). O re-export abaixo preserva
// esse contrato mesmo com o modal agora vivendo em seu proprio arquivo.
export { default as EditLeadModal } from '../components/leads/EditLeadModal'

export default Leads
