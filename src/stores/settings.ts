import type { Settings } from '../types'
import { settings } from './state'
import { supabaseFetch } from '../lib/supabase'

const SETTINGS_STORAGE_KEY = 'harvi_settings'

export const saveSettingsToLocalStorage = (settingsData: Settings) => {
  try {
    const toStore = {
      agentMode: settingsData.agentMode,
      agentActive: settingsData.agentActive,
      sentNewUser: settingsData.sentNewUser,
      botResponseDelayMinutes: settingsData.botResponseDelayMinutes,
      supabaseUrl: settingsData.supabaseUrl,
      supabaseAnonKey: settingsData.supabaseAnonKey
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toStore))
  } catch (error) {
    console.error('Ошибка сохранения настроек в localStorage:', error)
  }
}

/**
 * Загружает состояние режима агента из таблицы agent в Supabase
 */
export const loadAgentModeFromSupabase = async () => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[loadAgentModeFromSupabase] Supabase не настроен, пропускаем загрузку')
    return
  }

  try {
    const { data, error } = await supabaseFetch<any[]>(
      url,
      key,
      'agent?select=*&order=id.desc&limit=1',
      {
        headers: {
          'Range': '0-0',
          'Prefer': 'count=exact'
        }
      }
    )

    if (error) {
      console.error('[loadAgentModeFromSupabase] Ошибка загрузки:', error)
      return
    }

    if (data && data.length > 0) {
      const agentRecord = data[0]
      const isAgentMode = agentRecord.mode === 'agent'
      const isActive = agentRecord.active === true
      const isSentNewUser = agentRecord.sent_new_user === true

      console.log('📥 Загружен режим из Supabase:', {
        mode: agentRecord.mode,
        active: agentRecord.active,
        sent_new_user: agentRecord.sent_new_user,
        agentMode: isAgentMode,
        agentActive: isActive,
        sentNewUser: isSentNewUser
      })

      settings.value.agentMode = isAgentMode
      settings.value.agentActive = isActive
      settings.value.sentNewUser = isSentNewUser
      settings.value.updatedAt = new Date()
    }
  } catch (error) {
    console.error('[loadAgentModeFromSupabase] Исключение:', error)
  }
}

/**
 * Синхронизирует состояние режима агента с таблицей agent в Supabase
 */
