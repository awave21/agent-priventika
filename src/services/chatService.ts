import { supabase } from '@/lib/supabase'
import type { Message } from '../types'

export class ChatService {
  // Получение сообщений с пагинацией из таблицы save_messages
  static async getMessages(page = 1, limit = 50): Promise<{ data: Message[] | null; error: any }> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    return await supabase
      .from('save_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)
  }

  // Получение сообщений за определенный период
  static async getMessagesByDateRange(startDate: string, endDate: string): Promise<{ data: Message[] | null; error: any }> {
    return await supabase
      .from('save_messages')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
  }

  // Поиск сообщений по тексту
  static async searchMessages(query: string): Promise<{ data: Message[] | null; error: any }> {
    return await supabase
      .from('save_messages')
      .select('*')
      .ilike('message_text', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(100)
  }

  // Получение статистики сообщений
  static async getMessageStats(): Promise<{ data: any | null; error: any }> {
    return await supabase
      .from('save_messages')
      .select('id, created_at, role_user')
  }

  // Удаление сообщения
  static async deleteMessage(messageId: string): Promise<{ error: any }> {
    return await supabase
      .from('save_messages')
      .delete()
      .eq('id', messageId)
  }

  // Обновление сообщения
  static async updateMessage(messageId: string, updates: Partial<Message>): Promise<{ data: Message | null; error: any }> {
    return await supabase
      .from('save_messages')
      .update({
        ...updates,
        created_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select('*')
      .single()
  }

  // Получение количества сообщений
  static async getMessageCount(): Promise<{ count: number | null; error: any }> {
    return await supabase
      .from('save_messages')
      .select('*', { count: 'exact', head: true })
  }

  // Массовое удаление сообщений по chat_id
  static async deleteChatMessages(chatId: string): Promise<{ error: any }> {
    return await supabase
      .from('save_messages')
      .delete()
      .eq('chat_id', chatId)
  }

  // Получение последних сообщений для конкретного чата
  static async getChatMessages(chatId: string, limit = 20): Promise<{ data: Message[] | null; error: any }> {
    return await supabase
      .from('save_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit)
  }

  // Сохранение нового сообщения в Supabase
  static async saveMessage(message: Omit<Message, 'id'>): Promise<{ data: any | null; error: any }> {
    return await supabase
      .from('save_messages')
      .insert([{
        chat_id: message.chatId,
        message_text: message.text,
        created_at: message.createdAt.toISOString(),
        role_user: message.roleUser || 'user',
        processed: message.processed || false,
        channelid: message.channelId || null,
        message_id: message.messageId || null,
        file: message.file || null,
        isecho: message.isEcho || false,
        status: message.status || 'sent',
        answer: message.answer || false
      }])
      .select()
  }
}