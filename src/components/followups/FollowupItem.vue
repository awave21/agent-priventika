<script setup lang="ts">
import { Clock, Edit2, Trash2 } from 'lucide-vue-next'
import { formatDateTime, getTimeStatus } from '../../utils/followupHelpers'
import type { Followup } from '../../types'

defineProps<{
  followup: Followup
}>()

defineEmits<{
  edit: [followup: Followup]
  remove: [id: string]
}>()
</script>

<template>
  <div class="p-6 hover:bg-slate-50 transition-colors">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="font-medium text-slate-900">{{ followup.text }}</h3>
          <span
            v-if="followup.isDefault"
            class="px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-700"
          >
            По умолчанию
          </span>
          <span
            class="px-2 py-1 text-xs rounded-lg"
            :class="getTimeStatus(followup.createdAt, followup.intervalMinutes).color"
          >
            {{ getTimeStatus(followup.createdAt, followup.intervalMinutes).text }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <Clock :size="16" />
          <span>{{ formatDateTime(followup.createdAt, followup.intervalMinutes) }} (через {{ followup.intervalMinutes }} мин)</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="$emit('edit', followup)"
          class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Edit2 :size="18" />
        </button>
        <button
          @click="$emit('remove', followup.id)"
          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>