const syncAgentModeToSupabase = async (isAgentMode: boolean) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[syncAgentModeToSupabase] Supabase не настроен, пропускаем синхронизацию')
    return
  }

  const mode = isAgentMode ? 'agent' : 'manager'

  try {
    // Получаем последнюю запись
    const { data: existingData } = await supabaseFetch<any[]>(
      url,
      key,
      'agent?select=*&order=id.desc&limit=1'
    )

    if (existingData && existingData.length > 0) {
      // Обновляем существующую запись
      const recordId = existingData[0].id
      const { error } = await supabaseFetch(
        url,
        key,
        `agent?id=eq.${recordId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            mode,
            active: true,
            created_at: new Date().toISOString()
          })
        }
      )

      if (error) {
        console.error('[syncAgentModeToSupabase] Ошибка обновления:', error)
      } else {
        console.log('✅ Режим обновлен в Supabase:', mode)
      }
    } else {
      // Создаём новую запись
      const { error } = await supabaseFetch(
        url,
        key,
        'agent',
        {
          method: 'POST',
          body: JSON.stringify({
            mode,
            active: true
          })
        }
      )

      if (error) {
        console.error('[syncAgentModeToSupabase] Ошибка создания:', error)
      } else {
        console.log('✅ Режим сохранен в Supabase:', mode)
      }
    }
  } catch (error) {
    console.error('[syncAgentModeToSupabase] Исключение:', error)
  }
}

export const toggleAgentMode = async () => {
  settings.value.agentMode = !settings.value.agentMode
  settings.value.updatedAt = new Date()

  // Синхронизируем с Supabase
  await syncAgentModeToSupabase(settings.value.agentMode)
}

/**
 * Переключает состояние active агента и синхронизирует с Supabase
 */
export const toggleAgentActive = async () => {
  settings.value.agentActive = !settings.value.agentActive
  settings.value.updatedAt = new Date()

  // Синхронизируем с Supabase
  await syncAgentActiveToSupabase(settings.value.agentActive)
}

/**
 * Синхронизирует состояние active с таблицей agent в Supabase
 */
const syncAgentActiveToSupabase = async (isActive: boolean) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[syncAgentActiveToSupabase] Supabase не настроен, пропускаем синхронизацию')
    return
  }

  try {
    // Получаем последнюю запись
    const { data: existingData } = await supabaseFetch<any[]>(
      url,
      key,
      'agent?select=*&order=id.desc&limit=1'
    )

    if (existingData && existingData.length > 0) {
      // Обновляем существующую запись
      const recordId = existingData[0].id
      const { error } = await supabaseFetch(
        url,
        key,
        `agent?id=eq.${recordId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            active: isActive
          })
        }
      )

      if (error) {
        console.error('[syncAgentActiveToSupabase] Ошибка обновления:', error)
      } else {
        console.log('✅ Статус active обновлен в Supabase:', isActive)
      }
    } else {
      console.warn('[syncAgentActiveToSupabase] Запись не найдена, создаём новую')
      // Создаём новую запись
      const { error } = await supabaseFetch(
        url,
        key,
        'agent',
        {
          method: 'POST',
          body: JSON.stringify({
            mode: settings.value.agentMode ? 'agent' : 'manager',
            active: isActive
          })
        }
      )

      if (error) {
        console.error('[syncAgentActiveToSupabase] Ошибка создания:', error)
      } else {
        console.log('✅ Статус active сохранен в Supabase:', isActive)
      }
    }
  } catch (error) {
    console.error('[syncAgentActiveToSupabase] Исключение:', error)
  }
}

/**
 * Переключает режим отправки сообщений новым пользователям
 */
export const toggleSentNewUser = async () => {
  settings.value.sentNewUser = !settings.value.sentNewUser
  settings.value.updatedAt = new Date()

  // Синхронизируем с Supabase
  await syncSentNewUserToSupabase(settings.value.sentNewUser)
}

/**
 * Синхронизирует состояние sent_new_user с таблицей agent в Supabase
 */
const syncSentNewUserToSupabase = async (sentNewUser: boolean) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[syncSentNewUserToSupabase] Supabase не настроен, пропускаем синхронизацию')
    return
  }

  try {
    // Получаем последнюю запись
    const { data: existingData } = await supabaseFetch<any[]>(
      url,
      key,
      'agent?select=*&order=id.desc&limit=1'
    )

    if (existingData && existingData.length > 0) {
      // Обновляем существующую запись
      const recordId = existingData[0].id
      const { error } = await supabaseFetch(
        url,
        key,
        `agent?id=eq.${recordId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            sent_new_user: sentNewUser
          })
        }
      )

      if (error) {
        console.error('[syncSentNewUserToSupabase] Ошибка обновления:', error)
      } else {
        console.log('✅ Статус sent_new_user обновлен в Supabase:', sentNewUser)
      }
    } else {
      console.warn('[syncSentNewUserToSupabase] Запись не найдена, создаём новую')
      // Создаём новую запись
      const { error } = await supabaseFetch(
        url,
        key,
        'agent',
        {
          method: 'POST',
          body: JSON.stringify({
            mode: settings.value.agentMode ? 'agent' : 'manager',
            active: settings.value.agentActive,
            sent_new_user: sentNewUser
          })
        }
      )

      if (error) {
        console.error('[syncSentNewUserToSupabase] Ошибка создания:', error)
      } else {
        console.log('✅ Статус sent_new_user сохранен в Supabase:', sentNewUser)
      }
    }
  } catch (error) {
    console.error('[syncSentNewUserToSupabase] Исключение:', error)
  }
}

export const updateSettings = (updates: Partial<Settings>) => {
  settings.value = { ...settings.value, ...updates, updatedAt: new Date() }
  saveSettingsToLocalStorage(settings.value)
}
