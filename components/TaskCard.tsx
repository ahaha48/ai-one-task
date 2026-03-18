'use client'

import { useState } from 'react'
import { Task, TaskStatus, Settings } from '@/lib/supabase'
import EditTaskModal from '@/components/EditTaskModal'
import { getDueDateStatus, DUE_STYLES, formatDueDate } from '@/lib/dateUtils'

type Props = {
  task: Task
  settings: Settings
  onUpdated: () => void
  onDeleted: () => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  '未対応': 'bg-red-100 text-red-700',
  '対応中': 'bg-yellow-100 text-yellow-700',
  '完了': 'bg-green-100 text-green-700',
}

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  '未対応': '対応中',
  '対応中': '完了',
  '完了': '未対応',
}


function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function TaskCard({ task, settings, onUpdated, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoValue, setMemoValue] = useState(task.memo ?? '')

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

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoading(false)
    onUpdated()
  }

  const handleDelete = async () => {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    setLoading(false)
    onDeleted()
  }

  const urgent = task.is_urgent === true && task.status !== '完了'
  const done = task.status === '完了'
  const dueDateStatus = done ? 'normal' : getDueDateStatus(task.due_date)
  const dueStyle = DUE_STYLES[dueDateStatus]

  let cardBg = dueStyle.card.split(' ')[0]
  let cardBorder = dueStyle.card.split(' ')[1]
  if (urgent) { cardBg = 'bg-red-50'; cardBorder = 'border-red-400' }
  if (done) { cardBg = 'bg-gray-50'; cardBorder = 'border-gray-200' }

  return (
    <div className={`${cardBg} rounded-xl shadow-sm border-2 ${cardBorder} p-4 space-y-3`}>
      {urgent && (
        <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 -mx-4 -mt-4 mb-0 rounded-t-xl">
          <span>🚨</span><span>至急対応</span>
        </div>
      )}
      {!urgent && !done && dueStyle.banner && (
        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 -mx-4 -mt-4 mb-0 rounded-t-xl ${dueStyle.banner}`}>
          <span>{dueStyle.label}</span>
        </div>
      )}
      {done && (
        <div className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1 -mx-4 -mt-4 mb-0 rounded-t-xl">
          <span>✓</span><span>完了</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>{task.status}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-gray-400 whitespace-nowrap">依頼日 {formatDate(task.created_at)}</span>
          {task.due_date && task.status !== '完了' && (
            <span className={`text-xs font-medium whitespace-nowrap ${dueStyle.text}`}>
              期日 {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-900 font-medium leading-relaxed">{task.content}</p>

      <div className="text-xs text-gray-500">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-800">状況</span>
          {!editingMemo && (
            <button onClick={() => setEditingMemo(true)} className="text-gray-400 hover:text-blue-500 text-xs">編集</button>
          )}
        </div>
        {editingMemo ? (
          <div className="space-y-1">
            <textarea
              value={memoValue}
              onChange={e => setMemoValue(e.target.value)}
              rows={2}
              className="w-full border rounded p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="状況を入力..."
              autoFocus
            />
            <div className="flex gap-1">
              <button onClick={handleMemoSave} disabled={loading} className="text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700 disabled:opacity-50">保存</button>
              <button onClick={() => { setEditingMemo(false); setMemoValue(task.memo ?? '') }} className="text-xs border rounded px-2 py-1 hover:bg-gray-50">取消</button>
            </div>
          </div>
        ) : (
          <p className={`bg-gray-50 rounded p-2 min-h-[2rem] ${memoValue ? '' : 'text-gray-300 italic'}`}>
            {memoValue || '未入力'}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 text-xs text-gray-500">
        <span className="whitespace-nowrap">依頼者: <strong className="text-gray-900">{task.requester}</strong></span>
        <span>→</span>
        <span>依頼先: <strong className="text-gray-900">{task.assignee.split(',').map(s => s.trim()).join(' / ')}</strong></span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => handleStatusChange(STATUS_NEXT[task.status])}
          disabled={loading}
          className="flex-1 text-xs border rounded-lg py-1.5 hover:bg-gray-50 disabled:opacity-50"
        >
          {task.status === '未対応' && '対応中にする'}
          {task.status === '対応中' && '完了にする'}
          {task.status === '完了' && '未対応に戻す'}
        </button>

        <button
          onClick={() => setShowEditModal(true)}
          className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded-lg px-2 py-1.5 hover:bg-blue-50"
        >
          編集
        </button>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-gray-400 hover:text-red-500 px-2"
          >
            削除
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleDelete} className="text-xs text-red-600 border border-red-300 rounded px-2 py-1 hover:bg-red-50">確認</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-gray-500 border rounded px-2 py-1 hover:bg-gray-50">取消</button>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditTaskModal
          task={task}
          settings={settings}
          onClose={() => setShowEditModal(false)}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      )}
    </div>
  )
}
