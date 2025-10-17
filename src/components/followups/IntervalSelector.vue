<script setup lang="ts">
const intervalMinutes = defineModel<number>({ required: true })

const presets = [5, 10, 15, 30, 60]
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-3">Время срабатывания</label>

    <div class="mb-3 text-xs text-slate-600">Выберите интервал (от текущего момента):</div>
    <div class="grid grid-cols-5 gap-2 mb-3">
      <button
        v-for="preset in presets"
        :key="preset"
        type="button"
        @click="intervalMinutes = preset"
        class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="intervalMinutes === preset ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
      >
        {{ preset }} мин
      </button>
    </div>

    <div class="text-xs text-slate-600 mb-2">Или укажите свое значение (в минутах):</div>
    <input
      v-model.number="intervalMinutes"
      type="number"
      min="1"
      placeholder="Количество минут"
      class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
    />
  </div>
</template>
