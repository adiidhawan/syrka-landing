'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, Clock, ExternalLink, Info, MapPin, Search } from 'lucide-react'
import OpportunityTabs from '@/components/campus/OpportunityTabs'
import { ConfidenceTag } from '@/components/campus/MatchBreakdown'
import { EmptyState, PageHeader, ScoreBadge, Tag, Time } from '@/components/campus/ui'
import { FAMILY_LABEL, INFERRED_LEVELS, isSeniorTitle, type LiveJob, type LiveJobsResult, type RoleFamily } from '@/lib/campus/live-jobs'
import { liveMatch } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'

const PAGE = 24

export function ExperienceTag({ years, title }: { years: number | null; title: string }) {
  if (years === null && isSeniorTitle(title)) return <Tag tone="warn"><Clock size={11} aria-hidden />Senior role</Tag>
  if (years === null) return <Tag><Clock size={11} aria-hidden />Experience not stated</Tag>
  if (years <= 2) return <Tag tone="ok"><Clock size={11} aria-hidden />{years === 0 ? 'Entry level' : `${years}+ years`}</Tag>
  return <Tag tone="warn"><Clock size={11} aria-hidden />Asks for {years}+ years</Tag>
}

export function LiveSourceNote({ data }: { data: LiveJobsResult }) {
  const ok = data.boards.filter(b => b.ok).length
  return (
    <div className="cx-card mb-4 flex gap-3 p-4 text-[12.5px] text-cx-ink2">
      <Info size={16} className="mt-0.5 shrink-0 text-cx-info" aria-hidden />
      <div className="space-y-1">
        <p>
          <span className="font-medium text-cx-ink">Real openings in India</span>, read from the public job boards of {ok} companies
          {data.origin === 'snapshot'
            ? <> — the feeds could not be reached, so this is a <span className="font-medium">saved snapshot from <Time iso={data.fetchedAt} /></span>.</>
            : <>, last refreshed <Time iso={data.fetchedAt} relative />.</>}
          {' '}Applications happen on each company’s own site.
        </p>
        <p className="text-cx-dim">
          Skills are inferred from the posting text by keyword matching, and postings rarely state levels, so required skills are assumed at {INFERRED_LEVELS.required} and preferred at {INFERRED_LEVELS.preferred}. Experience is shown but not scored. SYRKA is not affiliated with these companies.
        </p>
      </div>
    </div>
  )
}

export default function LiveOpeningsView({ data }: { data: LiveJobsResult }) {
  const state = useDemoState()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<'all' | RoleFamily>('all')
  const [company, setCompany] = useState('all')
  const [experience, setExperience] = useState<'any' | 'junior' | 'stated'>('any')
  const [sort, setSort] = useState<'match' | 'newest'>('match')
  const [shown, setShown] = useState(PAGE)

  const families = [...new Set(data.jobs.map(j => j.family))].sort((a, b) => FAMILY_LABEL[a].localeCompare(FAMILY_LABEL[b]))
  const companies = [...new Set(data.jobs.map(j => j.company))].sort()
  const q = query.trim().toLowerCase()
  const rows = data.jobs
    .map(job => ({ job, match: liveMatch(state, PRIMARY_STUDENT_ID, job) }))
    .filter(({ job, match }) =>
      (!q || [job.title, job.company, job.location, ...match.required.map(r => r.name), ...match.preferred.map(r => r.name)].some(v => v.toLowerCase().includes(q))) &&
      (family === 'all' || job.family === family) &&
      (company === 'all' || job.company === company) &&
      (experience === 'any' || (experience === 'junior' ? (job.minYears === null ? !isSeniorTitle(job.title) : job.minYears <= 2) : job.minYears !== null && job.minYears <= 2)))
    .sort((a, b) => sort === 'match' ? b.match.score - a.match.score : (b.job.postedAt ?? '').localeCompare(a.job.postedAt ?? ''))
  const junior = data.jobs.filter((j: LiveJob) => j.minYears !== null && j.minYears <= 2).length

  return (
    <>
      <PageHeader eyebrow="Opportunities" title="Live openings" description="Real roles open now, scored against your profile with the same engine as the demo roles." />
      <OpportunityTabs />
      <LiveSourceNote data={data} />

      <div className="cx-card mb-4 grid grid-cols-2 gap-2 p-3 sm:flex sm:flex-wrap">
        <div className="relative col-span-2 min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-cx-faint" aria-hidden />
          <input className="cx-input !pl-8" placeholder="Search title, company or skill" value={query} onChange={e => { setQuery(e.target.value); setShown(PAGE) }} aria-label="Search live openings" />
        </div>
        <select className="cx-select sm:!w-auto" value={family} onChange={e => { setFamily(e.target.value as typeof family); setShown(PAGE) }} aria-label="Role family"><option value="all">All role types</option>{families.map(f => <option key={f} value={f}>{FAMILY_LABEL[f]}</option>)}</select>
        <select className="cx-select sm:!w-auto" value={company} onChange={e => { setCompany(e.target.value); setShown(PAGE) }} aria-label="Company"><option value="all">All companies</option>{companies.map(c => <option key={c}>{c}</option>)}</select>
        <select className="cx-select sm:!w-auto" value={experience} onChange={e => { setExperience(e.target.value as typeof experience); setShown(PAGE) }} aria-label="Experience">
          <option value="any">Any experience</option>
          <option value="junior">Up to 2 years, or not stated and not senior</option>
          <option value="stated">States 0–2 years</option>
        </select>
        <select className="cx-select sm:!w-auto" value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="Sort"><option value="match">Best aligned</option><option value="newest">Most recent</option></select>
      </div>

      <p className="mb-3 text-[12.5px] text-cx-dim">{rows.length} of {data.jobs.length} openings · {junior} state 2 years of experience or less</p>
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
                      <span className="inline-flex items-center gap-1"><Briefcase size={12} aria-hidden />{FAMILY_LABEL[job.family]}</span>
                    </div>
                  </div>
                  <ScoreBadge score={match.score} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {match.required.map(r => <Tag key={r.skillId} tone={r.status === 'met' ? 'ok' : r.status === 'partial' ? 'warn' : 'neutral'}>{r.name}</Tag>)}
                  {match.preferred.slice(0, 3).map(r => <Tag key={r.skillId}>{r.name} · preferred</Tag>)}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-cx-ink2">
                  <ExperienceTag years={job.minYears} title={job.title} />
                  <span>{match.summary.requiredMet}/{match.summary.requiredTotal} inferred required met</span>
                  <ConfidenceTag match={match} />
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link href={`/demo/student/opportunities/live/${job.id}`} className="cx-btn cx-btn-primary cx-btn-sm">See match</Link>
                  <a href={job.url} target="_blank" rel="noreferrer noopener" className="cx-btn cx-btn-sm">View on {job.company} <ExternalLink size={12} aria-hidden /></a>
                </div>
              </li>
            ))}
          </ul>
          {shown < rows.length && <div className="mt-4 text-center"><button className="cx-btn" onClick={() => setShown(s => s + PAGE)}>Show more ({rows.length - shown} left)</button></div>}
        </>
      ) : (
        <div className="cx-card"><EmptyState icon={<Briefcase size={22} />} title="No openings match these filters" action={<button className="cx-btn" onClick={() => { setQuery(''); setFamily('all'); setCompany('all'); setExperience('any') }}>Clear filters</button>} /></div>
      )}
    </>
  )
}
