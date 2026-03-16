'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, DEFAULT_SETTINGS } from '@/lib/supabase'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [notifyResult, setNotifyResult] = useState('')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setSettings(data)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleNotify = async () => {
    setNotifying(true)
    setNotifyResult('')
    const res = await fetch('/api/notify', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setNotifyResult(`✓ ${data.sent}名に送信しました（メール未設定: ${data.skipped}名）`)
    } else {
      setNotifyResult(`エラー: ${data.error}`)
    }
    setNotifying(false)
    setTimeout(() => setNotifyResult(''), 5000)
  }

  const updateMember = (i: number, val: string) => {
    const arr = [...settings.members]
    arr[i] = val
    setSettings(s => ({ ...s, members: arr }))
  }

  const updateMemberEmail = (i: number, val: string) => {
    const arr = [...(settings.memberEmails ?? [])]
    while (arr.length <= i) arr.push('')
    arr[i] = val
    setSettings(s => ({ ...s, memberEmails: arr }))
  }

  const addMember = () => {
    setSettings(s => ({
      ...s,
      members: [...s.members, ''],
      memberEmails: [...(s.memberEmails ?? []), ''],
    }))
  }

  const removeMember = (i: number) => {
    setSettings(s => ({
      ...s,
      members: s.members.filter((_, idx) => idx !== i),
      memberEmails: (s.memberEmails ?? []).filter((_, idx) => idx !== i),
    }))
  }

  const moveMember = (i: number, dir: -1 | 1) => {
    const arr = [...settings.members]
    const emails = [...(settings.memberEmails ?? [])]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    ;[emails[i], emails[j]] = [emails[j], emails[i]]
    setSettings(s => ({ ...s, members: arr, memberEmails: emails }))
  }

  const updateListItem = (key: 'assignees' | 'categories', i: number, val: string) => {
    const arr = [...settings[key]]
    arr[i] = val
    setSettings(s => ({ ...s, [key]: arr }))
  }

  const addListItem = (key: 'assignees' | 'categories') => {
    setSettings(s => ({ ...s, [key]: [...s[key], ''] }))
  }

  const removeListItem = (key: 'assignees' | 'categories', i: number) => {
    setSettings(s => ({ ...s, [key]: s[key].filter((_, idx) => idx !== i) }))
  }

  const moveListItem = (key: 'assignees' | 'categories', i: number, dir: -1 | 1) => {
    const arr = [...settings[key]]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setSettings(s => ({ ...s, [key]: arr }))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-blue-200 hover:text-white text-sm">← タスク一覧へ</Link>
          <h1 className="text-xl font-bold text-white">設定</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-50 font-medium"
        >
          {saving ? '保存中...' : saved ? '保存しました ✓' : '保存する'}
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-8">

        {/* CSメンバー */}
        <section className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-700 mb-1">CSメンバー（依頼者）</h2>
          <p className="text-xs text-gray-400 mb-4">名前の変更・並び替え・追加・削除ができます</p>
          <div className="space-y-2">
            {settings.members.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveMember(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▲</button>
                  <button onClick={() => moveMember(i, 1)} disabled={i === settings.members.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    value={m}
                    onChange={e => updateMember(i, e.target.value)}
                    placeholder={`名前${i + 1}`}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    value={(settings.memberEmails ?? [])[i] ?? ''}
                    onChange={e => updateMemberEmail(i, e.target.value)}
                    placeholder="メールアドレス"
                    type="email"
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button onClick={() => removeMember(i)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
              </div>
            ))}
            <button onClick={addMember} className="text-sm text-blue-600 hover:underline mt-1">+ 追加</button>
          </div>
        </section>

        {/* 依頼先 */}
        <section className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-700 mb-1">依頼先</h2>
          <p className="text-xs text-gray-400 mb-4">名前の変更・並び替え・追加・削除ができます</p>
          <div className="space-y-2">
            {settings.assignees.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveListItem('assignees', i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▲</button>
                  <button onClick={() => moveListItem('assignees', i, 1)} disabled={i === settings.assignees.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    value={a}
                    onChange={e => updateListItem('assignees', i, e.target.value)}
                    placeholder="依頼先名"
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    value={(settings.assigneeEmails ?? [])[i] ?? ''}
                    onChange={e => {
                      const arr = [...(settings.assigneeEmails ?? [])]
                      while (arr.length <= i) arr.push('')
                      arr[i] = e.target.value
                      setSettings(s => ({ ...s, assigneeEmails: arr }))
                    }}
                    placeholder="メールアドレス"
                    type="email"
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button onClick={() => removeListItem('assignees', i)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
              </div>
            ))}
            <button onClick={() => addListItem('assignees')} className="text-sm text-blue-600 hover:underline mt-1">+ 追加</button>
          </div>
        </section>

        {/* カテゴリ */}
        <section className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-700 mb-1">カテゴリ</h2>
          <p className="text-xs text-gray-400 mb-4">名前の変更・並び替え・追加・削除ができます</p>
          <div className="space-y-2">
            {settings.categories.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveListItem('categories', i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▲</button>
                  <button onClick={() => moveListItem('categories', i, 1)} disabled={i === settings.categories.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <input
                  value={c}
                  onChange={e => updateListItem('categories', i, e.target.value)}
                  placeholder="カテゴリ名"
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button onClick={() => removeListItem('categories', i)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
              </div>
            ))}
            <button onClick={() => addListItem('categories')} className="text-sm text-blue-600 hover:underline mt-1">+ 追加</button>
          </div>
        </section>

        {/* メール通知 */}
        <section className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-700 mb-1">メール通知設定</h2>
          <p className="text-xs text-gray-500 mb-4">期日前日・当日・超過のまま未対応のタスクを担当者にメールで通知します。毎朝9時に自動送信されます（Vercelデプロイ後に有効）。</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">送信元メールアドレス</label>
              <input
                value={settings.notify_from_email ?? ''}
                onChange={e => setSettings(s => ({ ...s, notify_from_email: e.target.value }))}
                placeholder="noreply@yourdomain.com"
                type="email"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">Resendで認証済みのドメインのアドレスを使用してください</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleNotify}
                disabled={notifying}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {notifying ? '送信中...' : '今すぐ通知を送る'}
              </button>
              {notifyResult && (
                <span className={`text-sm ${notifyResult.startsWith('エラー') ? 'text-red-600' : 'text-green-600'}`}>
                  {notifyResult}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Discord */}
        <section className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-700 mb-1">Discord Webhook URL</h2>
          <p className="text-xs text-gray-500 mb-3">タスク作成時にDiscordへ通知します。不要な場合は空白のままでOK。</p>
          <input
            value={settings.discord_webhook}
            onChange={e => setSettings(s => ({ ...s, discord_webhook: e.target.value }))}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </section>

      </main>
    </div>
  )
}
