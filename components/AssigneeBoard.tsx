'use client'

import { useState } from 'react'
import { Task, TaskStatus, Settings, getAssigneeStatus } from '@/lib/supabase'
import { getDueDateStatus, DUE_STYLES, formatDueDate } from '@/lib/dateUtils'

type Props = {
  tasks: Task[]
  settings: Settings
  onUpdated: () => void
}

type CompactProps = {
  task: Task
  assigneeName: string
  onUpdated: () => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  '未対応': 'bg-red-100 text-red-700',
  '対応中': 'bg-yellow-100 text-yellow-700',
  '完了': 'bg-green-100 text-green-700',
}

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  '未対応': '対応中', '対応中': '完了', '完了': '未対応',
}

// タスクカード（ステータス変更・メモ編集付き）
function TaskCardCompact({ task, assigneeName, onUpdated }: CompactProps) {
  const [loading, setLoading] = useState(false)
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoValue, setMemoValue] = useState(task.memo ?? '')

  // 担当者個別のステータスを取得
  const myStatus = getAssigneeStatus(task, assigneeName)
  const urgent = task.is_urgent === true && myStatus !== '完了'
  const done = myStatus === '完了'
  const dueDateStatus = done ? 'normal' : getDueDateStatus(task.due_date)
  const dueStyle = DUE_STYLES[dueDateStatus]
  const [cardBg, cardBorder] = urgent
    ? ['bg-red-50', 'border-red-300']
    : done
    ? ['bg-gray-50', 'border-gray-200']
    : [dueStyle.card.split(' ')[0], dueStyle.card.split(' ')[1] ?? 'border-gray-200']
  const icon = urgent ? '🚨' : dueDateStatus === 'overdue' ? '⚠️' : dueDateStatus === 'today' ? '📅' : dueDateStatus === 'tomorrow' ? '🔔' : ''

  const handleStatusChange = async () => {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee_name: assigneeName, status: STATUS_NEXT[myStatus] }),
    })
    setLoading(false)
    onUpdated()
  }

  const handleMemoSave = async () => {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo: memoValue }),
    })
    setLoading(false)
    setEditingMemo(false)
    onUpdated()
  }

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${cardBg} ${cardBorder} ${done ? 'opacity-60' : ''}`}>
      {/* ヘッダー行：アイコン・ステータス・期日 */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          {icon && <span className="text-xs">{icon}</span>}
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[myStatus]}`}>{myStatus}</span>
        </div>
        {task.due_date && !done && (
          <span className={`text-xs font-medium ${dueStyle.text}`}>
            期日 {formatDueDate(task.due_date)}
          </span>
        )}
      </div>

      {/* 依頼内容 */}
      <p className="text-xs text-gray-800 font-medium leading-relaxed">{task.content}</p>

      {/* 依頼者 */}
      <p className="text-xs text-gray-400">依頼者: {task.requester}</p>

      {/* 状況メモ */}
      <div>
        {editingMemo ? (
          <div className="space-y-1">
            <textarea
              value={memoValue}
              onChange={e => setMemoValue(e.target.value)}
              rows={2}
              autoFocus
              className="w-full border rounded p-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="状況を入力..."
            />
            <div className="flex gap-1">
              <button
                onClick={handleMemoSave}
                disabled={loading}
                className="text-xs bg-blue-600 text-white rounded px-2 py-0.5 hover:bg-blue-700 disabled:opacity-50"
              >保存</button>
              <button
                onClick={() => { setEditingMemo(false); setMemoValue(task.memo ?? '') }}
                className="text-xs border rounded px-2 py-0.5 hover:bg-gray-50"
              >取消</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingMemo(true)}
            className={`w-full text-left text-xs rounded px-1.5 py-1 hover:bg-white/70 transition-colors ${memoValue ? 'text-gray-600 bg-white/50' : 'text-gray-300 italic'}`}
          >
            {memoValue || '状況を入力...'}
          </button>
        )}
      </div>

      {/* ステータス変更ボタン */}
      <button
        onClick={handleStatusChange}
        disabled={loading}
        className="w-full text-xs border rounded py-1 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        {myStatus === '未対応' && '対応中にする'}
        {myStatus === '対応中' && '完了にする'}
        {myStatus === '完了' && '未対応に戻す'}
      </button>
    </div>
  )
}

