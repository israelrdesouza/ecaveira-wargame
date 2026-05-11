import { supabase } from '../lib/supabase'

const PROFILE_FIELDS =
  'id,nome,email,cargo,perfil,ativo,convite_status,convite_enviado_em,convite_aceito_em,convite_total_envios,ultimo_login_em,created_at,updated_at'

export async function getProfileById(userId) {
  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function updateProfileAccess(profileId, updates, currentUserId) {
  if (!profileId) {
    throw new Error('Usuário inválido.')
  }

  if (profileId === currentUserId && updates.ativo === false) {
    throw new Error('Você não pode bloquear seu próprio acesso.')
  }

  if (profileId === currentUserId && updates.perfil && updates.perfil !== 'admin') {
    throw new Error('Você não pode remover seu próprio perfil de administrador.')
  }

  const payload = {
    nome: updates.nome,
    cargo: updates.cargo,
    perfil: updates.perfil,
    ativo: updates.ativo,
    updated_at: new Date().toISOString(),
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined && key !== 'updated_at') {
      delete payload[key]
    }
  })

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', profileId)
    .select(PROFILE_FIELDS)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateOwnProfile(userId, updates) {
  if (!userId) {
    throw new Error('Usuário inválido.')
  }

  const payload = {
    nome: updates.nome,
    cargo: updates.cargo,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select(PROFILE_FIELDS)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function markInviteAccepted(userId) {
  if (!userId) {
    return null
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .update({
      convite_status: 'aceito',
      convite_aceito_em: now,
      ultimo_login_em: now,
      updated_at: now,
    })
    .eq('id', userId)
    .select(PROFILE_FIELDS)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}
