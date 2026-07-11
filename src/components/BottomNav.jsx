import { MoreHorizontal } from 'lucide-react'

function BottomNav({ items, currentPage, onNavigate, onOpenMore, isMoreOpen }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-strong pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[var(--shadow-panel)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end gap-1 px-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          if (item.id === 'newLead') {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 pb-1 text-[11px] font-black text-ink-secondary transition hover:text-white"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                    isActive
                      ? 'border-command-hover/50 bg-command text-white shadow-[var(--shadow-glow)]'
                      : 'border-command/30 bg-command-soft text-command-hover'
                  }`}
                >
                  <Icon size={20} strokeWidth={2.4} />
                </span>
                <span className="truncate">Novo</span>
              </button>
            )
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md border px-1 text-[11px] font-black transition ${
                isActive
                  ? 'border-command/20 bg-command-soft text-white'
                  : 'border-transparent text-ink-secondary hover:border-border hover:bg-white/[0.05] hover:text-ink'
              }`}
            >
              <Icon size={19} strokeWidth={2.5} />
              <span className="w-full truncate text-center">{item.label}</span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={onOpenMore}
          aria-label="Mais opções"
          aria-haspopup="dialog"
          aria-expanded={isMoreOpen}
          className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md border px-1 text-[11px] font-black transition ${
            isMoreOpen
              ? 'border-command/20 bg-command-soft text-white'
              : 'border-transparent text-ink-secondary hover:border-border hover:bg-white/[0.05] hover:text-ink'
          }`}
        >
          <MoreHorizontal size={19} strokeWidth={2.5} />
          <span className="w-full truncate text-center">Mais</span>
        </button>
      </div>
    </nav>
  )
}

export default BottomNav
