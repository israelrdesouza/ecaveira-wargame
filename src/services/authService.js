import { supabase } from '../lib/supabase'

export function sendPasswordResetEmail(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export function getCurrentAuthSession() {
  return supabase.auth.getSession()
}

export function exchangeRecoveryCodeForSession(code) {
  return supabase.auth.exchangeCodeForSession(code)
}

export function updateCurrentUserPassword(password) {
  return supabase.auth.updateUser({ password })
}

export function updateCurrentUserAuthData({ password, metadata }) {
  const payload = {
    data: metadata,
  }

  if (password) {
    payload.password = password
  }

  return supabase.auth.updateUser(payload)
}

export function updateFirstAccessPassword(password) {
  return supabase.auth.updateUser({
    password,
    data: {
      primeiro_acesso: false,
    },
  })
}

export function signOutCurrentUser() {
  return supabase.auth.signOut()
}
