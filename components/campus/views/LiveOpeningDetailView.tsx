'use client'

import Link from 'next/link'
import { ArrowLeft, Briefcase, ExternalLink, MapPin, TriangleAlert } from 'lucide-react'
import { EvidenceSummary, Explanation, Improvements, Limitations, MatchActions, RequirementList, ScoreComponents } from '@/components/campus/MatchBreakdown'
import { Card, PageHeader, Time } from '@/components/campus/ui'
import { ASSUMED_LEVELS, FAMILY_LABEL, HIMALAYAS_HOME, isSeniorTitle, type LiveJob } from '@/lib/campus/live-jobs'
import { liveMatch, liveSkillName } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import { applyHref, applyLabel, ExperienceTag, SourceLine } from './LiveOpeningsView'

export default function LiveOpeningDetailView({ job, verifiedAt, verified }: { job: LiveJob; verifiedAt: string; verified: boolean }) {
  const state = useDemoState()
  const match = liveMatch(state, PRIMARY_STUDENT_ID, job)
  const senior = (job.minYears !== null && job.minYears >= 3) || (job.minYears === null && isSeniorTitle(job.title) && !job.seniority.includes('Entry-level'))
  return (
    <>
      <Link href="/demo/student/opportunities/live" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-cx-dim no-underline hover:text-cx-ink"><ArrowLeft size={14} aria-hidden />All live openings</Link>
      <PageHeader
        eyebrow={`${job.company} · live external opening`}
        title={job.title}
        description={<span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden />{job.location}</span>
          <span className="inline-flex items-center gap-1"><Briefcase size={13} aria-hidden />{FAMILY_LABEL[job.family]}{job.employmentType ? ` · ${job.employmentType}` : ''}</span>
          {job.postedAt && <span>Posted <Time iso={job.postedAt} /></span>}
          {job.expiresAt && <span>Closes by <Time iso={job.expiresAt} /></span>}
        </span>}
        actions={<>
          <a href={applyHref(job)} target="_blank" rel="noreferrer noopener" className="cx-btn cx-btn-primary">{applyLabel(job)} <ExternalLink size={13} aria-hidden /></a>
          {match.status === 'ok' && <MatchActions match={match} perspective="student" />}
        </>}
      />
      <div className="-mt-3 mb-5"><SourceLine job={job} seenAt={verifiedAt} verb={verified ? 'verified open' : 'last seen'} />{!verified && <span className="text-[12px] text-cx-warn"> · could not re-check just now</span>}</div>

      {senior && (
        <div className="mb-4 flex gap-2.5 rounded-[10px] bg-cx-warn-soft px-4 py-3 text-[13px] text-cx-warn">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{job.minYears !== null ? `This posting asks for ${job.minYears}+ years of experience.` : 'This is a senior role by its title.'} The alignment score covers skills only.</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card title="Your requirement alignment" description="Against the skills this posting lists under its own requirement headings.">
          <ScoreComponents match={match} />
        </Card>
        <Card title="About this data">
          <div className="space-y-3 text-[13px] text-cx-ink2">
            <div className="flex flex-wrap items-center gap-2"><ExperienceTag job={job} /></div>
            <p>
              {job.source === 'himalayas'
                ? <>Listed on <a href={HIMALAYAS_HOME} target="_blank" rel="noreferrer noopener" className="text-cx-accent-ink underline underline-offset-2">Himalayas</a>. The full description, pay and application are there.</>
                : <>From {job.company}’s own careers page, shared with SYRKA as a partner employer.</>}
            </p>
            <p>Skills are mapped to the SYRKA catalogue by keyword. Only those listed under the posting’s requirement or nice-to-have headings are scored, at an assumed {ASSUMED_LEVELS.required} (required) or {ASSUMED_LEVELS.preferred} (preferred), because postings rarely state levels.</p>
            {job.extracted.length > 0 && (
              <div>
                <div className="mb-1 text-[12px] font-medium text-cx-ink">Also mentioned in the description (not scored)</div>
                <div className="flex flex-wrap gap-1">{job.extracted.map(id => <span key={id} className="cx-chip border-dashed text-cx-dim" style={{ borderColor: 'var(--cx-line-strong)' }}>{liveSkillName(state, id)}</span>)}</div>
              </div>
            )}
            <p className="text-[12px] text-cx-dim">SYRKA is not affiliated with {job.company}. Your profile is never sent to the source; matching happens inside SYRKA.</p>
          </div>
        </Card>
      </div>

      {match.status === 'ok' ? (
        <>
          <div className="mt-4"><Card title="Stated requirements" description="Your proficiency against the assumed level (the tick marks it)."><RequirementList match={match} /></Card></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Evidence behind the match"><EvidenceSummary match={match} /></Card>
            <Card title="How can I improve my match?" description="Generated from the stated requirements that are missing, below level or not yet evidenced."><Improvements match={match} perspective="student" /></Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card title="Why this match?"><Explanation match={match} /></Card>
            <Card title="Limitations"><Limitations match={match} /></Card>
          </div>
        </>
      ) : match.required.length + match.preferred.length > 0 && (
        <div className="mt-4"><Card title="Stated requirements" description="Listed for reference; too few to score."><RequirementList match={match} /></Card></div>
      )}
    </>
  )
}
