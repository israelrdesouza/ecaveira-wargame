import { AlertTriangle, Flame, Loader2, Search } from 'lucide-react'

function LeadsEmptyState({ variant, errorMessage, onClearFilters }) {
  if (variant === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/70 p-6 text-sm font-semibold text-zinc-400 shadow-lg shadow-black/20 backdrop-blur">
        <Loader2 size={18} className="animate-spin text-red-300" aria-hidden="true" />
        Carregando leads...
      </div>
    )
  }

  if (variant === 'error') {
    return (
      <div className="rounded-lg border border-red-500/25 bg-red-950/20 p-8 text-center shadow-lg shadow-black/20">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-red-500/30 bg-red-950/30 text-red-300">
          <AlertTriangle size={23} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-black text-white">
          Não foi possível carregar os leads.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-zinc-400">
          {errorMessage || 'Verifique sua conexão e tente novamente em instantes.'}
        </p>
      </div>
    )
  }

  if (variant === 'no-results') {
    return (
      <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-8 text-center shadow-lg shadow-black/20 backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
          <Search size={23} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-black text-white">
          Nenhum lead encontrado com os filtros selecionados.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-zinc-500">
          Ajuste a busca, etapa, temperatura ou ordenação para consultar outros alvos.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mx-auto mt-4 inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-black text-zinc-200 transition hover:border-red-500/40 hover:text-white"
          >
            Limpar filtros
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-8 text-center shadow-lg shadow-black/20 backdrop-blur">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
        <Flame size={23} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-black text-white">
        Nenhum lead cadastrado ainda. Cadastre seu primeiro alvo.
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-zinc-500">
        Assim que um lead for salvo, ele aparecerá neste radar.
      </p>
    </div>
  )
}

export default LeadsEmptyState
