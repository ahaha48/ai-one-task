import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEFAULT_SETTINGS } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings = { ...DEFAULT_SETTINGS }
  for (const row of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(settings as any)[row.key] = row.value
  }
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const upserts = Object.entries(body).map(([key, value]) => ({ key, value }))
  const { error } = await supabase.from('settings').upsert(upserts, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
