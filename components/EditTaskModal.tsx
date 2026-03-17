'use client'

import { useState } from 'react'
import { Task, Settings, TaskStatus } from '@/lib/supabase'

type Props = {
  task: Task
  settings: Settings
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

export default function EditTaskModal({ task, settings, onClose, onUpdated, onDeleted }: Props) {
  const members = settings.members.filter(Boolean)
  const allAssignees = [...new Set([...settings.assignees, ...members])]
  const allRequesters = [...new Set([...members, ...settings.assignees])]

  const initialAssignees = task.assignee.split(',').map(s => s.trim()).filter(Boolean)
  const knownAssignees = initialAssignees.filter(a => allAssignees.includes(a))
  const unknownAssignees = initialAssignees.filter(a => !allAssignees.includes(a))

  const [form, setForm] = useState({
    category: task.category,
    content: task.content,
    requester: task.requester,
    status: task.status as TaskStatus,
    memo: task.memo ?? '',
    is_urgent: task.is_urgent ?? false,
    due_date: task.due_date ?? '',
  })
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(knownAssignees)
  const [otherAssignee, setOtherAssignee] = useState(unknownAssignees.join(', '))
  const [otherChecked, setOtherChecked] = useState(unknownAssignees.length > 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    setLoading(false)
    onDeleted()
    onClose()
  }

  const toggleAssignee = (name: string) => {
    setSelectedAssignees(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const assigneeList = [
      ...selectedAssignees,
      ...(otherChecked && otherAssignee.trim() ? [otherAssignee.trim()] : []),
    ]
    if (!form.content || !form.requester || assigneeList.length === 0 || !form.due_date) {
      setError('依頼内容・依頼者・依頼先・期日は必須です')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        assignee: assigneeList.join(', '),
        due_date: form.due_date,
      }),
    })
    setLoading(false)
    if (!res.ok) { setError('更新に失敗しました'); return }
    onUpdated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">タスクを編集</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}

          {/* 至急 */}
          <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.is_urgent ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="checkbox"
              checked={form.is_urgent}
              onChange={e => setForm(f => ({ ...f, is_urgent: e.target.checked }))}
              className="accent-red-500 w-4 h-4"
            />
            <span className="text-sm font-bold text-red-600">🚨 至急対応</span>
          </label>

          {/* ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="未対応">未対応</option>
              <option value="対応中">対応中</option>
              <option value="完了">完了</option>
            </select>
          </div>

          {/* 依頼者 */}
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

          {/* 依頼先 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">依頼先 <span className="text-red-500">*</span></label>
            <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
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
                  onChange={e => setOtherChecked(e.target.checked)}
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
          </div>

          {/* 依頼内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">依頼内容 <span className="text-red-500">*</span></label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={3}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 期日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期日 <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              required
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 状況メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状況（任意）</label>
            <textarea
              value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              rows={2}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="補足・現在の状況など"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? '保存中...' : '保存する'}
            </button>
          </div>

          <div className="border-t pt-3">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-sm text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg py-2"
              >
                このタスクを削除する
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-gray-600">本当に削除しますか？この操作は取り消せません。</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    削除する
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
