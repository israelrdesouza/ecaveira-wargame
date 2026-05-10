import { supabase } from '../lib/supabase'

const PROFILE_FIELDS = 'id,nome,email,cargo,perfil,ativo,created_at,updated_at'

export async function createUser(payload) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: payload,
  })

  if (error) {
    const functionErrorMessage = await getFunctionErrorMessage(error)
    throw new Error(functionErrorMessage || error.message || 'Erro ao criar usuário.')
  }

  if (!data?.success) {
    throw new Error(data?.message || 'Erro ao criar usuário.')
  }

  return data
}

export async function listUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar os usuários.')
  }

  return data ?? []
}

export async function deleteUser(userId) {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: {
      user_id: userId,
    },
  })

  if (error) {
    const functionErrorMessage = await getFunctionErrorMessage(error)
    throw new Error(functionErrorMessage || error.message || 'Não foi possível excluir o usuário.')
  }

  if (!data?.success) {
    throw new Error(data?.message || 'Não foi possível excluir o usuário.')
  }

  return data
}

async function getFunctionErrorMessage(error) {
  try {
    const context = error.context

    if (context && typeof context.json === 'function') {
      const body = await context.json()
      return body?.message
    }
  } catch {
    return ''
  }

  return ''
}
