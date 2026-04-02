import { Task, getAssigneeStatus } from './supabase'
import { getDueDateStatus } from './dateUtils'

export async function sendLineGroupNotification(tasks: Task[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const groupId = process.env.LINE_GROUP_ID

  if (!token || !groupId) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN または LINE_GROUP_ID が設定されていません')
  }

  // 未対応タスクのうち期日超過・当日・前日のものを抽出
  const targetTasks = tasks.filter(t => {
    if (t.status === '完了') return false
    const s = getDueDateStatus(t.due_date)
    return s === 'overdue' || s === 'today' || s === 'tomorrow'
  })

  if (targetTasks.length === 0) return { sent: false, reason: '対象タスクなし' }

  // 担当者ごとにまとめる（個別ステータスが完了の担当者は除外）
  const byAssignee: Record<string, { tasks: Task[] }> = {}
  for (const task of targetTasks) {
    const names = task.assignee.split(',').map(s => s.trim()).filter(Boolean)
    for (const name of names) {
      if (getAssigneeStatus(task, name) === '完了') continue
      if (!byAssignee[name]) byAssignee[name] = { tasks: [] }
      byAssignee[name].tasks.push(task)
    }
  }

  if (Object.keys(byAssignee).length === 0) return { sent: false, reason: '対象担当者なし' }

  const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
  const lines: string[] = [`📋 AI ONE タスク状況（${today}）\n`]

  for (const [name, { tasks: assigneeTasks }] of Object.entries(byAssignee)) {
    lines.push(`👤 ${name}（${assigneeTasks.length}件）`)
    for (const task of assigneeTasks) {
      const s = getDueDateStatus(task.due_date)
      const label = s === 'overdue' ? '⚠️超過' : s === 'today' ? '📅当日' : '🔔前日'
      const due = task.due_date ? `（${task.due_date}）` : ''
      const urgent = task.is_urgent ? '🚨' : ''
      lines.push(`  ${urgent}${label} ${task.content}${due}`)
    }
    lines.push('')
  }

  lines.push('未対応タスクの確認・更新はこちら👇')
  lines.push('https://ai-one-task.vercel.app/')

  const text = lines.join('\n').trim()

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: groupId,
      messages: [{ type: 'text', text }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LINE送信失敗: ${err}`)
  }

  return { sent: true }
}
