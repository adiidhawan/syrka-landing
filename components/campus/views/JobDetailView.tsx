'use client'

import Link from 'next/link'
import { ArrowLeft, Briefcase, Lock, MapPin } from 'lucide-react'
import CandidateActions from '@/components/campus/CandidateActions'
import { ConfidenceTag, MatchActions } from '@/components/campus/MatchBreakdown'
import { Avatar, Card, EmptyState, PageHeader, ScoreBadge, Tag } from '@/components/campus/ui'
import { PRIMARY_COMPANY_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import { employerCandidates, employerMatch, job as getJob, jobRequirements } from '@/lib/campus/queries'

export default function JobDetailView({ id }: { id: string }) {
  const state = useDemoState()
  const job = getJob(state, id)
  if (!job || job.companyId !== PRIMARY_COMPANY_ID) {
    return <div className="cx-card"><EmptyState icon={<Briefcase size={22} />} title="Job not found" action={<Link href="/demo/employer/jobs" className="cx-btn">Back to jobs</Link>} /></div>
  }
  const reqs = jobRequirements(state, id)
  const candidates = employerCandidates(state)
  const ranked = candidates.map(c => ({ c, m: employerMatch(state, c, id) })).sort((a, b) => b.m.score - a.m.score)
  const hidden = state.students.length - candidates.length

  return (
    <>
      <Link href="/demo/employer/jobs" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-cx-dim no-underline hover:text-cx-ink"><ArrowLeft size={14} aria-hidden />All jobs</Link>
      <PageHeader
        eyebrow="Northstar Technologies"
        title={job.title}
        description={<span className="flex flex-wrap gap-x-3"><span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden />{job.location} · {job.arrangement}</span><span>{job.type}</span></span>}
        actions={<Link href={`/demo/employer/candidates?job=${id}`} className="cx-btn">Open in candidate search</Link>}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card title="Role">
          <p className="text-[13.5px] leading-relaxed text-cx-ink2">{job.description}</p>
          <h3 className="cx-eyebrow mb-1.5 mt-4">Responsibilities</h3>
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-cx-ink2">{job.responsibilities.map(r => <li key={r}>{r}</li>)}</ul>
          <h3 className="cx-eyebrow mb-1.5 mt-4">Experience</h3>
          <p className="text-[13px] text-cx-ink2">{job.experience}</p>
        </Card>
        <Card title="Capability requirements" description="What the matching engine compares candidates against." padded={false}>
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[11.5px] text-cx-dim"><th className="px-5 py-2 font-medium">Skill</th><th className="py-2 font-medium">Type</th><th className="px-5 py-2 text-right font-medium">Level for full credit</th></tr></thead>
            <tbody>
              {[...reqs.required.map(r => ({ ...r, kind: 'Required' })), ...reqs.preferred.map(r => ({ ...r, kind: 'Preferred' }))].map(r => (
                <tr key={r.skillId} className="border-t border-cx-line"><td className="px-5 py-2.5 font-medium">{r.name}</td><td className="py-2.5"><Tag tone={r.kind === 'Required' ? 'accent' : 'neutral'}>{r.kind}</Tag></td><td className="cx-num px-5 py-2.5 text-right">{r.minProficiency}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-cx-line px-5 py-3 text-[12px] text-cx-dim">
            Evidence considered: {job.evidencePolicy.projects ? 'projects' : ''}{job.evidencePolicy.projects && job.evidencePolicy.assessments ? ' and ' : ''}{job.evidencePolicy.assessments ? 'verified assessments' : ''}.
            {!reqs.preferred.length && ' No preferred skills, so the 20% preferred weight is spread over the other components.'}
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Matching candidates" description={`${ranked.length} discoverable candidates ranked by requirement alignment.`} action={hidden > 0 ? <span className="inline-flex items-center gap-1 text-[12px] text-cx-dim"><Lock size={12} aria-hidden />{hidden} private, not ranked</span> : undefined} padded={false}>
          <ul>
            {ranked.map(({ c, m }, i) => (
              <li key={c.id} className="flex flex-col gap-3 border-t border-cx-line px-5 py-3.5 first:border-0 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="cx-num w-5 text-[12px] text-cx-faint">{i + 1}</span>
                  <Avatar name={c.name} size={32} />
                  <div className="min-w-0">
                    <Link href={`/demo/employer/candidates/${c.id}?job=${id}`} className="font-medium text-cx-ink no-underline hover:underline">{c.name}</Link>
                    <div className="text-[12px] text-cx-dim">{c.preferredRole} · {m.summary.requiredMet}/{m.summary.requiredTotal} required met{m.summary.requiredMissing ? ` · missing ${m.required.filter(r => r.status === 'missing').map(r => r.name).join(', ')}` : ''}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidenceTag match={m} />
                  <ScoreBadge score={m.score} size="sm" />
                  <MatchActions match={m} perspective="employer" size="sm" />
                  <CandidateActions studentId={c.id} jobId={id} jobTitle={job.title} showNotes={false} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
