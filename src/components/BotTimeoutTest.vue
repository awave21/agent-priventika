<template>
  <div class="p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-xl font-bold mb-4">Тестирование задержки бота</h2>

    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium">Задержка (минут):</label>
        <span class="font-mono text-blue-600">{{ botDelayMinutes }}</span>
      </div>

      <div class="flex items-center gap-4">
        <label class="text-sm font-medium">Значение в базе timeout:</label>
        <span class="font-mono text-green-600">{{ botDelayMinutes }}</span>
      </div>

      <div class="mt-4 p-3 bg-green-50 rounded">
        <h3 class="font-semibold mb-2 text-green-800">✅ Новая логика:</h3>
        <div class="text-sm text-green-700 space-y-1">
          <div><strong>Немедленная синхронизация:</strong> При изменении задержки значение сразу отправляется в базу данных</div>
          <div><strong>Поле timeout:</strong> Хранит количество минут задержки (0, 3, 5, 10, 15, 30, 60...)</div>
          <div><strong>Без чекбокса:</strong> Задержка настраивается напрямую кнопками и полем ввода</div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-blue-50 rounded">
        <h3 class="font-semibold mb-2">Тестирование передачи значений:</h3>
        <div class="text-sm space-y-1">
          <div><strong>Кнопки быстрого выбора:</strong> 3, 5, 10, 15, 30, 60 минут</div>
          <div><strong>Поле ввода:</strong> Любое значение от 0 до 60 минут</div>
          <div><strong>Значение 0:</strong> Отключает задержку бота</div>
        </div>
      </div>

      <div class="flex gap-2 flex-wrap">
        <button
          @click="testSetDelay(3)"
          class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          3 мин
        </button>

        <button
          @click="testSetDelay(5)"
          class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          5 мин
        </button>

        <button
          @click="testSetDelay(10)"
          class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          10 мин
        </button>

        <button
          @click="testSetDelay(15)"
          class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          15 мин
        </button>

        <button
          @click="testSetDelay(30)"
          class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          30 мин
        </button>

        <button
          @click="testSetDelay(60)"
          class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          60 мин
        </button>

        <button
          @click="testSetDelay(0)"
          class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          0 мин (выкл)
        </button>
      </div>

      <div class="mt-4 p-3 bg-gray-100 rounded">
        <h3 class="font-semibold mb-2">Логи синхронизации:</h3>
        <div class="text-sm font-mono max-h-32 overflow-y-auto">
          {{ logs.join('\n') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore'

const store = useStore()
const logs = ref<string[]>([])

// Локальные реактивные переменные для тестирования
const botDelayMinutes = computed(() => store.settings.value.botResponseDelayMinutes)

const addLog = (message: string) => {
  logs.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`)
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

const testSetDelay = async (minutes: number) => {
  addLog(`Устанавливаем задержку: ${minutes} минут`)
  addLog(`Ожидаемое значение в базе timeout: ${minutes}`)

  try {
    await store.updateBotDelay(minutes)
    addLog(`✅ Задержка ${minutes} мин синхронизирована с базой данных`)
  } catch (error) {
    addLog(`❌ Ошибка синхронизации: ${error}`)
  }
}

</script>