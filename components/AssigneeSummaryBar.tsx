'use client'

import { Task, Settings } from '@/lib/supabase'
import { getDueDateStatus } from '@/lib/dateUtils'

type Props = {
  tasks: Task[]
  settings: Settings
  onFilterByAssignee: (name: string) => void
}

export default function AssigneeSummaryBar({ tasks, settings, onFilterByAssignee }: Props) {
  const members = settings.members.filter(Boolean)
  const allAssignees = [...new Set([...settings.assignees, ...members])]

  const getTasksFor = (name: string) =>
    tasks.filter(t => t.assignee.split(',').map(s => s.trim()).includes(name))

  const assigneesWithTasks = allAssignees.filter(a => getTasksFor(a).length > 0)
  if (assigneesWithTasks.length === 0) return null

  return (
    <div className="bg-white rounded-xl border shadow-sm p-3">
      <p className="text-xs text-gray-400 font-medium mb-2">担当者別タスク数</p>
      <div className="flex flex-wrap gap-2">
        {assigneesWithTasks.map(name => {
          const all = getTasksFor(name)
          const active = all.filter(t => t.status !== '完了')
          const urgent = active.filter(t => t.is_urgent).length
          const overdue = active.filter(t => getDueDateStatus(t.due_date) === 'overdue').length
          const today = active.filter(t => getDueDateStatus(t.due_date) === 'today').length
          const tomorrow = active.filter(t => getDueDateStatus(t.due_date) === 'tomorrow').length

          return (
            <button
              key={name}
              onClick={() => onFilterByAssignee(name)}
              className="flex items-center gap-2 border rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-700">{name}</span>
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 font-medium">{active.length}件</span>
              {urgent > 0 && <span className="text-xs text-red-600 font-medium">🚨{urgent}</span>}
              {overdue > 0 && <span className="text-xs text-orange-500 font-medium">⚠️{overdue}</span>}
              {today > 0 && <span className="text-xs text-blue-600 font-medium">📅{today}</span>}
              {tomorrow > 0 && <span className="text-xs text-yellow-600 font-medium">🔔{tomorrow}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

