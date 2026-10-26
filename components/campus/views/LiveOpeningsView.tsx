'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, Clock, ExternalLink, Info, MapPin, Search, WifiOff } from 'lucide-react'
import OpportunityTabs from '@/components/campus/OpportunityTabs'
import { ConfidenceTag } from '@/components/campus/MatchBreakdown'
import { EmptyState, PageHeader, ScoreBadge, Tag, Time } from '@/components/campus/ui'
import { ASSUMED_LEVELS, FAMILY_LABEL, HIMALAYAS_HOME, isSeniorTitle, type LiveJob, type RoleFamily } from '@/lib/campus/live-jobs'
import type { LiveState } from '@/lib/campus/live-jobs.server'
import type { MatchResult } from '@/lib/campus/matching'
import { liveMatch, liveSkillName, studentJobMatches } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'

const PAGE = 24

export function applyHref(job: LiveJob) {
  return `/demo/student/opportunities/live/${job.id}/apply`
}

export function applyLabel(job: LiveJob) {
  return `Apply on ${job.source === 'himalayas' ? 'Himalayas' : job.company}`
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

/** Stated skills coloured by how the student meets them; extracted ones dashed and marked as not scored. */
export function SkillChips({ job, match, limit = 3 }: { job: LiveJob; match: MatchResult; limit?: number }) {
  const state = useDemoState()
  return (
    <div className="flex flex-wrap gap-1">
      {match.required.map(r => <Tag key={r.skillId} tone={r.status === 'met' ? 'ok' : r.status === 'partial' ? 'warn' : 'neutral'}>{r.name}</Tag>)}
      {match.preferred.map(r => <Tag key={r.skillId}>{r.name} · preferred</Tag>)}
      {job.extracted.slice(0, limit).map(id => (
        <span key={id} className="cx-chip border-dashed text-cx-dim" style={{ borderColor: 'var(--cx-line-strong)' }} title="Mentioned in the description, not under its requirements. Not scored.">{liveSkillName(state, id)} · extracted</span>
      ))}
      {job.extracted.length > limit && <span className="cx-chip text-cx-dim">+{job.extracted.length - limit} extracted</span>}
    </div>
  )
}

export function SourceLine({ job, seenAt, verb = 'seen' }: { job: LiveJob; seenAt: string; verb?: string }) {
  return (
    <span className="text-[12px] text-cx-dim">
      <a href={job.source === 'himalayas' ? HIMALAYAS_HOME : job.sourceHome} target="_blank" rel="noreferrer noopener" className="font-medium text-cx-ink2 underline-offset-2 hover:underline">{job.sourceLabel}</a>
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
  const partners = data.sources.filter(s => s.key !== 'himalayas' && s.ok)
  const himalayas = data.sources.find(s => s.key === 'himalayas')
  return (
    <div className="cx-card mb-4 flex gap-3 p-4 text-[12.5px] text-cx-ink2">
      <Info size={16} className="mt-0.5 shrink-0 text-cx-info" aria-hidden />
      <div className="space-y-1">
        <p>
          <span className="font-medium text-cx-ink">Remote roles open to candidates in India, sourced from <a href={HIMALAYAS_HOME} target="_blank" rel="noreferrer noopener" className="text-cx-accent-ink underline underline-offset-2">Himalayas</a></span>
          {partners.length > 0 && <>, plus openings from partner employers who agreed to be listed ({partners.map(p => p.label.replace(' (partner)', '')).join(', ')})</>}.
          {' '}Last refreshed <Time iso={data.fetchedAt} relative />. Applications go through the source.
          {himalayas && !himalayas.ok && <span className="text-cx-warn"> Himalayas did not respond on the last refresh.</span>}
        </p>
        <p className="text-cx-dim">
          Only skills a posting lists under its own requirement headings are scored, at assumed levels ({ASSUMED_LEVELS.required} required, {ASSUMED_LEVELS.preferred} preferred). Skills only mentioned elsewhere are shown as “extracted” and not scored. Postings with too few stated skills show “Limited source detail” instead of a score. Each listing is checked again before you open or apply to it. SYRKA is not affiliated with these employers.
        </p>
      </div>
    </div>
  )
}

export default function LiveOpeningsView({ state: live }: { state: LiveState }) {
  const state = useDemoState()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<'all' | RoleFamily>('all')
  const [type, setType] = useState('all')
  const [detail, setDetail] = useState<'all' | 'scored'>('all')
  const [sort, setSort] = useState<'match' | 'newest'>('match')
  const [shown, setShown] = useState(PAGE)

  const header = <>
    <PageHeader eyebrow="Opportunities" title="Live external openings" description="Real roles from external sources, scored against your profile with the same engine as the demo roles." />
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
  const types = [...new Set(jobs.map(j => j.employmentType).filter((t): t is string => !!t))].sort()
  const q = query.trim().toLowerCase()
  const rows = jobs
    .map(job => ({ job, match: liveMatch(state, PRIMARY_STUDENT_ID, job) }))
    .filter(({ job, match }) =>
      (!q || [job.title, job.company, ...[...job.required, ...job.preferred, ...job.extracted].map(id => liveSkillName(state, id))].some(v => v.toLowerCase().includes(q))) &&
      (family === 'all' || job.family === family) &&
      (type === 'all' || job.employmentType === type) &&
      (detail === 'all' || match.status === 'ok'))
    .sort((a, b) => sort === 'newest'
      ? (b.job.postedAt ?? '').localeCompare(a.job.postedAt ?? '')
      : Number(b.match.status === 'ok') - Number(a.match.status === 'ok') || b.match.score - a.match.score)
  const limited = rows.filter(r => r.match.status !== 'ok').length

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
        <select className="cx-select sm:!w-auto" value={type} onChange={e => { setType(e.target.value); setShown(PAGE) }} aria-label="Employment type"><option value="all">Any employment type</option>{types.map(t => <option key={t}>{t}</option>)}</select>
        <select className="cx-select sm:!w-auto" value={detail} onChange={e => { setDetail(e.target.value as typeof detail); setShown(PAGE) }} aria-label="Source detail"><option value="all">Include limited detail</option><option value="scored">Scored listings only</option></select>
        <select className="cx-select sm:!w-auto" value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="Sort"><option value="match">Best aligned</option><option value="newest">Most recent</option></select>
      </div>

      <p className="mb-3 text-[12.5px] text-cx-dim">{rows.length} of {jobs.length} openings{limited ? ` · ${limited} with limited source detail` : ''}</p>
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
                  {match.status === 'ok' ? <ScoreBadge score={match.score} /> : <span className="shrink-0"><Tag>Limited source detail</Tag></span>}
                </div>
                <div className="mt-3"><SkillChips job={job} match={match} /></div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-cx-ink2">
                  <ExperienceTag job={job} />
                  {match.status === 'ok' && <><span>{match.summary.requiredMet}/{match.summary.requiredTotal} stated required met</span><ConfidenceTag match={match} /></>}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <Link href={`/demo/student/opportunities/live/${job.id}`} className="cx-btn cx-btn-primary cx-btn-sm">See match</Link>
                  <a href={applyHref(job)} target="_blank" rel="noreferrer noopener" className="cx-btn cx-btn-sm">{applyLabel(job)} <ExternalLink size={12} aria-hidden /></a>
                  <span className="ml-auto"><SourceLine job={job} seenAt={live.data.fetchedAt} /></span>
                </div>
              </li>
            ))}
          </ul>
          {shown < rows.length && <div className="mt-4 text-center"><button className="cx-btn" onClick={() => setShown(s => s + PAGE)}>Show more ({rows.length - shown} left)</button></div>}
        </>
      ) : (
        <div className="cx-card"><EmptyState icon={<Briefcase size={22} />} title="No openings match these filters" action={<button className="cx-btn" onClick={() => { setQuery(''); setFamily('all'); setType('all'); setDetail('all') }}>Clear filters</button>} /></div>
      )}
    </>
  )
}
