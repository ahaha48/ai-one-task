import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase環境変数が設定されていません。')
  _client = createClient(url, key)
  return _client
}

// 後方互換のためのエイリアス
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export type TaskStatus = '未対応' | '対応中' | '完了'

export type Task = {
  id: string
  category: string
  content: string
  requester: string
  assignee: string
  status: TaskStatus
  memo: string
  is_urgent: boolean
  due_date: string | null
  created_at: string
  completed_at: string | null
  assignee_statuses: string | null // JSON: { "担当者名": "未対応"|"対応中"|"完了" }
}

// 担当者ごとのステータスを取得
export function getAssigneeStatus(task: Task, name: string): TaskStatus {
  if (!task.assignee_statuses) return task.status
  try {
    const map = JSON.parse(task.assignee_statuses) as Record<string, TaskStatus>
    return map[name] ?? task.status
  } catch {
    return task.status
  }
}

// 全担当者のステータスから全体ステータスを計算
export function calcOverallStatus(statuses: Record<string, TaskStatus>): TaskStatus {
  const values = Object.values(statuses)
  if (values.every(s => s === '完了')) return '完了'
  if (values.some(s => s === '対応中' || s === '完了')) return '対応中'
  return '未対応'
}

export type Settings = {
  members: string[]
  memberEmails: string[]
  assignees: string[]
  assigneeEmails: string[]
  categories: string[]
  discord_webhook: string
  notify_from_email: string
}

export const DEFAULT_SETTINGS: Settings = {
  members: ['', '', '', '', '', '', '', '', '', ''],
  memberEmails: ['', '', '', '', '', '', '', '', '', ''],
  assignees: ['セールスチーム', '実央さん', 'かずさん', 'はるなさん', '加藤さん', '目崎さん'],
  assigneeEmails: ['', '', '', '', '', '', ''],
  categories: ['質問対応', '事務手続連絡', 'スケジュール確認', '業務連絡', '依頼', 'その他'],
  discord_webhook: '',
  notify_from_email: '',
}
