import { createRouter, createWebHistory } from 'vue-router'
import { useStore } from '../composables/useStore'

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
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const store = useStore()

  if (to.meta.requiresAuth && !store.isAuthenticated.value) {
    next({ name: 'login' })
  } else if (to.name === 'login' && store.isAuthenticated.value) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
