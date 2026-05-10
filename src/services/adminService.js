import { supabase } from '../lib/supabase'

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
