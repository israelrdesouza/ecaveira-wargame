import { CalendarClock, Plus } from 'lucide-react'

function DashboardHeader({ mes, ano, onOpenPeriod, onCreateLead }) {
  return (
    <header className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
            Cockpit comercial
          </p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-zinc-400">
            Metas, pipeline e follow-ups do período selecionado, em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={onOpenPeriod}
            title="Selecionar período"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/25 px-4 text-sm font-black text-zinc-200 transition hover:border-red-500/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300/40"
          >
            <CalendarClock size={16} className="text-red-300" aria-hidden="true" />
            {String(mes).padStart(2, '0')}/{ano}
          </button>

          <button
            type="button"
            onClick={onCreateLead}
            title="Novo alvo"
            aria-label="Novo alvo"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-400/35 bg-red-600 text-white shadow-lg shadow-red-950/35 transition hover:scale-105 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300/50"
          >
            <Plus className="h-5 w-5" strokeWidth={2.8} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