export default function AssigneeBoard({ tasks, settings, onUpdated }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const members = settings.members.filter(Boolean)
  const fromSettings = [...new Set([...settings.assignees, ...members])]
  const fromTasks = tasks.flatMap(t => t.assignee.split(',').map(s => s.trim()).filter(Boolean))
  const allAssignees = [...new Set([...fromSettings, ...fromTasks])]

  const tasksByAssignee = (name: string) =>
    tasks.filter(t => t.assignee.split(',').map(s => s.trim()).includes(name))

  const activeTasks = (name: string) =>
    tasksByAssignee(name).filter(t => getAssigneeStatus(t, name) !== '完了')

  const assigneesWithTasks = allAssignees.filter(a => tasksByAssignee(a).length > 0)

  const toggleCollapse = (name: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const collapseAll = () => setCollapsed(new Set(assigneesWithTasks))
  const expandAll = () => setCollapsed(new Set())

  if (assigneesWithTasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>タスクがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 一括操作 */}
      <div className="flex gap-2 justify-end">
        <button onClick={expandAll} className="text-xs text-gray-500 hover:text-gray-700 border rounded-lg px-2.5 py-1 hover:bg-gray-50">
          すべて開く
        </button>
        <button onClick={collapseAll} className="text-xs text-gray-500 hover:text-gray-700 border rounded-lg px-2.5 py-1 hover:bg-gray-50">
          すべて閉じる
        </button>
      </div>

      {assigneesWithTasks.map(name => {
        const active = activeTasks(name)
        const all = tasksByAssignee(name)
        const urgentCount = active.filter(t => t.is_urgent).length
        const overdueCount = active.filter(t => getDueDateStatus(t.due_date) === 'overdue').length
        const todayCount = active.filter(t => getDueDateStatus(t.due_date) === 'today').length
        const tomorrowCount = active.filter(t => getDueDateStatus(t.due_date) === 'tomorrow').length
        const isCollapsed = collapsed.has(name)

        return (
          <div key={name} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* ヘッダー（クリックで折りたたみ） */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              onClick={() => toggleCollapse(name)}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-gray-800 text-sm">{name}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                  {active.length}件対応中 / 全{all.length}件
                </span>
                {urgentCount > 0 && <span className="text-xs text-red-600 font-medium">🚨 至急 {urgentCount}</span>}
                {overdueCount > 0 && <span className="text-xs text-orange-500 font-medium">⚠️ 超過 {overdueCount}</span>}
                {todayCount > 0 && <span className="text-xs text-blue-600 font-medium">📅 当日 {todayCount}</span>}
                {tomorrowCount > 0 && <span className="text-xs text-yellow-600 font-medium">🔔 前日 {tomorrowCount}</span>}
              </div>
              <span className={`text-gray-400 text-xs ml-2 transition-transform flex-shrink-0 ${isCollapsed ? '' : 'rotate-180'}`}>▼</span>
            </button>

            {/* タスク一覧（折りたたみ） */}
            {!isCollapsed && (
              <div className="border-t px-4 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {all
                    .sort((a, b) => {
                      if (a.status === '完了' && b.status !== '完了') return 1
                      if (a.status !== '完了' && b.status === '完了') return -1
                      if (a.is_urgent !== b.is_urgent) return a.is_urgent ? -1 : 1
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    })
                    .map(task => (
                      <TaskCardCompact key={task.id} task={task} assigneeName={name} onUpdated={onUpdated} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
