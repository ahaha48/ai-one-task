'use client'

import { useState } from 'react'
import { Settings } from '@/lib/supabase'

type Props = {
  settings: Settings
  onClose: () => void
  onAdded: () => void
}

export default function AddTaskModal({ settings, onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    category: settings.categories[0] ?? '',
    content: '',
    requester: '',
    memo: '',
    is_urgent: false,
    due_date: '',
  })
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [otherAssignee, setOtherAssignee] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const members = settings.members.filter(Boolean)
  const allAssignees = [...new Set([...settings.assignees, ...members])]
  const allRequesters = [...new Set([...members, ...settings.assignees])]

  const toggleAssignee = (name: string) => {
    setSelectedAssignees(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    )
  }

  const otherChecked = selectedAssignees.includes('__other__')
  const toggleOther = () => {
    setSelectedAssignees(prev =>
      prev.includes('__other__') ? prev.filter(a => a !== '__other__') : [...prev, '__other__']
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const assigneeList = selectedAssignees
      .filter(a => a !== '__other__')
      .concat(otherChecked && otherAssignee.trim() ? [otherAssignee.trim()] : [])
    if (!form.content || !form.requester || assigneeList.length === 0 || !form.category) {
      setError('カテゴリ・依頼内容・依頼者・依頼先は必須です')
      return
    }
    setLoading(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, assignee: assigneeList.join(', ') }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('作成に失敗しました')
      return
    }
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* ヘッダー（固定） */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">新しいタスクを追加</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* フォーム本体（スクロール可能） */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}

            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.is_urgent ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={form.is_urgent}
                onChange={e => setForm(f => ({ ...f, is_urgent: e.target.checked }))}
                className="accent-red-500 w-4 h-4"
              />
              <div>
                <span className="text-sm font-bold text-red-600">🚨 至急対応</span>
                <span className="text-xs text-gray-500 ml-2">チェックするとカードに至急マークが表示されます</span>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {settings.categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">依頼者 <span className="text-red-500">*</span></label>
              <select
                value={form.requester}
                onChange={e => setForm(f => ({ ...f, requester: e.target.value }))}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">選択してください</option>
                {allRequesters.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">依頼先 <span className="text-red-500">*</span></label>
              <div className="border rounded-lg p-2 space-y-1 max-h-36 overflow-y-auto">
                {allAssignees.map(a => (
                  <label key={a} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 ${selectedAssignees.includes(a) ? 'bg-blue-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(a)}
                      onChange={() => toggleAssignee(a)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{a}</span>
                  </label>
                ))}
                <label className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 ${otherChecked ? 'bg-blue-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={otherChecked}
                    onChange={toggleOther}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">その他の依頼先</span>
                </label>
              </div>
              {otherChecked && (
                <input
                  value={otherAssignee}
                  onChange={e => setOtherAssignee(e.target.value)}
                  placeholder="依頼先を入力してください"
                  className="w-full border rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
              {(selectedAssignees.filter(a => a !== '__other__').length > 0 || (otherChecked && otherAssignee.trim())) && (
                <p className="text-xs text-blue-600 mt-1">
                  選択中: {[...selectedAssignees.filter(a => a !== '__other__'), otherChecked && otherAssignee.trim() ? otherAssignee.trim() : ''].filter(Boolean).join(' / ')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">依頼内容 <span className="text-red-500">*</span></label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={3}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="依頼内容を入力してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期日（任意）</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
              <textarea
                value={form.memo}
                onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                rows={2}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="補足情報など"
              />
            </div>
          </div>

          {/* ボタン（固定フッター） */}
          <div className="flex gap-3 px-5 py-4 border-t flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm hover:bg-blue-700 disabled:opacity-50 font-medium">
              {loading ? '作成中...' : 'タスクを作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
