import { LogOut } from 'lucide-react'
import AppVersion from '../AppVersion'

function SidebarFooter({ collapsed, onSignOut }) {
  return (
    <div className="mt-auto space-y-2 pt-3">
      <button
        type="button"
        onClick={onSignOut}
        title="Sair"
        aria-label="Sair"
        className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-command/20 bg-surface text-xs font-black uppercase tracking-[0.12em] text-ink-secondary transition hover:border-command-hover/45 hover:bg-command-soft hover:text-white ${
          collapsed ? 'px-0' : ''
        }`}
      >
        <LogOut size={15} />
        {!collapsed && 'Sair'}
      </button>
      <AppVersion className="text-center" />
    </div>
  )
}

export default SidebarFooter
