<script setup lang="ts">
import { useRoute } from 'vue-router'
import { LayoutDashboard, MessageSquare, UserX, Bell, Users, Settings, FlaskConical } from 'lucide-vue-next'

const route = useRoute()

defineProps<{
  visible: boolean
}>()

const navItems = [
  { name: 'Дашборд', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Чаты', path: '/chats', icon: MessageSquare },
  { name: 'Тест', path: '/test-chats', icon: FlaskConical },
  { name: 'Лист игнор', path: '/ignore', icon: UserX },
  { name: 'Напоминания', path: '/followups', icon: Bell },
  { name: 'Пользователи', path: '/users', icon: Users },
  { name: 'Настройки', path: '/settings', icon: Settings }
]
</script>

<template>
  <aside
    class="bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-hidden"
    :class="visible ? 'w-64' : 'w-0'"
  >
    <div class="p-6 border-b border-slate-200 w-64">
      <h2 class="text-xl font-semibold text-slate-900">CRM Система</h2>
      <p class="text-sm text-slate-500 mt-1">Управление чатами</p>
    </div>

    <nav class="flex-1 p-4 space-y-1 w-64">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
        :class="
          route.path.startsWith(item.path)
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-50'
        "
      >
        <component :is="item.icon" :size="20" />
        <span class="font-medium">{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>
