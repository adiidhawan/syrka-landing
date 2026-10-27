'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Briefcase, MapPin, TriangleAlert } from 'lucide-react'
import { EvidenceSummary, Explanation, Improvements, Limitations, MatchActions, RequirementList, ScoreComponents } from '@/components/campus/MatchBreakdown'
import { Card, PageHeader, Time } from '@/components/campus/ui'
import { ASSUMED_LEVELS, FAMILY_LABEL, HIMALAYAS_HOME, isSeniorTitle, type LiveJob } from '@/lib/campus/live-jobs'
import { liveMatch } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { recordLiveView, useDemoState, useHydrated } from '@/lib/campus/store'
import { ExperienceTag, LiveJobActions, SourceLine } from './LiveOpeningsView'

export default function LiveOpeningDetailView({ job, verifiedAt, verified }: { job: LiveJob; verifiedAt: string; verified: boolean }) {
  const state = useDemoState()
  const match = liveMatch(state, PRIMARY_STUDENT_ID, job)
  const hydrated = useHydrated()
  useEffect(() => { if (hydrated) recordLiveView(PRIMARY_STUDENT_ID, job) }, [hydrated, job])
  const senior = (job.minYears !== null && job.minYears >= 3) || (job.minYears === null && isSeniorTitle(job.title) && !job.seniority.includes('Entry-level'))
  return (
    <>
      <Link href="/demo/student/opportunities/live" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-cx-dim no-underline hover:text-cx-ink"><ArrowLeft size={14} aria-hidden />All live openings</Link>
      <PageHeader
        eyebrow={`${job.company} · real opening`}
        title={job.title}
        description={<span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden />{job.location}</span>
          <span className="inline-flex items-center gap-1"><Briefcase size={13} aria-hidden />{FAMILY_LABEL[job.family]}{job.employmentType ? ` · ${job.employmentType}` : ''}</span>
          {job.postedAt && <span>Posted <Time iso={job.postedAt} /></span>}
          {job.expiresAt && <span>Closes by <Time iso={job.expiresAt} /></span>}
        </span>}
        actions={<>
          <LiveJobActions job={job} large />
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
        <Card title="How well you match" description="Against the skills this posting mentions.">
          <ScoreComponents match={match} />
        </Card>
        <Card title="About this data">
          <div className="space-y-3 text-[13px] text-cx-ink2">
            <div className="flex flex-wrap items-center gap-2"><ExperienceTag job={job} /></div>
            <p>
              {job.source === 'himalayas'
                ? <>Listed on <a href={HIMALAYAS_HOME} target="_blank" rel="noreferrer noopener" className="text-cx-accent-ink underline underline-offset-2">Himalayas</a>. The full description, pay and application are there.</>
                : <>From {job.company}’s own careers page. The full description, pay and application are there.</>}
            </p>
            <p>Skills are read from the posting by keyword. Postings rarely state skill levels, so a level of {ASSUMED_LEVELS.required} is assumed ({ASSUMED_LEVELS.preferred} for nice-to-have skills). Treat the match as a guide.</p>
            <p className="text-[12px] text-cx-dim">SYRKA is not affiliated with {job.company}. Your profile is never sent to the source; matching happens inside SYRKA.</p>
          </div>
        </Card>
      </div>

      {match.status === 'ok' ? (
        <>
          <div className="mt-4"><Card title="Skills this role asks for" description="Your level against the assumed level (the tick marks it)."><RequirementList match={match} /></Card></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Evidence behind the match"><EvidenceSummary match={match} /></Card>
            <Card title="How can I improve my match?" description="From the skills that are missing, below level or not yet evidenced."><Improvements match={match} perspective="student" /></Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card title="Why this match?"><Explanation match={match} /></Card>
            <Card title="Limitations"><Limitations match={match} /></Card>
          </div>
        </>
      ) : match.required.length + match.preferred.length > 0 && (
        <div className="mt-4"><Card title="Skills this role asks for" description="Too few to calculate a match."><RequirementList match={match} /></Card></div>
      )}
    </>
  )
}
