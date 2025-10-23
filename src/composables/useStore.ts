import { watch } from 'vue'
import { users, chats, messages, ignoreList, followups, settings, isAuthenticated } from '../stores/state'
import { toggleAgentMode, toggleAgentActive, toggleSentNewUser, updateBotDelay, updateSettings } from '../stores/settings'
import { loadUsersFromSupabase, toggleUserActive, activateAllUsers, deactivateAllUsers } from '../stores/users'
import { ignoredUsers, addToIgnoreList, removeFromIgnoreList, loadIgnoreListFromSupabase } from '../stores/ignoreList'
import { loadFollowupsFromSupabase, addFollowup, removeFollowup, updateFollowup } from '../stores/followups'
import { activeChats, getChatMessages, getChatById, messageStats, sendMessage, loadMessagesFromSupabase, updateMessageStatus } from '../stores/chats'

export function useStore() {
  watch(
    () => [settings.value.supabaseUrl, settings.value.supabaseAnonKey],
    () => {
      if (settings.value.supabaseUrl && settings.value.supabaseAnonKey) {
        loadUsersFromSupabase()
        loadIgnoreListFromSupabase()
        loadFollowupsFromSupabase()
        loadMessagesFromSupabase()
      }
    },
    { immediate: true }
  )

  return {
    users,
    chats,
    messages,
    ignoreList,
    followups,
    settings,
    isAuthenticated,
    activeChats,
    ignoredUsers,
    messageStats,
    getChatMessages,
    getChatById,
    addToIgnoreList,
    removeFromIgnoreList,
    addFollowup,
    removeFollowup,
    updateFollowup,
    toggleUserActive,
    activateAllUsers,
    deactivateAllUsers,
    toggleAgentMode,
    toggleAgentActive,
    toggleSentNewUser,
    updateBotDelay,
    updateSettings,
    loadUsersFromSupabase,
    loadIgnoreListFromSupabase,
    loadFollowupsFromSupabase,
    loadMessagesFromSupabase,
    updateMessageStatus,
    sendMessage
  }
}
