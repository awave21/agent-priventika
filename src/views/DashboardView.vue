<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../composables/useStore'
import AppLayout from '../components/AppLayout.vue'
import { BarChart3, TrendingUp } from 'lucide-vue-next'

const store = useStore()

const totalAgentMessages = computed(() => {
  return store.messageStats.value.reduce((sum, stat) => sum + stat.agentCount, 0)
})

const totalManagerMessages = computed(() => {
  return store.messageStats.value.reduce((sum, stat) => sum + stat.managerCount, 0)
})

const totalMessages = computed(() => totalAgentMessages.value + totalManagerMessages.value)

const agentPercentage = computed(() => {
  if (totalMessages.value === 0) return 0
  return Math.round((totalAgentMessages.value / totalMessages.value) * 100)
})
</script>

<template>
  <AppLayout>
    <div class="p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-slate-900 mb-2">Дашборд</h1>
        <p class="text-slate-600">Статистика ответов агента и менеджера</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-slate-600">Всего ответов</h3>
            <BarChart3 :size="20" class="text-slate-400" />
          </div>
          <p class="text-3xl font-semibold text-slate-900">{{ totalMessages }}</p>
          <p class="text-sm text-slate-500 mt-2">За выбранный период</p>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-slate-600">Ответы агента</h3>
            <TrendingUp :size="20" class="text-emerald-500" />
          </div>
          <p class="text-3xl font-semibold text-emerald-600">{{ totalAgentMessages }}</p>
          <p class="text-sm text-slate-500 mt-2">{{ agentPercentage }}% от всех ответов</p>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-slate-600">Ответы менеджера</h3>
            <TrendingUp :size="20" class="text-slate-500" />
          </div>
          <p class="text-3xl font-semibold text-slate-600">{{ totalManagerMessages }}</p>
          <p class="text-sm text-slate-500 mt-2">{{ 100 - agentPercentage }}% от всех ответов</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 class="text-lg font-semibold text-slate-900 mb-6">Детальная статистика</h3>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">Дата</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">Ответы агента</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">Ответы менеджера</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">Всего</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">% агента</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="stat in store.messageStats.value"
                :key="stat.date"
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="py-3 px-4 text-sm text-slate-900">
                  {{ new Date(stat.date).toLocaleDateString('ru-RU') }}
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                    {{ stat.agentCount }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                    {{ stat.managerCount }}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm font-medium text-slate-900">
                  {{ stat.agentCount + stat.managerCount }}
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-emerald-500 rounded-full"
                        :style="{
                          width: `${(stat.agentCount / (stat.agentCount + stat.managerCount)) * 100}%`
                        }"
                      />
                    </div>
                    <span class="text-sm text-slate-600 font-medium">
                      {{ Math.round((stat.agentCount / (stat.agentCount + stat.managerCount)) * 100) }}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="store.messageStats.value.length === 0" class="text-center py-12">
            <p class="text-slate-500">Нет данных для отображения</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
