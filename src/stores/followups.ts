import { supabaseFetch } from '../lib/supabase'
import { followups, settings } from './state'

export const loadFollowupsFromSupabase = async () => {
  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) return

  try {
    const { data, error } = await supabaseFetch<any[]>(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      'followups?select=*&order=created_at.asc'
    )

    if (error) throw error

    if (data) {
      followups.value = data.map(item => ({
        id: item.id,
        chatId: item.chat_id || undefined,
        text: item.text,
        intervalMinutes: item.interval_minutes,
        isDefault: item.is_default ?? false,
        isSent: item.is_sent ?? false,
        sentAt: item.sent_at ? new Date(item.sent_at) : null,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))
    }
  } catch (error) {
    console.error('Ошибка загрузки напоминаний из Supabase:', error)
  }
}

export const addFollowup = async (text: string, intervalMinutes: number, isDefault = false, chatId?: string) => {
  const tempId = Date.now().toString()
  const newFollowup = {
    id: tempId,
    chatId,
    text,
    intervalMinutes,
    isDefault,
    isSent: false,
    sentAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // Оптимистичное обновление UI
  followups.value.push(newFollowup)

  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) {
    return
  }

  try {
    const { data, error } = await supabaseFetch<any>(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      'followups',
      {
        method: 'POST',
        headers: {
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          chat_id: chatId || null,
          text: text,
          interval_minutes: intervalMinutes,
          is_default: isDefault,
          is_sent: false
        })
      }
    )

    if (error) {
      console.error('Ошибка создания напоминания:', error)
      // Откатить изменения при ошибке
      followups.value = followups.value.filter(f => f.id !== tempId)
      return
    }

    // Обновить временный ID на реальный из БД
    if (data && Array.isArray(data) && data.length > 0) {
      const createdFollowup = data[0]
      const index = followups.value.findIndex(f => f.id === tempId)
      if (index !== -1) {
        followups.value[index] = {
          id: createdFollowup.id,
          chatId: createdFollowup.chat_id || undefined,
          text: createdFollowup.text,
          intervalMinutes: createdFollowup.interval_minutes,
          isDefault: createdFollowup.is_default ?? false,
          isSent: createdFollowup.is_sent ?? false,
          sentAt: createdFollowup.sent_at ? new Date(createdFollowup.sent_at) : null,
          createdAt: new Date(createdFollowup.created_at),
          updatedAt: new Date(createdFollowup.updated_at)
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при создании напоминания:', error)
    // Откатить изменения при ошибке
    followups.value = followups.value.filter(f => f.id !== tempId)
  }
}

export const removeFollowup = async (id: string) => {
  // Сохраняем для отката
  const index = followups.value.findIndex(f => f.id === id)
  if (index === -1) return

  const removed = followups.value[index]

  // Оптимистичное обновление UI
  followups.value = followups.value.filter(f => f.id !== id)

  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) {
    return
  }

  try {
    const { error } = await supabaseFetch(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      `followups?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'Prefer': 'return=minimal'
        }
      }
    )

    if (error) {
      console.error('Ошибка удаления напоминания:', error)
      // Откатить изменения при ошибке
      followups.value.splice(index, 0, removed)
      return
    }
  } catch (error) {
    console.error('Ошибка при удалении напоминания:', error)
    // Откатить изменения при ошибке
    followups.value.splice(index, 0, removed)
  }
}

export const updateFollowup = async (id: string, text: string, intervalMinutes: number) => {
  const followup = followups.value.find(f => f.id === id)
  if (!followup) return

  // Сохраняем предыдущие значения для отката
  const previousText = followup.text
  const previousIntervalMinutes = followup.intervalMinutes

  // Оптимистичное обновление UI
  followup.text = text
  followup.intervalMinutes = intervalMinutes
  followup.updatedAt = new Date()

  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) {
    return
  }

  try {
    const { error } = await supabaseFetch(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      `followups?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          text: text,
          interval_minutes: intervalMinutes,
          updated_at: new Date().toISOString()
        })
      }
    )

    if (error) {
      console.error('Ошибка обновления напоминания:', error)
      // Откатить изменения при ошибке
      followup.text = previousText
      followup.intervalMinutes = previousIntervalMinutes
      return
    }
  } catch (error) {
    console.error('Ошибка при обновлении напоминания:', error)
    // Откатить изменения при ошибке
    followup.text = previousText
    followup.intervalMinutes = previousIntervalMinutes
  }
}
