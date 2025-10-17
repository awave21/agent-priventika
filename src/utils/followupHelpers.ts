export const formatDateTime = (createdAt: Date, intervalMinutes: number) => {
  const triggerTime = new Date(new Date(createdAt).getTime() + intervalMinutes * 60 * 1000)
  return triggerTime.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getTimeStatus = (createdAt: Date, intervalMinutes: number) => {
  const now = new Date()
  const trigger = new Date(new Date(createdAt).getTime() + intervalMinutes * 60 * 1000)

  if (trigger < now) {
    return { text: 'Просрочено', color: 'text-red-600 bg-red-50' }
  }

  const diffHours = (trigger.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (diffHours < 1) {
    return { text: 'Скоро', color: 'text-orange-600 bg-orange-50' }
  }

  if (diffHours < 24) {
    return { text: 'Сегодня', color: 'text-blue-600 bg-blue-50' }
  }

  return { text: 'Запланировано', color: 'text-slate-600 bg-slate-50' }
}
