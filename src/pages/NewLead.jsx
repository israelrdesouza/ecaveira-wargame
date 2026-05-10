import { Link, Loader2, Save, Thermometer, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { createLead } from '../services/leadService'
import { ORIGINS, PRODUCTS, TEMPERATURES } from '../utils/constants'

const initialForm = {
  name: '',
  contact: '',
  phone: '',
  email: '',
  product: PRODUCTS[0],
  productOther: '',
  source: ORIGINS[0],
  sourceOther: '',
  temperature: 'Morno',
  nextContact: '',
  nextAction: '',
  note: '',
  crmLink: '',
  estimatedValue: '',
}

const cleanedCommercialFields = new Set([
  'name',
  'contact',
  'productOther',
  'sourceOther',
])

const uppercaseCommercialFields = new Set([
  'nextAction',
  'note',
])

function NewLead() {
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    const nextValue = normalizeFieldValue(name, value)

    setForm((current) => {
      const nextForm = { ...current, [name]: nextValue }

      if (name === 'product' && value !== 'Outro') {
        nextForm.productOther = ''
      }

      if (name === 'source' && value !== 'Outro') {
        nextForm.sourceOther = ''
      }

      return nextForm
    })

    setFieldErrors((current) => ({ ...current, [name]: false }))
    setError('')
    setSuccess('')
  }

  function handleFieldKeyDown(event) {
    if (event.key !== 'Enter' || event.currentTarget.tagName === 'TEXTAREA') {
      return
    }

    event.preventDefault()

    const fields = Array.from(
      event.currentTarget.form.querySelectorAll(
        'input:not([type="hidden"]), select, textarea, button[type="submit"]',
      ),
    ).filter((field) => !field.disabled)
    const currentIndex = fields.indexOf(event.currentTarget)
    fields[currentIndex + 1]?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    setError('')
    setSuccess('')

    const validationErrors = validateForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setError('Preencha os campos obrigatórios antes de salvar.')
      return
    }

    setIsSaving(true)

    try {
      await createLead(form)
      setForm(initialForm)
      setFieldErrors({})
      setSuccess('Lead cadastrado com sucesso.')
    } catch (leadError) {
      setError(leadError.message || 'Não foi possível cadastrar o lead.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-5">
      <header className="rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Cadastrar alvo
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Novo Lead
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
              Registro manual para alimentar o cockpit e gravar o alvo no
              Supabase.
            </p>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
            <UserPlus size={27} />
          </span>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur md:p-5"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Empresa/Pessoa"
            name="name"
            value={form.name}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            placeholder="Digite o nome da empresa e/ou pessoa"
            error={fieldErrors.name}
            required
          />
          <Field
            label="Contato"
            name="contact"
            value={form.contact}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            placeholder="Digite o nome do contato"
            error={fieldErrors.contact}
            required
          />
          <Field
            label="Celular"
            name="phone"
            value={form.phone}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            placeholder="(27) 99999-9999"
            error={fieldErrors.phone}
            required
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            placeholder="Opcional"
          />
          <SelectField
            label="Produto"
            name="product"
            value={form.product}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            options={PRODUCTS}
            error={fieldErrors.product}
            required
          />
          {form.product === 'Outro' && (
            <Field
              label="Produto"
              name="productOther"
              value={form.productOther}
              onChange={updateField}
              onKeyDown={handleFieldKeyDown}
              placeholder="Digite o produto"
              error={fieldErrors.productOther}
              required
            />
          )}
          <SelectField
            label="Origem"
            name="source"
            value={form.source}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            options={ORIGINS}
            error={fieldErrors.source}
            required
          />
          {form.source === 'Outro' && (
            <Field
              label="Origem"
              name="sourceOther"
              value={form.sourceOther}
              onChange={updateField}
              onKeyDown={handleFieldKeyDown}
              placeholder="Digite a origem"
              error={fieldErrors.sourceOther}
              required
            />
          )}

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              <Thermometer size={14} />
              Temperatura
            </span>
            <select
              name="temperature"
              value={form.temperature}
              onChange={updateField}
              onKeyDown={handleFieldKeyDown}
              required
              className={getFieldClassName(fieldErrors.temperature)}
            >
              {TEMPERATURES.map((temperature) => (
                <option key={temperature}>{temperature}</option>
              ))}
            </select>
          </label>

          <Field
            label="Próximo contato"
            name="nextContact"
            type="date"
            value={form.nextContact}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
          />
          <Field
            label="Próxima ação"
            name="nextAction"
            value={form.nextAction}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            placeholder="Ex: ligar amanhã, enviar proposta, agendar demo"
          />
          <Field
            label="Link do Ploomes/CRM Vendas"
            name="crmLink"
            value={form.crmLink}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            icon={Link}
            placeholder="Cole aqui o link do Ploomes ou CRM Vendas"
          />
          <Field
            label="Valor estimado"
            name="estimatedValue"
            value={form.estimatedValue}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            placeholder="Ex: 549,90"
          />
          <label className="space-y-2 md:col-span-2 xl:col-span-3">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              Observação curta
            </span>
            <textarea
              name="note"
              value={form.note}
              onChange={updateField}
              rows={4}
              className="w-full resize-none rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
              placeholder="Digite uma observação rápida sobre o lead"
            />
          </label>
        </div>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-md border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200">
            {success}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-zinc-500">
            O lead será criado na etapa Suspect e registrado no histórico.
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Salvando...' : 'Salvar lead'}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  onKeyDown,
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
        {Icon && <Icon size={16} className="shrink-0 text-zinc-500" />}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
        />
      </span>
    </label>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  onKeyDown,
  options,
  error = false,
  required = false,
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
        onKeyDown={onKeyDown}
        required={required}
        className={getFieldClassName(error)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function normalizeFieldValue(name, value) {
  if (name === 'phone') {
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

function validateForm(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = true
  if (!form.contact.trim()) errors.contact = true
  if (!onlyDigits(form.phone)) errors.phone = true
  if (!form.product) errors.product = true
  if (form.product === 'Outro' && !form.productOther.trim()) errors.productOther = true
  if (!form.source) errors.source = true
  if (form.source === 'Outro' && !form.sourceOther.trim()) errors.sourceOther = true
  if (!form.temperature) errors.temperature = true

  return errors
}

function getFieldWrapperClassName(error) {
  return `flex h-11 items-center gap-2 rounded-md border bg-black/30 px-3 transition focus-within:border-red-500 ${
    error ? 'border-red-500/70 ring-1 ring-red-500/40' : 'border-white/10'
  }`
}

function getFieldClassName(error) {
  return `h-11 w-full rounded-md border bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500 ${
    error ? 'border-red-500/70 ring-1 ring-red-500/40' : 'border-white/10'
  }`
}

export default NewLead
