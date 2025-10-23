<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from '../composables/useStore'
import { useRealtimeChats } from '../composables/useRealtimeChats'
import { settings } from '../stores/state'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/AppLayout.vue'
import { Send, Search, Trash2, Plus } from 'lucide-vue-next'
import type { Message, Chat } from '../types'

const route = useRoute()
const store = useStore()
const { subscribe } = useRealtimeChats()

const selectedChatId = ref<string | null>(route.params.id as string || null)
const newMessage = ref('')
const searchQuery = ref('')

// Локальные хранилища для тестовых данных (изолированы от основных)
const testChats = ref<Chat[]>([])
const testMessages = ref<Message[]>([])

const getUserDisplayName = (user: any, chatId?: string) => {
  return user?.name || user?.username || user?.phone || chatId || 'Неизвестно'
}

const filteredChats = computed(() => {
  // Используем локальные тестовые данные
  const allChats = testChats.value

  // Обрабатываем все чаты из тестовой таблицы (фильтрация не требуется)
  const processedChats = allChats
    .map(chat => {
      const chatMessages = testMessages.value.filter(m => m.chatId === chat.id) // Используем локальные сообщения
      // Безопасно получаем последнее сообщение с проверкой существования массива
      const lastMessage = chatMessages && chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null
      return {
        ...chat,
        lastMessage
      }
    })

  if (!searchQuery.value) return processedChats

  const query = searchQuery.value.toLowerCase()
  return processedChats.filter(chat => {
    const displayName = getUserDisplayName(null, chat.id) // Для чатов пользователь не определен
    return displayName && displayName.toLowerCase().includes(query)
  })
})

const selectedChat = computed(() => {
  if (!selectedChatId.value) return null
  // Используем локальные тестовые данные для получения чата
  return testChats.value.find(c => c.id === selectedChatId.value) || null
})

const currentMessages = computed(() => {
  if (!selectedChatId.value) return []
  // Используем локальные тестовые сообщения
  return testMessages.value
    .filter(m => m.chatId === selectedChatId.value)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
})

const selectChat = (chatId: string) => {
  selectedChatId.value = chatId
}

const sendMessage = () => {
  if (!newMessage.value.trim() || !selectedChatId.value) return

  store.sendMessage(selectedChatId.value, newMessage.value, false)
  newMessage.value = ''
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

// Автопрокрутка к последнему сообщению
const scrollToBottom = () => {
  setTimeout(() => {
    const messagesContainer = document.querySelector('.overflow-y-auto.p-6.space-y-4')
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }, 50)
}

// Функция генерации уникального channel ID для тестовых чатов
const generateChannelId = () => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substr(2, 9)
  return `channel_${timestamp}_${randomSuffix}`
}

// Функция генерации уникального chat ID для тестовых чатов
const generateChatId = () => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substr(2, 9)
  return `test_${timestamp}_${randomSuffix}`
}







// Функция создания тестового чата (адаптирована для store)
const createTestChat = async () => {
  try {
    // Генерируем уникальные ID
    const testChatId = generateChatId()
    const testChannelId = generateChannelId()

    const newChat = {
      id: testChatId,
      userId: testChannelId,
      lastMessageAt: new Date(),
      createdAt: new Date()
    }

    // Добавляем чат в локальное хранилище
    testChats.value.push(newChat)

    // Автоматически выбираем созданный чат
    selectChat(testChatId)

    // Создаем запись в таблице savemessagetest для фиксации чата
    await saveChatToSupabase(newChat)

    console.log('✅ Тестовый чат создан в локальном хранилище:', testChatId)

    alert('Тестовый чат успешно создан!')
  } catch (error) {
    console.error('❌ Ошибка создания чата:', error)
    alert('Ошибка при создании чата')
  }
}

// Функция сохранения информации о чате в Supabase
const saveChatToSupabase = async (chat: any) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[saveChatToSupabase] Supabase не настроен')
    return
  }

  try {
    // Создаем фиктивное сообщение для фиксации чата в БД
    const chatMessage = {
      chat_id: chat.id,
      message_text: '[CHAT_CREATED]',
      created_at: chat.createdAt.toISOString(),
      processed: false,
      channelid: chat.userId,
      role_user: 'system',
      message_id: null,
      file: null,
      isecho: false,
      status: 'created',
      answer: false
    }

    const response = await fetch(`${url}/rest/v1/savemessagetest`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(chatMessage)
    })

    if (response.ok) {
      console.log('✅ Информация о чате сохранена в savemessagetest')
    } else {
      console.error('❌ Ошибка сохранения информации о чате')
    }
  } catch (error) {
    console.error('[saveChatToSupabase] Исключение:', error)
  }
}

