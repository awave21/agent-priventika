<script setup lang="ts">
import { Bell } from 'lucide-vue-next'
import FollowupItem from './FollowupItem.vue'
import type { Followup } from '../../types'

defineProps<{
  followups: Followup[]
}>()

defineEmits<{
  edit: [followup: Followup]
  remove: [id: string]
}>()
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
    <div v-if="followups.length === 0" class="text-center py-16">
      <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Bell :size="32" class="text-slate-400" />
      </div>
      <h3 class="text-lg font-medium text-slate-900 mb-2">Нет напоминаний</h3>
      <p class="text-sm text-slate-600">Создайте первое напоминание</p>
    </div>

    <div v-else class="divide-y divide-slate-200">
      <FollowupItem
        v-for="followup in followups"
        :key="followup.id"
        :followup="followup"
        @edit="$emit('edit', $event)"
        @remove="$emit('remove', $event)"
      />
    </div>
  </div>
</template>
