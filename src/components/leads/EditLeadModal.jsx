import { ArrowLeft, Check, ChevronDown, Link, Loader2, Pencil, Thermometer, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ORIGINS, PRODUCTS, TEMPERATURES } from '../../utils/constants'
import {
  ACCENT_PATTERN,
  formatStage,
  formatTemperature,
  getLeadCompany,
  normalizeStageValue,
  onlyDigits,
} from '../../utils/leadHelpers'

const cleanedCommercialFields = new Set(['empresa', 'contato', 'produto_outro', 'origem_outro'])
const uppercaseCommercialFields = new Set(['proxima_acao', 'observacao'])

// Mesmas etapas canonicas usadas em src/pages/Leads.jsx (FUNNEL_STAGES).
// Duplicado aqui propositalmente para nao alterar Leads.jsx/Dashboard.jsx:
// o modal precisa da lista para o select de etapa e para formatar o badge
// de leitura, mas nao recebe stageOptions como prop hoje.
const STAGE_OPTIONS = [
  { label: 'Suspect', value: 'suspect' },
  { label: 'Prospect', value: 'prospect' },
  { label: 'Demo', value: 'demo' },
  { label: 'Negociação', value: 'negociacao' },
  { label: 'Fechado', value: 'fechado' },
  { label: 'Perdido', value: 'perdido' },
  { label: 'Congelado', value: 'congelado' },
]

