<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '../composables/useStore'
import { useAuth } from '../composables/useAuth'
import { Bot, User, LogOut, Menu, Power } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const { signOut, user } = useAuth()

const isLoggingOut = ref(false)
const logoutMessage = ref('')

defineProps<{
  sidebarVisible: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const handleLogout = async () => {
  isLoggingOut.value = true
  logoutMessage.value = ''

  try {
    const { error } = await signOut()

    if (error) {
      console.error('Ошибка при выходе:', error)
      logoutMessage.value = 'Ошибка при выходе из системы'
    } else {
      logoutMessage.value = 'Вы успешно вышли из системы'
      console.log('✅ Пользователь вышел из системы:', user.value?.email)

      // Небольшая задержка чтобы показать сообщение
      setTimeout(() => {
        router.push({ name: 'login' })
      }, 1000)
    }
  } catch (error) {
    console.error('Критическая ошибка при выходе:', error)
    logoutMessage.value = 'Произошла ошибка при выходе'
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
    <div class="flex items-center gap-4">
      <button
        @click="emit('toggleSidebar')"
        class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
      >
        <Menu :size="20" />
      </button>
      <h1 class="text-lg font-medium text-slate-900">Панель управления</h1>
    </div>

    <div class="flex items-center gap-6">
      <div class="flex items-center gap-3">
        <span class="text-sm text-slate-600 font-medium"></span>
        <button
          @click="store.toggleAgentMode()"
          class="relative w-14 h-7 rounded-full transition-colors"
          :class="store.settings.value.agentMode ? 'bg-emerald-500' : 'bg-slate-300'"
        >
          <div
            class="absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all flex items-center justify-center"
            :class="store.settings.value.agentMode ? 'left-7' : 'left-0.5'"
          >
            <Bot v-if="store.settings.value.agentMode" :size="14" class="text-emerald-600" />
            <User v-else :size="14" class="text-slate-600" />
          </div>
        </button>
        <span class="text-sm font-semibold" :class="store.settings.value.agentMode ? 'text-emerald-600' : 'text-slate-600'">
          {{ store.settings.value.agentMode ? 'Агент' : 'Менеджер' }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm text-slate-600 font-medium"></span>
        <button
          @click="store.toggleAgentActive()"
          class="relative w-14 h-7 rounded-full transition-colors"
          :class="store.settings.value.agentActive ? 'bg-blue-500' : 'bg-slate-300'"
        >
          <div
            class="absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all flex items-center justify-center"
            :class="store.settings.value.agentActive ? 'left-7' : 'left-0.5'"
          >
            <Power :size="14" :class="store.settings.value.agentActive ? 'text-blue-600' : 'text-slate-600'" />
          </div>
        </button>
        <span class="text-sm font-semibold" :class="store.settings.value.agentActive ? 'text-blue-600' : 'text-slate-600'">
          {{ store.settings.value.agentActive ? 'Активен' : 'Отключен' }}
        </span>
      </div>

      <div class="relative">
        <button
          @click="handleLogout"
          :disabled="isLoggingOut"
          class="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut :size="18" />
          <span>{{ isLoggingOut ? 'Выход...' : 'Выйти' }}</span>
        </button>

        <!-- Сообщение об успешном выходе -->
        <div
          v-if="logoutMessage"
          class="absolute top-full right-0 mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 whitespace-nowrap z-50"
        >
          {{ logoutMessage }}
        </div>
      </div>
    </div>
  </header>
</template>
