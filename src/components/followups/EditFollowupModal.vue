<script setup lang="ts">
import { ref, watch } from 'vue'

const show = defineModel<boolean>({ required: true })

const props = defineProps<{
  followupId?: string
  initialText?: string
  initialIntervalMinutes?: number
}>()

const emit = defineEmits<{
  save: [id: string, text: string, intervalMinutes: number]
}>()

const text = ref('')
const intervalMinutes = ref(5)

watch(() => [props.followupId, props.initialText, props.initialIntervalMinutes], () => {
  if (props.followupId) {
    text.value = props.initialText || ''
    intervalMinutes.value = props.initialIntervalMinutes || 5
  }
}, { immediate: true })

const handleSave = () => {
  if (!props.followupId || !text.value) return
  emit('save', props.followupId, text.value, intervalMinutes.value)
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
      <h2 class="text-xl font-semibold text-slate-900 mb-4">Редактировать напоминание</h2>

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

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Интервал (в минутах)</label>
          <input
            v-model.number="intervalMinutes"
            type="number"
            min="1"
            placeholder="Количество минут"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      <div class="flex gap-3">
        <button
          @click="show = false"
          class="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
        >
          Отмена
        </button>
        <button
          @click="handleSave"
          :disabled="!text"
          class="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>
