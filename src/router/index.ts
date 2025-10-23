import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chats',
      name: 'chats',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chats/:id',
      name: 'chat-detail',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/test-chats',
      name: 'test-chats',
      component: () => import('../views/TestChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/test-chats/:id',
      name: 'test-chat-detail',
      component: () => import('../views/TestChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ignore',
      name: 'ignore',
      component: () => import('../views/IgnoreListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/followups',
      name: 'followups',
      component: () => import('../views/FollowupView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/realtime-demo',
      name: 'realtime-demo',
      component: () => import('../views/SimpleRealtimeDemoView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bot-timeout-test',
      name: 'bot-timeout-test',
      component: () => import('../components/BotTimeoutTest.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const { user, isLoading } = useAuth()

  // Ждем пока загрузится состояние аутентификации
  if (isLoading.value) {
    // Небольшая задержка для ожидания загрузки состояния аутентификации
    setTimeout(() => {
      if (to.meta.requiresAuth && !user.value) {
        next({ name: 'login' })
      } else if (to.name === 'login' && user.value) {
        next({ name: 'dashboard' })
      } else {
        next()
      }
    }, 100)
    return
  }

  if (to.meta.requiresAuth && !user.value) {
    next({ name: 'login' })
  } else if (to.name === 'login' && user.value) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
