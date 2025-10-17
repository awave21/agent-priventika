import { supabaseFetch } from '../lib/supabase'
import { users, settings } from './state'

export const loadUsersFromSupabase = async () => {
  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) return

  try {
    const { data, error } = await supabaseFetch<any[]>(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      'user_clients?select=*',
      {
        headers: {
          'Range': '0-999999',
          'Prefer': 'count=exact'
        }
      }
    )

    if (error) throw error

    console.log('📊 Количество полученных пользователей из Supabase:', data?.length || 0)
    console.log('📦 Полученные данные:', data)

    if (data) {
      users.value = data.map(item => ({
        id: item.chat_id,
        chatId: item.chat_id,
        phone: item.phone,
        name: item.name,
        username: item.username,
        avatarUri: item.avatar_uri,
        chatType: item.chat_type,
        messagesCount: item.messages_count || 0,
        notes: item.notes,
        tags: item.tags || [],
        isActive: item.is_active ?? true,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей из Supabase:', error)
  }
}

export const toggleUserActive = async (userId: string) => {
  const user = users.value.find(u => u.id === userId)
  if (!user) return

  const previousState = user.isActive
  const newActiveState = !user.isActive

  // Оптимистичное обновление UI
  user.isActive = newActiveState

  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) {
    return
  }

  try {
    const { error } = await supabaseFetch(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      `user_clients?chat_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ is_active: newActiveState })
      }
    )

    if (error) {
      console.error('Ошибка обновления статуса пользователя:', error)
      // Откатить изменения при ошибке
      user.isActive = previousState
      return
    }
  } catch (error) {
    console.error('Ошибка при переключении статуса пользователя:', error)
    // Откатить изменения при ошибке
    user.isActive = previousState
  }
}

export const activateAllUsers = async () => {
  // Сохраняем предыдущие состояния для отката
  const previousStates = users.value.map(user => ({
    id: user.id,
    isActive: user.isActive
  }))

  // Оптимистичное обновление UI
  users.value.forEach(user => {
    user.isActive = true
  })

  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) {
    return
  }

  try {
    const { error } = await supabaseFetch(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      'user_clients?chat_id=not.is.null',
      {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ is_active: true })
      }
    )

    if (error) {
      console.error('Ошибка массового активирования пользователей:', error)
      // Откатить изменения при ошибке
      previousStates.forEach(prevState => {
        const user = users.value.find(u => u.id === prevState.id)
        if (user) {
          user.isActive = prevState.isActive
        }
      })
      return
    }
  } catch (error) {
    console.error('Ошибка при активации всех пользователей:', error)
    // Откатить изменения при ошибке
    previousStates.forEach(prevState => {
      const user = users.value.find(u => u.id === prevState.id)
      if (user) {
        user.isActive = prevState.isActive
      }
    })
  }
}

export const deactivateAllUsers = async () => {
  // Сохраняем предыдущие состояния для отката
  const previousStates = users.value.map(user => ({
    id: user.id,
    isActive: user.isActive
  }))

  // Оптимистичное обновление UI
  users.value.forEach(user => {
    user.isActive = false
  })

  if (!settings.value.supabaseUrl || !settings.value.supabaseAnonKey) {
    return
  }

  try {
    const { error } = await supabaseFetch(
      settings.value.supabaseUrl,
      settings.value.supabaseAnonKey,
      'user_clients?chat_id=not.is.null',
      {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ is_active: false })
      }
    )

    if (error) {
      console.error('Ошибка массового деактивирования пользователей:', error)
      // Откатить изменения при ошибке
      previousStates.forEach(prevState => {
        const user = users.value.find(u => u.id === prevState.id)
        if (user) {
          user.isActive = prevState.isActive
        }
      })
      return
    }
  } catch (error) {
    console.error('Ошибка при деактивации всех пользователей:', error)
    // Откатить изменения при ошибке
    previousStates.forEach(prevState => {
      const user = users.value.find(u => u.id === prevState.id)
      if (user) {
        user.isActive = prevState.isActive
      }
    })
  }
}
