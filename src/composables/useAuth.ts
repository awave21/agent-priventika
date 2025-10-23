import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '../stores/state'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function useAuth() {
  const user = ref<SupabaseUser | null>(null)
  const isLoading = ref(true)

  // Получение текущего пользователя
  const getCurrentUser = async () => {
    try {
      console.log('🔍 [useAuth] Getting current user...')
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('❌ [useAuth] Error getting current user:', error)
        isAuthenticated.value = false
        return
      }

      user.value = currentUser
      isAuthenticated.value = !!currentUser
      console.log('✅ [useAuth] Current user loaded:', currentUser?.email || 'No user')
    } catch (error) {
      console.error('💥 [useAuth] Exception getting user:', error)
      isAuthenticated.value = false
    } finally {
      isLoading.value = false
    }
  }

  // Вход в систему
  const signIn = async (email: string, password: string) => {
    console.log('🔑 [useAuth] Attempting sign in for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ [useAuth] Sign in error:', error.message)
      isAuthenticated.value = false
    } else if (data.user) {
      user.value = data.user
      isAuthenticated.value = true
      console.log('✅ [useAuth] Sign in successful for:', data.user.email)
    }

    return { data, error }
  }

  // Регистрация
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    return { data, error }
  }

  // Выход из системы
  const signOut = async () => {
    console.log('🚪 [useAuth] Signing out user:', user.value?.email)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('❌ [useAuth] Sign out error:', error.message)
    } else {
      user.value = null
      isAuthenticated.value = false
      console.log('✅ [useAuth] Sign out successful')
    }

    return { error }
  }

  // Слушатель изменений аутентификации
  supabase.auth.onAuthStateChange((event: string, session: any) => {
    console.log('🔐 [useAuth] Auth state change:', event, { hasSession: !!session, hasUser: !!session?.user })

    if (event === 'SIGNED_IN') {
      user.value = session?.user || null
      isAuthenticated.value = true
      console.log('✅ [useAuth] User signed in:', user.value?.email)
    } else if (event === 'SIGNED_OUT') {
      user.value = null
      isAuthenticated.value = false
      console.log('🚪 [useAuth] User signed out')
    } else if (event === 'TOKEN_REFRESHED') {
      user.value = session?.user || null
      console.log('🔄 [useAuth] Token refreshed for user:', user.value?.email)
    } else if (event === 'USER_UPDATED') {
      user.value = session?.user || null
      console.log('👤 [useAuth] User updated:', user.value?.email)
    }

    isLoading.value = false
  })

  // Инициализация
  getCurrentUser()

  return {
    user: computed(() => user.value),
    isLoading: computed(() => isLoading.value),
    isAuthenticated: computed(() => !!user.value),
    signIn,
    signUp,
    signOut,
    getCurrentUser
  }
}