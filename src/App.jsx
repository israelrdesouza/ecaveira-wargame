import { useState } from 'react'
import Layout from './components/Layout'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import FirstAccessPassword from './pages/FirstAccessPassword'
import Goals from './pages/Goals'
import LandingPage from './pages/LandingPage'
import Leads from './pages/Leads'
import Login from './pages/Login'
import NewLead from './pages/NewLead'
import Reports from './pages/Reports'
import ResetPassword from './pages/ResetPassword'
import { useAuth } from './hooks/useAuth'
import { adminNavItem, navItems } from './lib/navigation'

const pages = {
  admin: Admin,
  dashboard: Dashboard,
  leads: Leads,
  newLead: NewLead,
  goals: Goals,
  reports: Reports,
}

function App() {
  const [currentPage, setCurrentPage] = useState(() =>
    window.location.pathname === '/admin' ? 'admin' : 'landing',
  )
  const {
    session,
    user,
    profile,
    isAdmin,
    isBlocked,
    loading,
    signIn,
    signOut,
    refreshSession,
  } = useAuth()
  const isResetPasswordRoute = window.location.pathname === '/reset-password'
  const sidebarNavItems = isAdmin ? [...navItems, adminNavItem] : navItems
  const requiresFirstAccessPassword = user?.user_metadata?.primeiro_acesso === true
  const activePageId =
    session && (currentPage === 'landing' || currentPage === 'login')
      ? 'dashboard'
      : currentPage
  const ActivePage = pages[activePageId] ?? Dashboard

  async function handleSignOut() {
    await signOut()
    setCurrentPage('login')
  }

  async function handleFirstAccessComplete() {
    await refreshSession()
    setCurrentPage('dashboard')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07080a] text-sm font-black uppercase tracking-[0.18em] text-red-300">
        Carregando WarGame...
      </div>
    )
  }

  if (isResetPasswordRoute) {
    return <ResetPassword onBackToLogin={() => setCurrentPage('login')} />
  }

  if (session && isBlocked) {
    return <BlockedAccess profile={profile} onSignOut={handleSignOut} />
  }

  if (session && requiresFirstAccessPassword) {
    return (
      <FirstAccessPassword
        onComplete={handleFirstAccessComplete}
        onSignOut={handleSignOut}
      />
    )
  }

  if (!session && currentPage === 'landing') {
    return <LandingPage onEnter={() => setCurrentPage('login')} />
  }

  if (!session) {
    return (
      <Login
        onBack={() => setCurrentPage('landing')}
        onSuccess={() => setCurrentPage('dashboard')}
        signIn={signIn}
      />
    )
  }

  return (
    <Layout
      currentPage={activePageId}
      navItems={navItems}
      sidebarNavItems={sidebarNavItems}
      onNavigate={setCurrentPage}
      onSignOut={handleSignOut}
      user={user}
      profile={profile}
      onProfileUpdated={refreshSession}
    >
      <ActivePage onNavigate={setCurrentPage} />
    </Layout>
  )
}

function BlockedAccess({ profile, onSignOut }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07080a] px-5 text-zinc-100 antialiased">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(220,38,38,0.22),transparent_24rem),linear-gradient(135deg,#07080a_0%,#111216_48%,#050506_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
      </div>

      <section className="relative w-full max-w-md rounded-lg border border-red-500/25 bg-zinc-950/80 p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
          Acesso bloqueado
        </p>
        <h1 className="mt-3 text-2xl font-black text-white">
          Seu acesso está temporariamente bloqueado.
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
          Entre em contato com o administrador para reativar seu usuário.
        </p>
        {profile?.nome && (
          <p className="mt-4 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm font-bold text-zinc-300">
            {profile.nome}
          </p>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-red-600 px-5 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-red-500"
        >
          Sair
        </button>
      </section>
    </main>
  )
}

export default App
