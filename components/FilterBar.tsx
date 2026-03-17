'use client'

import { Settings, TaskStatus } from '@/lib/supabase'

export type Filters = {
  status: TaskStatus | 'すべて' | '未完了'
  assignee: string
  requester: string
  keyword: string
}

export type SortKey = 'created_desc' | 'created_asc' | 'due_date' | 'urgent_first' | 'status'

type Props = {
  filters: Filters
  sortKey: SortKey
  settings: Settings
  onChange: (f: Filters) => void
  onSortChange: (s: SortKey) => void
}

const DEFAULT_FILTERS: Filters = {
  status: '未完了',
  assignee: '',
  requester: '',
  keyword: '',
}

function isFiltered(filters: Filters, sortKey: SortKey) {
  return (
    filters.status !== 'すべて' ||
    filters.assignee !== '' ||
    filters.requester !== '' ||
    filters.keyword !== '' ||
    sortKey !== 'created_desc'
  )
}

export default function FilterBar({ filters, sortKey, settings, onChange, onSortChange }: Props) {
  const members = settings.members.filter(Boolean)
  const allRequesters = [...new Set([...members, ...settings.assignees])]

  const selectCls = "border rounded-lg px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
  const filtered = isFiltered(filters, sortKey)

  return (
    <div className="bg-white rounded-xl border shadow-sm p-3 space-y-2">
      {/* キーワード検索 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={filters.keyword}
            onChange={e => onChange({ ...filters, keyword: e.target.value })}
            placeholder="キーワードで検索（依頼内容・依頼者・依頼先）"
            className="w-full border rounded-lg pl-7 pr-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {filtered && (
          <button
            onClick={() => { onChange(DEFAULT_FILTERS); onSortChange('created_desc') }}
            className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2.5 py-1.5 whitespace-nowrap hover:bg-blue-50"
          >
            リセット
          </button>
        )}
      </div>

      {/* ドロップダウン絞り込み */}
      <div className="flex flex-wrap gap-2">
        <select
          value={sortKey}
          onChange={e => onSortChange(e.target.value as SortKey)}
          className={`${selectCls} font-medium text-gray-700`}
        >
          <option value="created_desc">登録順（新しい順）</option>
          <option value="created_asc">登録順（古い順）</option>
          <option value="due_date">期日順</option>
          <option value="urgent_first">至急優先</option>
          <option value="status">ステータス順</option>
        </select>

        <select
          value={filters.status}
          onChange={e => onChange({ ...filters, status: e.target.value as Filters['status'] })}
          className={filters.status !== 'すべて' ? `${selectCls} border-blue-400 bg-blue-50 font-medium text-blue-700` : selectCls}
        >
          <option value="未完了">未完了（未対応＋対応中）</option>
          <option value="すべて">すべて（完了含む）</option>
          <option value="未対応">未対応のみ</option>
          <option value="対応中">対応中のみ</option>
          <option value="完了">完了のみ</option>
        </select>

        <select
          value={filters.assignee}
          onChange={e => onChange({ ...filters, assignee: e.target.value })}
          className={filters.assignee ? `${selectCls} border-blue-400 bg-blue-50 font-medium text-blue-700` : selectCls}
        >
          <option value="">すべての依頼先</option>
          {settings.assignees.map(a => <option key={a}>{a}</option>)}
        </select>

        <select
          value={filters.requester}
          onChange={e => onChange({ ...filters, requester: e.target.value })}
          className={filters.requester ? `${selectCls} border-blue-400 bg-blue-50 font-medium text-blue-700` : selectCls}
        >
          <option value="">すべての依頼者</option>
          {allRequesters.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
    </div>
  )
}
