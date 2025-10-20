import { createClient } from '@supabase/supabase-js'
import type { Message } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Отсутствуют переменные окружения Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Типы для аутентификации Supabase
export interface SupabaseUser {
  id: string
  email: string
  created_at: string
}

// Расширяем существующий тип Message для real-time
export interface RealtimeMessage extends Message {
  // Дополнительные поля для Supabase real-time
  created_at?: string
  updated_at?: string
}

// Типы для real-time подписок
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimePayload {
  eventType: RealtimeEvent
  new: RealtimeMessage
  old: RealtimeMessage
}

// Тип для статуса подписки
export interface SubscriptionStatus {
  state: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'
  error?: Error
}

// Кастомная функция для выполнения HTTP запросов к Supabase REST API
export const supabaseFetch = async <T = any>(
  supabaseUrl: string,
  supabaseKey: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: Error }> => {
  try {
    const url = `${supabaseUrl}/rest/v1/${endpoint}`
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    }

    console.log('🌐 [supabaseFetch] Запрос к:', url)
    console.log('🔑 [supabaseFetch] API ключ:', supabaseKey ? '[СКРЫТ]' : 'ОТСУТСТВУЕТ')
    console.log('📝 [supabaseFetch] Заголовки:', headers)

    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log('📡 [supabaseFetch] Ответ сервера:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [supabaseFetch] Ошибка ответа сервера:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText || response.statusText}`)
    }

    // Проверяем, есть ли тело ответа
    const contentLength = response.headers.get('content-length')
    const hasContent = contentLength !== '0' && response.headers.get('transfer-encoding') !== 'chunked' || true

    console.log('📦 [supabaseFetch] Наличие контента в ответе:', hasContent)

    if (hasContent) {
      try {
        const data = await response.json()
        console.log('✅ [supabaseFetch] Данные успешно получены:', data)
        return { data }
      } catch (jsonError) {
        console.error('❌ [supabaseFetch] Ошибка парсинга JSON:', jsonError)
        // Если ответ не является JSON, но статус успешный, вернем пустой объект
        if (response.status === 204 || response.status === 202) {
          console.log('✅ [supabaseFetch] Пустой ответ (204/202) - операция успешна')
          return { data: null as T }
        }
        throw new Error(`Ошибка парсинга JSON: ${jsonError}`)
      }
    } else {
      console.log('✅ [supabaseFetch] Пустой ответ - операция успешна')
      return { data: null as T }
    }
  } catch (error) {
    console.error('❌ [supabaseFetch] Критическая ошибка:', error)
    return { error: error as Error }
  }
}
