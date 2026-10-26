import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { LANDSCAPE_TAG, MISSIONS_TAG } from '@/lib/campus/external.server'
import { fetchLiveJobs, parsePartnerBoards } from '@/lib/campus/live-jobs'
import { LIVE_JOBS_TAG } from '@/lib/campus/live-jobs.server'
import { computeDemand, toSnapshot } from '@/lib/campus/market-demand'
import { writeSnapshot } from '@/lib/campus/snapshot-store'

export const maxDuration = 60

/**
 * Scheduled refresh (Vercel Cron, daily). Reads the live sources afresh, stores today's market-demand snapshot (only
 * aggregate counts), and marks the cached live jobs, missions and landscape data for background refresh.
 * Requires `Authorization: Bearer $CRON_SECRET`, which Vercel Cron sends automatically when CRON_SECRET is set.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const report: Record<string, unknown> = { startedAt: new Date().toISOString() }
  try {
    const live = await fetchLiveJobs({ partners: parsePartnerBoards(process.env.CAMPUS_PARTNER_BOARDS), himalayasKey: process.env.HIMALAYAS_API_KEY || undefined })
    const snapshot = toSnapshot(computeDemand(live.jobs, live.fetchedAt))
    report.liveJobs = live.jobs.length
    report.sources = live.sources
    report.snapshot = { date: snapshot.date, store: await writeSnapshot(snapshot), skills: Object.keys(snapshot.skills).length }
  } catch (e) {
    report.liveJobsError = e instanceof Error ? e.message : String(e)
  }
  for (const tag of [LIVE_JOBS_TAG, MISSIONS_TAG, LANDSCAPE_TAG]) revalidateTag(tag, 'max')
  report.revalidated = [LIVE_JOBS_TAG, MISSIONS_TAG, LANDSCAPE_TAG]
  return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } })
}
