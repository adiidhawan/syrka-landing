import LiveOpeningsView from '@/components/campus/views/LiveOpeningsView'
import { getLiveState } from '@/lib/campus/live-jobs.server'

// Re-render hourly so the freshness check runs even while the data itself is cached for longer.
export const revalidate = 3600

export default async function LiveOpeningsPage() {
  return <LiveOpeningsView state={await getLiveState()} />
}
