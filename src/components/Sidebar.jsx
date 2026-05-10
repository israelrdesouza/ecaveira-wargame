import { LogOut, RadioTower, ShieldCheck, Zap } from 'lucide-react'
import logo from '../assets/ecaveira-logo.png'

function Sidebar({ currentPage, navItems, onNavigate, onSignOut, user }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-zinc-950/85 px-4 py-5 shadow-2xl shadow-black/50 backdrop-blur-xl lg:block">
      <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="group flex w-full items-center gap-3 rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-left shadow-[0_0_35px_rgba(127,29,29,0.12)] transition hover:border-red-500/45 hover:bg-red-950/30"
        >
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-red-500/25 bg-black/35 shadow-[0_0_26px_rgba(220,38,38,0.26)]">
            <span className="absolute inset-1 rounded-md bg-red-600/20 blur-md motion-safe:animate-pulse" />
            <img
              src={logo}
              alt="eCaveira WarGame"
              className="relative h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(248,113,113,0.45)] transition duration-300 ease-out group-hover:scale-105"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black uppercase tracking-wide text-white">
              eCaveira WarGame
            </span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-red-200/80">
              Cockpit comercial pessoal
            </span>
          </span>
        </button>

        <div className="mt-6 rounded-lg border border-white/10 bg-zinc-900/45 p-3">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
            <span>Status</span>
            <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.85)]" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Signal label="Foco" value="87%" />
            <Signal label="Ritmo" value="Alto" />
          </div>
        </div>

        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-extrabold transition ${
                  isActive
                    ? 'border border-red-500/30 bg-red-600 text-white shadow-lg shadow-red-950/35'
                    : 'border border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.045] hover:text-zinc-100'
                }`}
              >
                <Icon size={18} strokeWidth={2.4} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
            <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-zinc-600">
              Operador
            </p>
            <p className="mt-1 truncate text-sm font-bold text-zinc-200">
              {user?.email}
            </p>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-500/25 bg-red-950/20 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:border-red-400/45 hover:bg-red-950/35 hover:text-white"
            >
              <LogOut size={15} />
              Sair
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-red-500/30 bg-red-950/35 text-red-300">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="text-sm font-black text-white">Modo Ataque</p>
                <p className="mt-0.5 text-xs font-medium text-zinc-500">
                  Pipeline sob vigilância
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-600">
            <RadioTower size={14} />
            <span>Operação local, sem backend</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Signal({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
        <Zap size={12} />
        {label}
      </div>
      <p className="mt-1 text-sm font-black text-zinc-100">{value}</p>
    </div>
  )
}

export default Sidebar
