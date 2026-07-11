function LeadsFilters({
  stageOptions,
  temperatureOptions,
  selectedStage,
  selectedTemperature,
  onSelectStage,
  onSelectTemperature,
}) {
  return (
    <div className="space-y-4">
      <FilterGroup
        label="Etapa"
        items={stageOptions}
        active={selectedStage}
        onSelect={onSelectStage}
      />
      <FilterGroup
        label="Temperatura"
        items={temperatureOptions}
        active={selectedTemperature}
        onSelect={onSelectTemperature}
        subtle
      />
    </div>
  )
}

function FilterGroup({ label, items, active, onSelect, subtle = false }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-600">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const selected = item.value === active

          return (
            <button
              key={item.value || item.label}
              type="button"
              onClick={() => onSelect?.(item.value)}
              aria-pressed={selected}
              className={`rounded-md border px-3 py-2 text-xs font-black transition ${
                selected
                  ? 'border-red-500/40 bg-red-600 text-white shadow-lg shadow-red-950/25'
                  : subtle
                    ? 'border-white/10 bg-black/20 text-zinc-400 hover:border-red-500/30 hover:text-white'
                    : 'border-white/10 bg-black/30 text-zinc-400 hover:border-red-500/30 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default LeadsFilters
