import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTaskReminders } from '@/lib/email'
import { Settings } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // cronからの呼び出しか手動かを問わず同じ処理
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // タスクと設定を取得
  const [{ data: tasks, error: tasksError }, { data: settingsRows }] = await Promise.all([
    supabase.from('tasks').select('*'),
    supabase.from('settings').select('*'),
  ])

  if (tasksError || !tasks) {
    return NextResponse.json({ error: 'タスク取得失敗' }, { status: 500 })
  }

  // 設定を組み立てる
  const settingsMap = Object.fromEntries((settingsRows ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]))
  const members: string[] = (settingsMap.members as string[]) ?? []
  const memberEmails: string[] = (settingsMap.memberEmails as string[]) ?? []
  const assignees: string[] = (settingsMap.assignees as string[]) ?? []
  const assigneeEmails: string[] = (settingsMap.assigneeEmails as string[]) ?? []
  const fromEmail: string = (settingsMap.notify_from_email as string) || process.env.NOTIFY_FROM_EMAIL || ''

  if (!fromEmail) {
    return NextResponse.json({ error: '送信元メールアドレスが設定されていません' }, { status: 400 })
  }

  // 担当者名→メールアドレスのマッピングを作成
  const emailMap: Record<string, string> = {}
  members.forEach((name, i) => { if (name && memberEmails[i]) emailMap[name] = memberEmails[i] })
  assignees.forEach((name, i) => { if (name && assigneeEmails[i]) emailMap[name] = assigneeEmails[i] })

  try {
    const result = await sendTaskReminders(tasks, emailMap, fromEmail)
    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '不明なエラー'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Vercel Cronからの GET も受け付ける
export async function GET(req: NextRequest) {
  return POST(req)
}
