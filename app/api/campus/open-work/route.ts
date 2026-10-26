import { NextResponse, type NextRequest } from 'next/server'
import { getOpenWorks } from '@/lib/campus/external.server'
import { FAMILY_LABEL, LIVE_SKILL_NAMES } from '@/lib/campus/live-jobs'
import { createSeedState } from '@/lib/campus/seed'

// Only catalogue skill names and role categories can be queried, so this route cannot be used as an open proxy.
const ALLOWED = new Set(
  [...createSeedState().skills.map(s => s.name), ...Object.values(LIVE_SKILL_NAMES), ...Object.values(FAMILY_LABEL)].map(q => q.toLowerCase()),
)

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  if (!ALLOWED.has(q.toLowerCase())) return NextResponse.json({ error: 'Choose a skill or role from the list.' }, { status: 400 })
  const result = await getOpenWorks(q)
  return NextResponse.json(result, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } })
}
