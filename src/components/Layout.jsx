import { LogOut } from 'lucide-react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

function Layout({
  children,
  currentPage,
  navItems,
  sidebarNavItems = navItems,
  onNavigate,
  onSignOut,
  user,
  profile,
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07080a] text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(185,28,28,0.22),transparent_30rem),radial-gradient(circle_at_80%_20%,rgba(63,63,70,0.20),transparent_28rem),linear-gradient(135deg,#07080a_0%,#101115_44%,#050506_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
      </div>

      <Sidebar
        currentPage={currentPage}
        navItems={sidebarNavItems}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        user={user}
        profile={profile}
      />

      <main className="relative min-h-screen min-w-0 px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:ml-72 lg:px-8 lg:py-8">
        <div className="mb-4 flex justify-end lg:hidden">
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-zinc-950/70 px-3 text-xs font-black uppercase tracking-[0.12em] text-zinc-300 backdrop-blur transition hover:border-red-500/35 hover:text-white"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
        <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
      </main>

      <BottomNav
        currentPage={currentPage}
        navItems={navItems}
        onNavigate={onNavigate}
      />
    </div>
  )
}

export default Layout
