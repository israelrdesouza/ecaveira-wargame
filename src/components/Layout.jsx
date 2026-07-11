import { useRef, useState } from 'react'
import BottomNav from './BottomNav'
import MobileMoreMenu from './mobile/MobileMoreMenu'
import Sidebar from './Sidebar'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ecaveira:sidebar-collapsed'

function readStoredSidebarCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function persistSidebarCollapsed(value) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(value))
  } catch {
    // Preferência não pôde ser salva (ex.: localStorage indisponível);
    // a navegação continua funcionando normalmente.
  }
}

function Layout({
  children,
  currentPage,
  navItems,
  sidebarNavItems = navItems,
  onNavigate,
  onSignOut,
  user,
  profile,
  onProfileUpdated,
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readStoredSidebarCollapsed)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const sidebarRef = useRef(null)
  const isAdmin = profile?.perfil === 'admin'
  const mobileNavItems = navItems.filter((item) => item.id !== 'reports')

  function toggleSidebarCollapsed() {
    setIsSidebarCollapsed((current) => {
      const next = !current
      persistSidebarCollapsed(next)
      return next
    })
  }

  function openMoreMenu() {
    setIsMoreMenuOpen(true)
  }

  function closeMoreMenu() {
    setIsMoreMenuOpen(false)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07080a] text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(185,28,28,0.22),transparent_30rem),radial-gradient(circle_at_80%_20%,rgba(63,63,70,0.20),transparent_28rem),linear-gradient(135deg,#07080a_0%,#101115_44%,#050506_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
      </div>

      <Sidebar
        ref={sidebarRef}
        currentPage={currentPage}
        navItems={sidebarNavItems}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        user={user}
        profile={profile}
        onProfileUpdated={onProfileUpdated}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
      />

      <main
        className={`relative min-h-screen min-w-0 px-4 pb-24 pt-4 transition-[margin] duration-[var(--duration-base)] ease-out sm:px-6 sm:pt-6 lg:px-8 lg:py-8 ${
          isSidebarCollapsed ? 'lg:ml-[var(--sidebar-w-collapsed)]' : 'lg:ml-[var(--sidebar-w-expanded)]'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
      </main>

      <BottomNav
        items={mobileNavItems}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onOpenMore={openMoreMenu}
        isMoreOpen={isMoreMenuOpen}
      />

      <MobileMoreMenu
        isOpen={isMoreMenuOpen}
        onClose={closeMoreMenu}
        onNavigate={onNavigate}
        isAdmin={isAdmin}
        onOpenProfile={() => sidebarRef.current?.openProfileModal()}
        onOpenNotifications={() => sidebarRef.current?.openNotificationsModal()}
        onSignOut={onSignOut}
      />
    </div>
  )
}

export default Layout
