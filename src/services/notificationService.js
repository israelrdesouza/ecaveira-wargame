import { supabase } from '../lib/supabase'

const NOTIFICATION_FIELDS = 'id,tipo,titulo,mensagem,user_id,lida,created_at'

export async function createInviteAcceptedNotification({ userId, name, email }) {
  if (!userId) {
    return null
  }

  const displayName = name || email || 'Usuário'
  const { data, error } = await supabase
    .from('notificacoes')
    .insert({
      tipo: 'convite_aceito',
      titulo: 'Convite aceito',
      mensagem: `O usuário ${displayName} aceitou o convite e ativou o acesso.`,
      user_id: userId,
      lida: false,
    })
    .select(NOTIFICATION_FIELDS)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listUnreadNotifications() {
  const { data, error } = await supabase
    .from('notificacoes')
    .select(NOTIFICATION_FIELDS)
    .eq('lida', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function markNotificationAsRead(notificationId) {
  if (!notificationId) {
    return null
  }

  const { data, error } = await supabase
    .from('notificacoes')
    .update({
      lida: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select(NOTIFICATION_FIELDS)
    .single()

  if (error) {
    throw error
  }

  return data
}
