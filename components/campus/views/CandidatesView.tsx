'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, FolderKanban, Lock, Search, Users } from 'lucide-react'
import CandidateActions from '@/components/campus/CandidateActions'
import JobSelect, { useSelectedJob } from '@/components/campus/JobSelect'
import { ConfidenceTag } from '@/components/campus/MatchBreakdown'
import { Avatar, EmptyState, PageHeader, ScoreBadge, Tag } from '@/components/campus/ui'
import { employerCandidates, employerMatch, job as getJob } from '@/lib/campus/queries'
import { useDemoState } from '@/lib/campus/store'

type Sort = 'match' | 'relevance' | 'experience'

export default function CandidatesView({ initialJob, initialQuery = '' }: { initialJob?: string; initialQuery?: string }) {
  const state = useDemoState()
  const [jobId, setJobId] = useSelectedJob(initialJob)
  const job = getJob(state, jobId)
  const [query, setQuery] = useState(initialQuery)
  const [skill, setSkill] = useState('all')
  const [minLevel, setMinLevel] = useState(0)
  const [uni, setUni] = useState('all')
  const [year, setYear] = useState('all')
  const [evidence, setEvidence] = useState<'all' | 'verified' | 'reviewed_project'>('all')
  const [role, setRole] = useState('all')
  const [sharing, setSharing] = useState<'all' | 'projects' | 'assessments'>('all')
  const [sort, setSort] = useState<Sort>('match')

  // Only discoverable candidates ever reach this page: employerCandidates() applies the visibility rules.
  const candidates = employerCandidates(state)
  const privateCount = state.students.length - candidates.length
  const roles = [...new Set(candidates.map(c => c.preferredRole))].sort()
  const years = [...new Set(candidates.map(c => c.graduationYear))].sort()
  const skillOptions = [...new Map(candidates.flatMap(c => c.skills.map(s => [s.skillId, s.skill.name] as const))).entries()].sort((a, b) => a[1].localeCompare(b[1]))

  const q = query.trim().toLowerCase()
  const rows = candidates
    .map(c => {
      const match = employerMatch(state, c, jobId)
      const reqs = [...match.required, ...match.preferred].filter(r => r.proficiency !== null)
      const relevance = match.required.length ? match.required.reduce((t, r) => t + (r.proficiency ?? 0), 0) / match.required.length : 0
      const experience = (c.projects ?? []).reduce((t, p) => t + (p.verificationStatus === 'verified' ? 2 : 1), 0)
      return { c, match, reqs, relevance, experience }
    })
    .filter(({ c, match }) => {
      if (q && !(c.name.toLowerCase().includes(q) || c.skills.some(s => s.skill.name.toLowerCase().includes(q)))) return false
      if (skill !== 'all') {
        const s = c.skills.find(k => k.skillId === skill)
        if (!s || s.proficiency < minLevel) return false
      } else if (minLevel > 0 && !match.required.every(r => (r.proficiency ?? 0) >= minLevel)) return false
      if (uni !== 'all' && c.university?.id !== uni) return false
      if (year !== 'all' && String(c.graduationYear) !== year) return false
      if (role !== 'all' && c.preferredRole !== role) return false
      if (evidence === 'verified' && !c.skills.some(s => s.verificationStatus === 'verified')) return false
      if (evidence === 'reviewed_project' && !(c.projects ?? []).some(p => p.verificationStatus === 'verified')) return false
      if (sharing === 'projects' && !c.sections.projects) return false
      if (sharing === 'assessments' && !c.sections.assessments) return false
      return true
    })
    .sort((a, b) => sort === 'match' ? b.match.score - a.match.score : sort === 'relevance' ? b.relevance - a.relevance : b.experience - a.experience || b.match.score - a.match.score)

  const clear = () => { setQuery(''); setSkill('all'); setMinLevel(0); setUni('all'); setYear('all'); setEvidence('all'); setRole('all'); setSharing('all') }

  return (
    <>
      <PageHeader
        eyebrow="Candidate discovery"
        title="Candidates"
        description="Ranked by requirement alignment with the selected job, using only the skills and evidence each candidate shares."
        actions={<JobSelect value={jobId} onChange={setJobId} />}
      />

      <div className="cx-card mb-4 p-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <div className="relative col-span-2 min-w-[200px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-cx-faint" aria-hidden />
            <input className="cx-input !pl-8" placeholder="Search by name or skill" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search candidates by name or skill" />
          </div>
          <select className="cx-select sm:!w-auto" value={skill} onChange={e => setSkill(e.target.value)} aria-label="Skill"><option value="all">Any skill</option>{skillOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          <select className="cx-select sm:!w-auto" value={minLevel} onChange={e => setMinLevel(Number(e.target.value))} aria-label="Minimum proficiency">
            <option value={0}>Any proficiency</option>
            {[60, 70, 80].map(v => <option key={v} value={v}>{skill === 'all' ? `All required ≥ ${v}` : `≥ ${v}`}</option>)}
          </select>
          <select className="cx-select sm:!w-auto" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort"><option value="match">Sort: alignment</option><option value="relevance">Sort: skill relevance</option><option value="experience">Sort: project experience</option></select>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <select className="cx-select sm:!w-auto" value={uni} onChange={e => setUni(e.target.value)} aria-label="University"><option value="all">Any university</option>{state.universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <select className="cx-select sm:!w-auto" value={year} onChange={e => setYear(e.target.value)} aria-label="Graduation year"><option value="all">Any graduation year</option>{years.map(y => <option key={y}>{y}</option>)}</select>
          <select className="cx-select sm:!w-auto" value={role} onChange={e => setRole(e.target.value)} aria-label="Preferred role"><option value="all">Any preferred role</option>{roles.map(r => <option key={r}>{r}</option>)}</select>
          <select className="cx-select sm:!w-auto" value={evidence} onChange={e => setEvidence(e.target.value as typeof evidence)} aria-label="Evidence"><option value="all">Any evidence</option><option value="verified">Has a verified skill</option><option value="reviewed_project">Has a reviewed project</option></select>
          <select className="cx-select sm:!w-auto" value={sharing} onChange={e => setSharing(e.target.value as typeof sharing)} aria-label="Shared sections"><option value="all">Any shared sections</option><option value="projects">Shares projects</option><option value="assessments">Shares assessments</option></select>
          <button className="cx-btn cx-btn-ghost" onClick={clear}>Clear</button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-cx-dim">
        <span>{rows.length} of {candidates.length} discoverable candidates{job ? ` · compared with ${job.title}` : ''}</span>
        {privateCount > 0 && <span className="inline-flex items-center gap-1"><Lock size={12} aria-hidden />{privateCount} private profile{privateCount > 1 ? 's are' : ' is'} not discoverable</span>}
      </div>

      {rows.length ? (
        <ul className="space-y-3">
          {rows.map(({ c, match, reqs }) => (
            <li key={c.id} className="cx-card p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex min-w-0 flex-1 gap-3">
                  <Avatar name={c.name} size={40} />
                  <div className="min-w-0">
                    <Link href={`/demo/employer/candidates/${c.id}?job=${jobId}`} className="text-[15px] font-semibold text-cx-ink no-underline hover:underline">{c.name}</Link>
                    <div className="text-[12.5px] text-cx-dim">{c.degree} · {c.university?.name} · {c.graduationYear}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {reqs.length ? reqs.map(r => (
                        <span key={r.skillId} className={`cx-chip ${r.status === 'met' ? 'bg-cx-ok-soft text-cx-ok' : 'bg-cx-warn-soft text-cx-warn'}`}>
                          {r.externallyVerified && <BadgeCheck size={11} aria-label="verified" />}{r.name} {r.proficiency}
                        </span>
                      )) : <span className="text-[12.5px] text-cx-dim">No skills listed for this job.</span>}
                    </div>
                    {match.projectEvidence.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-cx-dim">
                        {match.projectEvidence.slice(0, 2).map(p => <span key={p.id} className="inline-flex items-center gap-1"><FolderKanban size={12} className="text-cx-info" aria-hidden />{p.name}{p.reviewed ? ' · reviewed' : ''}</span>)}
                      </div>
                    )}
                    {c.projects === null && <div className="mt-2 text-[12px] text-cx-dim"><Lock size={11} className="mr-1 inline" aria-hidden />Projects not shared</div>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-end">
                  <ScoreBadge score={match.score} />
                  <div className="text-[12px] text-cx-dim md:text-right">{match.summary.requiredMet}/{match.summary.requiredTotal} required met<div className="mt-1"><ConfidenceTag match={match} /></div></div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-cx-line pt-3">
                <Link href={`/demo/employer/candidates/${c.id}?job=${jobId}`} className="cx-btn cx-btn-primary cx-btn-sm">View candidate</Link>
                <CandidateActions studentId={c.id} jobId={jobId} jobTitle={job?.title} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="cx-card"><EmptyState icon={<Users size={22} />} title="No candidates match these filters" action={<button className="cx-btn" onClick={clear}>Clear filters</button>}>Try a lower proficiency or a different skill.</EmptyState></div>
      )}
      <p className="mt-6 text-[12px] text-cx-dim">Alignment is calculated from skills, proficiency, projects and verification only. University, CGPA and personal characteristics are not inputs. <Tag>Demo analytics</Tag></p>
    </>
  )
}
