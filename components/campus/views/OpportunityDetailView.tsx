'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Briefcase, Building2, MapPin } from 'lucide-react'
import { EvidenceSummary, Explanation, Improvements, Limitations, MatchActions, RequirementList, ScoreComponents } from '@/components/campus/MatchBreakdown'
import { Card, EmptyState, PageHeader, Tag, Time } from '@/components/campus/ui'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { recordJobView, useDemoState, useHydrated } from '@/lib/campus/store'
import { company, job as getJob, studentMatch } from '@/lib/campus/queries'

export default function OpportunityDetailView({ id }: { id: string }) {
  const state = useDemoState()
  const hydrated = useHydrated()
  const job = getJob(state, id)
  useEffect(() => { if (hydrated && job) recordJobView(PRIMARY_STUDENT_ID, job.id) }, [hydrated, job])

  if (!job) {
    return <div className="cx-card"><EmptyState icon={<Briefcase size={22} />} title="Opportunity not found" action={<Link href="/demo/student/opportunities" className="cx-btn">Back to opportunities</Link>}>It may have been removed when the demo was reset.</EmptyState></div>
  }
  const org = company(state, job.companyId)
  const match = studentMatch(state, PRIMARY_STUDENT_ID, job.id)

  return (
    <>
      <Link href="/demo/student/opportunities" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-cx-dim no-underline hover:text-cx-ink"><ArrowLeft size={14} aria-hidden />All opportunities</Link>
      <PageHeader
        eyebrow={org?.name}
        title={job.title}
        description={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden />{job.location} · {job.arrangement}</span><span className="inline-flex items-center gap-1"><Briefcase size={13} aria-hidden />{job.type}</span><span>Posted <Time iso={job.postedAt} /></span></span>}
        actions={<MatchActions match={match} perspective="student" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card title="Your requirement alignment" description="Calculated from your current profile. It updates as you add skills, projects and assessments.">
          <ScoreComponents match={match} />
        </Card>
        <Card title="About the role">
          <p className="text-[13.5px] leading-relaxed text-cx-ink2">{job.description}</p>
          <h3 className="cx-eyebrow mb-1.5 mt-4">Responsibilities</h3>
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-cx-ink2">{job.responsibilities.map(r => <li key={r}>{r}</li>)}</ul>
          <h3 className="cx-eyebrow mb-1.5 mt-4">Experience</h3>
          <p className="text-[13px] text-cx-ink2">{job.experience}</p>
          {org && <div className="mt-4 flex items-start gap-2 border-t border-cx-line pt-4 text-[12.5px] text-cx-dim"><Building2 size={14} className="mt-0.5 shrink-0" aria-hidden /><span><span className="font-medium text-cx-ink">{org.name}</span> · {org.industry}. {org.about} <Tag>Fictional company</Tag></span></div>}
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Requirements" description="Your proficiency against the level each requirement asks for (the tick marks the required level).">
          <RequirementList match={match} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Evidence behind the match"><EvidenceSummary match={match} /></Card>
        <Card title="How can I improve my match?" description="Generated from the requirements that are missing, below level or not yet evidenced.">
          <Improvements match={match} perspective="student" />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card title="Why this match?"><Explanation match={match} /></Card>
        <Card title="Limitations"><Limitations match={match} /></Card>
      </div>
    </>
  )
}
