<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from '../composables/useStore'
import AppLayout from '../components/AppLayout.vue'
import { Users, Power, PowerOff } from 'lucide-vue-next'
import { loadUsersFromSupabase } from '../stores/users'

const store = useStore()

onMounted(() => {
  console.log('🔄 [UsersView] Загрузка пользователей при монтировании компонента')
  loadUsersFromSupabase()
})

const searchQuery = ref('')

const getUserDisplayName = (user: any) => {
  return user.name || user.username || user.phone
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return store.users.value

  const query = searchQuery.value.toLowerCase()
  return store.users.value.filter(user => {
    const displayName = getUserDisplayName(user)
    return displayName.toLowerCase().includes(query) || user.phone.toLowerCase().includes(query)
  })
})

const activeCount = computed(() => {
  const count = store.users.value.filter(u => u.isActive).length
  console.log('📊 [UsersView] Активные пользователи:', count)
  return count
})

const inactiveCount = computed(() => {
  const count = store.users.value.filter(u => !u.isActive).length
  console.log('📊 [UsersView] Неактивные пользователи:', count)
  return count
})


const toggleUser = async (userId: string) => {
  console.log('🔄 [UsersView] Начало переключения пользователя:', userId)

  // Проверяем настройки Supabase
  console.log('🔍 [UsersView] Проверка настроек Supabase:', {
    hasUrl: !!store.settings.value.supabaseUrl,
    hasKey: !!store.settings.value.supabaseAnonKey,
    url: store.settings.value.supabaseUrl ? '[СКРЫТО]' : 'ОТСУТСТВУЕТ',
    key: store.settings.value.supabaseAnonKey ? '[СКРЫТО]' : 'ОТСУТСТВУЕТ'
  })

  // Проверяем пользователя
  const user = store.users.value.find(u => u.id === userId)
  console.log('👤 [UsersView] Найден пользователь:', user ? {
    id: user.id,
    isActive: user.isActive,
    name: user.name || user.username || user.phone
  } : 'ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН')

  try {
    await store.toggleUserActive(userId)
    console.log('✅ [UsersView] Переключение пользователя завершено успешно')
  } catch (error) {
    console.error('❌ [UsersView] Ошибка при переключении пользователя:', error)
  }
}

const activateAll = async () => {
  console.log('🔄 [UsersView] Начало массовой активации пользователей')

  // Проверяем настройки Supabase
  console.log('🔍 [UsersView] Проверка настроек Supabase:', {
    hasUrl: !!store.settings.value.supabaseUrl,
    hasKey: !!store.settings.value.supabaseAnonKey,
    url: store.settings.value.supabaseUrl ? '[СКРЫТО]' : 'ОТСУТСТВУЕТ',
    key: store.settings.value.supabaseAnonKey ? '[СКРЫТО]' : 'ОТСУТСТВУЕТ'
  })

  console.log('🔄 [UsersView] Запуск активации всех пользователей')
  try {
    await store.activateAllUsers()
    console.log('✅ [UsersView] Активация всех пользователей завершена успешно')
  } catch (error) {
    console.error('❌ [UsersView] Ошибка при активации всех пользователей:', error)
  }
}

const deactivateAll = async () => {
  console.log('🔄 [UsersView] Начало массовой деактивации пользователей')

  // Проверяем настройки Supabase
  console.log('🔍 [UsersView] Проверка настроек Supabase:', {
    hasUrl: !!store.settings.value.supabaseUrl,
    hasKey: !!store.settings.value.supabaseAnonKey,
    url: store.settings.value.supabaseUrl ? '[СКРЫТО]' : 'ОТСУТСТВУЕТ',
    key: store.settings.value.supabaseAnonKey ? '[СКРЫТО]' : 'ОТСУТСТВУЕТ'
  })

  console.log('🔄 [UsersView] Запуск деактивации всех пользователей')
  try {
    await store.deactivateAllUsers()
    console.log('✅ [UsersView] Деактивация всех пользователей завершена успешно')
  } catch (error) {
    console.error('❌ [UsersView] Ошибка при деактивации всех пользователей:', error)
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <AppLayout>
    <div class="p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-semibold text-slate-900 mb-2">Пользователи</h1>
          <p class="text-slate-600">Управление пользователями системы</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="activateAll"
            :disabled="inactiveCount === 0"
            class="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="inactiveCount === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'"
          >
            <Power :size="20" />
            <span>Включить всех</span>
          </button>

          <button
            @click="deactivateAll"
            :disabled="activeCount === 0"
            class="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="activeCount === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'"
          >
            <PowerOff :size="20" />
            <span>Отключить всех</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-slate-600 mb-1">Активные пользователи</h3>
              <p class="text-3xl font-semibold text-emerald-600">{{ activeCount }}</p>
            </div>
            <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Power :size="24" class="text-emerald-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-slate-600 mb-1">Неактивные пользователи</h3>
              <p class="text-3xl font-semibold text-slate-400">{{ inactiveCount }}</p>
            </div>
            <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <PowerOff :size="24" class="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div class="p-6 border-b border-slate-200">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск пользователей..."
            class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        <div v-if="filteredUsers.length === 0" class="text-center py-16">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users :size="32" class="text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">Пользователи не найдены</h3>
          <p class="text-sm text-slate-600">Попробуйте изменить параметры поиска</p>
        </div>

        <div v-else class="divide-y divide-slate-200">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="user.isActive ? 'bg-emerald-100' : 'bg-slate-200'">
                <span class="font-medium" :class="user.isActive ? 'text-emerald-700' : 'text-slate-600'">
                  {{ getUserDisplayName(user)[0].toUpperCase() }}
                </span>
              </div>
              <div>
                <div class="flex items-center gap-3">
                  <h3 class="font-medium text-slate-900">{{ getUserDisplayName(user) }}</h3>
                  <span
                    class="px-2 py-1 text-xs rounded-lg"
                    :class="user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                  >
                    {{ user.isActive ? 'Активен' : 'Неактивен' }}
                  </span>
                </div>
                <p class="text-sm text-slate-500">{{ user.phone }} • {{ formatDate(user.createdAt) }}</p>
              </div>
            </div>

            <button
              @click="toggleUser(user.id)"
              class="relative w-14 h-7 rounded-full transition-colors"
              :class="user.isActive ? 'bg-emerald-500' : 'bg-slate-300'"
            >
              <div
                class="absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all"
                :class="user.isActive ? 'left-7' : 'left-0.5'"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
