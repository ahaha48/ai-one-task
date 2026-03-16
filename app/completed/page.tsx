'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Task, Settings, DEFAULT_SETTINGS } from '@/lib/supabase'
import TaskCard from '@/components/TaskCard'
import StackedTaskList from '@/components/StackedTaskList'

const CATEGORY_COLORS: Record<string, string> = {
  '質問対応': 'bg-purple-100 text-purple-700 border-purple-200',
  '事務手続連絡': 'bg-blue-100 text-blue-700 border-blue-200',
  'スケジュール確認': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '業務連絡': 'bg-orange-100 text-orange-700 border-orange-200',
  '依頼': 'bg-pink-100 text-pink-700 border-pink-200',
  'その他': 'bg-gray-100 text-gray-700 border-gray-200',
}

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

  const groupedByCategory = settings.categories
    .map(cat => ({ category: cat, tasks: completedTasks.filter(t => t.category === cat) }))
    .concat(
      [...new Set(completedTasks.map(t => t.category))]
        .filter(cat => !settings.categories.includes(cat))
        .map(cat => ({ category: cat, tasks: completedTasks.filter(t => t.category === cat) }))
    )
    .filter(g => g.tasks.length > 0)

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
          <div className="space-y-6">
            {groupedByCategory.map(({ category, tasks: catTasks }) => {
              const catColor = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700 border-gray-200'
              return (
                <div key={category}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-bold mb-3 ${catColor}`}>
                    <span>{category}</span>
                    <span className="text-xs font-normal opacity-70">{catTasks.length}件</span>
                  </div>
                  {viewMode === 'stack' ? (
                    <StackedTaskList tasks={catTasks} settings={settings} onUpdated={fetchData} onDeleted={fetchData} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catTasks.map(task => (
                        <TaskCard key={task.id} task={task} settings={settings} onUpdated={fetchData} onDeleted={fetchData} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
