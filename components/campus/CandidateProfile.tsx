'use client'

import { Award, BookOpen, ExternalLink, FolderKanban, Lock, MapPin } from 'lucide-react'
import type { EmployerCandidateView } from '@/lib/campus/queries'
import { Avatar, EvidenceBadge, Meter, Tag, Time, VerificationBadge } from './ui'

function NotShared({ what }: { what: string }) {
  return <p className="flex items-center gap-2 text-[13px] text-cx-dim"><Lock size={13} aria-hidden />The candidate has not shared their {what}.</p>
}

export function CandidateHeader({ c }: { c: EmployerCandidateView }) {
  return (
    <div className="flex items-start gap-4">
      <Avatar name={c.name} size={52} />
      <div className="min-w-0">
        <h2 className="text-[20px] font-semibold text-cx-ink">{c.name}</h2>
        <div className="mt-0.5 text-[13px] text-cx-ink2">{c.degree} · {c.university?.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-cx-dim">
          <span>Graduating {c.graduationYear}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{c.location}</span>
          <span>Interested in: {c.preferredRole}</span>
        </div>
      </div>
    </div>
  )
}

/** The profile as an employer sees it: only shared sections, built from the access-controlled view. */
export default function CandidateProfile({ c }: { c: EmployerCandidateView }) {
  return (
    <div className="space-y-6">
      {c.bio && <p className="text-[14px] leading-relaxed text-cx-ink2">{c.bio}</p>}

      <section>
        <h3 className="cx-eyebrow mb-3">Skills and evidence</h3>
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {c.skills.map(s => (
            <li key={s.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                <span className="truncate font-medium">{s.skill.name}</span>
                <span className="flex items-center gap-1.5"><EvidenceBadge type={s.evidenceType} compact /><span className="cx-num w-6 text-right">{s.proficiency}</span></span>
              </div>
              <Meter value={s.proficiency} tone={s.evidenceType === 'self_reported' ? 'muted' : 'accent'} label={`${s.skill.name} proficiency`} />
            </li>
          ))}
        </ul>
        {!c.attemptsShared && <p className="mt-3 text-[12px] text-cx-dim">Assessment results are not shared, so assessed skills show the candidate’s self-rating.</p>}
      </section>

      <section>
        <h3 className="cx-eyebrow mb-3">Projects</h3>
        {c.projects === null ? <NotShared what="projects" /> : c.projects.length === 0 ? <p className="text-[13px] text-cx-dim">No projects yet.</p> : (
          <ul className="space-y-3">
            {c.projects.map(p => (
              <li key={p.id} className="rounded-[10px] border border-cx-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-[14px] font-medium"><FolderKanban size={15} className="text-cx-info" aria-hidden />{p.name}</div>
                  <VerificationBadge status={p.verificationStatus} />
                </div>
                <p className="mt-1.5 text-[13px] text-cx-ink2">{p.summary}</p>
                <p className="mt-1 text-[12.5px] text-cx-dim"><span className="font-medium text-cx-ink2">Contribution:</span> {p.contribution} · {p.role} · <Time iso={p.completedAt} /></p>
                <div className="mt-2 flex flex-wrap gap-1">{p.skillIds.map(id => <Tag key={id}>{c.skills.find(s => s.skillId === id)?.skill.name ?? id}</Tag>)}</div>
                {p.review && <p className="mt-2 text-[12px] text-cx-ok">Reviewed by {p.review.verifierName}: {p.review.note}</p>}
                {p.evidence.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {p.evidence.map(e => <a key={e.id} href={e.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[12.5px] text-cx-accent-ink"><ExternalLink size={12} aria-hidden />{e.label}</a>)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="cx-eyebrow mb-3">Education</h3>
          {c.education === null ? <NotShared what="education record" /> : (
            <div className="text-[13px]">
              <div className="flex items-center gap-2 font-medium"><BookOpen size={14} className="text-cx-dim" aria-hidden />{c.education.degree}</div>
              <div className="ml-[22px] text-cx-dim">{c.university?.name} · {c.education.startYear}–{c.education.graduationYear}</div>
              <div className="ml-[22px] mt-1 text-cx-dim">CGPA {c.education.cgpa.toFixed(1)} / {c.education.cgpaScale} <span className="text-cx-faint">(not used in matching)</span></div>
              {c.education.highlights.length > 0 && <ul className="ml-[22px] mt-1 list-disc pl-4 text-cx-ink2">{c.education.highlights.map(h => <li key={h}>{h}</li>)}</ul>}
            </div>
          )}
        </div>
        <div>
          <h3 className="cx-eyebrow mb-3">Achievements</h3>
          {c.achievements === null ? <NotShared what="achievements" /> : c.achievements.length === 0 ? <p className="text-[13px] text-cx-dim">None listed.</p> : (
            <ul className="space-y-2 text-[13px]">
              {c.achievements.map(a => (
                <li key={a.id} className="flex gap-2"><Award size={14} className="mt-0.5 shrink-0 text-cx-dim" aria-hidden /><div><div className="font-medium">{a.title}</div><div className="text-[12px] text-cx-dim">{a.issuer} · <Time iso={a.date} /> · demo record</div></div></li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
