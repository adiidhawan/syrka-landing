'use client'

import Link from 'next/link'
import { Briefcase, MapPin } from 'lucide-react'
import { Card, PageHeader, ScoreBadge, Tag, Time } from '@/components/campus/ui'
import { PRIMARY_COMPANY_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import { companyJobs, employerCandidates, employerMatch, jobRequirements } from '@/lib/campus/queries'

export default function EmployerJobsPage() {
  const state = useDemoState()
  const jobs = companyJobs(state, PRIMARY_COMPANY_ID)
  const candidates = employerCandidates(state)
  return (
    <>
      <PageHeader eyebrow="Jobs" title="Job listings" description="Northstar Technologies’ open roles and how the discoverable candidate pool aligns with each." />
      <div className="grid gap-3 md:grid-cols-2">
        {jobs.map(j => {
          const reqs = jobRequirements(state, j.id)
          const scores = candidates.map(c => ({ c, score: employerMatch(state, c, j.id).score })).sort((a, b) => b.score - a.score)
          const strong = scores.filter(s => s.score >= 75).length
          const shortlisted = state.shortlists.filter(s => s.companyId === PRIMARY_COMPANY_ID && s.jobId === j.id && candidates.some(c => c.id === s.studentId)).length
          return (
            <Card key={j.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/demo/employer/jobs/${j.id}`} className="text-[16px] font-semibold text-cx-ink no-underline hover:underline">{j.title}</Link>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[12.5px] text-cx-dim">
                    <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{j.location} · {j.arrangement}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase size={12} aria-hidden />{j.type}</span>
                    <span>Posted <Time iso={j.postedAt} /></span>
                  </div>
                </div>
                <Tag tone={j.status === 'open' ? 'ok' : 'neutral'}>{j.status === 'open' ? 'Open' : 'Closed'}</Tag>
              </div>
              <p className="mt-3 text-[13px] text-cx-ink2">{j.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {reqs.required.map(r => <Tag key={r.skillId} tone="accent">{r.name} ≥ {r.minProficiency}</Tag>)}
                {reqs.preferred.map(r => <Tag key={r.skillId}>{r.name} · preferred</Tag>)}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cx-line pt-3 text-[12.5px] text-cx-dim">
                <span>{strong} candidate{strong === 1 ? '' : 's'} at 75%+ · {shortlisted} shortlisted</span>
                {scores[0] && <span className="flex items-center gap-2">Top: <span className="font-medium text-cx-ink">{scores[0].c.name}</span><ScoreBadge score={scores[0].score} size="sm" /></span>}
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/demo/employer/jobs/${j.id}`} className="cx-btn cx-btn-sm cx-btn-primary">View matches</Link>
                <Link href={`/demo/employer/candidates?job=${j.id}`} className="cx-btn cx-btn-sm">Filter candidates</Link>
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
