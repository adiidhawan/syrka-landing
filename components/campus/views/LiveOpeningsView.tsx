'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, Briefcase, Clock, ExternalLink, EyeOff, Info, MapPin, Search, Undo2, WifiOff } from 'lucide-react'
import OpportunityTabs from '@/components/campus/OpportunityTabs'
import { EmptyState, PageHeader, ScoreBadge, Tag, Time } from '@/components/campus/ui'
import { FAMILY_LABEL, HIMALAYAS_HOME, isSeniorTitle, type LiveJob, type RoleFamily } from '@/lib/campus/live-jobs'
import type { LiveState } from '@/lib/campus/live-jobs.server'
import type { MatchResult } from '@/lib/campus/matching'
import { liveMatch, liveSkillName, studentJobMatches } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { recordApplicationOpened, setOpportunityDismissed, toggleSavedOpportunity, useDemoState } from '@/lib/campus/store'

const PAGE = 24

/** Careers-page jobs link straight to the company's posting; Himalayas jobs go through its closure check first. */
export function applyHref(job: LiveJob) {
  return job.source === 'himalayas' ? `/demo/student/opportunities/live/${job.id}/apply` : job.applyUrl
}

export function applyLabel(job: LiveJob) {
  return `Apply on ${job.source === 'himalayas' ? 'Himalayas' : job.company}`
}

/** One clear Apply button, plus small save and not-interested controls. Each is recorded in the student's activity. */
export function LiveJobActions({ job, large = false }: { job: LiveJob; large?: boolean }) {
  const state = useDemoState()
  const saved = state.savedOpportunities.some(o => o.jobId === job.id)
  const dismissed = state.dismissedOpportunities.some(o => o.jobId === job.id)
  const size = large ? '' : 'cx-btn-sm'
  return (
    <>
      <a href={applyHref(job)} target="_blank" rel="noreferrer noopener" onClick={() => recordApplicationOpened(PRIMARY_STUDENT_ID, job)} className={`cx-btn cx-btn-primary ${size}`}>
        {applyLabel(job)} <ExternalLink size={12} aria-hidden />
      </a>
      <button className={`cx-btn cx-btn-ghost ${size} ${saved ? 'text-cx-accent-ink' : ''}`} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save'} title={saved ? 'Saved' : 'Save'} onClick={() => toggleSavedOpportunity(PRIMARY_STUDENT_ID, job)}>
        {saved ? <BookmarkCheck size={14} aria-hidden /> : <Bookmark size={14} aria-hidden />}{large && (saved ? 'Saved' : 'Save')}
      </button>
      <button className={`cx-btn cx-btn-ghost ${size}`} aria-label={dismissed ? 'Restore' : 'Not interested'} title={dismissed ? 'Restore' : 'Not interested'} onClick={() => setOpportunityDismissed(PRIMARY_STUDENT_ID, job, !dismissed)}>
        {dismissed ? <Undo2 size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}{large && (dismissed ? 'Restore' : 'Not interested')}
      </button>
    </>
  )
}

/** Experience as the source states it: Himalayas' own seniority first, then years read from the text. */
export function ExperienceTag({ job }: { job: LiveJob }) {
  if (job.employmentType === 'Intern' || /\bintern(ship)?\b/i.test(job.title)) return <Tag tone="ok"><Clock size={11} aria-hidden />Internship</Tag>
  if (job.seniority.includes('Entry-level')) return <Tag tone="ok"><Clock size={11} aria-hidden />Entry level</Tag>
  if (job.minYears !== null && job.minYears <= 2) return <Tag tone="ok"><Clock size={11} aria-hidden />{job.minYears === 0 ? 'Entry level' : `${job.minYears}+ years`}</Tag>
  if (job.minYears !== null) return <Tag tone="warn"><Clock size={11} aria-hidden />Asks for {job.minYears}+ years</Tag>
  if (isSeniorTitle(job.title)) return <Tag tone="warn"><Clock size={11} aria-hidden />Senior role</Tag>
  return <Tag><Clock size={11} aria-hidden />Experience not stated</Tag>
}

/** The posting's skills, coloured by how the student meets them. */
export function SkillChips({ match, limit = 6 }: { match: MatchResult; limit?: number }) {
  const all = [...match.required, ...match.preferred]
  return (
    <div className="flex flex-wrap gap-1">
      {all.slice(0, limit).map(r => <Tag key={r.skillId} tone={r.status === 'met' ? 'ok' : r.status === 'partial' ? 'warn' : 'neutral'}>{r.name}{r.kind === 'preferred' ? ' · nice to have' : ''}</Tag>)}
      {all.length > limit && <span className="cx-chip text-cx-dim">+{all.length - limit} more</span>}
    </div>
  )
}

