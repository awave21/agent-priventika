import { computed } from 'vue'
import { supabaseFetch } from '../lib/supabase'
import { ignoreList, users, settings } from './state'

export const ignoredUsers = computed(() => {
  return ignoreList.value.map(entry => {
    const user = users.value.find(u => u.id === entry.userId)
    return { ...entry, user }
  })
})

export const addToIgnoreList = async (userId: string) => {
  const exists = ignoreList.value.find(e => e.userId === userId)
  if (exists) return

  const newEntry = {
    id: Date.now().toString(),
    userId,
    createdAt: new Date()
  }

  ignoreList.value.push(newEntry)

  if (settings.value.supabaseUrl && settings.value.supabaseAnonKey) {
    try {
      await supabaseFetch(
        settings.value.supabaseUrl,
        settings.value.supabaseAnonKey,
        'ignore_list',
        {
          method: 'POST',
          body: JSON.stringify({ user_id: userId })
        }
      )
    } catch (error) {
      console.error('Ошибка синхронизации с Supabase:', error)
    }
  }
}

export const removeFromIgnoreList = async (entryId: string) => {
  const entry = ignoreList.value.find(e => e.id === entryId)
  if (!entry) return

  ignoreList.value = ignoreList.value.filter(e => e.id !== entryId)

  if (settings.value.supabaseUrl && settings.value.supabaseAnonKey) {
    try {
      await supabaseFetch(
        settings.value.supabaseUrl,
        settings.value.supabaseAnonKey,
        `ignore_list?user_id=eq.${entry.userId}`,
        {
          method: 'DELETE'
        }
      )
    } catch (error) {
      console.error('Ошибка синхронизации с Supabase:', error)
    }
  }
}

export const loadIgnoreListFromSupabase = async () => {
  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) return

  try {
    const { data, error } = await supabaseFetch<any[]>(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      'ignore_list?select=id,user_id,created_at'
    )

    if (error) throw error

    if (data) {
      ignoreList.value = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        createdAt: new Date(item.created_at)
      }))
    }
  } catch (error) {
    console.error('Ошибка загрузки ignore_list из Supabase:', error)
  }
}
