'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Task, Settings, DEFAULT_SETTINGS } from '@/lib/supabase'
import TaskCard from '@/components/TaskCard'
import StackedTaskList from '@/components/StackedTaskList'


export default function CompletedPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'stack' | 'board'>('stack')

  const fetchData = useCallback(async () => {
    const [tasksRes, settingsRes] = await Promise.all([
      fetch('/api/tasks', { cache: 'no-store' }),
      fetch('/api/settings', { cache: 'no-store' }),
    ])
    const [tasksData, settingsData] = await Promise.all([
      tasksRes.json(),
      settingsRes.json(),
    ])
    setTasks(tasksData)
    setSettings(settingsData)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const completedTasks = tasks
    .filter(t => t.status === '完了')
    .sort((a, b) => {
      const aDate = a.completed_at ?? a.created_at
      const bDate = b.completed_at ?? b.created_at
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })


  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-4 py-3 md:px-6 md:py-4" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-blue-200 hover:text-white text-sm">← タスク一覧へ</Link>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white leading-tight mt-0.5">完了済みタスク</h1>
          </div>
          <div className="flex border border-white/30 rounded-lg overflow-hidden text-xs md:text-sm">
            <button
              onClick={() => setViewMode('stack')}
              className={`px-2.5 py-1.5 ${viewMode === 'stack' ? 'bg-white text-blue-900 font-medium' : 'text-white/80 hover:bg-white/10'}`}
            >
              リスト
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-2.5 py-1.5 ${viewMode === 'board' ? 'bg-white text-blue-900 font-medium' : 'text-white/80 hover:bg-white/10'}`}
            >
              カード
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-5 space-y-4">
        <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-500">{completedTasks.length}</p>
          <p className="text-xs text-gray-500 mt-1">完了済みタスク</p>
        </div>

        {completedTasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">✅</p>
            <p>完了済みのタスクはありません</p>
          </div>
        ) : (
          viewMode === 'stack' ? (
            <StackedTaskList tasks={completedTasks} settings={settings} onUpdated={fetchData} onDeleted={fetchData} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTasks.map(task => (
                <TaskCard key={task.id} task={task} settings={settings} onUpdated={fetchData} onDeleted={fetchData} />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}