export function SourceLine({ job, seenAt, verb = 'seen' }: { job: LiveJob; seenAt: string; verb?: string }) {
  return (
    <span className="text-[12px] text-cx-dim">
      <a href={job.source === 'himalayas' ? HIMALAYAS_HOME : job.applyUrl} target="_blank" rel="noreferrer noopener" className="font-medium text-cx-ink2 underline-offset-2 hover:underline">{job.sourceLabel}</a>
      {' · '}{verb} <Time iso={seenAt} relative />
    </span>
  )
}

/** Shown instead of live openings when they are switched off, unreachable or too old to trust. */
function DemoFallback({ title, body }: { title: string; body: React.ReactNode }) {
  const state = useDemoState()
  const demo = studentJobMatches(state, PRIMARY_STUDENT_ID).slice(0, 6)
  return (
    <>
      <div className="cx-card mb-4 flex gap-3 p-4 text-[13px]">
        <WifiOff size={16} className="mt-0.5 shrink-0 text-cx-dim" aria-hidden />
        <div><div className="font-medium text-cx-ink">{title}</div><p className="mt-0.5 text-cx-ink2">{body}</p></div>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {demo.map(({ job, company, match }) => (
          <li key={job.id} className="cx-card flex items-start gap-4 p-5">
            <div className="min-w-0 flex-1">
              <Tag tone="warn">Example opportunity — not a current opening</Tag>
              <div className="mt-2 text-[12.5px] text-cx-dim">{company.name} (fictional)</div>
              <Link href={`/demo/student/opportunities/${job.id}`} className="block text-[15px] font-semibold text-cx-ink no-underline hover:underline">{job.title}</Link>
            </div>
            <ScoreBadge score={match.score} />
          </li>
        ))}
      </ul>
    </>
  )
}

