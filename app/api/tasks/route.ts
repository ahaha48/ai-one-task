import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendDiscordNotification } from '@/lib/discord'

export async function GET() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { category, content, requester, assignee, memo, is_urgent, due_date } = body

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ category, content, requester, assignee, memo, status: '未対応', is_urgent: !!is_urgent, due_date: due_date || null }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Discord通知
  const { data: settings } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'discord_webhook')
    .single()

  if (settings?.value) {
    await sendDiscordNotification(data, settings.value).catch(() => {})
  }

  return NextResponse.json(data)
}