function EditLeadModal({ lead, error, isSaving, onClose, onSave }) {
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

  const requestClose = useCallback(() => {
    if (isEditing && hasChanges) {
      setConfirmAction('discard-close')
      return
    }

    onClose()
  }, [isEditing, hasChanges, onClose])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'Escape') {
        return
      }

      if (confirmAction) {
        setConfirmAction(null)
        return
      }

      requestClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [confirmAction, requestClose])

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      requestClose()
    }
  }

  function startEdit() {
    setConfirmAction(null)
    setIsEditing(true)
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
    <>
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="mx-auto flex w-full max-w-4xl max-h-[85vh] flex-col rounded-lg border border-white/10 bg-zinc-950 shadow-2xl shadow-black">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              {isEditing ? 'Editar lead' : 'Detalhes do lead'}
            </p>
            <h2 className="mt-2 text-2xl font-black leading-snug text-white">
              {getLeadCompany(lead)}
            </h2>
          </div>
          {!isEditing && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSaving}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Voltar para Leads"
                title="Voltar para Leads"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={startEdit}
                disabled={isSaving}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Editar lead"
                title="Editar lead"
              >
                <Pencil size={17} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="min-h-0 flex-1 overflow-y-auto p-5"
        >
          <div className="space-y-6">
            <FieldGroup title="Identificação">
              {isEditing ? (
                <>
                  <EditField
                    label="Empresa/Pessoa"
                    name="empresa"
                    value={form.empresa}
                    onChange={updateField}
                    placeholder="Digite o nome da empresa e/ou pessoa"
                    error={fieldErrors.empresa}
                    required
                  />
                  <EditField
                    label="Contato"
                    name="contato"
                    value={form.contato}
                    onChange={updateField}
                    placeholder="Digite o nome do contato"
                    error={fieldErrors.contato}
                    required
                  />
                  <EditField
                    label="Celular"
                    name="celular"
                    value={form.celular}
                    onChange={updateField}
                    placeholder="(27) 99999-9999"
                    error={fieldErrors.celular}
                    required
                  />
                  <EditField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="Opcional"
                  />
                </>
              ) : (
                <>
                  <ReadOnlyField label="Empresa/Pessoa" value={form.empresa} />
                  <ReadOnlyField label="Contato" value={form.contato} />
                  <ReadOnlyField label="Celular" value={form.celular} />
                  <ReadOnlyField label="Email" value={form.email} />
                </>
              )}
            </FieldGroup>

            <FieldGroup title="Comercial">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                      Etapa
                    </span>
                    <StagePicker
                      value={form.etapa}
                      options={STAGE_OPTIONS}
                      onSelect={(value) => updateField({ target: { name: 'etapa', value } })}
                    />
                  </div>
                  <EditSelect
                    label="Produto"
                    name="produto"
                    value={form.produto}
                    onChange={updateField}
                    options={PRODUCTS}
                    error={fieldErrors.produto}
                    required
                  />
                  {form.produto === 'Outro' && (
                    <EditField
                      label="Produto (outro)"
                      name="produto_outro"
                      value={form.produto_outro}
                      onChange={updateField}
                      placeholder="Digite o produto"
                      error={fieldErrors.produto_outro}
                      required
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
                  />
                  {form.origem === 'Outro' && (
                    <EditField
                      label="Origem (outra)"
                      name="origem_outro"
                      value={form.origem_outro}
                      onChange={updateField}
                      placeholder="Digite a origem"
                      error={fieldErrors.origem_outro}
                      required
                    />
                  )}
                  <label className="space-y-2">
                    <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                      <Thermometer size={14} aria-hidden="true" />
                      Temperatura
                    </span>
                    <select
                      name="temperatura"
                      value={form.temperatura}
                      onChange={updateField}
                      className={getInputClassName(fieldErrors.temperatura)}
                      required
                    >
                      {TEMPERATURES.map((temperature) => (
                        <option key={temperature}>{temperature}</option>
                      ))}
                    </select>
                  </label>
                  <EditField
                    label="Valor estimado"
                    name="valor_estimado"
                    value={form.valor_estimado}
                    onChange={updateField}
                    placeholder="Ex: 549,90"
                  />
                  <EditField
                    label="Link do Ploomes/CRM Vendas"
                    name="link_ploomes"
                    value={form.link_ploomes}
                    onChange={updateField}
                    icon={Link}
                    placeholder="Cole aqui o link do Ploomes ou CRM Vendas"
                  />
                </>
              ) : (
                <>
                  <ReadOnlyField
                    label="Produto"
                    value={form.produto === 'Outro' ? form.produto_outro : form.produto}
                  />
                  <ReadOnlyField
                    label="Origem"
                    value={form.origem === 'Outro' ? form.origem_outro : form.origem}
                  />
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                      Etapa
                    </span>
                    <div>
                      <span className="inline-flex w-fit items-center gap-1 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm font-black text-zinc-200">
                        {formatStage(form.etapa, STAGE_OPTIONS)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                      Temperatura
                    </span>
                    <div>
                      <span className="inline-flex w-fit items-center gap-1 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm font-black text-zinc-200">
                        {formatTemperature(form.temperatura)}
                      </span>
                    </div>
                  </div>
                  <ReadOnlyField
                    label="Valor estimado"
                    value={form.valor_estimado ? `R$ ${form.valor_estimado}` : ''}
                  />
                  <ReadOnlyField label="Link do Ploomes/CRM Vendas" value={form.link_ploomes} />
                </>
              )}
            </FieldGroup>

            <FieldGroup title="Follow-up">
              {isEditing ? (
                <>
                  <EditField
                    label="Próximo contato"
                    name="proximo_contato"
                    type="date"
                    value={form.proximo_contato}
                    onChange={updateField}
                  />
                  <EditField
                    label="Próxima ação"
                    name="proxima_acao"
                    value={form.proxima_acao}
                    onChange={updateField}
                    placeholder="Ex: ligar amanhã, enviar proposta, agendar demo"
                  />
                </>
              ) : (
                <>
                  <ReadOnlyField label="Próximo contato" value={form.proximo_contato} />
                  <ReadOnlyField label="Próxima ação" value={form.proxima_acao} />
                </>
              )}
            </FieldGroup>

            <FieldGroup title="Observações">
              {isEditing ? (
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                    Observação curta
                  </span>
                  <textarea
                    name="observacao"
                    value={form.observacao}
                    onChange={updateField}
                    rows={3}
                    className="w-full resize-none rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
                    placeholder="Digite uma observação rápida sobre o lead"
                  />
                </label>
              ) : (
                <div className="sm:col-span-2">
                  <ReadOnlyField label="Observação curta" value={form.observacao} multiline />
                </div>
              )}
            </FieldGroup>
          </div>

          {(confirmAction === 'discard-close' || confirmAction === 'discard-edit') && (
            <div className="mt-5 rounded-lg border border-red-500/25 bg-red-950/20 p-4">
              <p className="text-sm font-black text-red-100">
                Existem alterações não salvas. Deseja sair sem salvar?
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
                <button
                  type="button"
                  onClick={confirmDiscard}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Sair sem salvar
                </button>
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

          {isEditing && (
            <div className="sticky -bottom-5 z-10 -mx-5 mt-5 border-t border-white/10 bg-zinc-950/95 px-5 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
              <div className="flex justify-end gap-2 pb-[max(env(safe-area-inset-bottom),12px)]">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSaving}
                  aria-label="Cancelar edição"
                  title="Cancelar edição"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-red-500/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X size={18} aria-hidden="true" />
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !hasChanges}
                  aria-label="Salvar alterações"
                  title="Salvar alterações"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-red-600 text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>

    {confirmAction === 'save' && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setConfirmAction(null)
          }
        }}
      >
        <div className="w-full max-w-sm rounded-lg border border-red-500/25 bg-zinc-950 p-6 text-center shadow-2xl shadow-black">
          <p className="text-base font-black leading-snug text-white">
            Deseja salvar as alterações deste lead?
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              disabled={isSaving}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-md border border-white/10 text-sm font-black text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Não
            </button>
            <button
              type="button"
              onClick={confirmSave}
              disabled={isSaving}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-red-600 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              Sim, salvar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function StagePicker({ value, options, onSelect, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const currentLabel = options.find((option) => option.value === value)?.label ?? value

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  function handleKeyDown(event) {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation()
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-11 w-full items-center justify-between rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span>{currentLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-zinc-500 transition ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute inset-x-0 z-20 mt-1.5 max-h-64 overflow-y-auto rounded-md border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50"
        >
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition ${
                    isSelected
                      ? 'bg-red-950/40 text-red-200'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {option.label}
                  {isSelected && <Check size={15} className="shrink-0 text-red-300" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function FieldGroup({ title, children }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-red-300/80">
        {title}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function ReadOnlyField({ label, value, multiline = false }) {
  const displayValue = String(value ?? '').trim() || 'Não informado'

  return (
    <div className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      <p
        className={`rounded-md border border-white/5 bg-white/[0.03] px-3 py-2.5 text-sm font-semibold ${
          displayValue === 'Não informado' ? 'text-zinc-600' : 'text-zinc-200'
        } ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}
      >
        {displayValue}
      </p>
    </div>
  )
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
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <span className={getFieldWrapperClassName(error)}>
        {Icon && <Icon size={16} className="shrink-0 text-zinc-500" aria-hidden="true" />}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
        />
      </span>
    </label>
  )
}

function EditSelect({ label, name, value, onChange, options, error = false, required = false }) {
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
        className={getInputClassName(error)}
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
    etapa: normalizeStageValue(lead.etapa_atual ?? lead.stage, STAGE_OPTIONS),
    proximo_contato: lead.proximo_contato ?? '',
    proxima_acao: lead.proxima_acao ?? '',
    observacao: lead.observacao ?? '',
    link_ploomes: lead.link_ploomes ?? '',
    valor_estimado: formatDecimalBR(lead.valor_estimado),
  }
}

// Converte o numero bruto do banco (ex.: 549.9) em string decimal BR com
// duas casas (ex.: "549,90"), sem simbolo de moeda, para exibir/editar no
// input com o mesmo formato que parseEstimatedValue (leadService.js) espera
// ao salvar. Mantem round-trip seguro: 549.9 -> "549,90" -> 549.9.
function formatDecimalBR(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

function hasFormChanges(form, originalForm) {
  return (
    JSON.stringify(getComparableEditForm(form)) !== JSON.stringify(getComparableEditForm(originalForm))
  )
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
    etapa: form.etapa,
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
    .replace(ACCENT_PATTERN, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trimStart()
    .toLocaleUpperCase('pt-BR')
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

function getInputClassName(error) {
  return `h-11 w-full rounded-md border bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500 ${
    error ? 'border-red-500/70 ring-1 ring-red-500/40' : 'border-white/10'
  }`
}

export default EditLeadModal