// Функция удаления тестового чата
const deleteTestChat = async (chatId: string) => {
  if (!confirm('Вы уверены, что хотите удалить этот тестовый чат? Все сообщения будут удалены.')) {
    return
  }

  console.log('🗑️ Начинаем удаление чата:', chatId)
  console.log('📊 Состояние локального хранилища перед удалением:')
  console.log('- Количество чатов:', testChats.value.length)
  console.log('- Выбранный чат:', selectedChatId.value)
  console.log('- Количество сообщений:', testMessages.value.length)

  try {
    // Удаляем чат из локального хранилища
    const chatIndex = testChats.value.findIndex(c => c.id === chatId)
    console.log('🔍 Индекс чата для удаления в локальном хранилище:', chatIndex)

    if (chatIndex !== -1) {
      testChats.value.splice(chatIndex, 1)
      console.log('✅ Чат удален из локального хранилища')
    } else {
      console.warn('⚠️ Чат не найден в локальном хранилище')
    }

    // Удаляем все сообщения для этого чата из локального хранилища
    const messagesBefore = testMessages.value.length
    testMessages.value = testMessages.value.filter(m => m.chatId !== chatId)
    const messagesAfter = testMessages.value.length
    console.log(`📬 Удалено сообщений из локального хранилища: ${messagesBefore - messagesAfter}`)

    // Очищаем выбор чата если был выбран удаленный
    if (selectedChatId.value === chatId) {
      selectedChatId.value = testChats.value.length > 0 ? testChats.value[0].id : null
      console.log('🎯 Выбор чата очищен, новый выбранный чат:', selectedChatId.value)
    }

    // Очищаем сообщения из таблиц в Supabase
    console.log('🧹 Очищаем сообщения из БД...')
    await clearChatMessagesFromSupabase(chatId)
    await clearChatHistoryFromSupabase(chatId)

    console.log('📊 Состояние локального хранилища после удаления:')
    console.log('- Количество чатов:', testChats.value.length)
    console.log('- Выбранный чат:', selectedChatId.value)
    console.log('- Количество сообщений:', testMessages.value.length)

    console.log('✅ Тестовый чат полностью удален:', chatId)
    alert('Тестовый чат успешно удален!')
  } catch (error) {
    console.error('❌ Ошибка удаления чата:', error)
    alert('Ошибка при удалении чата')
  }
}

// Функция очистки сообщений чата из Supabase через REST API
const clearChatMessagesFromSupabase = async (chatId: string) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[clearChatMessagesFromSupabase] Supabase не настроен')
    return
  }

  try {
    // Используем прямой REST API запрос к Supabase
    const deleteUrl = `${url}/rest/v1/savemessagetest?chat_id=eq.${chatId}`

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })

    if (response.ok) {
      console.log('✅ Сообщения чата очищены из savemessagetest:', chatId)
    } else {
      const errorData = await response.text()
      console.error('[clearChatMessagesFromSupabase] Ошибка очистки:', response.status, errorData)
    }
  } catch (error) {
    console.error('[clearChatMessagesFromSupabase] Исключение:', error)
  }
}

// Функция очистки истории чата из таблицы test_chat_histories
const clearChatHistoryFromSupabase = async (chatId: string) => {
  const url = settings.value.supabaseUrl
  const key = settings.value.supabaseAnonKey

  if (!url || !key) {
    console.warn('[clearChatHistoryFromSupabase] Supabase не настроен')
    return
  }

  try {
    // Используем прямой REST API запрос к Supabase для test_chat_histories
    const deleteUrl = `${url}/rest/v1/test_chat_histories?chat_id=eq.${chatId}`

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })

    if (response.ok) {
      console.log('✅ История чата очищена из test_chat_histories:', chatId)
    } else {
      const errorData = await response.text()
      console.error('[clearChatHistoryFromSupabase] Ошибка очистки:', response.status, errorData)
    }
  } catch (error) {
    console.error('[clearChatHistoryFromSupabase] Исключение:', error)
  }
}

