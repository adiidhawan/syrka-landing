import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import { EmptyState } from '@/components/campus/ui'
import LiveOpeningDetailView from '@/components/campus/views/LiveOpeningDetailView'
import { getLiveJobs } from '@/lib/campus/live-jobs.server'

export default async function LiveOpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, data] = await Promise.all([params, getLiveJobs()])
  const job = data.jobs.find(j => j.id === id)
  if (!job) {
    return (
      <div className="cx-card">
        <EmptyState icon={<Briefcase size={22} />} title="This opening is no longer listed" action={<Link href="/demo/student/opportunities/live" className="cx-btn">Browse live openings</Link>}>
          The company may have filled or closed the role since it was last read.
        </EmptyState>
      </div>
    )
  }
  return <LiveOpeningDetailView job={job} data={{ fetchedAt: data.fetchedAt, origin: data.origin }} />
}
