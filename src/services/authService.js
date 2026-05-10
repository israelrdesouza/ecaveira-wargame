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

export function signOutCurrentUser() {
  return supabase.auth.signOut()
}
