function BottomNav({ currentPage, navItems, onNavigate }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 px-2 pb-2 pt-2 shadow-2xl shadow-black/70 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md border px-1 text-[11px] font-black transition ${
                isActive
                  ? 'border-red-500/40 bg-red-600 text-white shadow-lg shadow-red-950/30'
                  : 'border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.05] hover:text-zinc-200'
              }`}
              aria-label={item.label}
            >
              <Icon size={19} strokeWidth={2.5} />
              <span className="w-full truncate text-center">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
