<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../composables/useStore'
import { Lock } from 'lucide-vue-next'

const router = useRouter()
const store = useStore()

const password = ref('')
const error = ref('')
const isLoading = ref(false)
const appStatus = ref('Загрузка...')

const VALID_PASSWORD = 'admin123'

onMounted(() => {
  // Проверяем статус приложения
  try {
    console.log('🔍 Диагностика приложения:')
    console.log('- Vue Router:', !!router)
    console.log('- Store:', !!store)
    console.log('- Аутентификация:', store.isAuthenticated.value)

    // Проверяем настройки Supabase
    if (store.settings.value.supabaseUrl && store.settings.value.supabaseAnonKey) {
      console.log('✅ Supabase настройки найдены')
    } else {
      console.log('⚠️ Supabase настройки отсутствуют или пустые')
    }

    appStatus.value = 'Приложение готово'
  } catch (err) {
    console.error('❌ Ошибка инициализации:', err)
    appStatus.value = 'Ошибка загрузки приложения'
  }
})

const handleSubmit = async () => {
  error.value = ''

  if (password.value.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов'
    return
  }

  isLoading.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  if (password.value === VALID_PASSWORD) {
    store.isAuthenticated.value = true
    await router.push({ name: 'dashboard' })
  } else {
    error.value = 'Неверный пароль'
  }

  isLoading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
            <Lock :size="32" class="text-white" />
          </div>
        </div>

        <h1 class="text-2xl font-semibold text-center text-slate-900 mb-2">
          Вход в систему
        </h1>
        <p class="text-sm text-slate-600 text-center mb-4">
          Введите пароль для доступа к панели управления
        </p>

        <div class="mb-6 p-3 bg-slate-50 rounded-lg text-center">
          <p class="text-xs text-slate-500">{{ appStatus }}</p>
          <p class="text-xs text-slate-400 mt-1">
            URL: {{ store.settings.value.supabaseUrl || 'Не настроен' }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-2">
              Пароль
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Введите пароль"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              :class="{ 'border-red-500': error }"
            />
            <p v-if="error" class="mt-2 text-sm text-red-600">
              {{ error }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Вход...' : 'Войти' }}
          </button>
        </form>

      </div>
    </div>
  </div>
</template>
