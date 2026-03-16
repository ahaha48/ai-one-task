import { NextRequest, NextResponse } from 'next/server'
import { supabase, TaskStatus, calcOverallStatus } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // 担当者個別のステータス更新
  if (body.assignee_name && body.status) {
    // 現在のタスクを取得
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('assignee, assignee_statuses, status')
      .eq('id', id)
      .single()

    if (fetchError || !task) return NextResponse.json({ error: 'タスク取得失敗' }, { status: 500 })

    // assignee_statusesを更新
    const currentStatuses: Record<string, TaskStatus> = task.assignee_statuses
      ? JSON.parse(task.assignee_statuses)
      : {}

    // 全担当者を初期化（未設定のものはtask.statusで埋める）
    const assignees = task.assignee.split(',').map((s: string) => s.trim())
    for (const a of assignees) {
      if (!currentStatuses[a]) currentStatuses[a] = task.status
    }
    currentStatuses[body.assignee_name] = body.status

    const overallStatus = calcOverallStatus(currentStatuses)
    const updates: Record<string, unknown> = {
      assignee_statuses: JSON.stringify(currentStatuses),
      status: overallStatus,
      completed_at: overallStatus === '完了' ? new Date().toISOString() : null,
    }

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // 通常のステータス更新（全体一括）
  const updates: Record<string, unknown> = { ...body }
  if (body.status === '完了') {
    updates.completed_at = new Date().toISOString()
    // assignee_statusesも全員完了にする
    if (body.assignee) {
      const assignees = body.assignee.split(',').map((s: string) => s.trim())
      const statuses: Record<string, TaskStatus> = {}
      for (const a of assignees) statuses[a] = '完了'
      updates.assignee_statuses = JSON.stringify(statuses)
    }
  } else if (body.status) {
    updates.completed_at = null
  }

  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
