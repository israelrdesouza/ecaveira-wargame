import { ExternalLink, Flame, Loader2, MessageCircle } from 'lucide-react'
import { formatCurrencyBRL, formatPhoneBR } from '../../utils/formatters'
import {
  formatStage,
  formatTemperature,
  getLeadCompany,
  getLeadNextContact,
  getLeadPhoneDigits,
  isLeadActionTarget,
  normalizeStageValue,
  openPloomes,
  openWhatsApp,
} from '../../utils/leadHelpers'

export function StageSelect({ lead, stageOptions, isMoving, onMoveStage }) {
  const currentStage = normalizeStageValue(lead.etapa_atual ?? lead.stage, stageOptions)

  return (
    <label
      data-lead-action
      className="relative inline-flex h-10 w-full min-w-[138px] items-center rounded-md border border-white/10 bg-black/20 text-xs font-black text-zinc-300 transition focus-within:border-red-500/40 hover:border-zinc-500/50 hover:text-white sm:w-auto"
    >
      {isMoving && <Loader2 size={14} className="ml-2 shrink-0 animate-spin text-red-300" />}
      <select
        value={currentStage}
        disabled={isMoving || !lead.id}
        onChange={(event) => onMoveStage(lead, event.target.value)}
        className="h-full w-full rounded-md bg-transparent px-3 text-xs font-black text-zinc-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {stageOptions.map((stage) => (
          <option key={stage.value} value={stage.value} className="bg-zinc-950">
            {stage.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Temperature({ value }) {
  const warm = value === 'Caveira' || value === 'Quente'

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-black ${
        warm
          ? 'border-red-500/30 bg-red-950/30 text-red-200'
          : 'border-zinc-600/30 bg-zinc-800/50 text-zinc-300'
      }`}
    >
      <Flame size={13} aria-hidden="true" />
      {value}
    </span>
  )
}

export function ActionButton({ icon: Icon, label, tone = 'zinc', onClick, disabled = false, title }) {
  const tones = {
    zinc: 'border-white/10 bg-black/20 text-zinc-300 hover:border-zinc-500/50 hover:text-white',
    red: 'border-red-500/25 bg-red-950/20 text-red-200 hover:border-red-400/45',
    green: 'border-emerald-500/25 bg-emerald-950/20 text-emerald-200 hover:border-emerald-400/45',
  }

  return (
    <button
      type="button"
      data-lead-action
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title || label}
      className={`inline-flex h-10 w-full min-w-[138px] items-center justify-center gap-2 rounded-md border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto ${tones[tone]}`}
    >
      <Icon size={15} aria-hidden="true" />
      {label}
    </button>
  )
}

function LeadsTable({ leads, stageOptions, movingLeadId, onMoveStage, onOpenLead, onActionNotice }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-lg shadow-black/20 backdrop-blur">
      <div className="grid grid-cols-[1.4fr_0.7fr_0.75fr_0.85fr_1.1fr_0.7fr_1.3fr] gap-4 border-b border-white/10 bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
        <span>Empresa / Contato</span>
        <span>Etapa</span>
        <span>Temperatura</span>
        <span>Próx. contato</span>
        <span>Próxima ação</span>
        <span>Valor</span>
        <span>Ações</span>
      </div>

      <div className="divide-y divide-white/10">
        {leads.map((lead) => (
          <article
            key={lead.id ?? getLeadCompany(lead)}
            onDoubleClick={(event) => {
              if (isLeadActionTarget(event.target) || !lead.id) return
              onOpenLead(lead)
            }}
            title="Duplo clique para abrir detalhes"
            className="grid cursor-pointer grid-cols-[1.4fr_0.7fr_0.75fr_0.85fr_1.1fr_0.7fr_1.3fr] items-center gap-4 p-4 transition hover:bg-white/[0.025]"
          >
            <div className="min-w-0">
              <h2 className="truncate font-black text-white">{getLeadCompany(lead)}</h2>
              <p className="mt-1 truncate text-xs font-semibold text-zinc-500">
                {lead.contato ?? lead.contact ?? 'Sem contato'} ·{' '}
                {formatPhoneBR(lead.celular ?? lead.phone) || 'sem celular'}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                {lead.origem ?? lead.origin ?? 'Origem não informada'}
              </p>
            </div>

            <span className="w-fit rounded-md border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-black text-zinc-200">
              {formatStage(lead.etapa_atual ?? lead.stage, stageOptions)}
            </span>

            <Temperature value={formatTemperature(lead.temperatura ?? lead.temp)} />

            <p className="text-sm font-semibold text-zinc-300">{getLeadNextContact(lead)}</p>

            <p className="truncate text-sm font-medium text-zinc-400">
              {lead.proxima_acao || lead.ultima_acao || 'Sem próxima ação'}
            </p>

            <p className="text-sm font-black text-white">
              {formatCurrencyBRL(lead.valor_estimado ?? lead.value)}
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <StageSelect
                lead={lead}
                stageOptions={stageOptions}
                isMoving={movingLeadId === lead.id}
                onMoveStage={onMoveStage}
              />
              <ActionButton
                tone="green"
                icon={MessageCircle}
                label="WhatsApp"
                disabled={!getLeadPhoneDigits(lead)}
                title={getLeadPhoneDigits(lead) ? 'Abrir WhatsApp' : 'Celular não informado'}
                onClick={() => openWhatsApp(lead, onActionNotice)}
              />
              <ActionButton
                tone="zinc"
                icon={ExternalLink}
                label="Ploomes"
                title="Abrir Ploomes"
                onClick={() => openPloomes(lead, onActionNotice)}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default LeadsTable