// Конвертация данных из Supabase в формат Message для тестовой таблицы
const convertSupabaseToMessage = (data: Record<string, any>): Message => {
  return {
    id: data.id?.toString() || '',
    chatId: data.chat_id || '',
    text: data.message_text || '',
    isAgent: data.role_user === 'agent',
    isUserMessage: data.role_user === 'user',
    createdAt: new Date(data.created_at),
    processed: data.processed,
    channelId: data.channelid,
    roleUser: data.role_user,
    messageId: data.message_id,
    file: data.file,
    isEcho: data.isecho,
    status: data.status,
    answer: data.answer
  }
}

// Real-time подписка на таблицу savemessagetest с улучшенной диагностикой
let testChannel: ReturnType<typeof supabase.channel> | null = null

const subscribeToTestTable = () => {
  console.log('🔄 Подписываемся на real-time обновления savemessagetest...')

  // Диагностика перед подпиской
  console.log('🔍 ДИАГНОСТИКА перед подпиской:', {
    timestamp: new Date().toISOString(),
    supabaseConfigured: {
      url: !!settings.value.supabaseUrl,
      key: !!settings.value.supabaseAnonKey
    },
    currentState: {
      chatsCount: testChats.value.length,
      messagesCount: testMessages.value.length,
      selectedChatId: selectedChatId.value
    },
    chats: testChats.value.map(c => ({ id: c.id, userId: c.userId })),
    recentMessages: testMessages.value.slice(-3).map(m => ({
      id: m.id,
      chatId: m.chatId,
      text: m.text.substring(0, 30) + '...',
      createdAt: m.createdAt
    }))
  })

  testChannel = supabase
    .channel('test_messages_changes')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'savemessagetest'
      },
      (payload: any) => {
        console.log('📨 Real-time событие в savemessagetest:', {
          eventType: payload.eventType,
          table: payload.table,
          hasNew: !!payload.new,
          hasOld: !!payload.old,
          commit_timestamp: payload.commit_timestamp,
          schema: payload.schema,
          payloadData: payload
        })

        try {
          // Детальная диагностика полученного события
          console.log('📨 ОБРАБОТКА REAL-TIME СОБЫТИЯ:', {
            timestamp: new Date().toISOString(),
            eventType: payload.eventType,
            table: payload.table,
            hasNew: !!payload.new,
            hasOld: !!payload.old,
            currentState: {
              chatsCount: testChats.value.length,
              messagesCount: testMessages.value.length,
              selectedChatId: selectedChatId.value
            }
          })

          switch (payload.eventType) {
            case 'INSERT':
              if (!payload.new) {
                console.warn('⚠️ INSERT событие без данных нового сообщения')
                break
              }

              console.log('📨 Данные нового сообщения из БД:', {
                id: payload.new.id,
                chat_id: payload.new.chat_id,
                message_text: payload.new.message_text,
                role_user: payload.new.role_user,
                created_at: payload.new.created_at,
                channelid: payload.new.channelid
              })

              // Проверяем что сообщение не пустое и не является системным
              if (!payload.new.message_text || payload.new.message_text.trim() === '' || payload.new.message_text === '[CHAT_CREATED]') {
                console.log('📨 Пропускаем системное/пустое сообщение:', payload.new.message_text)
                break
              }

              // Обрабатываем сообщения для всех чатов
              const newMessage = convertSupabaseToMessage(payload.new)
              console.log('🆕 Конвертированное сообщение:', {
                id: newMessage.id,
                chatId: newMessage.chatId,
                text: newMessage.text,
                isAgent: newMessage.isAgent,
                isUserMessage: newMessage.isUserMessage,
                createdAt: newMessage.createdAt,
                channelId: newMessage.channelId
              })

              // УСИЛЕННАЯ проверка существования сообщения в локальном хранилище
              const existingMessages = testMessages.value
              const existingIndex = existingMessages.findIndex(m => m.id === newMessage.id)
              const existingMessage = existingMessages[existingIndex]

              console.log('🔍 ДЕТАЛЬНАЯ ПРОВЕРКА СУЩЕСТВОВАНИЯ В ЛОКАЛЬНОМ ХРАНИЛИЩЕ:', {
                existingIndex,
                currentMessagesCount: existingMessages.length,
                newMessageId: newMessage.id,
                chatId: newMessage.chatId,
                existingMessageFound: !!existingMessage,
                existingMessageDetails: existingMessage ? {
                  id: existingMessage.id,
                  chatId: existingMessage.chatId,
                  text: existingMessage.text.substring(0, 30) + '...',
                  createdAt: existingMessage.createdAt
                } : null
              })

              if (existingIndex === -1) {
                // Сохраняем состояние ПЕРЕД добавлением в локальное хранилище
                const stateBeforeAdd = {
                  messagesCount: testMessages.value.length,
                  chatsCount: testChats.value.length,
                  lastMessageId: testMessages.value.length > 0 ? testMessages.value[testMessages.value.length - 1].id : null
                }

                // Добавляем сообщение в локальное хранилище
                testMessages.value.push(newMessage)
                console.log('✅ Новое сообщение добавлено в локальное хранилище')

                // Проверяем состояние ПОСЛЕ добавления
                const stateAfterAdd = {
                  messagesCount: testMessages.value.length,
                  chatsCount: testChats.value.length,
                  newLastMessageId: testMessages.value.length > 0 ? testMessages.value[testMessages.value.length - 1].id : null
                }

                console.log('📊 СОСТОЯНИЕ ЛОКАЛЬНОГО ХРАНИЛИЩА ДО И ПОСЛЕ ДОБАВЛЕНИЯ:', {
                  before: stateBeforeAdd,
                  after: stateAfterAdd,
                  addedSuccessfully: stateAfterAdd.messagesCount === stateBeforeAdd.messagesCount + 1
                })

                // Обновляем время последнего сообщения в чате в локальном хранилище
                const chat = testChats.value.find(c => c.id === newMessage.chatId)
                if (chat) {
                  chat.lastMessageAt = newMessage.createdAt
                  console.log('✅ Время последнего сообщения в чате обновлено', newMessage.chatId)
                } else {
                  console.warn('⚠️ Чат не найден для обновления времени:', newMessage.chatId)
                  console.log('📋 Доступные чаты в локальном хранилище:', testChats.value.map(c => c.id))
                }

                // Автопрокрутка к новому сообщению
                scrollToBottom()
                console.log('✅ Автопрокрутка выполнена')
              } else {
                console.log('⚠️ Сообщение уже существует в store, пропускаем')
              }
              break

            case 'UPDATE':
              if (!payload.new) {
                console.warn('⚠️ UPDATE событие без данных обновленного сообщения')
                break
              }

              const updatedMessage = convertSupabaseToMessage(payload.new)
              const updateIndex = testMessages.value.findIndex(m => m.id === updatedMessage.id)

              if (updateIndex !== -1) {
                testMessages.value[updateIndex] = updatedMessage
                console.log('🔄 Сообщение обновлено из БД:', updatedMessage.id)
              }
              break

            case 'DELETE':
              if (!payload.old?.id) {
                console.warn('⚠️ DELETE событие без данных удаляемого сообщения')
                break
              }

              const deleteIndex = testMessages.value.findIndex(m => m.id === payload.old.id)
              if (deleteIndex !== -1) {
                testMessages.value.splice(deleteIndex, 1)
                console.log('🗑️ Сообщение удалено из БД:', payload.old.id)
              }
              break
          }
        } catch (err) {
          console.error('❌ Ошибка обработки real-time события:', err)
        }
      }
    )
    .subscribe((status: string, err?: Error) => {
      console.log('🔗 Статус подписки на savemessagetest:', {
        status,
        error: err,
        timestamp: new Date().toISOString()
      })

      if (status === 'SUBSCRIBED') {
        console.log('✅ УСПЕШНО подключено к real-time обновлениям savemessagetest')
        console.log('📡 Канал готов получать события от таблицы savemessagetest')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ ОШИБКА канала real-time для savemessagetest:', err)
        console.error('🔧 Возможные причины:')
        console.error('- Таблица savemessagetest не существует')
        console.error('- Real-time не включен для таблицы')
        console.error('- RLS политики блокируют доступ')
        console.error('- Неправильные настройки Supabase')
      } else if (status === 'TIMED_OUT') {
        console.error('⏰ Таймаут подключения к real-time')
      } else if (status === 'CLOSED') {
        console.warn('🔌 Канал real-time закрыт')
      }
    })
}

