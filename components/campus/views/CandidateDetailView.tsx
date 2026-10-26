'use client'

import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import CandidateActions, { NotesList } from '@/components/campus/CandidateActions'
import CandidateProfile, { CandidateHeader } from '@/components/campus/CandidateProfile'
import JobSelect, { useSelectedJob } from '@/components/campus/JobSelect'
import { EvidenceSummary, Explanation, Improvements, Limitations, RequirementList, ScoreComponents } from '@/components/campus/MatchBreakdown'
import { Card, EmptyState } from '@/components/campus/ui'
import { employerCandidate, employerMatch, job as getJob } from '@/lib/campus/queries'
import { useDemoState } from '@/lib/campus/store'

export default function CandidateDetailView({ id, initialJob }: { id: string; initialJob?: string }) {
  const state = useDemoState()
  const [jobId, setJobId] = useSelectedJob(initialJob)
  // Access-controlled read: returns null for private or unknown profiles, so nothing private reaches the page.
  const c = employerCandidate(state, id)
  const back = <Link href={`/demo/employer/candidates?job=${jobId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-cx-dim no-underline hover:text-cx-ink"><ArrowLeft size={14} aria-hidden />All candidates</Link>

  if (!c) {
    return (
      <>
        {back}
        <div className="cx-card"><EmptyState icon={<Lock size={22} />} title="This profile is not available" action={<Link href="/demo/employer/candidates" className="cx-btn">Browse discoverable candidates</Link>}>The candidate has not shared their profile with employers, or it no longer exists. No profile information is shown.</EmptyState></div>
      </>
    )
  }
  const job = getJob(state, jobId)
  const match = employerMatch(state, c, jobId)

  return (
    <>
      {back}
      <div className="cx-card mb-4 flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
        <CandidateHeader c={c} />
        <div className="flex flex-wrap gap-2 md:justify-end"><CandidateActions studentId={c.id} jobId={jobId} jobTitle={job?.title} size="md" showNotes={false} /></div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <JobSelect value={jobId} onChange={setJobId} />
        <span className="text-[12px] text-cx-dim">Shortlisting applies to the selected job.</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card title={`Requirement alignment · ${job?.title ?? ''}`} description="Calculated from the shared profile only."><ScoreComponents match={match} /></Card>
        <Card title="Gaps against requirements"><Improvements match={match} perspective="employer" /></Card>
      </div>
      <div className="mt-4"><Card title="Requirements"><RequirementList match={match} /></Card></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Evidence behind the match"><EvidenceSummary match={match} /></Card>
        <Card title="How the score was calculated"><Explanation match={match} /><div className="mt-4 border-t border-cx-line pt-4"><Limitations match={match} /></div></Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card title="Shared profile"><CandidateProfile c={c} /></Card>
        <Card title="Internal notes" description="Your team only."><NotesList studentId={c.id} /></Card>
      </div>
    </>
  )
}
