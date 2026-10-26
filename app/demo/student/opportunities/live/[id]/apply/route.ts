import { NextResponse, type NextRequest } from 'next/server'
import { checkLiveOpening, getLiveState } from '@/lib/campus/live-jobs.server'

/**
 * Apply clicks pass through here so the listing is checked at its source first. Open roles redirect to the
 * source's mandated application link; closed ones go back to the listing, which explains that it has closed.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = new URL(`/demo/student/opportunities/live/${encodeURIComponent(id)}`, request.url)
  const check = await checkLiveOpening(id)
  if (check.status === 'closed' || check.status === 'missing') {
    detail.searchParams.set('closed', '1')
    return NextResponse.redirect(detail)
  }
  let target = check.status === 'open' ? check.job?.applyUrl : undefined
  if (!target) {
    const live = await getLiveState()
    if (live.status === 'live') target = live.data.jobs.find(j => j.id === id)?.applyUrl
  }
  // Only ever redirect to an http(s) link that came from the source data, never to anything taken from the request.
  if (!target || !/^https?:\/\//i.test(target)) return NextResponse.redirect(detail)
  return NextResponse.redirect(target)
}
