'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Briefcase, MapPin, Search } from 'lucide-react'
import { ConfidenceTag, MatchActions } from '@/components/campus/MatchBreakdown'
import { EmptyState, PageHeader, ScoreBadge, Tag } from '@/components/campus/ui'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import { studentJobMatches } from '@/lib/campus/queries'

export default function OpportunitiesView({ initialQuery = '' }: { initialQuery?: string }) {
  const state = useDemoState()
  const all = studentJobMatches(state, PRIMARY_STUDENT_ID)
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState('all')
  const [arrangement, setArrangement] = useState('all')
  const [minScore, setMinScore] = useState(0)
  const [sort, setSort] = useState<'match' | 'newest'>('match')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all
      .filter(({ job, company, match }) =>
        (!q || [job.title, company.name, job.location, ...match.required.map(r => r.name), ...match.preferred.map(r => r.name)].some(v => v.toLowerCase().includes(q))) &&
        (type === 'all' || job.type === type) &&
        (arrangement === 'all' || job.arrangement === arrangement) &&
        match.score >= minScore)
      .sort((a, b) => (sort === 'match' ? b.match.score - a.match.score : b.job.postedAt.localeCompare(a.job.postedAt)))
  }, [all, query, type, arrangement, minScore, sort])

  return (
    <>
      <PageHeader eyebrow="Opportunities" title="Recommended jobs and internships" description="Every percentage is requirement alignment: how your profile compares with what the job lists. It is not a chance of being hired." />

      <div className="cx-card mb-4 grid grid-cols-2 gap-2 p-3 sm:flex sm:flex-wrap">
        <div className="relative col-span-2 min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-cx-faint" aria-hidden />
          <input className="cx-input !pl-8" placeholder="Search title, company or skill" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search opportunities" />
        </div>
        <select className="cx-select sm:!w-auto" value={type} onChange={e => setType(e.target.value)} aria-label="Type"><option value="all">All types</option><option>Full-time</option><option>Internship</option></select>
        <select className="cx-select sm:!w-auto" value={arrangement} onChange={e => setArrangement(e.target.value)} aria-label="Work arrangement"><option value="all">Any arrangement</option><option>On-site</option><option>Hybrid</option><option>Remote</option></select>
        <select className="cx-select sm:!w-auto" value={minScore} onChange={e => setMinScore(Number(e.target.value))} aria-label="Minimum alignment"><option value={0}>Any alignment</option><option value={50}>50% and above</option><option value={75}>75% and above</option></select>
        <select className="cx-select sm:!w-auto" value={sort} onChange={e => setSort(e.target.value as 'match' | 'newest')} aria-label="Sort"><option value="match">Best aligned</option><option value="newest">Newest</option></select>
      </div>

      <p className="mb-3 text-[12.5px] text-cx-dim">{list.length} of {all.length} open roles</p>
      {list.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map(({ job, company, match }) => (
            <li key={job.id} className="cx-card flex flex-col p-5">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-cx-dim">{company.name}</div>
                  <Link href={`/demo/student/opportunities/${job.id}`} className="mt-0.5 block text-[16px] font-semibold text-cx-ink no-underline hover:underline">{job.title}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-cx-dim">
                    <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{job.location} · {job.arrangement}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase size={12} aria-hidden />{job.type}</span>
                  </div>
                </div>
                <ScoreBadge score={match.score} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {match.required.map(r => <Tag key={r.skillId} tone={r.status === 'met' ? 'ok' : r.status === 'partial' ? 'warn' : 'neutral'}>{r.name}</Tag>)}
                {match.preferred.map(r => <Tag key={r.skillId}>{r.name} · preferred</Tag>)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-cx-ink2">
                <span>{match.summary.requiredMet} of {match.summary.requiredTotal} required met</span>
                {match.summary.requiredPartial > 0 && <span className="text-cx-dim">· {match.summary.requiredPartial} partly</span>}
                <ConfidenceTag match={match} />
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Link href={`/demo/student/opportunities/${job.id}`} className="cx-btn cx-btn-primary cx-btn-sm">View opportunity</Link>
                <MatchActions match={match} perspective="student" size="sm" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="cx-card"><EmptyState icon={<Briefcase size={22} />} title="No roles match these filters" action={<button className="cx-btn" onClick={() => { setQuery(''); setType('all'); setArrangement('all'); setMinScore(0) }}>Clear filters</button>} /></div>
      )}
    </>
  )
}
