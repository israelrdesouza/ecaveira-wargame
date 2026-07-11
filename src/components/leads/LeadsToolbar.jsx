import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import LeadsFilters from './LeadsFilters'

function LeadsToolbar({
  searchTerm,
  onSearchChange,
  sortOption,
  onSortChange,
  sortOptions,
  stageOptions,
  temperatureOptions,
  selectedStage,
  onSelectStage,
  selectedTemperature,
  onSelectTemperature,
  activeFilterCount,
  onClearFilters,
}) {
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const hasActiveFilters = activeFilterCount > 0 || searchTerm.trim() !== ''
  const selectedSortLabel =
    sortOptions.find((option) => option.value === sortOption)?.label ?? 'Ordenar'

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-lg shadow-black/20 backdrop-blur">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="flex h-11 min-w-0 items-center gap-3 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500/50">
          <Search size={18} className="shrink-0 text-zinc-500" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por empresa, pessoa ou contato"
            aria-label="Buscar leads"
            className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
          />
        </label>

        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(true)}
          className="relative inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 text-sm font-black text-zinc-200 transition hover:border-red-500/40 hover:text-white lg:hidden"
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setIsSortOpen((current) => !current)}
            aria-expanded={isSortOpen}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-500 lg:w-auto"
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            Ordenar
          </button>
          {isSortOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-md border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50">
              <div className="border-b border-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600">
                {selectedSortLabel}
              </div>
              {sortOptions.map((option) => {
                const selected = option.value === sortOption

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSortChange(option.value)
                      setIsSortOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-bold transition ${
                      selected
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {option.label}
                    {selected && <span className="text-xs">Ativo</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsSortOpen((current) => !current)}
          aria-expanded={isSortOpen}
          className="relative inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 text-sm font-black text-zinc-200 transition hover:border-red-500/40 hover:text-white lg:hidden"
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          {selectedSortLabel}
        </button>
      </div>

      {isSortOpen && (
        <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-zinc-950 shadow-xl shadow-black/40 lg:hidden">
          {sortOptions.map((option) => {
            const selected = option.value === sortOption

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value)
                  setIsSortOpen(false)
                }}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-bold transition ${
                  selected ? 'bg-red-600 text-white' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {option.label}
                {selected && <span className="text-xs">Ativo</span>}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-4 hidden lg:block">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-600">
            Filtros
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-black uppercase tracking-[0.1em] text-red-300 transition hover:text-white"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="mt-2">
          <LeadsFilters
            stageOptions={stageOptions}
            temperatureOptions={temperatureOptions}
            selectedStage={selectedStage}
            selectedTemperature={selectedTemperature}
            onSelectStage={onSelectStage}
            onSelectTemperature={onSelectTemperature}
          />
        </div>
      </div>

      {isMobileFiltersOpen && (
        <MobileFiltersDrawer
          stageOptions={stageOptions}
          temperatureOptions={temperatureOptions}
          selectedStage={selectedStage}
          selectedTemperature={selectedTemperature}
          onSelectStage={onSelectStage}
          onSelectTemperature={onSelectTemperature}
          activeFilterCount={activeFilterCount}
          onClearFilters={onClearFilters}
          onClose={() => setIsMobileFiltersOpen(false)}
        />
      )}
    </div>
  )
}

function MobileFiltersDrawer({
  stageOptions,
  temperatureOptions,
  selectedStage,
  selectedTemperature,
  onSelectStage,
  onSelectTemperature,
  activeFilterCount,
  onClearFilters,
  onClose,
}) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    closeButtonRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch justify-end lg:hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de leads"
        className="relative flex h-full w-full max-w-sm flex-col border-l border-border bg-surface-strong shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
              {activeFilterCount} filtro{activeFilterCount === 1 ? '' : 's'} ativo
              {activeFilterCount === 1 ? '' : 's'}
            </p>
            <h2 className="mt-1 text-lg font-black text-white">Filtrar leads</h2>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fechar filtros"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <LeadsFilters
            stageOptions={stageOptions}
            temperatureOptions={temperatureOptions}
            selectedStage={selectedStage}
            selectedTemperature={selectedTemperature}
            onSelectStage={onSelectStage}
            onSelectTemperature={onSelectTemperature}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 text-sm font-black text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpar filtros
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 text-sm font-black text-white transition hover:bg-red-500"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default LeadsToolbar
