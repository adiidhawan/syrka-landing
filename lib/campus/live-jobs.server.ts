import { unstable_cache } from 'next/cache'
import { fetchLiveJobs, type LiveJobsResult } from './live-jobs'
import snapshot from './live-snapshot.json'

/**
 * Live openings, read from the company feeds at most every six hours. When no feed can be reached, the bundled
 * snapshot from the last `npm run campus:calibrate` is shown instead and labelled as such.
 */
export const getLiveJobs = unstable_cache(
  async (): Promise<LiveJobsResult> => {
    try {
      const live = await fetchLiveJobs()
      if (live.jobs.length) return live
    } catch {
      // Fall through to the snapshot.
    }
    return { ...(snapshot as LiveJobsResult), origin: 'snapshot' }
  },
  ['campus-live-jobs-v3'],
  { revalidate: 21600 },
)
