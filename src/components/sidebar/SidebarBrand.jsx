import { ChevronLeft, ChevronRight } from 'lucide-react'
import logo from '../../assets/ecaveira-logo.png'

function SidebarBrand({ collapsed, onNavigateHome, onToggleCollapsed }) {
  return (
    <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : 'justify-between'}`}>
      <button
        type="button"
        onClick={onNavigateHome}
        title="Ir para o Dashboard"
        aria-label="eCaveira WarGame — ir para o Dashboard"
        className="group flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-left transition hover:bg-white/[0.035]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-command/20 bg-black/25 shadow-[var(--shadow-glow)]">
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            className="h-5 w-5 object-contain transition duration-[var(--duration-base)] group-hover:scale-105"
          />
        </span>
        {!collapsed && (
          <span className="min-w-0 leading-none">
            <span className="flex items-baseline gap-1 truncate">
              <span className="text-[13px] font-black tracking-tight text-white">eCaveira</span>
              <span className="text-[13px] font-black tracking-tight text-command-hover">WarGame</span>
            </span>
            <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Cockpit comercial
            </span>
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onToggleCollapsed}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-pressed={collapsed}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-ink-muted transition hover:border-command-hover/40 hover:text-white"
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </div>
  )
}

export default SidebarBrand
