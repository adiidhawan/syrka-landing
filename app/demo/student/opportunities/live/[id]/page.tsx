import Link from 'next/link'
import { Briefcase, CircleSlash } from 'lucide-react'
import { EmptyState } from '@/components/campus/ui'
import LiveOpeningDetailView from '@/components/campus/views/LiveOpeningDetailView'
import { checkLiveOpening, getLiveState } from '@/lib/campus/live-jobs.server'

const back = <Link href="/demo/student/opportunities/live" className="cx-btn">Browse live openings</Link>

export default async function LiveOpeningPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ closed?: string }> }) {
  const [{ id }, { closed }] = await Promise.all([params, searchParams])
  // Re-check this one listing at the source before showing it.
  const [check, live] = await Promise.all([checkLiveOpening(id), getLiveState()])
  if (closed || check.status === 'closed' || check.status === 'missing') {
    return <div className="cx-card"><EmptyState icon={<CircleSlash size={22} />} title="This opening has closed" action={back}>The source reports that the role is no longer accepting applications, so it has been removed.</EmptyState></div>
  }
  const listed = live.status === 'live' ? live.data.jobs.find(j => j.id === id) : undefined
  const job = (check.status === 'open' && check.job) || listed
  if (!job) {
    return <div className="cx-card"><EmptyState icon={<Briefcase size={22} />} title="This opening is not available" action={back}>It could not be verified with its source right now.</EmptyState></div>
  }
  const verified = check.status === 'open'
  return <LiveOpeningDetailView job={job} verified={verified} verifiedAt={verified ? check.checkedAt : live.status === 'live' ? live.data.fetchedAt : check.checkedAt} />
}
