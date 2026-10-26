import { unstable_cache } from 'next/cache'
import { checkLiveJob, fetchLiveJobs, parsePartnerBoards, type ClosureCheck, type LiveJobsResult } from './live-jobs'

/**
 * Server-only access to live openings. Configuration (all optional):
 *   CAMPUS_LIVE_JOBS=off           hide live openings entirely, e.g. for an investor environment
 *   CAMPUS_LIVE_MAX_AGE_HOURS=36   how old the last good result may be before it is hidden
 *   HIMALAYAS_API_KEY              raises Himalayas rate limits; never sent to the browser
 *   CAMPUS_PARTNER_BOARDS          allow-listed employer boards (see parsePartnerBoards)
 */

export const LIVE_JOBS_TAG = 'campus-live-jobs'
const MAX_AGE_HOURS = Number(process.env.CAMPUS_LIVE_MAX_AGE_HOURS) || 36
const himalayasKey = process.env.HIMALAYAS_API_KEY || undefined

// Refreshed twice a day, matching Himalayas' own daily refresh. fetchLiveJobs throws only when every source fails;
// the cache does not store errors, so the last good result keeps being served until it ages out below.
const cachedLiveJobs = unstable_cache(
  () => fetchLiveJobs({ partners: parsePartnerBoards(process.env.CAMPUS_PARTNER_BOARDS), himalayasKey }),
  ['campus-live-jobs-v5'],
  { revalidate: 43200, tags: [LIVE_JOBS_TAG] },
)

export type LiveState =
  | { status: 'live'; data: LiveJobsResult; maxAgeHours: number }
  | { status: 'stale'; fetchedAt: string; maxAgeHours: number }
  | { status: 'unavailable' | 'disabled' }

export async function getLiveState(): Promise<LiveState> {
  if (process.env.CAMPUS_LIVE_JOBS === 'off') return { status: 'disabled' }
  try {
    const data = await cachedLiveJobs()
    const ageHours = (Date.now() - Date.parse(data.fetchedAt)) / 3_600_000
    if (ageHours > MAX_AGE_HOURS) return { status: 'stale', fetchedAt: data.fetchedAt, maxAgeHours: MAX_AGE_HOURS }
    return { status: 'live', data, maxAgeHours: MAX_AGE_HOURS }
  } catch {
    return { status: 'unavailable' }
  }
}

/** Per-job closure check against the source, cached for up to 10 minutes as Himalayas allows. */
export function checkLiveOpening(id: string): Promise<ClosureCheck> {
  return checkLiveJob(id, { himalayasKey })
}
