import LiveOpeningsView from '@/components/campus/views/LiveOpeningsView'
import { getLiveJobs } from '@/lib/campus/live-jobs.server'

export default async function LiveOpeningsPage() {
  return <LiveOpeningsView data={await getLiveJobs()} />
}
