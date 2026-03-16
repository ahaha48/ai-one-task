import { Task } from './supabase'

// Google Calendar 追加リンクを生成（終日イベント）
export function googleCalendarLink(task: Task): string {
  if (!task.due_date) return ''
  const date = task.due_date.replace(/-/g, '')           // YYYYMMDD
  const nextDate = nextDay(task.due_date).replace(/-/g, '')
  const title = encodeURIComponent(`【タスク】${task.content.slice(0, 50)}`)
  const detail = encodeURIComponent(
    `依頼者: ${task.requester}\n依頼先: ${task.assignee}\nカテゴリ: ${task.category}\n\n${task.content}`
  )
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${nextDate}&details=${detail}`
}

// ICS形式のカレンダーデータを生成（複数タスクをまとめて1ファイル）
export function generateICS(tasks: Task[], assigneeName: string): string {
  const events = tasks
    .filter(t => t.due_date)
    .map(t => {
      const date = t.due_date!.replace(/-/g, '')
      const next = nextDay(t.due_date!).replace(/-/g, '')
      const uid = `${t.id}@ai-one-task`
      const summary = icsEscape(`【タスク】${t.content.slice(0, 50)}`)
      const description = icsEscape(
        `依頼者: ${t.requester} / カテゴリ: ${t.category}\\n\\n${t.content}`
      )
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${next}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `STATUS:NEEDS-ACTION`,
        'END:VEVENT',
      ].join('\r\n')
    })

  if (events.length === 0) return ''

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI ONE Task Management//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:AI ONE タスク (${assigneeName})`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function icsEscape(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
}
