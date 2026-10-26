'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CircleCheck, CircleDashed, CircleHelp, CircleMinus, FolderKanban, Lightbulb, ClipboardCheck, TriangleAlert } from 'lucide-react'
import type { MatchResult, RequirementResult } from '@/lib/campus/matching'
import { EVIDENCE_LABEL } from '@/lib/campus/queries'
import { cn, Dialog, EvidenceBadge, Meter, ScoreBadge, Tag } from './ui'

type Perspective = 'student' | 'employer'

export function ConfidenceTag({ match }: { match: MatchResult }) {
  const tone = match.confidence === 'high' ? 'ok' : match.confidence === 'medium' ? 'accent' : 'warn'
  return <Tag tone={tone}>{match.confidence[0].toUpperCase() + match.confidence.slice(1)} confidence</Tag>
}

/** Score, confidence and the per-component points that add up to it. */
export function ScoreComponents({ match }: { match: MatchResult }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <ScoreBadge score={match.score} size="lg" />
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-cx-ink">Requirement alignment</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-cx-dim">
            <span>{match.summary.requiredMet} of {match.summary.requiredTotal} required met</span>
            {match.summary.preferredTotal > 0 && <span>· {match.summary.preferredMet} of {match.summary.preferredTotal} preferred</span>}
            <ConfidenceTag match={match} />
          </div>
        </div>
      </div>
      <table className="mt-5 w-full text-[13px]">
        <caption className="sr-only">Score breakdown by component</caption>
        <thead>
          <tr className="text-left text-[11.5px] text-cx-dim">
            <th className="pb-2 font-medium">Component</th>
            <th className="w-16 pb-2 text-right font-medium">Weight</th>
            <th className="hidden w-[32%] pb-2 pl-4 font-medium sm:table-cell">Coverage</th>
            <th className="w-16 pb-2 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody>
          {match.components.map(c => (
            <tr key={c.key} className={cn('border-t border-cx-line', !c.applies && 'text-cx-faint')}>
              <td className="py-2.5 pr-2">
                <div className="font-medium">{c.label}</div>
                <div className="text-[12px] text-cx-dim">{c.applies ? c.detail : 'Not part of this job’s requirements'}</div>
              </td>
              <td className="cx-num py-2.5 text-right">{c.applies ? `${Math.round(c.weight * 100)}%` : '—'}</td>
              <td className="hidden py-2.5 pl-4 sm:table-cell">
                {c.applies && <div className="flex items-center gap-2"><Meter value={c.coverage * 100} label={`${c.label} coverage`} /><span className="cx-num w-9 text-right text-[12px] text-cx-dim">{Math.round(c.coverage * 100)}%</span></div>}
              </td>
              <td className="cx-num py-2.5 text-right font-medium">{c.applies ? c.points.toFixed(1) : '—'}</td>
            </tr>
          ))}
          <tr className="border-t border-cx-strong">
            <td className="py-2.5 font-semibold" colSpan={2}>Total</td>
            <td className="hidden sm:table-cell" />
            <td className="cx-num py-2.5 text-right font-semibold">{match.score}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const STATUS = {
  met: { Icon: CircleCheck, cls: 'text-cx-ok', label: 'Met' },
  partial: { Icon: CircleDashed, cls: 'text-cx-warn', label: 'Partly met' },
  missing: { Icon: CircleMinus, cls: 'text-cx-faint', label: 'Not shown' },
}

function RequirementRow({ r }: { r: RequirementResult }) {
  const { Icon, cls, label } = STATUS[r.status]
  return (
    <li className="grid grid-cols-[18px_1fr] gap-x-2.5 border-t border-cx-line py-3 first:border-0 first:pt-0">
      <Icon size={17} className={cn('mt-0.5', cls)} aria-label={label} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13.5px] font-medium text-cx-ink">{r.name}</span>
          <span className="cx-num text-[12px] text-cx-dim">
            {r.proficiency === null ? 'Not on profile' : `${r.proficiency} / ${r.minProficiency} needed`}
          </span>
        </div>
        <div className="mt-2"><Meter value={r.proficiency ?? 0} marker={r.minProficiency} tone={r.status === 'met' ? 'accent' : 'muted'} label={`${r.name} proficiency`} /></div>
        {(r.evidenceType || r.projects.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {r.evidenceType && <EvidenceBadge type={r.evidenceType} />}
            {r.projects.map(p => (
              <span key={p.id} className="cx-chip bg-cx-sunken text-cx-ink2"><FolderKanban size={11} aria-hidden />{p.name}{p.reviewed ? '' : ' (unreviewed)'}</span>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

export function RequirementList({ match }: { match: MatchResult }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="cx-eyebrow mb-3">Required · {match.summary.requiredMet}/{match.summary.requiredTotal}</h3>
        {match.required.length ? <ul>{match.required.map(r => <RequirementRow key={r.skillId} r={r} />)}</ul> : <p className="text-[13px] text-cx-dim">No required skills listed.</p>}
      </div>
      <div>
        <h3 className="cx-eyebrow mb-3">Preferred · {match.summary.preferredMet}/{match.summary.preferredTotal}</h3>
        {match.preferred.length ? <ul>{match.preferred.map(r => <RequirementRow key={r.skillId} r={r} />)}</ul> : <p className="text-[13px] text-cx-dim">This job lists no preferred skills, so their weight is spread across the other components.</p>}
      </div>
    </div>
  )
}

export function EvidenceSummary({ match }: { match: MatchResult }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <h3 className="cx-eyebrow mb-2">Supporting projects</h3>
        {match.projectEvidence.length ? (
          <ul className="space-y-2">
            {match.projectEvidence.map(p => (
              <li key={p.id} className="text-[13px]">
                <div className="flex items-center gap-1.5 font-medium text-cx-ink"><FolderKanban size={14} className="text-cx-info" aria-hidden />{p.name}</div>
                <div className="ml-5 text-[12px] text-cx-dim">{p.reviewed ? 'Faculty-reviewed' : 'Not yet reviewed'} · shows {p.skills.join(', ')}</div>
              </li>
            ))}
          </ul>
        ) : <p className="text-[13px] text-cx-dim">No project on the profile demonstrates these skills.</p>}
      </div>
      <div>
        <h3 className="cx-eyebrow mb-2">Verified skill evidence</h3>
        {match.assessmentEvidence.length ? (
          <ul className="space-y-2">
            {match.assessmentEvidence.map(a => (
              <li key={a.skillId} className="flex items-center gap-1.5 text-[13px]"><ClipboardCheck size={14} className="text-cx-accent" aria-hidden /><span className="font-medium">{a.name}</span><span className="text-cx-dim">· {EVIDENCE_LABEL[a.evidenceType]}</span></li>
            ))}
          </ul>
        ) : <p className="text-[13px] text-cx-dim">None of these skills is verified by an assessment, institution or employer yet.</p>}
      </div>
    </div>
  )
}

function actionHref(a: NonNullable<MatchResult['improvements'][number]['action']>, name: string) {
  if (a.type === 'assessment') return { href: `/demo/student/skills?assess=${a.skillId}`, label: `Take the ${name} assessment` }
  if (a.type === 'project') return { href: `/demo/student/projects?new=1&skill=${a.skillId}`, label: 'Add a project' }
  return { href: `/demo/student/skills?add=${encodeURIComponent(name)}`, label: `Add ${name}` }
}

export function Improvements({ match, perspective }: { match: MatchResult; perspective: Perspective }) {
  if (!match.improvements.length) {
    return <p className="text-[13px] text-cx-dim">{perspective === 'student' ? 'Every requirement is met and backed by evidence. Nothing to add for this role.' : 'No gaps against the listed requirements.'}</p>
  }
  return (
    <ul className="space-y-3">
      {match.improvements.map(i => {
        const link = perspective === 'student' && i.action ? actionHref(i.action, i.name) : null
        return (
          <li key={`${i.skillId}-${i.reason}`} className="flex gap-2.5 text-[13px]">
            {perspective === 'student' ? <Lightbulb size={15} className="mt-0.5 shrink-0 text-cx-accent" aria-hidden /> : <TriangleAlert size={15} className="mt-0.5 shrink-0 text-cx-warn" aria-hidden />}
            <div className="min-w-0">
              <div className="text-cx-ink">{perspective === 'student' ? i.advice : i.gap}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Tag>{i.kind === 'required' ? 'Required skill' : 'Preferred skill'}</Tag>
                {link && <Link href={link.href} className="text-[12.5px] font-medium text-cx-accent-ink underline-offset-2 hover:underline">{link.label} →</Link>}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Explanation({ match }: { match: MatchResult }) {
  return (
    <div className="space-y-4 text-[13px]">
      <ol className="list-decimal space-y-1.5 pl-5 text-cx-ink2">
        {match.explanation.map(line => <li key={line}>{line}</li>)}
      </ol>
      <p className="rounded-[8px] bg-cx-sunken px-3 py-2.5 text-cx-ink2"><span className="font-medium text-cx-ink">Confidence: {match.confidence}.</span> {match.confidenceNote}</p>
      <p className="text-[12.5px] text-cx-dim">Requirement credit is 1 when proficiency reaches the required level, otherwise proficiency ÷ required level. Project evidence counts 1 for a reviewed project and 0.6 for an unreviewed one.</p>
    </div>
  )
}

export function Limitations({ match }: { match: MatchResult }) {
  return (
    <ul className="space-y-1.5 text-[12.5px] text-cx-dim">
      {match.limitations.map(l => <li key={l} className="flex gap-2"><CircleHelp size={13} className="mt-0.5 shrink-0" aria-hidden />{l}</li>)}
    </ul>
  )
}

/** The two explanation actions, each opening a dialog: "Why this match?" and "How can I improve my match?". */
export function MatchActions({ match, perspective, size = 'md' }: { match: MatchResult; perspective: Perspective; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState<'why' | 'improve' | null>(null)
  const btn = cn('cx-btn', size === 'sm' && 'cx-btn-sm')
  return (
    <>
      <button type="button" className={btn} onClick={() => setOpen('why')}>Why this match?</button>
      <button type="button" className={btn} onClick={() => setOpen('improve')}>{perspective === 'student' ? 'How can I improve my match?' : 'Gaps'}</button>
      <Dialog open={open === 'why'} onClose={() => setOpen(null)} title="Why this match?" description="How the alignment score was calculated from the profile and the job’s requirements." width={640}>
        <ScoreComponents match={match} />
        <div className="mt-6 border-t border-cx-line pt-5"><Explanation match={match} /></div>
        <div className="mt-6 border-t border-cx-line pt-5"><h3 className="cx-eyebrow mb-2">Limitations</h3><Limitations match={match} /></div>
      </Dialog>
      <Dialog open={open === 'improve'} onClose={() => setOpen(null)} title={perspective === 'student' ? 'How can I improve my match?' : 'Gaps against requirements'} description="Generated from the requirements that are missing, below level or not yet evidenced." width={600}>
        <Improvements match={match} perspective={perspective} />
        {perspective === 'student' && <p className="mt-5 border-t border-cx-line pt-4 text-[12px] text-cx-dim">These steps change how well your profile aligns with this job’s stated requirements. They do not guarantee an interview or an offer.</p>}
      </Dialog>
    </>
  )
}
