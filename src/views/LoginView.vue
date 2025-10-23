<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { Lock, Mail, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const { signIn, isLoading, user } = useAuth()

// Форма входа
const loginForm = ref({
  email: '',
  password: ''
})

const error = ref('')
const success = ref('')
const showPassword = ref(false)

// Следим за изменениями состояния аутентификации
watch(user, async (newUser) => {
  if (newUser && !isLoading.value) {
    // Пользователь аутентифицирован и загрузка завершена
    await router.push({ name: 'dashboard' })
  }
}, { immediate: true })

onMounted(() => {
  // Если пользователь уже загружен (сессия восстановлена мгновенно)
  if (user.value && !isLoading.value) {
    router.push({ name: 'dashboard' })
  }
})

const handleLogin = async () => {
  error.value = ''
  success.value = ''

  if (!loginForm.value.email || !loginForm.value.password) {
    error.value = 'Заполните все поля'
    return
  }

  if (loginForm.value.password.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов'
    return
  }

  const { error: signInError } = await signIn(loginForm.value.email, loginForm.value.password)

  if (signInError) {
    error.value = getErrorMessage(signInError.message)
  } else {
    success.value = 'Успешный вход в систему!'
    await router.push({ name: 'dashboard' })
  }
}

const getErrorMessage = (errorMessage: string) => {
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Неверный email или пароль'
  }
  if (errorMessage.includes('Email not confirmed')) {
    return 'Подтвердите ваш email адрес'
  }
  return errorMessage
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
        <p class="text-sm text-slate-600 text-center mb-6">
          Введите данные для доступа к панели управления
        </p>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-2">
              Email адрес
            </label>
            <div class="relative">
              <Mail :size="20" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                v-model="loginForm.email"
                type="email"
                placeholder="your@email.com"
                class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                :class="{ 'border-red-500': error }"
                :disabled="isLoading"
                required
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-2">
              Пароль
            </label>
            <div class="relative">
              <Lock :size="20" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Введите пароль"
                class="w-full pl-10 pr-16 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                :class="{ 'border-red-500': error }"
                :disabled="isLoading"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <Eye v-if="showPassword" :size="20" />
                <EyeOff v-else :size="20" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Вход...' : 'Войти' }}
          </button>
        </form>

        <!-- Сообщения об ошибках и успехе -->
        <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <div v-if="success" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-sm text-green-600">{{ success }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
