'use client'

import { useState } from 'react'
import { Task, TaskStatus } from '@/lib/supabase'
import { getDueDateStatus, formatDueDate } from '@/lib/dateUtils'

type Props = {
  task: Task
  assigneeName: string
  onClose: () => void
  onUpdated: () => void
}

export default function QuickEditModal({ task, assigneeName, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState<TaskStatus>(
    (() => {
      if (!task.assignee_statuses) return task.status
      try {
        const map = JSON.parse(task.assignee_statuses) as Record<string, TaskStatus>
        return map[assigneeName] ?? task.status
      } catch { return task.status }
    })()
  )
  const [memo, setMemo] = useState(task.memo ?? '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await Promise.all([
      fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee_name: assigneeName, status }),
      }),
      fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo }),
      }),
    ])
    setLoading(false)
    onUpdated()
    onClose()
  }

  const dueDateStatus = getDueDateStatus(task.due_date)
  const dueLabelColors: Record<string, string> = {
    overdue: 'text-orange-600 bg-orange-50',
    today: 'text-blue-600 bg-blue-50',
    tomorrow: 'text-yellow-600 bg-yellow-50',
    normal: 'text-gray-500 bg-gray-50',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[92vh] sm:max-h-[90vh]">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">タスク詳細</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* タスク内容カード */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border">
            {task.is_urgent && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold">
                🚨 至急対応
              </div>
            )}
            <p className="text-sm text-gray-900 font-medium leading-relaxed">{task.content}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>依頼者: <strong className="text-gray-900">{task.requester}</strong></span>
              <span>→</span>
              <span>依頼先: <strong className="text-gray-900">{task.assignee.split(',').map(s => s.trim()).join(' / ')}</strong></span>
            </div>
            {task.due_date && (
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${dueLabelColors[dueDateStatus]}`}>
                期日 {formatDueDate(task.due_date)}
              </span>
            )}
          </div>

          {/* ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">ステータス</label>
            <div className="flex gap-2">
              {(['未対応', '対応中', '完了'] as TaskStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    status === s
                      ? s === '未対応' ? 'border-red-400 bg-red-50 text-red-700'
                        : s === '対応中' ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                        : 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">状況メモ（任意）</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="補足・現在の状況など"
            />
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-3 px-5 py-4 border-t flex-shrink-0">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2.5 text-sm text-gray-800 hover:bg-gray-50">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm hover:bg-blue-700 disabled:opacity-50 font-medium">
            {loading ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