const unsubscribeFromTestTable = () => {
  if (testChannel) {
    console.log('🔌 Отключаемся от real-time обновлений savemessagetest...')
    try {
      supabase.removeChannel(testChannel)
      testChannel = null
      console.log('✅ Успешно отключено от real-time обновлений savemessagetest')
    } catch (err) {
      console.error('❌ Ошибка при отключении от real-time:', err)
      testChannel = null
    }
  }
}


const sendMessageToWebhook = async (chatId: string, text: string) => {
  try {
    // Генерируем данные для отправки на вебхук
    const testMessageId = `7d96a608-3be7-4751-bb0c-${Math.random().toString(36).substr(2, 12)}`

    // Генерируем уникальный channelId
    const channelId = generateChannelId()

    const webhookMessage = {
      messageId: testMessageId,
      dateTime: new Date().toISOString(),
      channelId: channelId,
      chatType: 'instagram',
      chatId: chatId,
      type: 'text',
      isEcho: false,
      contact: {
        name: '⚡',
        igsid: '1545614590217988'
      },
      text: text,
      status: 'inbound'
    }

    // Структура данных для отправки на вебхук
    const webhookPayload = {
      headers: {
        connection: 'upgrade',
        host: 'n8n.chatmedbot.ru',
        'x-real-ip': '172.18.0.1',
        'x-forwarded-for': '172.18.0.1',
        'x-forwarded-proto': 'https',
        'content-length': '516',
        accept: 'application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, image/*;q=0.8, */*;q=0.7',
        'content-type': 'application/json',
        'user-agent': 'axios/1.12.0',
        'accept-encoding': 'gzip, compress, deflate, br'
      },
      params: {},
      query: {},
      body: {
        messages: [webhookMessage]
      },
      webhookUrl: 'https://n8n.chatmedbot.ru/webhook/klientiks-test',
      executionMode: 'production'
    }

    // Отправляем запрос на вебхук
    const response = await fetch('https://n8n.chatmedbot.ru/webhook/klientiks-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'axios/1.12.0',
        'Accept': 'application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, image/*;q=0.8, */*;q=0.7',
        'Accept-Encoding': 'gzip, compress, deflate, br'
      },
      body: JSON.stringify(webhookPayload)
    })

    if (response.ok) {
      console.log('✅ Сообщение отправлено на вебхук')
      return true
    } else {
      console.error('❌ Ошибка отправки на вебхук:', response.status)
      return false
    }
  } catch (error) {
    console.error('❌ Ошибка при отправке на вебхук:', error)
    return false
  }
}

