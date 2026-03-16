import nodemailer from 'nodemailer'
import { Task } from './supabase'
import { getDueDateStatus } from './dateUtils'
import { googleCalendarLink, generateICS } from './calendar'

export async function sendTaskReminders(
  tasks: Task[],
  emailMap: Record<string, string>, // 担当者名 → メールアドレス
  fromEmail: string
) {
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPassword) {
    throw new Error('GMAIL_USER または GMAIL_APP_PASSWORD が設定されていません')
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  })

  // 未対応タスクのうち、期日超過・当日・前日のものを抽出
  const targetTasks = tasks.filter(t => {
    if (t.status !== '未対応') return false
    const s = getDueDateStatus(t.due_date)
    return s === 'overdue' || s === 'today' || s === 'tomorrow'
  })

  if (targetTasks.length === 0) return { sent: 0, skipped: 0 }

  // 担当者ごとにタスクをまとめる
  const byAssignee: Record<string, Task[]> = {}
  for (const task of targetTasks) {
    const names = task.assignee.split(',').map(s => s.trim())
    for (const name of names) {
      if (!byAssignee[name]) byAssignee[name] = []
      byAssignee[name].push(task)
    }
  }

  let sent = 0
  let skipped = 0

  for (const [name, assigneeTasks] of Object.entries(byAssignee)) {
    const email = emailMap[name]
    if (!email) { skipped++; continue }

    const tasksWithDue = assigneeTasks.filter(t => t.due_date)
    const rows = assigneeTasks.map(t => {
      const s = getDueDateStatus(t.due_date)
      const label = s === 'overdue' ? '⚠️ 期日超過' : s === 'today' ? '📅 期限当日' : '🔔 期限前日'
      const due = t.due_date ?? ''
      const gcLink = googleCalendarLink(t)
      const calBtn = gcLink
        ? `<a href="${gcLink}" style="font-size:11px;color:#2563eb;text-decoration:none;border:1px solid #2563eb;border-radius:4px;padding:2px 6px;white-space:nowrap;" target="_blank">📅 Googleカレンダーに追加</a>`
        : ''
      return `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb;">${label}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${t.category}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${t.content}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${t.requester}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${due}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${calBtn}</td>
      </tr>`
    }).join('')

    // ICSファイルを生成
    const icsContent = generateICS(tasksWithDue, name)
    const attachments = icsContent ? [{
      filename: 'tasks.ics',
      content: Buffer.from(icsContent),
      contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
    }] : []

    const html = `
<div style="font-family:sans-serif;max-width:660px;margin:0 auto;">
  <h2 style="color:#1f2937;">AI ONE タスク管理 - 対応が必要なタスクがあります</h2>
  <p>${name} さん、以下のタスクが未対応のまま期日が近づいています。</p>
  ${tasksWithDue.length > 0 ? `<p style="background:#eff6ff;padding:10px;border-radius:6px;font-size:13px;">📎 添付の <strong>tasks.ics</strong> をGoogleカレンダーにインポートするか、各行の「Googleカレンダーに追加」ボタンをクリックしてください。</p>` : ''}
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">状態</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">カテゴリ</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">依頼内容</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">依頼者</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">期日</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">カレンダー</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="color:#6b7280;font-size:12px;">このメールはAI ONEタスク管理システムから自動送信されています。</p>
</div>`

    await transporter.sendMail({
      from: `AI ONE タスク管理 <${fromEmail}>`,
      to: email,
      subject: `【AI ONE】${name}さん宛に未対応タスクが${assigneeTasks.length}件あります`,
      html,
      attachments,
    })
    sent++
  }

  return { sent, skipped }
}
