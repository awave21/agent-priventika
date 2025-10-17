import { ref } from 'vue'
import type { User, Chat, Message, IgnoreListEntry, Followup, Settings } from '../types'

export const users = ref<User[]>([])

export const chats = ref<Chat[]>([])

export const messages = ref<Message[]>([])

export const ignoreList = ref<IgnoreListEntry[]>([
  { id: '1', userId: '3', createdAt: new Date('2025-10-11T15:00:00') }
])

export const followups = ref<Followup[]>([
  { id: '1', text: 'Уточнить статус заказа', intervalMinutes: 60, triggerTime: new Date('2025-10-17T10:00:00'), isDefault: false, isSent: false, sentAt: null, createdAt: new Date('2025-10-16T10:31:00'), updatedAt: new Date('2025-10-16T10:31:00') },
  { id: '2', text: 'Проверить восстановление доступа', intervalMinutes: 30, triggerTime: new Date('2025-10-16T15:00:00'), isDefault: true, isSent: false, sentAt: null, createdAt: new Date('2025-10-16T09:16:00'), updatedAt: new Date('2025-10-16T09:16:00') }
])

const SETTINGS_STORAGE_KEY = 'harvi_settings'

const loadSettingsFromLocalStorage = (): Partial<Settings> => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек из localStorage:', error)
  }
  return {}
}

const storedSettings = loadSettingsFromLocalStorage()

export const settings = ref<Settings>({
  id: '1',
  agentMode: storedSettings.agentMode ?? true,
  agentActive: storedSettings.agentActive ?? true,
  sentNewUser: storedSettings.sentNewUser ?? false,
  botResponseDelayMinutes: storedSettings.botResponseDelayMinutes ?? 5,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? storedSettings.supabaseUrl ?? 'https://supabase.chatmedbot.ru',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? storedSettings.supabaseAnonKey ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwNDg2NDAwLCJleHAiOjE5MTgyNTI4MDB9._cdEr1h09JdARVZUcdhutRYz0yx6yKmoKNZjHIuxIVA',
  updatedAt: new Date()
})

export const isAuthenticated = ref(false)
