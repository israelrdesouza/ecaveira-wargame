import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getProfileById } from '../services/profileService'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function applySession(nextSession) {
      if (!isMounted) {
        return
      }

      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (!nextSession?.user?.id) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const nextProfile = await getProfileById(nextSession.user.id)

        if (!isMounted) {
          return
        }

        setProfile(nextProfile)
      } catch {
        if (!isMounted) {
          return
        }

        setProfile(null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (!error) {
        await applySession(data.session)
        return
      }

      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.sessionStorage.setItem('ecaveira_password_recovery', 'true')
      }

      applySession(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUp(email, password) {
    return supabase.auth.signUp({ email, password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  async function refreshSession() {
    setLoading(true)

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      setLoading(false)
      return
    }

    setSession(data.session)
    setUser(data.session?.user ?? null)

    if (!data.session?.user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const nextProfile = await getProfileById(data.session.user.id)
      setProfile(nextProfile)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = profile?.perfil === 'admin'
  const isBlocked = profile?.ativo === false

  return {
    session,
    user,
    profile,
    isAdmin,
    isBlocked,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  }
}
