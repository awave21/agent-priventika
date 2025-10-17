<script setup lang="ts">
import { ref } from 'vue'
import IntervalSelector from './IntervalSelector.vue'

const show = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  add: [text: string, intervalMinutes: number, isDefault: boolean]
}>()

const text = ref('Уточни у клиента актуальность вопроса, учитывая предыдущий контекст диалога')
const intervalMinutes = ref(5)
const isDefault = ref(false)

const handleAdd = () => {
  if (!text.value) return
  emit('add', text.value, intervalMinutes.value, isDefault.value)
  show.value = false
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="show = false"
  >
    <div class="bg-white rounded-2xl max-w-md w-full p-6">
      <h2 class="text-xl font-semibold text-slate-900 mb-4">Добавить напоминание</h2>

      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Текст напоминания</label>
          <textarea
            v-model="text"
            placeholder="Введите текст напоминания"
            rows="3"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
          />
        </div>

        <IntervalSelector v-model="intervalMinutes" />

        <label class="flex items-center gap-3 cursor-pointer">
          <input
            v-model="isDefault"
            type="checkbox"
            class="w-5 h-5 text-slate-900 bg-slate-50 border-slate-300 rounded focus:ring-2 focus:ring-slate-900"
          />
          <span class="text-sm text-slate-700">Использовать контекст чата по умолчанию</span>
        </label>
      </div>

      <div class="flex gap-3">
        <button
          @click="show = false"
          class="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
        >
          Отмена
        </button>
        <button
          @click="handleAdd"
          :disabled="!text"
          class="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Добавить
        </button>
      </div>
    </div>
  </div>
</template>
