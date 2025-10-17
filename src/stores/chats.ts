import { computed } from 'vue'
import type { Message, MessageStats } from '../types'
import { chats, messages, users, settings } from './state'
import { supabaseFetch } from '../lib/supabase'

export const activeChats = computed(() => {
  return chats.value
    .map(chat => {
      const user = users.value.find(u => u.id === chat.userId)
      const chatMessages = messages.value.filter(m => m.chatId === chat.id)
      const lastMessage = chatMessages[chatMessages.length - 1]
      return {
        ...chat,
        user,
        lastMessage
      }
    })
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
})

export const getChatMessages = (chatId: string) => {
  return messages.value
    .filter(m => m.chatId === chatId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

export const getChatById = (chatId: string) => {
  const chat = chats.value.find(c => c.id === chatId)
  if (!chat) return null
  const user = users.value.find(u => u.id === chat.userId)
  return { ...chat, user }
}

export const messageStats = computed<MessageStats[]>(() => {
  const stats: Record<string, { agentCount: number; managerCount: number }> = {}

  messages.value
    .filter(m => !m.isUserMessage)
    .forEach(msg => {
      const date = msg.createdAt.toISOString().split('T')[0]
      if (!stats[date]) {
        stats[date] = { agentCount: 0, managerCount: 0 }
      }
      if (msg.isAgent) {
        stats[date].agentCount++
      } else {
        stats[date].managerCount++
      }
    })

  return Object.entries(stats)
    .map(([date, counts]) => ({
      date,
      ...counts
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
})

/**
 * Загружает сообщения из таблицы save_messages в Supabase
 * и восстанавливает список чатов на основе загруженных сообщений
 */
export const loadMessagesFromSupabase = async (chatId?: string) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[loadMessagesFromSupabase] Supabase не настроен, пропускаем загрузку')
    return
  }

  try {
    const endpoint = chatId
      ? `save_messages?chat_id=eq.${chatId}&order=created_at.asc`
      : 'save_messages?order=created_at.asc'

    const { data, error } = await supabaseFetch<any[]>(url, key, endpoint)

    if (error) {
      console.error('[loadMessagesFromSupabase] Ошибка загрузки:', error)
      return
    }

    if (data && data.length > 0) {
      console.log(`📥 Загружено ${data.length} сообщений из Supabase`)

      // Преобразуем данные из Supabase в формат Message
      const loadedMessages: Message[] = data.map((row) => ({
        id: row.id.toString(),
        chatId: row.chat_id,
        text: row.message_text || '',
        isAgent: row.role_user === 'agent',
        isUserMessage: row.role_user === 'user',
        createdAt: new Date(row.created_at),
        processed: row.processed,
        channelId: row.channelid,
        roleUser: row.role_user,
        messageId: row.message_id,
        file: row.file,
        isEcho: row.isecho,
        status: row.status,
        answer: row.answer
      }))

      // Заменяем существующие сообщения загруженными
      if (chatId) {
        // Удаляем старые сообщения для этого чата и добавляем новые
        messages.value = [
          ...messages.value.filter(m => m.chatId !== chatId),
          ...loadedMessages
        ]
      } else {
        // Полная замена всех сообщений
        messages.value = loadedMessages

        // Восстанавливаем список чатов из сообщений
        reconstructChatsFromMessages(loadedMessages)
      }
    }
  } catch (error) {
    console.error('[loadMessagesFromSupabase] Исключение:', error)
  }
}

/**
 * Восстанавливает список чатов на основе загруженных сообщений
 */
const reconstructChatsFromMessages = (loadedMessages: Message[]) => {
  // Группируем сообщения по chat_id
  const chatGroups = new Map<string, Message[]>()

  for (const msg of loadedMessages) {
    if (!msg.chatId) continue

    if (!chatGroups.has(msg.chatId)) {
      chatGroups.set(msg.chatId, [])
    }
    chatGroups.get(msg.chatId)!.push(msg)
  }

  // Создаём объекты чатов
  const reconstructedChats = Array.from(chatGroups.entries()).map(([chatId, msgs]) => {
    // Сортируем сообщения по времени создания
    const sortedMessages = msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const firstMessage = sortedMessages[0]
    const lastMessage = sortedMessages[sortedMessages.length - 1]

    // Ищем userId из channelId или используем chat_id как fallback
    const userId = firstMessage.channelId || chatId

    return {
      id: chatId,
      userId: userId,
      lastMessageAt: lastMessage.createdAt,
      createdAt: firstMessage.createdAt
    }
  })

  // Заменяем чаты
  chats.value = reconstructedChats

  console.log(`✅ Восстановлено ${reconstructedChats.length} чатов из сообщений`)
}

/**
 * Сохраняет сообщение в таблицу save_messages в Supabase
 */
const saveMessageToSupabase = async (message: Message) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[saveMessageToSupabase] Supabase не настроен, пропускаем сохранение')
    return null
  }

  try {
    // Определяем роль пользователя
    let roleUser = 'manager'
    if (message.isUserMessage) {
      roleUser = 'user'
    } else if (message.isAgent) {
      roleUser = 'agent'
    }

    const payload = {
      chat_id: message.chatId,
      message_text: message.text,
      created_at: message.createdAt.toISOString(),
      processed: message.processed ?? false,
      channelid: message.channelId ?? null,
      role_user: roleUser,
      message_id: message.messageId ?? null,
      file: message.file ?? null,
      isecho: message.isEcho ?? false,
      status: message.status ?? 'sent',
      answer: message.answer ?? false
    }

    const { data, error } = await supabaseFetch<any[]>(
      url,
      key,
      'save_messages',
      {
        method: 'POST',
        headers: {
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      }
    )

    if (error) {
      console.error('[saveMessageToSupabase] Ошибка сохранения:', error)
      return null
    }

    if (data && data.length > 0) {
      console.log('✅ Сообщение сохранено в Supabase:', data[0].id)
      return data[0].id
    }

    return null
  } catch (error) {
    console.error('[saveMessageToSupabase] Исключение:', error)
    return null
  }
}

/**
 * Обновляет статус сообщения в Supabase
 */
export const updateMessageStatus = async (
  messageId: string,
  updates: Partial<{
    processed: boolean
    status: string
    answer: boolean
  }>
) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[updateMessageStatus] Supabase не настроен, пропускаем обновление')
    return
  }

  try {
    const { error } = await supabaseFetch(
      url,
      key,
      `save_messages?id=eq.${messageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    )

    if (error) {
      console.error('[updateMessageStatus] Ошибка обновления:', error)
    } else {
      console.log('✅ Статус сообщения обновлён в Supabase:', messageId)
    }
  } catch (error) {
    console.error('[updateMessageStatus] Исключение:', error)
  }
}

export const sendMessage = async (chatId: string, text: string, isUserMessage: boolean) => {
  const chat = chats.value.find(c => c.id === chatId)
  if (!chat) return

  const newMessage: Message = {
    id: Date.now().toString(),
    chatId,
    text,
    isAgent: settings.value.agentMode,
    isUserMessage,
    createdAt: new Date(),
    processed: false,
    status: 'sent',
    answer: false
  }

  // Добавляем в локальный стор
  messages.value.push(newMessage)
  chat.lastMessageAt = new Date()

  // Сохраняем в Supabase
  const savedId = await saveMessageToSupabase(newMessage)
  if (savedId) {
    // Обновляем ID сообщения на ID из базы данных
    newMessage.id = savedId.toString()
  }
}
