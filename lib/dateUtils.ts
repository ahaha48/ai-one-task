export function getDueDateStatus(dateStr: string | null | undefined): 'overdue' | 'today' | 'tomorrow' | 'normal' {
  if (!dateStr) return 'normal'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  return 'normal'
}

export const DUE_STYLES = {
  overdue:  { card: 'bg-orange-50 border-orange-400', banner: 'bg-orange-500 text-white',  label: '⚠️ 期日超過', text: 'text-orange-600' },
  today:    { card: 'bg-blue-50 border-blue-400',     banner: 'bg-blue-500 text-white',    label: '📅 期限当日', text: 'text-blue-600' },
  tomorrow: { card: 'bg-yellow-50 border-yellow-400', banner: 'bg-yellow-400 text-white',  label: '🔔 期限前日', text: 'text-yellow-600' },
  normal:   { card: 'bg-white border-gray-200',       banner: '',                          label: '',            text: 'text-gray-400' },
}

export function formatDueDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}
