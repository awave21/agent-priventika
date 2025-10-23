<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Отсутствуют переменные окружения Supabase');
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Типы данных для таблицы savemessagetest
interface SavemessagetestRecord {
  id?: string;
  chat_id: string;
  message_text: string;
  role_user?: string;
  created_at?: string;
  channelid?: string;
  processed?: boolean;
  message_id?: string | null;
  file?: string | null;
  isecho?: boolean;
  status?: string;
  answer?: boolean;
}

// Состояние компонента
const realtimeMessages = ref<string[]>([]);
const isConnected = ref(false);
const error = ref<string | null>(null);

let subscription: any = null;

// Функция подписки на изменения таблицы savemessagetest
function subscribeToTestTable() {
  console.log('Подписываемся на изменения таблицы savemessagetest...');

  subscription = supabase
    .channel('simple_test_messages_changes') // Название канала для таблицы savemessagetest (отличное от TestChatView)
    .on(
      'postgres_changes',
      {
        event: '*', // Слушаем все события (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'savemessagetest'
      },
      (payload) => {
        console.log('Получено real-time событие из savemessagetest:', payload);

        // Обрабатываем событие
        const eventData = (payload.new || payload.old) as SavemessagetestRecord;
        if (!eventData || !eventData.chat_id) return;

        const newMsg = `Action: ${payload.eventType}; ChatID: ${eventData.chat_id}; Text: ${eventData.message_text}; Role: ${eventData.role_user}`;
        realtimeMessages.value.push(newMsg);

        // Ограничиваем количество сообщений для производительности
        if (realtimeMessages.value.length > 100) {
          realtimeMessages.value = realtimeMessages.value.slice(-50);
        }
      }
    )
    .subscribe((status: string, err?: Error) => {
      console.log('Статус подписки на savemessagetest:', status, err);

      if (status === 'SUBSCRIBED') {
        isConnected.value = true;
        error.value = null;
        console.log('✅ Успешно подключено к real-time для savemessagetest');
      } else if (status === 'CHANNEL_ERROR') {
        isConnected.value = false;
        error.value = `Ошибка канала: ${err?.message || 'Неизвестная ошибка'}`;
        console.error('❌ Ошибка канала real-time для savemessagetest:', err);
      } else if (status === 'TIMED_OUT') {
        isConnected.value = false;
        error.value = 'Таймаут подключения';
        console.error('⏰ Таймаут подключения к real-time');
      } else if (status === 'CLOSED') {
        isConnected.value = false;
        console.warn('🔌 Канал real-time закрыт');
      }
    });
}

// Функция отправки тестового сообщения в таблицу savemessagetest
const sendTestMessage = async () => {
  try {
    // Генерируем уникальный ID для сообщения
    const messageId = `test_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const testMessage: SavemessagetestRecord = {
      chat_id: `test_chat_${Date.now()}`, // Используем timestamp как ID чата
      message_text: `Тестовое сообщение ${new Date().toLocaleTimeString()}`,
      role_user: 'user',
      created_at: new Date().toISOString(),
      channelid: `channel_${Date.now()}`,
      processed: false,
      message_id: messageId,
      file: null,
      isecho: false,
      status: 'sent',
      answer: false
    };

    const { error } = await supabase
      .from('savemessagetest')
      .insert(testMessage);

    if (error) {
      console.error('Ошибка отправки сообщения в savemessagetest:', error);
      alert(`Ошибка отправки сообщения: ${error.message}`);
    } else {
      console.log('✅ Тестовое сообщение отправлено в savemessagetest');
    }
  } catch (err) {
    console.error('❌ Исключение при отправке сообщения:', err);
    alert('Ошибка при отправке сообщения');
  }
};

// Функция очистки сообщений
const clearMessages = () => {
  realtimeMessages.value = [];
};

// Монтирование компонента
onMounted(() => {
  subscribeToTestTable();
});

// Размонтирование компонента
onBeforeUnmount(() => {
  if (subscription) {
    console.log('Отключаемся от real-time...');
    supabase.removeChannel(subscription);
    subscription = null;
  }
});
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-slate-800">
      Простой компонент Supabase Realtime (savemessagetest)
    </h2>

    <!-- Статус подключения -->
    <div class="mb-6 p-4 rounded-lg border"
         :class="isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full"
               :class="isConnected ? 'bg-green-500' : 'bg-red-500'">
          </div>
          <span class="font-medium"
                :class="isConnected ? 'text-green-800' : 'text-red-800'">
            {{ isConnected ? 'Подключено к real-time' : 'Отключено от real-time' }}
          </span>
        </div>

        <div class="flex gap-2">
          <button
            @click="sendTestMessage"
            :disabled="!isConnected"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Отправить тестовое сообщение
          </button>

          <button
            @click="clearMessages"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Очистить
          </button>
        </div>
      </div>

      <!-- Отображение ошибок -->
      <div v-if="error" class="mt-2 text-red-600 text-sm">
        {{ error }}
      </div>
    </div>

    <!-- Список сообщений -->
    <div class="bg-white rounded-lg border border-slate-200">
      <div class="p-4 border-b border-slate-200">
        <h3 class="font-semibold text-slate-800">
          Real-time события из savemessagetest ({{ realtimeMessages.length }})
        </h3>
      </div>

      <div class="max-h-96 overflow-y-auto p-4">
        <div v-if="realtimeMessages.length === 0"
             class="text-center text-slate-500 py-8">
          Нет событий. Отправьте тестовое сообщение или ждите изменений в таблице savemessagetest.
        </div>

        <div v-else
             v-for="(msg, idx) in realtimeMessages"
             :key="idx"
             class="mb-3 p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
          <pre class="text-sm text-slate-700 whitespace-pre-wrap">{{ msg }}</pre>
          <div class="text-xs text-slate-500 mt-2">
            {{ new Date().toLocaleTimeString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- Инструкции -->
    <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 class="font-semibold text-blue-800 mb-2">Как использовать:</h4>
      <ul class="text-sm text-blue-700 space-y-1">
        <li>• Компонент автоматически подписывается на изменения таблицы 'savemessagetest'</li>
        <li>• Нажмите "Отправить тестовое сообщение" чтобы добавить запись в таблицу</li>
        <li>• Все изменения (INSERT/UPDATE/DELETE) будут отображаться в реальном времени</li>
        <li>• Убедитесь, что в Supabase включен real-time для таблицы 'savemessagetest'</li>
        <li>• Структура записи: chat_id, message_text, role_user, created_at, channelid</li>
      </ul>
    </div>
  </div>
</template>