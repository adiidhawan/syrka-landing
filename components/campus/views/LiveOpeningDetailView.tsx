'use client'

import Link from 'next/link'
import { ArrowLeft, Briefcase, ExternalLink, MapPin, TriangleAlert } from 'lucide-react'
import { EvidenceSummary, Explanation, Improvements, Limitations, MatchActions, RequirementList, ScoreComponents } from '@/components/campus/MatchBreakdown'
import { Card, PageHeader, Time } from '@/components/campus/ui'
import { FAMILY_LABEL, INFERRED_LEVELS, isSeniorTitle, type LiveJob, type LiveJobsResult } from '@/lib/campus/live-jobs'
import { liveMatch } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import { ExperienceTag } from './LiveOpeningsView'

export default function LiveOpeningDetailView({ job, data }: { job: LiveJob; data: Pick<LiveJobsResult, 'fetchedAt' | 'origin'> }) {
  const state = useDemoState()
  const match = liveMatch(state, PRIMARY_STUDENT_ID, job)
  return (
    <>
      <Link href="/demo/student/opportunities/live" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-cx-dim no-underline hover:text-cx-ink"><ArrowLeft size={14} aria-hidden />All live openings</Link>
      <PageHeader
        eyebrow={`${job.company} · live opening`}
        title={job.title}
        description={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden />{job.location}</span><span className="inline-flex items-center gap-1"><Briefcase size={13} aria-hidden />{FAMILY_LABEL[job.family]}</span>{job.postedAt && <span>Posted <Time iso={job.postedAt} /></span>}</span>}
        actions={<>
          <a href={job.url} target="_blank" rel="noreferrer noopener" className="cx-btn cx-btn-primary">View and apply on {job.company} <ExternalLink size={13} aria-hidden /></a>
          <MatchActions match={match} perspective="student" />
        </>}
      />

      {((job.minYears !== null && job.minYears >= 3) || (job.minYears === null && isSeniorTitle(job.title))) && (
        <div className="mb-4 flex gap-2.5 rounded-[10px] bg-cx-warn-soft px-4 py-3 text-[13px] text-cx-warn">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{job.minYears !== null ? `This posting asks for ${job.minYears}+ years of experience.` : 'This is a senior role by its title.'} The alignment score covers skills only, so read it as a skills comparison rather than a sign the role is open to graduates.</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card title="Your requirement alignment" description="Against skills inferred from the posting.">
          <ScoreComponents match={match} />
        </Card>
        <Card title="About this data">
          <div className="space-y-3 text-[13px] text-cx-ink2">
            <div className="flex flex-wrap items-center gap-2"><ExperienceTag years={job.minYears} title={job.title} /></div>
            <p>Read from {job.company}’s public job board{data.origin === 'snapshot' ? <> (saved snapshot from <Time iso={data.fetchedAt} />)</> : <>, refreshed <Time iso={data.fetchedAt} relative /></>}. The full description, salary and application are on the company’s site.</p>
            <p>Skills were found by keyword matching on the posting text. Skills listed under “nice to have” or “preferred” headings count as preferred; the rest as required.</p>
            <p>The posting does not state proficiency levels, so required skills are assumed at {INFERRED_LEVELS.required} and preferred at {INFERRED_LEVELS.preferred}.</p>
            <p className="text-[12px] text-cx-dim">SYRKA is not affiliated with {job.company}. Check the original posting before applying.</p>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Inferred requirements" description="Your proficiency against the assumed level (the tick marks it).">
          <RequirementList match={match} />
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Evidence behind the match"><EvidenceSummary match={match} /></Card>
        <Card title="How can I improve my match?" description="Generated from the inferred requirements that are missing, below level or not yet evidenced.">
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
