<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStore } from '../composables/useStore'
import AppLayout from '../components/AppLayout.vue'
import { Settings as SettingsIcon, Database, Save, CheckCircle, Loader, AlertCircle, UserPlus } from 'lucide-vue-next'

const store = useStore()

const botDelayMinutes = ref(5)
const supabaseUrl = ref('')
const supabaseAnonKey = ref('')
const showSuccessMessage = ref(false)
const isTestingConnection = ref(false)
const connectionStatus = ref<'idle' | 'success' | 'error'>('idle')
const connectionError = ref('')

onMounted(() => {
  botDelayMinutes.value = store.settings.value.botResponseDelayMinutes
  supabaseUrl.value = store.settings.value.supabaseUrl
  supabaseAnonKey.value = store.settings.value.supabaseAnonKey
})

const saveSettings = () => {
  // Сохраняем настройки локально
  store.updateSettings({
    botResponseDelayMinutes: botDelayMinutes.value,
    supabaseUrl: supabaseUrl.value,
    supabaseAnonKey: supabaseAnonKey.value
  })

  // Немедленная синхронизация задержки бота с базой данных
  if (store.settings.value.supabaseUrl && store.settings.value.supabaseAnonKey) {
    store.updateBotDelay(botDelayMinutes.value)
  }

  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

const quickSetDelay = async (minutes: number) => {
  console.log(`[SettingsView] Установка задержки через кнопку: ${minutes} минут`)
  botDelayMinutes.value = minutes

  // Немедленная синхронизация с базой данных
  if (store.settings.value.supabaseUrl && store.settings.value.supabaseAnonKey) {
    try {
      await store.updateBotDelay(minutes)
      console.log(`[SettingsView] ✅ Задержка ${minutes} мин синхронизирована с базой данных`)
    } catch (error) {
      console.error(`[SettingsView] ❌ Ошибка синхронизации:`, error)
    }
  }

  // Сохраняем локально
  store.updateSettings({
    botResponseDelayMinutes: minutes
  })
}

const onDelayInputChange = async () => {
  console.log(`[SettingsView] Изменение через поле ввода: ${botDelayMinutes.value} минут`)

  // Немедленная синхронизация с базой данных
  if (store.settings.value.supabaseUrl && store.settings.value.supabaseAnonKey) {
    try {
      await store.updateBotDelay(botDelayMinutes.value)
      console.log(`[SettingsView] ✅ Задержка ${botDelayMinutes.value} мин синхронизирована с базой данных`)
    } catch (error) {
      console.error(`[SettingsView] ❌ Ошибка синхронизации:`, error)
    }
  }

  // Сохраняем локально
  store.updateSettings({
    botResponseDelayMinutes: botDelayMinutes.value
  })
}

const testSupabaseConnection = async () => {
  if (!supabaseUrl.value || !supabaseAnonKey.value) {
    connectionStatus.value = 'error'
    connectionError.value = 'Заполните URL и Anon Key'
    return
  }

  isTestingConnection.value = true
  connectionStatus.value = 'idle'
  connectionError.value = ''

  try {
    const url = supabaseUrl.value.replace(/\/$/, '')
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey.value,
        'Authorization': `Bearer ${supabaseAnonKey.value}`
      }
    })

    if (response.ok || response.status === 404) {
      connectionStatus.value = 'success'
    } else {
      connectionStatus.value = 'error'
      connectionError.value = `Ошибка подключения: ${response.status} ${response.statusText}`
    }
  } catch (error) {
    connectionStatus.value = 'error'
    connectionError.value = error instanceof Error ? error.message : 'Не удалось подключиться к Supabase'
  } finally {
    isTestingConnection.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="p-8 max-w-4xl">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
          <SettingsIcon :size="24" class="text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold text-slate-900">Настройки</h1>
          <p class="text-slate-600">Конфигурация системы и интеграций</p>
        </div>
      </div>

      <div
        v-if="showSuccessMessage"
        class="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
      >
        <CheckCircle :size="20" class="text-emerald-600" />
        <span class="text-emerald-900 font-medium">Настройки успешно сохранены</span>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <UserPlus :size="20" class="text-slate-600" />
            <h2 class="text-xl font-semibold text-slate-900">Отправка новым пользователям</h2>
          </div>

          <div class="space-y-4">
            <p class="text-sm text-slate-600">
              Включите этот режим, чтобы автоматически отправлять приветственные сообщения новым пользователям
            </p>

            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p class="font-medium text-slate-900">Режим отправки новым пользователям</p>
                <p class="text-sm text-slate-600 mt-1">
                  {{ store.settings.value.sentNewUser ? 'Включен' : 'Выключен' }}
                </p>
              </div>
              <button
                @click="store.toggleSentNewUser()"
                class="relative w-14 h-7 rounded-full transition-colors"
                :class="store.settings.value.sentNewUser ? 'bg-blue-500' : 'bg-slate-300'"
              >
                <div
                  class="absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all"
                  :class="store.settings.value.sentNewUser ? 'left-7' : 'left-0.5'"
                ></div>
              </button>
            </div>

            <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p class="text-sm text-amber-900">
                <strong>Примечание:</strong> Это поведение применяется только к пользователям, которые впервые написали в чат
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <Clock :size="20" class="text-slate-600" />
            <h2 class="text-xl font-semibold text-slate-900">Задержка ответа бота</h2>
          </div>

          <div class="space-y-4">
            <p class="text-sm text-slate-600">
              Укажите через сколько минут бот может ответить после сообщения пользователя, если уже общается менеджер
            </p>

            <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div class="text-sm text-blue-900 space-y-2">
                <div><strong>Статус синхронизации:</strong></div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="store.settings.value.supabaseUrl && store.settings.value.supabaseAnonKey ? 'bg-green-500' : 'bg-red-500'"></div>
                  <span>{{ store.settings.value.supabaseUrl && store.settings.value.supabaseAnonKey ? 'Supabase настроен' : 'Supabase не настроен' }}</span>
                </div>
                <div v-if="store.settings.value.supabaseUrl" class="text-xs font-mono break-all">
                  URL: {{ store.settings.value.supabaseUrl }}
                </div>
                <div v-if="!store.settings.value.supabaseUrl || !store.settings.value.supabaseAnonKey" class="mt-2">
                  <strong class="text-red-700">⚠️ Настройте подключение к Supabase для синхронизации с базой данных</strong>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-3">
                Задержка (в минутах)
              </label>

              <div class="flex gap-2 mb-4 flex-wrap">
                <button
                  type="button"
                  @click="quickSetDelay(3)"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    botDelayMinutes === 3
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  "
                >
                  3 мин
                </button>
                <button
                  type="button"
                  @click="quickSetDelay(5)"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    botDelayMinutes === 5
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  "
                >
                  5 мин
                </button>
                <button
                  type="button"
                  @click="quickSetDelay(10)"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    botDelayMinutes === 10
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  "
                >
                  10 мин
                </button>
                <button
                  type="button"
                  @click="quickSetDelay(15)"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    botDelayMinutes === 15
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  "
                >
                  15 мин
                </button>
                <button
                  type="button"
                  @click="quickSetDelay(30)"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    botDelayMinutes === 30
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  "
                >
                  30 мин
                </button>
                <button
                  type="button"
                  @click="quickSetDelay(60)"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    botDelayMinutes === 60
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  "
                >
                  60 мин
                </button>
              </div>

              <input
                v-model.number="botDelayMinutes"
                type="number"
                min="1"
                max="60"
                placeholder="Укажите свое значение"
                @input="onDelayInputChange"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div class="text-sm text-blue-900 space-y-2">
                <div><strong>Статус синхронизации:</strong></div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="store.settings.value.supabaseUrl && store.settings.value.supabaseAnonKey ? 'bg-green-500' : 'bg-red-500'"></div>
                  <span>{{ store.settings.value.supabaseUrl && store.settings.value.supabaseAnonKey ? 'Supabase настроен' : 'Supabase не настроен' }}</span>
                </div>
                <div v-if="store.settings.value.supabaseUrl" class="text-xs font-mono break-all">
                  URL: {{ store.settings.value.supabaseUrl }}
                </div>
                <div v-if="!store.settings.value.supabaseUrl || !store.settings.value.supabaseAnonKey" class="mt-2">
                  <strong class="text-red-700">⚠️ Настройте подключение к Supabase для синхронизации с базой данных</strong>
                </div>
              </div>
            </div>

            <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p class="text-sm text-blue-900">
                <strong>Текущая настройка:</strong> Бот может ответить через
                <strong>{{ botDelayMinutes }} минут</strong> после последнего сообщения
                пользователя, если менеджер уже взял чат в работу
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <Database :size="20" class="text-slate-600" />
            <h2 class="text-xl font-semibold text-slate-900">Подключение к Supabase</h2>
          </div>

          <div class="space-y-4">
            <p class="text-sm text-slate-600 mb-4">
              Настройте подключение к вашему проекту Supabase для синхронизации данных
            </p>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Supabase URL</label>
              <input
                v-model="supabaseUrl"
                type="url"
                placeholder="https://ваш-проект.supabase.co"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                Supabase Anon Key
              </label>
              <input
                v-model="supabaseAnonKey"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <button
                type="button"
                @click="testSupabaseConnection"
                :disabled="isTestingConnection || !supabaseUrl || !supabaseAnonKey"
                class="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Loader v-if="isTestingConnection" :size="20" class="animate-spin" />
                <CheckCircle v-else-if="connectionStatus === 'success'" :size="20" />
                <AlertCircle v-else-if="connectionStatus === 'error'" :size="20" />
                <Database v-else :size="20" />
                <span>
                  {{ isTestingConnection ? 'Проверка...' : 'Проверить подключение' }}
                </span>
              </button>
            </div>

            <div
              v-if="connectionStatus === 'success'"
              class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
            >
              <CheckCircle :size="20" class="text-emerald-600" />
              <span class="text-emerald-900 font-medium">Подключение успешно установлено</span>
            </div>

            <div
              v-if="connectionStatus === 'error'"
              class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle :size="20" class="text-red-600 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-red-900">
                <p class="font-medium mb-1">Ошибка подключения</p>
                <p class="text-red-700">{{ connectionError }}</p>
              </div>
            </div>

            <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p class="text-sm text-amber-900">
                <strong>Важно:</strong> Эти данные хранятся локально в памяти приложения. Для
                постоянного хранения необходимо настроить сохранение в Supabase
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            @click="saveSettings"
            class="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Save :size="20" />
            <span>Сохранить настройки</span>
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
