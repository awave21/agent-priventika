export interface User {
  id: string
  chatId: string
  phone: string
  name: string | null
  username: string | null
  avatarUri: string | null
  chatType: string | null
  messagesCount: number
  notes: string | null
  tags: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Chat {
  id: string
  userId: string
  lastMessageAt: Date
  createdAt: Date
}

export interface Message {
  id: string
  chatId: string
  text: string
  isAgent: boolean
  isUserMessage: boolean
  createdAt: Date
  processed?: boolean
  channelId?: string
  roleUser?: string
  messageId?: string
  file?: string
  isEcho?: boolean
  status?: string
  answer?: boolean
}

export interface IgnoreListEntry {
  id: string
  userId: string
  createdAt: Date
}

export interface Followup {
  id: string
  chatId?: string
  text: string
  intervalMinutes: number
  triggerTime?: Date
  isDefault: boolean
  isSent: boolean
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  id: string
  agentMode: boolean
  agentActive: boolean
  sentNewUser: boolean
  botResponseDelayMinutes: number
  supabaseUrl: string
  supabaseAnonKey: string
  updatedAt: Date
}

export interface MessageStats {
  agentCount: number
  managerCount: number
  date: string
}
