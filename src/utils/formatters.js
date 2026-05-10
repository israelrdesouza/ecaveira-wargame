export function formatCurrencyBRL(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 'R$ 0'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(numericValue)
}

export function formatCurrencyBRLWithCents(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 'R$ 0,00'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

export function formatPhoneBR(value) {
  const digits = String(value ?? '').replace(/\D/g, '')

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return value || ''
}

export function formatPercent(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return '0%'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(numericValue / 100)
}

export function formatDateBR(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTimeBR(value) {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return `${values.day}/${values.month}/${values.year} ${values.hour}:${values.minute}`
}
