import { PlusCircle } from 'lucide-react'

function LeadsHeader({ resultCount, isLoading, onCreateLead }) {
  const countLabel = isLoading
    ? 'Carregando leads...'
    : `${resultCount} lead${resultCount === 1 ? '' : 's'}`

  return (
    <header className="rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-lg shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300 sm:hidden">
            {countLabel}
          </p>

          <h1 className="hidden text-2xl font-black tracking-tight text-white sm:block lg:text-3xl">
            Leads
          </h1>
          <p className="mt-1 hidden max-w-xl text-sm font-medium leading-6 text-zinc-400 sm:block">
            Priorize por etapa, temperatura e próximo contato.
          </p>
          <p className="mt-2 hidden text-xs font-black uppercase tracking-[0.14em] text-zinc-500 sm:block">
            {countLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateLead}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300/50"
        >
          <PlusCircle size={18} aria-hidden="true" />
          Novo Lead
        </button>
      </div>
    </header>
  )
}

export default LeadsHeader
