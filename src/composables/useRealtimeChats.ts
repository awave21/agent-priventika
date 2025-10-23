import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { supabase, RealtimePayload } from '@/lib/supabase'
import { useStore } from './useStore'
import type { Message } from '../types'

export interface UseRealtimeChatsReturn {
   isConnected: Ref<boolean>
   error: Ref<string | null>
   subscribe: () => void
   unsubscribe: () => void
 }

export function useRealtimeChats(): UseRealtimeChatsReturn {
  const store = useStore()
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  let channel: ReturnType<typeof supabase.channel> | null = null

  // Конвертация данных из Supabase в формат Message
   const convertSupabaseToMessage = (data: Record<string, any>): Message => {
    return {
      id: data.id.toString(),
      chatId: data.chat_id,
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

  // Подписка на real-time обновления таблицы save_messages
  const subscribe = () => {
    console.log('🔄 Подписываемся на real-time обновления чатов...')

    channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'save_messages'
        },
        (payload: RealtimePayload) => {
          console.log('📨 Real-time событие:', payload)

          try {
            switch (payload.eventType) {
              case 'INSERT':
                 // Проверяем, что payload.new существует
                 if (!payload.new) {
                   console.warn('⚠️ INSERT событие без данных нового сообщения')
                   break
                 }

                 // Конвертируем и добавляем новое сообщение
                 const newMessage = convertSupabaseToMessage(payload.new)

                 // Проверяем, существует ли уже такое сообщение в store
                 const existingIndex = store.messages.value.findIndex(m => m.id === newMessage.id)
                 if (existingIndex === -1) {
                   store.messages.value.push(newMessage)

                   // Обновляем время последнего сообщения в чате
                   const chat = store.chats.value.find(c => c.id === newMessage.chatId)
                   if (chat) {
                     chat.lastMessageAt = newMessage.createdAt
                   }

                   console.log('✅ Новое сообщение добавлено:', newMessage.id)
                 }
                 break

               case 'UPDATE':
                 // Проверяем, что payload.new существует
                 if (!payload.new) {
                   console.warn('⚠️ UPDATE событие без данных обновленного сообщения')
                   break
                 }

                 // Обновляем существующее сообщение
                 const updatedMessage = convertSupabaseToMessage(payload.new)
                 const updateIndex = store.messages.value.findIndex(m => m.id === updatedMessage.id)

                 if (updateIndex !== -1) {
                   store.messages.value[updateIndex] = updatedMessage
                   console.log('🔄 Сообщение обновлено:', updatedMessage.id)
                 }
                 break

               case 'DELETE':
                 // Проверяем, что payload.old существует и имеет id
                 if (!payload.old?.id) {
                   console.warn('⚠️ DELETE событие без данных удаляемого сообщения')
                   break
                 }

                 // Удаляем сообщение
                 const deleteIndex = store.messages.value.findIndex(m => m.id === payload.old.id)
                 if (deleteIndex !== -1) {
                   store.messages.value.splice(deleteIndex, 1)
                   console.log('🗑️ Сообщение удалено:', payload.old.id)
                 }
                 break
            }
          } catch (err) {
            console.error('❌ Ошибка обработки real-time события:', err)
            error.value = err instanceof Error ? err.message : 'Ошибка обработки события'
          }
        }
      )
      .subscribe((status: string) => {
        isConnected.value = status === 'SUBSCRIBED'
        console.log('🔗 Статус подписки:', status)

        if (status === 'SUBSCRIBED') {
          error.value = null
          console.log('✅ Подключено к real-time обновлениям')
        } else if (status === 'CHANNEL_ERROR') {
          error.value = 'Ошибка подключения к real-time'
          console.error('❌ Ошибка канала real-time')
        }
      })
  }

  // Отписка от обновлений
   const unsubscribe = () => {
     if (channel) {
       console.log('🔌 Отключаемся от real-time обновлений...')
       try {
         supabase.removeChannel(channel)
         channel = null
         isConnected.value = false
         console.log('✅ Успешно отключено от real-time обновлений')
       } catch (err) {
         console.error('❌ Ошибка при отключении от real-time:', err)
         // Принудительно устанавливаем состояние отключено даже при ошибке
         channel = null
         isConnected.value = false
       }
     }
   }

  // Lifecycle хуки
  onMounted(() => {
    // Не подписываемся автоматически - ждем вызова subscribe()
    console.log('🚀 useRealtimeChats готов к работе')
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe
  }
}