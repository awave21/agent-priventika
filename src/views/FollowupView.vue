<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore'
import AppLayout from '../components/AppLayout.vue'
import FollowupList from '../components/followups/FollowupList.vue'
import AddFollowupModal from '../components/followups/AddFollowupModal.vue'
import EditFollowupModal from '../components/followups/EditFollowupModal.vue'
import { Plus } from 'lucide-vue-next'
import type { Followup } from '../types'

const store = useStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const editingFollowup = ref<{ id: string; text: string; intervalMinutes: number } | null>(null)

const sortedFollowups = computed(() => {
  return [...store.followups.value].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime() + a.intervalMinutes * 60 * 1000
    const bTime = new Date(b.createdAt).getTime() + b.intervalMinutes * 60 * 1000
    return aTime - bTime
  })
})

const handleAdd = (text: string, intervalMinutes: number, isDefault: boolean) => {
  store.addFollowup(text, intervalMinutes, isDefault)
}

const handleEdit = (followup: Followup) => {
  editingFollowup.value = {
    id: followup.id,
    text: followup.text,
    intervalMinutes: followup.intervalMinutes
  }
  showEditModal.value = true
}

const handleSave = (id: string, text: string, intervalMinutes: number) => {
  store.updateFollowup(id, text, intervalMinutes)
  editingFollowup.value = null
}

const handleRemove = (id: string) => {
  if (confirm('Вы уверены, что хотите удалить это напоминание?')) {
    store.removeFollowup(id)
  }
}
</script>

<template>
  <AppLayout>
    <div class="p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-semibold text-slate-900 mb-2">Напоминания</h1>
          <p class="text-slate-600">Управление запланированными напоминаниями</p>
        </div>
        <button
          @click="showAddModal = true"
          class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Plus :size="20" />
          <span>Добавить напоминание</span>
        </button>
      </div>

      <FollowupList
        :followups="sortedFollowups"
        @edit="handleEdit"
        @remove="handleRemove"
      />
    </div>

    <AddFollowupModal
      v-model="showAddModal"
      @add="handleAdd"
    />

    <EditFollowupModal
      v-model="showEditModal"
      :followup-id="editingFollowup?.id"
      :initial-text="editingFollowup?.text"
      :initial-interval-minutes="editingFollowup?.intervalMinutes"
      @save="handleSave"
    />
  </AppLayout>
</template>
