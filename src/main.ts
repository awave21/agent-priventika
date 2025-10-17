import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { loadAgentModeFromSupabase } from './stores/settings'

// Загружаем состояние режима агента из Supabase при старте
loadAgentModeFromSupabase()

createApp(App).use(router).mount('#app')
