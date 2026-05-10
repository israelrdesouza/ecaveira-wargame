import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import LandingPage from './pages/LandingPage'
import Leads from './pages/Leads'
import Login from './pages/Login'
import NewLead from './pages/NewLead'
import Reports from './pages/Reports'
import ResetPassword from './pages/ResetPassword'
import { useAuth } from './hooks/useAuth'
import { navItems } from './lib/navigation'

const pages = {
  dashboard: Dashboard,
  leads: Leads,
  newLead: NewLead,
  goals: Goals,
  reports: Reports,
}

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const { session, user, loading, signIn, signOut } = useAuth()
  const isResetPasswordRoute = window.location.pathname === '/reset-password'
  const activePageId =
    session && (currentPage === 'landing' || currentPage === 'login')
      ? 'dashboard'
      : currentPage
  const ActivePage = pages[activePageId] ?? Dashboard

  async function handleSignOut() {
    await signOut()
    setCurrentPage('login')
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
      onNavigate={setCurrentPage}
      onSignOut={handleSignOut}
      user={user}
    >
      <ActivePage onNavigate={setCurrentPage} />
    </Layout>
  )
}

export default App
