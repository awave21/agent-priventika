<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore'
import AppLayout from '../components/AppLayout.vue'
import { UserX, Plus, Trash2 } from 'lucide-vue-next'

const store = useStore()

const showAddModal = ref(false)
const searchQuery = ref('')
const selectedUser = ref<any>(null)
const showDropdown = ref(false)

const getUserDisplayName = (user: any) => {
  return user?.name || user?.username || user?.phone || 'Неизвестно'
}

const availableUsers = computed(() => {
  const notIgnored = store.users.value.filter(user =>
    !store.ignoredUsers.value.some(entry => entry.userId === user.id)
  )

  if (!searchQuery.value.trim()) return notIgnored

  const query = searchQuery.value.toLowerCase().trim()

  return notIgnored.filter(user => {
    const name = (user.name || '').toLowerCase()
    const username = (user.username || '').toLowerCase()
    const phone = (user.phone || '').toLowerCase()
    const chatId = (user.chatId || '').toLowerCase()

    return (
      chatId.includes(query) ||
      name.includes(query) ||
      username.includes(query) ||
      phone.includes(query)
    )
  })
})

const selectUser = (user: any) => {
  selectedUser.value = user
  searchQuery.value = getUserDisplayName(user)
  showDropdown.value = false
}

const onInputFocus = () => {
  showDropdown.value = true
}

const onInputChange = () => {
  selectedUser.value = null
  showDropdown.value = true

  const exactMatch = store.users.value.find(u => u.chatId === searchQuery.value.trim())
  if (exactMatch) {
    selectUser(exactMatch)
  }
}

const addToIgnore = () => {
  if (!selectedUser.value) return

  store.addToIgnoreList(selectedUser.value.id)
  showAddModal.value = false
  searchQuery.value = ''
  selectedUser.value = null
  showDropdown.value = false
}

const removeFromIgnore = (entryId: string) => {
  store.removeFromIgnoreList(entryId)
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <AppLayout>
    <div class="p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-semibold text-slate-900 mb-2">Лист игнор</h1>
          <p class="text-slate-600">Управление черным списком пользователей</p>
        </div>
        <button
          @click="showAddModal = true"
          class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Plus :size="20" />
          <span>Добавить в игнор</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div v-if="store.ignoredUsers.value.length === 0" class="text-center py-16">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX :size="32" class="text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">Список пуст</h3>
          <p class="text-sm text-slate-600">Нет пользователей в черном списке</p>
        </div>

        <div v-else class="divide-y divide-slate-200">
          <div
            v-for="entry in store.ignoredUsers.value"
            :key="entry.id"
            class="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                <span class="text-slate-600 font-medium">
                  {{ getUserDisplayName(entry.user)[0].toUpperCase() }}
                </span>
              </div>
              <div>
                <h3 class="font-medium text-slate-900">{{ getUserDisplayName(entry.user) }}</h3>
                <p class="text-sm text-slate-500">Добавлен: {{ formatDate(entry.createdAt) }}</p>
              </div>
            </div>
            <button
              @click="removeFromIgnore(entry.id)"
              class="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 :size="18" />
              <span>Удалить</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 class="text-xl font-semibold text-slate-900 mb-4">Добавить в игнор</h2>

        <div class="mb-6 relative">
          <label class="block text-sm font-medium text-slate-700 mb-2">Выберите пользователя</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Введите имя или chat_id"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            @focus="onInputFocus"
            @input="onInputChange"
          />

          <div
            v-if="showDropdown && availableUsers.length > 0"
            class="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
          >
            <div
              v-for="user in availableUsers"
              :key="user.id"
              @click="selectUser(user)"
              class="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-slate-600 font-medium">
                    {{ getUserDisplayName(user)[0].toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-slate-900 truncate">{{ getUserDisplayName(user) }}</div>
                  <div class="text-sm text-slate-500 truncate">chat_id: {{ user.chatId }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedUser" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <span class="text-green-700 font-medium">
                  {{ getUserDisplayName(selectedUser)[0].toUpperCase() }}
                </span>
              </div>
              <div>
                <div class="font-medium text-slate-900">{{ getUserDisplayName(selectedUser) }}</div>
                <div class="text-sm text-slate-600">chat_id: {{ selectedUser.chatId }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="showAddModal = false"
            class="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Отмена
          </button>
          <button
            @click="addToIgnore"
            :disabled="!selectedUser"
            class="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
