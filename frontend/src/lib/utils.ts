export function formatDistanceToNow(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'сейчас'
  if (diffMins < 60) return `${diffMins} мин`
  if (diffHours < 24) return `${diffHours} ч`
  if (diffDays < 7) return `${diffDays} д`
  
  return past.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  
  if (isSameDay(d, now)) {
    return 'Сегодня'
  }
  
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(d, yesterday)) {
    return 'Вчера'
  }
  
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  )
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
