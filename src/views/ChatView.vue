<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from '../composables/useStore'
import { useRealtimeChats } from '../composables/useRealtimeChats'
import AppLayout from '../components/AppLayout.vue'
import { Send, Search, Wifi, WifiOff, Power, ExternalLink } from 'lucide-vue-next'

const route = useRoute()
const store = useStore()
const { subscribe, isConnected, error: realtimeError } = useRealtimeChats()

const selectedChatId = ref<string | null>(route.params.id as string || null)
const newMessage = ref('')
const searchQuery = ref('')

const getUserDisplayName = (user: any, chatId?: string) => {
  return user?.name || user?.username || user?.phone || chatId || 'Неизвестно'
}

const filteredChats = computed(() => {
  if (!searchQuery.value) return store.activeChats.value

  const query = searchQuery.value.toLowerCase()
  return store.activeChats.value.filter(chat => {
    const displayName = getUserDisplayName(chat.user, chat.id)
    const phone = chat.user?.phone || ''
    return displayName.toLowerCase().includes(query) || phone.toLowerCase().includes(query)
  })
})

const selectedChat = computed(() => {
  if (!selectedChatId.value) return null
  return store.getChatById(selectedChatId.value)
})

const currentMessages = computed(() => {
  if (!selectedChatId.value) return []
  return store.getChatMessages(selectedChatId.value)
})

const channelId = computed(() => currentMessages.value[0]?.channelId || '')

const currentUser = computed(() => store.users.value.find(u => u.id === selectedChatId.value))

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

// Инициализация real-time функциональности
onMounted(() => {
  subscribe()
})

</script>

<template>
  <AppLayout>
    <div class="flex h-full">
      <div class="w-96 bg-white border-r border-slate-200 flex flex-col">
        <div class="p-4 border-b border-slate-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-slate-900">Чаты</h2>
            <div class="flex items-center gap-2 text-sm">
              <component :is="isConnected ? Wifi : WifiOff" :size="16" :class="isConnected ? 'text-green-500' : 'text-red-500'" />
              <span :class="isConnected ? 'text-green-600' : 'text-red-600'">
                {{ isConnected ? 'Real-time' : 'Офлайн' }}
              </span>
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
          <!-- Показать ошибку real-time если есть -->
          <div v-if="realtimeError" class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {{ realtimeError }}
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
                {{ getUserDisplayName(chat.user, chat.id)[0].toUpperCase() }}
              </span>
            </div>
            <div class="flex-1 text-left min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-medium text-slate-900 truncate">{{ getUserDisplayName(chat.user, chat.id) }}</h3>
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
                {{ getUserDisplayName(selectedChat.user, selectedChat.id)[0].toUpperCase() }}
              </span>
            </div>
            <div>
              <h3 class="font-medium text-slate-900">{{ getUserDisplayName(selectedChat.user, selectedChat.id) }}</h3>
              <p class="text-xs text-slate-500">Онлайн</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="store.toggleUserActive(selectedChatId!)" class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors" :class="currentUser?.isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'">
              <Power :size="16" />
              <span class="text-sm">{{ currentUser?.isActive ? 'Активен' : 'Неактивен' }}</span>
            </button>
            <a v-if="channelId" :href="`https://app.wazzup24.com/3944-8479/chat/whatsapp/${selectedChatId!}/${channelId}`" target="_blank" class="flex items-center gap-1 px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
              <ExternalLink :size="16" />
              <span class="text-sm">Wazzup</span>
            </a>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div
            v-for="message in currentMessages"
            :key="message.id"
            class="flex"
            :class="message.isUserMessage ? 'justify-start' : 'justify-end'"
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
          <form @submit.prevent="sendMessage" class="flex items-center gap-3">
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
            <Search :size="32" class="text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">Выберите чат</h3>
          <p class="text-sm text-slate-600">Выберите чат из списка слева, чтобы начать общение</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