const sendMessageWithWebhook = async () => {
  if (!newMessage.value.trim() || !selectedChatId.value) return

  const chat = testChats.value.find(c => c.id === selectedChatId.value)
  if (chat && chat.id.startsWith('test_')) {
    // Для тестовых чатов отправляем на вебхук БЕЗ сохранения в базу
    const success = await sendMessageToWebhook(chat.id, newMessage.value)
    if (success) {
      // НЕ сохраняем в базу - только отправляем на вебхук
      // await sendTestMessage(selectedChatId.value, newMessage.value, false)

      newMessage.value = ''
      console.log('✅ Сообщение отправлено на вебхук (без сохранения в базу)')

      // Автопрокрутка к последнему сообщению через небольшую задержку
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } else {
      alert('Ошибка отправки на вебхук')
    }
  } else {
    // Для обычных чатов используем обычную логику
    sendMessage()
  }
}

// Функция загрузки тестовых данных в локальные хранилища
const loadTestDataToLocalStorage = async () => {
  console.log('🔄 Загружаем тестовые данные в локальные хранилища...')

  // Очищаем локальные хранилища перед загрузкой
  testChats.value = []
  testMessages.value = []

  try {
    const url = settings.value.supabaseUrl
    const key = settings.value.supabaseAnonKey

    if (!url || !key) {
      console.warn('[loadTestDataToLocalStorage] Supabase не настроен')
      return
    }

    // Загружаем сообщения напрямую из таблицы savemessagetest
    const response = await fetch(`${url}/rest/v1/savemessagetest?order=created_at.asc`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`📥 Загружено ${data.length} сообщений из savemessagetest`)

      // Конвертируем сообщения в формат Message
      const loadedMessages: Message[] = data.map((row: any) => ({
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

      // Добавляем сообщения в локальное хранилище
      testMessages.value = loadedMessages

      // Восстанавливаем чаты из сообщений
      const chatGroups = new Map<string, Message[]>()
      for (const msg of loadedMessages) {
        if (!msg.chatId) continue
        if (!chatGroups.has(msg.chatId)) {
          chatGroups.set(msg.chatId, [])
        }
        chatGroups.get(msg.chatId)!.push(msg)
      }

      // Создаем объекты чатов
      const reconstructedChats = Array.from(chatGroups.entries()).map(([chatId, msgs]) => {
        const sortedMessages = msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        const firstMessage = sortedMessages[0]
        const lastMessage = sortedMessages[sortedMessages.length - 1]

        return {
          id: chatId,
          userId: firstMessage.channelId || chatId,
          lastMessageAt: lastMessage.createdAt,
          createdAt: firstMessage.createdAt
        }
      })

      testChats.value = reconstructedChats

      console.log(`✅ Загружено в локальные хранилища: ${testChats.value.length} чатов, ${testMessages.value.length} сообщений`)
    } else {
      console.error('❌ Ошибка загрузки из savemessagetest:', response.status)
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки тестовых данных:', error)
  }
}

// Инициализация - загрузка данных и подписка на обновления
onMounted(async () => {
  // Загружаем существующие данные из тестовой таблицы в локальные хранилища
  await loadTestDataToLocalStorage()

  // Подписываемся на real-time обновления
  subscribe()
  subscribeToTestTable()
})

// Отписываемся от обновлений при размонтировании компонента
onUnmounted(() => {
  unsubscribeFromTestTable()
})
</script>

<template>
  <AppLayout>
    <div class="flex h-full">
      <div class="w-96 bg-white border-r border-slate-200 flex flex-col">
        <div class="p-4 border-b border-slate-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-slate-900">Тест</h2>
            <div class="flex items-center gap-3">
              <button
                @click="createTestChat"
                class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus :size="16" />
                Создать чат
              </button>
            </div>
          </div>
          <div class="relative">
            <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск чатов..."
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <button
            v-for="chat in filteredChats"
            :key="chat.id"
            @click="selectChat(chat.id)"
            class="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100"
            :class="{ 'bg-slate-100': selectedChatId === chat.id }"
          >
            <div class="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <span class="text-slate-600 font-medium">
                {{ getUserDisplayName(null, chat.id)[0].toUpperCase() }}
              </span>
            </div>
            <div class="flex-1 text-left min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-medium text-slate-900 truncate">{{ getUserDisplayName(null, chat.id) }}</h3>
                <span class="text-xs text-slate-500">{{ formatTime(chat.lastMessageAt) }}</span>
              </div>
              <p class="text-sm text-slate-600 truncate">
                {{ chat.lastMessage?.text || 'Нет сообщений' }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <div v-if="selectedChat" class="flex-1 flex flex-col bg-slate-50">
        <div class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mr-3">
              <span class="text-slate-600 font-medium">
                {{ getUserDisplayName(null, selectedChat.id)[0].toUpperCase() }}
              </span>
            </div>
            <div>
              <h3 class="font-medium text-slate-900">{{ getUserDisplayName(null, selectedChat.id) }}</h3>
              <p class="text-xs text-slate-500">Онлайн</p>
            </div>
          </div>
          <button
            v-if="selectedChat.id.startsWith('test_')"
            @click="deleteTestChat(selectedChat.id)"
            class="p-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Удалить тестовый чат"
          >
            <Trash2 :size="20" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div
            v-for="message in currentMessages"
            :key="message.id"
            class="flex"
            :class="message.isAgent ? 'justify-start' : 'justify-end'"
          >
            <div
              class="max-w-md px-4 py-3 rounded-2xl"
              :class="
                message.isUserMessage
                  ? 'bg-white text-slate-900'
                  : message.isAgent
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-white'
              "
            >
              <p class="text-sm">{{ message.text }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs opacity-70">{{ formatTime(message.createdAt) }}</span>
                <span v-if="!message.isUserMessage" class="text-xs opacity-70">
                  • {{ message.isAgent ? 'Агент' : 'Менеджер' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border-t border-slate-200 p-4">
          <form @submit.prevent="sendMessageWithWebhook" class="flex items-center gap-3">
            <input
              v-model="newMessage"
              type="text"
              placeholder="Введите сообщение..."
              class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <button
              type="submit"
              :disabled="!newMessage.trim()"
              class="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send :size="20" />
            </button>
          </form>
        </div>
      </div>

      <div v-else class="flex-1 flex items-center justify-center bg-slate-50">
        <div class="text-center">
          <div class="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus :size="32" class="text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">Создайте тестовый чат</h3>
          <p class="text-sm text-slate-600 mb-4">Нажмите кнопку "Создать чат" выше, чтобы начать тестирование</p>
          <button
            @click="createTestChat"
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus :size="16" />
            Создать чат
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>