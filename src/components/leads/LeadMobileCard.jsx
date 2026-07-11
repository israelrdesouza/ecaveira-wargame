import { ExternalLink, Eye, MessageCircle } from 'lucide-react'
import { formatCurrencyBRLWithCents, formatDateBR, formatPhoneBR } from '../../utils/formatters'
import {
  formatStage,
  formatTemperature,
  getLeadCompany,
  getLeadPhoneDigits,
  openPloomes,
  openWhatsApp,
} from '../../utils/leadHelpers'
import { Temperature } from './LeadsTable'

function LeadMobileCard({ lead, stageOptions, onOpenLead, onActionNotice }) {
  const estimatedValue = lead.valor_estimado ?? lead.value
  const contactName = lead.contato ?? lead.contact ?? 'Sem contato'
  const phoneLabel = formatPhoneBR(lead.celular ?? lead.phone)
  const nextActionLabel = String(lead.proxima_acao ?? '').trim() || 'Definir próxima ação'

  return (
    <article className="min-w-0 rounded-lg border border-white/5 bg-zinc-900/70 p-4 shadow-lg shadow-black/20 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-base font-black leading-snug text-white">
            {getLeadCompany(lead)}
          </h2>
          <p className="mt-0.5 truncate text-xs font-semibold text-zinc-500">
            {contactName}
            {phoneLabel ? ` • ${phoneLabel}` : ''}
          </p>
        </div>

        {estimatedValue ? (
          <p className="shrink-0 text-sm font-black text-white">
            {formatCurrencyBRLWithCents(estimatedValue)}
          </p>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Temperature value={formatTemperature(lead.temperatura ?? lead.temp)} />
        <ReadOnlyStageBadge lead={lead} stageOptions={stageOptions} />
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 text-sm min-[390px]:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-600">
            Próximo contato
          </p>
          <p className="mt-0.5 font-semibold text-zinc-200">{getOperationalNextContact(lead)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-600">
            Próxima ação
          </p>
          <p className="mt-0.5 line-clamp-2 font-medium text-zinc-400">{nextActionLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <IconAction
          tone="neutral"
          icon={Eye}
          label="Abrir detalhes"
          title="Abrir detalhes"
          onClick={() => onOpenLead(lead)}
        />
        <IconAction
          tone="green"
          icon={MessageCircle}
          label="WhatsApp"
          disabled={!getLeadPhoneDigits(lead)}
          title={getLeadPhoneDigits(lead) ? 'Abrir WhatsApp' : 'Celular não informado'}
          onClick={() => openWhatsApp(lead, onActionNotice)}
        />
        <IconAction
          tone="purple"
          icon={ExternalLink}
          label="Abrir Ploomes"
          title="Abrir Ploomes"
          onClick={() => openPloomes(lead, onActionNotice)}
        />
      </div>
    </article>
  )
}

function getOperationalNextContact(lead) {
  const rawValue = lead.proximo_contato ?? lead.next

  if (!rawValue) {
    return 'Sem data definida'
  }

  if (String(rawValue).includes('Hoje') || String(rawValue).includes('Amanhã')) {
    return rawValue
  }

  const dateOnly = String(rawValue).slice(0, 10)
  const todayISO = new Date().toISOString().slice(0, 10)
  const tomorrowISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  if (dateOnly === todayISO) {
    return 'Hoje'
  }

  if (dateOnly === tomorrowISO) {
    return 'Amanhã'
  }

  const formatted = formatDateBR(rawValue)

  return dateOnly < todayISO ? `Atrasado • ${formatted}` : formatted
}

function ReadOnlyStageBadge({ lead, stageOptions }) {
  const label = formatStage(lead.etapa_atual ?? lead.stage, stageOptions)

  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-md border border-white/10 bg-zinc-800/50 px-2.5 py-1 text-xs font-black text-zinc-200">
      {label}
    </span>
  )
}

function IconAction({ icon: Icon, label, tone = 'neutral', onClick, disabled = false, title }) {
  const tones = {
    green:
      'border-emerald-500/25 bg-emerald-950/20 text-emerald-300 hover:border-emerald-400/40 hover:text-emerald-200',
    neutral: 'border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:text-white',
    purple:
      'border-violet-500/25 bg-violet-950/20 text-violet-300 hover:border-violet-400/45 hover:text-violet-200',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  )
}

export default LeadMobileCard
