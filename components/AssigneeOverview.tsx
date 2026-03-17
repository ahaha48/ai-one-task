'use client'

import { useState } from 'react'
import { Task, Settings, getAssigneeStatus } from '@/lib/supabase'
import { getDueDateStatus, formatDueDate } from '@/lib/dateUtils'
import EditTaskModal from '@/components/EditTaskModal'

type Props = {
  tasks: Task[]
  settings: Settings
  selectedAssignee: string
  onSelectAssignee: (name: string) => void
  onUpdated: () => void
}

function formatDueDateShort(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function AssigneeOverview({ tasks, settings, selectedAssignee, onSelectAssignee, onUpdated }: Props) {
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set())
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const members = settings.members.filter(Boolean)
  const fromSettings = [...new Set([...settings.assignees, ...members])]
  const fromTasks = tasks.flatMap(t => t.assignee.split(',').map(s => s.trim()).filter(Boolean))
  const allAssignees = [...new Set([...fromSettings, ...fromTasks])]

  const getTasksFor = (name: string) =>
    tasks.filter(t => t.assignee.split(',').map(s => s.trim()).includes(name))

  const assigneesWithTasks = allAssignees.filter(a => getTasksFor(a).length > 0)
  if (assigneesWithTasks.length === 0) return null

  const toggleExpand = (name: string) => {
    setExpandedNames(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">担当者別 タスク状況</h2>
        {selectedAssignee && (
          <button
            onClick={() => onSelectAssignee('')}
            className="text-xs text-blue-600 hover:underline"
          >
            絞り込み解除
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {assigneesWithTasks.map(name => {
          const allTasks = getTasksFor(name)
          const activeTasks = allTasks.filter(t => getAssigneeStatus(t, name) !== '完了')
          const pendingTasks = activeTasks.filter(t => getAssigneeStatus(t, name) === '未対応')
          const inProgressTasks = activeTasks.filter(t => getAssigneeStatus(t, name) === '対応中')
          const urgentCount = activeTasks.filter(t => t.is_urgent).length
          const overdueCount = activeTasks.filter(t => getDueDateStatus(t.due_date) === 'overdue').length
          const todayCount = activeTasks.filter(t => getDueDateStatus(t.due_date) === 'today').length
          const tomorrowCount = activeTasks.filter(t => getDueDateStatus(t.due_date) === 'tomorrow').length
          const isSelected = selectedAssignee === name
          const isExpanded = expandedNames.has(name)
          const hasAlert = urgentCount > 0 || overdueCount > 0

          // 展開時に表示するタスク（期日順・至急優先）
          const topTasks = [...activeTasks].sort((a, b) => {
            if (a.is_urgent !== b.is_urgent) return a.is_urgent ? -1 : 1
            const statusA = getDueDateStatus(a.due_date)
            const statusB = getDueDateStatus(b.due_date)
            const order: Record<string, number> = { overdue: 0, today: 1, tomorrow: 2, normal: 3 }
            if (statusA !== statusB) return (order[statusA] ?? 3) - (order[statusB] ?? 3)
            if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
            return 0
          })

          return (
            <div
              key={name}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                hasAlert ? 'border-red-300' : isSelected ? 'border-blue-400' : 'border-gray-200'
              }`}
            >
              {/* カードヘッダー：クリックで絞り込み */}
              <button
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => onSelectAssignee(name)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-base truncate">{name}</span>
                      {isSelected && <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 flex-shrink-0">絞込中</span>}
                    </div>
                    {/* アラート */}
                    {(urgentCount > 0 || overdueCount > 0 || todayCount > 0 || tomorrowCount > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {urgentCount > 0 && <span className="text-xs font-medium text-red-600 bg-red-50 rounded px-1.5 py-0.5">🚨 至急 {urgentCount}件</span>}
                        {overdueCount > 0 && <span className="text-xs font-medium text-orange-600 bg-orange-50 rounded px-1.5 py-0.5">⚠️ 超過 {overdueCount}件</span>}
                        {todayCount > 0 && <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">📅 当日 {todayCount}件</span>}
                        {tomorrowCount > 0 && <span className="text-xs font-medium text-yellow-600 bg-yellow-50 rounded px-1.5 py-0.5">🔔 前日 {tomorrowCount}件</span>}
                      </div>
                    )}
                  </div>
                  {/* タスク数（大きく表示） */}
                  <div className="text-right flex-shrink-0">
                    <div className={`text-3xl font-bold leading-none ${hasAlert ? 'text-red-500' : 'text-gray-700'}`}>
                      {activeTasks.length}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">件</div>
                  </div>
                </div>

                {/* 未対応 / 対応中 バー */}
                {activeTasks.length > 0 && (
                  <div className="mt-3">
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                      {pendingTasks.length > 0 && (
                        <div
                          className="bg-red-400"
                          style={{ width: `${(pendingTasks.length / activeTasks.length) * 100}%` }}
                        />
                      )}
                      {inProgressTasks.length > 0 && (
                        <div
                          className="bg-yellow-400"
                          style={{ width: `${(inProgressTasks.length / activeTasks.length) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      {pendingTasks.length > 0 && (
                        <span className="text-xs text-red-500">未対応 {pendingTasks.length}</span>
                      )}
                      {inProgressTasks.length > 0 && (
                        <span className="text-xs text-yellow-600">対応中 {inProgressTasks.length}</span>
                      )}
                    </div>
                  </div>
                )}
              </button>

              {/* 展開ボタン */}
              <button
                onClick={() => toggleExpand(name)}
                className="w-full px-4 py-2 border-t text-xs text-gray-400 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
              >
                <span>{isExpanded ? 'タスクを隠す' : `タスクを見る（${activeTasks.length}件）`}</span>
                <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* タスク一覧（展開時） */}
              {isExpanded && (
                <div className="border-t divide-y">
                  {topTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 px-4 py-3">対応中のタスクはありません</p>
                  ) : (
                    topTasks.map(task => {
                      const myStatus = getAssigneeStatus(task, name)
                      const due = getDueDateStatus(task.due_date)
                      const dueColors: Record<string, string> = {
                        overdue: 'text-orange-600',
                        today: 'text-blue-600',
                        tomorrow: 'text-yellow-600',
                        normal: 'text-gray-400',
                      }
                      return (
                        <button
                          key={task.id}
                          className="w-full px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
                          onClick={() => setEditingTask(task)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 leading-snug line-clamp-2">{task.content}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {task.is_urgent && <span className="text-xs text-red-600">🚨</span>}
                                <span className={`text-xs font-medium ${
                                  myStatus === '未対応' ? 'text-red-500' :
                                  myStatus === '対応中' ? 'text-yellow-600' : 'text-green-600'
                                }`}>{myStatus}</span>
                                {task.due_date && (
                                  <span className={`text-xs font-medium ${dueColors[due]}`}>
                                    {formatDueDate(task.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-blue-400 flex-shrink-0 mt-0.5">編集 →</span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>

    {editingTask && (
      <EditTaskModal
        task={editingTask}
        settings={settings}
        onClose={() => setEditingTask(null)}
        onUpdated={() => { setEditingTask(null); onUpdated() }}
        onDeleted={() => { setEditingTask(null); onUpdated() }}
      />
    )}
    </>
  )
}
