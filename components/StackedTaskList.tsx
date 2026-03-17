'use client'

import { useState } from 'react'
import { Task, TaskStatus, Settings } from '@/lib/supabase'
import EditTaskModal from '@/components/EditTaskModal'
import { getDueDateStatus, DUE_STYLES, formatDueDate } from '@/lib/dateUtils'

type Props = {
  tasks: Task[]
  settings: Settings
  onUpdated: () => void
  onDeleted: () => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  '未対応': 'bg-red-100 text-red-700',
  '対応中': 'bg-yellow-100 text-yellow-700',
  '完了': 'bg-green-100 text-green-700',
}


function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function StackedTaskList({ tasks, settings, onUpdated, onDeleted }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    setLoadingId(task.id)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoadingId(null)
    onUpdated()
  }

  const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
    '未対応': '対応中', '対応中': '完了', '完了': '未対応',
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>タスクがありません</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden border shadow-sm">
        {tasks.map((task, index) => {
          const isExpanded = expandedId === task.id
          const urgent = task.is_urgent === true && task.status !== '完了'
          const done = task.status === '完了'
          const dueDateStatus = done ? 'normal' : getDueDateStatus(task.due_date)
          const dueStyle = DUE_STYLES[dueDateStatus]
          const baseBg = urgent ? 'bg-red-50' : done ? 'bg-gray-50' : dueStyle.card.split(' ')[0]
          const tabBg = isExpanded ? baseBg : `${baseBg} hover:brightness-95`

          return (
            <div key={task.id} className={`${index > 0 ? 'border-t' : ''}`}>
              {/* タブ（常時表示） */}
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${tabBg}`}
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
              >
                {/* 左：アイコン */}
                <span className="text-sm w-4 flex-shrink-0">
                  {urgent ? '🚨' : done ? '✓' : dueDateStatus === 'overdue' ? '⚠️' : dueDateStatus === 'today' ? '📅' : dueDateStatus === 'tomorrow' ? '🔔' : '　'}
                </span>

                {/* バッジ類 */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>{task.status}</span>
                </div>

                {/* 依頼内容（省略） */}
                <span className="flex-1 text-sm text-gray-700 truncate min-w-0">{task.content}</span>

                {/* 右：担当・期日 */}
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400">
                  <span className="hidden md:inline truncate max-w-[6rem]">{task.assignee.split(',').map(s => s.trim()).join(' / ')}</span>
                  {task.due_date && task.status !== '完了' && (
                    <span className={`font-medium whitespace-nowrap ${dueStyle.text}`}>
                      {formatDueDate(task.due_date)}
                    </span>
                  )}
                  <span className="hidden sm:inline whitespace-nowrap">{formatDate(task.created_at)}</span>
                  <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {/* 展開エリア */}
              {isExpanded && (
                <div className={`px-6 pb-4 pt-2 border-t ${baseBg}`}>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{task.content}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>依頼者: <strong className="text-gray-700">{task.requester}</strong></span>
                      <span>→</span>
                      <span>依頼先: <strong className="text-gray-700">{task.assignee.split(',').map(s => s.trim()).join(' / ')}</strong></span>
                    </div>

                    {task.memo && (
                      <p className="text-xs text-gray-600 bg-white/70 rounded-lg p-2 border">{task.memo}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleStatusChange(task, STATUS_NEXT[task.status])}
                        disabled={loadingId === task.id}
                        className="flex-1 text-xs border rounded-lg py-1.5 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        {task.status === '未対応' && '対応中にする'}
                        {task.status === '対応中' && '完了にする'}
                        {task.status === '完了' && '未対応に戻す'}
                      </button>
                      <button
                        onClick={() => setEditingTask(task)}
                        className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 bg-white hover:bg-blue-50"
                      >
                        編集・削除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          settings={settings}
          onClose={() => setEditingTask(null)}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      )}
    </>
  )
}
