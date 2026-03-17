import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log('LINE Webhook:', JSON.stringify(body, null, 2))

  for (const event of body.events ?? []) {
    const source = event.source
    if (source?.type === 'group') {
      console.log('GROUP ID:', source.groupId)
    }
  }

  return NextResponse.json({ ok: true })
}