function Credit({ state }: { state: Extract<LiveState, { status: 'live' }> }) {
  const { data } = state
  const companies = data.sources.filter(s => s.key !== 'himalayas' && s.ok)
  const himalayas = data.sources.find(s => s.key === 'himalayas' && s.ok)
  return (
    <div className="cx-card mb-4 flex gap-3 p-4 text-[12.5px] text-cx-ink2">
      <Info size={16} className="mt-0.5 shrink-0 text-cx-info" aria-hidden />
      <p>
        <span className="font-medium text-cx-ink">Real openings in India from the careers pages of {companies.length} companies</span>
        {himalayas && <>, plus remote roles from <a href={HIMALAYAS_HOME} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">Himalayas</a></>}.
        {' '}Apply directly on the company’s site. Last refreshed <Time iso={data.fetchedAt} relative />. Skills are read from each posting by keyword, so treat the match as a guide.
      </p>
    </div>
  )
}

export default function LiveOpeningsView({ state: live }: { state: LiveState }) {
  const state = useDemoState()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<'all' | RoleFamily>('all')
  const [company, setCompany] = useState('all')
  const [experience, setExperience] = useState<'any' | 'junior'>('any')
  const [show, setShow] = useState<'active' | 'saved' | 'dismissed'>('active')
  const [sort, setSort] = useState<'graduate' | 'match' | 'newest'>('graduate')
  const [shown, setShown] = useState(PAGE)

  const header = <>
    <PageHeader eyebrow="Opportunities" title="Real job openings" description="Current roles at real companies, matched against your profile. Apply directly on the company’s own site." />
    <OpportunityTabs />
  </>

  if (live.status !== 'live') {
    const copy = live.status === 'disabled'
      ? { title: 'Live openings are switched off here', body: 'This environment shows illustrative roles only. None of them is a current opening.' }
      : live.status === 'stale'
        ? { title: 'Live openings are out of date', body: <>The last successful refresh was <Time iso={live.fetchedAt} relative />, older than the {live.maxAgeHours}-hour limit, so those listings are hidden. Here are illustrative roles instead; none of them is a current opening.</> }
        : { title: 'Live openings are unavailable right now', body: 'The job sources could not be reached. Here are illustrative roles instead; none of them is a current opening.' }
    return <>{header}<DemoFallback {...copy} /></>
  }

  const jobs = live.data.jobs
  const families = [...new Set(jobs.map(j => j.family))].sort((a, b) => FAMILY_LABEL[a].localeCompare(FAMILY_LABEL[b]))
  const companies = [...new Set(jobs.map(j => j.company))].sort()
  const isJunior = (j: LiveJob) => j.employmentType === 'Intern' || j.seniority.includes('Entry-level') || (j.minYears === null ? !isSeniorTitle(j.title) : j.minYears <= 2)
  const q = query.trim().toLowerCase()
  const savedIds = new Set(state.savedOpportunities.map(o => o.jobId))
  const dismissedIds = new Set(state.dismissedOpportunities.map(o => o.jobId))
  const rows = jobs
    .map(job => ({ job, match: liveMatch(state, PRIMARY_STUDENT_ID, job) }))
    .filter(({ job }) =>
      (!q || [job.title, job.company, ...[...job.required, ...job.preferred, ...job.extracted].map(id => liveSkillName(state, id))].some(v => v.toLowerCase().includes(q))) &&
      (family === 'all' || job.family === family) &&
      (company === 'all' || job.company === company) &&
      (experience === 'any' || isJunior(job)) &&
      (show === 'saved' ? savedIds.has(job.id) : show === 'dismissed' ? dismissedIds.has(job.id) : !dismissedIds.has(job.id)))
    .sort((a, b) => sort === 'newest'
      ? (b.job.postedAt ?? '').localeCompare(a.job.postedAt ?? '')
      : (sort === 'graduate' ? Number(isJunior(b.job)) - Number(isJunior(a.job)) : 0) || Number(b.match.status === 'ok') - Number(a.match.status === 'ok') || b.match.score - a.match.score)

  return (
    <>
      {header}
      <Credit state={live} />

      <div className="cx-card mb-4 grid grid-cols-2 gap-2 p-3 sm:flex sm:flex-wrap">
        <div className="relative col-span-2 min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-cx-faint" aria-hidden />
          <input className="cx-input !pl-8" placeholder="Search title, company or skill" value={query} onChange={e => { setQuery(e.target.value); setShown(PAGE) }} aria-label="Search live openings" />
        </div>
        <select className="cx-select sm:!w-auto" value={family} onChange={e => { setFamily(e.target.value as typeof family); setShown(PAGE) }} aria-label="Role type"><option value="all">All role types</option>{families.map(f => <option key={f} value={f}>{FAMILY_LABEL[f]}</option>)}</select>
        <select className="cx-select sm:!w-auto" value={company} onChange={e => { setCompany(e.target.value); setShown(PAGE) }} aria-label="Company"><option value="all">All companies</option>{companies.map(c => <option key={c}>{c}</option>)}</select>
        <select className="cx-select sm:!w-auto" value={experience} onChange={e => { setExperience(e.target.value as typeof experience); setShown(PAGE) }} aria-label="Experience"><option value="any">Any experience</option><option value="junior">Graduate-friendly (0–2 years)</option></select>
        <select className="cx-select sm:!w-auto" value={show} onChange={e => { setShow(e.target.value as typeof show); setShown(PAGE) }} aria-label="Show">
          <option value="active">Active openings</option>
          <option value="saved">Saved ({jobs.filter(j => savedIds.has(j.id)).length})</option>
          <option value="dismissed">Not interested ({jobs.filter(j => dismissedIds.has(j.id)).length})</option>
        </select>
        <select className="cx-select sm:!w-auto" value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="Sort"><option value="graduate">Graduate-friendly first</option><option value="match">Best skill match</option><option value="newest">Most recent</option></select>
      </div>

      <p className="mb-3 text-[12.5px] text-cx-dim">{rows.length} of {jobs.length} openings · {jobs.filter(isJunior).length} graduate-friendly</p>
      {rows.length ? (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {rows.slice(0, shown).map(({ job, match }) => (
              <li key={job.id} className="cx-card flex flex-col p-5">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] text-cx-dim">{job.company}</div>
                    <Link href={`/demo/student/opportunities/live/${job.id}`} className="mt-0.5 block text-[15px] font-semibold text-cx-ink no-underline hover:underline">{job.title}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-cx-dim">
                      <span className="inline-flex min-w-0 items-center gap-1"><MapPin size={12} className="shrink-0" aria-hidden /><span className="truncate">{job.location}</span></span>
                      <span className="inline-flex items-center gap-1"><Briefcase size={12} aria-hidden />{FAMILY_LABEL[job.family]}{job.employmentType ? ` · ${job.employmentType}` : ''}</span>
                    </div>
                  </div>
                  {match.status === 'ok' && <ScoreBadge score={match.score} />}
                </div>
                <div className="mt-3"><SkillChips match={match} /></div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-cx-ink2">
                  <ExperienceTag job={job} />
                  <span>You match {match.summary.requiredMet + match.summary.preferredMet} of {match.summary.requiredTotal + match.summary.preferredTotal} skills</span>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                  <LiveJobActions job={job} />
                  <Link href={`/demo/student/opportunities/live/${job.id}`} className="cx-btn cx-btn-ghost cx-btn-sm">See match</Link>
                  <span className="ml-auto"><SourceLine job={job} seenAt={live.data.fetchedAt} /></span>
                </div>
              </li>
            ))}
          </ul>
          {shown < rows.length && <div className="mt-4 text-center"><button className="cx-btn" onClick={() => setShown(s => s + PAGE)}>Show more ({rows.length - shown} left)</button></div>}
        </>
      ) : (
        <div className="cx-card"><EmptyState icon={<Briefcase size={22} />} title="No openings match these filters" action={<button className="cx-btn" onClick={() => { setQuery(''); setFamily('all'); setCompany('all'); setExperience('any'); setShow('active') }}>Clear filters</button>} /></div>
      )}
    </>
  )
}
