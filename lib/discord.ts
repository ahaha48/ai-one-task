import { Task } from './supabase'

export async function sendDiscordNotification(task: Task, webhookUrl: string) {
  if (!webhookUrl) return

  const statusEmoji: Record<string, string> = {
    '未対応': '🔴',
    '対応中': '🟡',
    '完了': '🟢',
  }

  const content = [
    '📋 **新しいタスクが作成されました**',
    '',
    `**カテゴリ:** ${task.category}`,
    `**依頼者:** ${task.requester}`,
    `**依頼先:** ${task.assignee}`,
    `**内容:** ${task.content}`,
    task.memo ? `**メモ:** ${task.memo}` : null,
    `**ステータス:** ${statusEmoji[task.status]} ${task.status}`,
  ]
    .filter(Boolean)
    .join('\n')

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}
