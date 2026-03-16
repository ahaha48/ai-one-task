'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Task, Settings, DEFAULT_SETTINGS } from '@/lib/supabase'
import TaskCard from '@/components/TaskCard'
import AddTaskModal from '@/components/AddTaskModal'
import FilterBar, { Filters, SortKey } from '@/components/FilterBar'
import AssigneeBoard from '@/components/AssigneeBoard'
import AssigneeSummaryBar from '@/components/AssigneeSummaryBar'
import StackedTaskList from '@/components/StackedTaskList'

const DEFAULT_FILTERS: Filters = {
  status: 'すべて',
  assignee: '',
  category: '',
  requester: '',
  keyword: '',
}

const STATUS_ORDER: Record<string, number> = { '未対応': 0, '対応中': 1, '完了': 2 }

const CATEGORY_COLORS: Record<string, string> = {
  '質問対応': 'bg-purple-100 text-purple-700 border-purple-200',
  '事務手続連絡': 'bg-blue-100 text-blue-700 border-blue-200',
  'スケジュール確認': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '業務連絡': 'bg-orange-100 text-orange-700 border-orange-200',
  '依頼': 'bg-pink-100 text-pink-700 border-pink-200',
  'その他': 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sortKey, setSortKey] = useState<SortKey>('created_desc')
  const [viewMode, setViewMode] = useState<'board' | 'stack' | 'assignee'>('stack')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const filtered = tasks
    .filter(t => {
      if (filters.status !== 'すべて' && t.status !== filters.status) return false
      if (filters.assignee && !t.assignee.split(',').map(s => s.trim()).includes(filters.assignee)) return false
      if (filters.category && t.category !== filters.category) return false
      if (filters.requester && t.requester !== filters.requester) return false
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        const match =
          t.content.toLowerCase().includes(kw) ||
          t.requester.toLowerCase().includes(kw) ||
          t.assignee.toLowerCase().includes(kw) ||
          (t.memo ?? '').toLowerCase().includes(kw)
        if (!match) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortKey) {
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return a.due_date.localeCompare(b.due_date)
        case 'urgent_first':
          if (a.is_urgent !== b.is_urgent) return a.is_urgent ? -1 : 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'status':
          if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default: // created_desc
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const counts = {
    '未対応': tasks.filter(t => t.status === '未対応').length,
    '対応中': tasks.filter(t => t.status === '対応中').length,
    '完了': tasks.filter(t => t.status === '完了').length,
  }

  // カテゴリ順を設定の順番に従って維持しつつグループ化
  const groupedByCategory: { category: string; tasks: typeof filtered }[] = settings.categories
    .map(cat => ({ category: cat, tasks: filtered.filter(t => t.category === cat) }))
    .concat(
      // 設定にないカテゴリ（独自入力など）も拾う
      [...new Set(filtered.map(t => t.category))]
        .filter(cat => !settings.categories.includes(cat))
        .map(cat => ({ category: cat, tasks: filtered.filter(t => t.category === cat) }))
    )
    .filter(g => g.tasks.length > 0)

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-4 py-3 md:px-6 md:py-4" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          {/* タイトル */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-white leading-tight">AI ONE タスク管理</h1>
            <p className="text-xs text-blue-200 hidden sm:block">CSチーム共有タスクボード</p>
          </div>

          {/* 右側ボタン群 */}
          <div className="flex items-center gap-2 flex-wrap">
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
              <button
                onClick={() => setViewMode('assignee')}
                className={`px-2.5 py-1.5 ${viewMode === 'assignee' ? 'bg-white text-blue-900 font-medium' : 'text-white/80 hover:bg-white/10'}`}
              >
                担当者別
              </button>
            </div>
            <Link href="/settings" className="text-xs md:text-sm text-white/80 hover:text-white border border-white/30 rounded-lg px-2.5 py-1.5 hover:bg-white/10">
              設定
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-blue-900 px-3 py-1.5 rounded-lg text-xs md:text-sm hover:bg-blue-50 font-medium whitespace-nowrap"
            >
              + タスクを追加
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">

        {/* サマリー */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-red-500">{counts['未対応']}</p>
            <p className="text-xs text-gray-500 mt-1">未対応</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-yellow-500">{counts['対応中']}</p>
            <p className="text-xs text-gray-500 mt-1">対応中</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-500">{counts['完了']}</p>
            <p className="text-xs text-gray-500 mt-1">完了</p>
          </div>
        </div>

        {/* 担当者別タスク数サマリー */}
        <AssigneeSummaryBar
          tasks={tasks}
          settings={settings}
          onFilterByAssignee={name => {
            setViewMode('stack')
            setFilters(f => ({ ...f, assignee: f.assignee === name ? '' : name, keyword: '' }))
          }}
        />

        {/* フィルター（リスト・カード表示時のみ） */}
        {viewMode !== 'assignee' && (
          <FilterBar filters={filters} sortKey={sortKey} settings={settings} onChange={setFilters} onSortChange={setSortKey} />
        )}

        {/* タスク一覧 */}
        {viewMode === 'assignee' ? (
          <AssigneeBoard tasks={tasks} settings={settings} onUpdated={fetchData} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>タスクがありません</p>
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
                        <TaskCard
                          key={task.id}
                          task={task}
                          settings={settings}
                          onUpdated={fetchData}
                          onDeleted={fetchData}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showModal && (
        <AddTaskModal
          settings={settings}
          onClose={() => setShowModal(false)}
          onAdded={fetchData}
        />
      )}
    </div>
  )
}
