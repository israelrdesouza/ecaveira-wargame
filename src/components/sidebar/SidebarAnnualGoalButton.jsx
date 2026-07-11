import { BadgeDollarSign } from 'lucide-react'
import { formatCurrencyBRLWithCents } from '../../utils/formatters'

function formatAnnualGoalValidity(value) {
  if (!value) {
    return 'sem vigência'
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-')
    return `${month}/${year}`
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-BR', {
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function SidebarAnnualGoalButton({ collapsed, year, hasGoal, value, validUntil, onOpen }) {
  const label = `Meta ${year}`
  const displayValue = hasGoal ? formatCurrencyBRLWithCents(value) : 'Não configurada'

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onOpen}
        title={`${label}: ${displayValue}`}
        aria-label={`${label}: ${displayValue}`}
        className="mt-2 flex h-10 w-full items-center justify-center rounded-md border border-border bg-surface text-command-hover transition hover:border-command-hover/40"
      >
        <BadgeDollarSign size={17} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-2 flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-left transition hover:border-command-hover/35"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-command/25 bg-black/25 text-command-hover">
        <BadgeDollarSign size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-black uppercase tracking-[0.16em] text-ink-muted">
          {label}
        </span>
        <span className="block truncate text-sm font-black leading-tight text-white">
          {displayValue}
        </span>
      </span>
      {hasGoal && (
        <span className="shrink-0 text-[10px] font-semibold text-ink-muted">
          até {formatAnnualGoalValidity(validUntil)}
        </span>
      )}
    </button>
  )
}

export default SidebarAnnualGoalButton
