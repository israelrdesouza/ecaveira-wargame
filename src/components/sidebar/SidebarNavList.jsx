function SidebarNavList({ collapsed, items, currentPage, onNavigate }) {
  return (
    <nav className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = currentPage === item.id

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex h-11 w-full items-center gap-3 rounded-md border px-3 text-sm font-extrabold transition ${
              collapsed ? 'justify-center px-0' : ''
            } ${
              isActive
                ? 'border-command/20 bg-command-soft text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-command-hover'
                : 'border-transparent text-ink-secondary hover:border-border hover:bg-white/[0.045] hover:text-ink'
            }`}
          >
            <Icon size={18} strokeWidth={2.4} />
            {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}

export default SidebarNavList
