'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award, BookOpen, ExternalLink, FolderKanban, MapPin, Pencil } from 'lucide-react'
import SharingPanel from '@/components/campus/SharingPanel'
import { Avatar, Card, DemoBadge, Dialog, EvidenceBadge, Field, Flash, Meter, PageHeader, Tag, Time, useFlash, VerificationBadge } from '@/components/campus/ui'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { updateProfile, useDemoState, validateProfile, type ProfileInput } from '@/lib/campus/store'
import { projectsFor, skillsFor, university, type SkillView } from '@/lib/campus/queries'
import type { Skill } from '@/lib/campus/types'

const AREAS: { label: string; categories: Skill['category'][] }[] = [
  { label: 'Technical', categories: ['programming', 'frontend', 'backend'] },
  { label: 'Analytical', categories: ['analytical', 'data_ai'] },
  { label: 'Communication', categories: ['communication'] },
  { label: 'Collaboration', categories: ['collaboration'] },
  { label: 'Leadership', categories: ['leadership'] },
  { label: 'Domain and design', categories: ['domain', 'design'] },
]

function areaSummary(skills: SkillView[]) {
  return AREAS.map(a => {
    const list = skills.filter(s => a.categories.includes(s.skill.category))
    return {
      ...a,
      count: list.length,
      verified: list.filter(s => s.verificationStatus === 'verified').length,
      average: list.length ? Math.round(list.reduce((t, s) => t + s.proficiency, 0) / list.length) : null,
      top: list.slice(0, 3).map(s => s.skill.name),
    }
  })
}

function EditProfile({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial: ProfileInput; onSave: (v: ProfileInput) => void }) {
  const [form, setForm] = useState(initial)
  const [interests, setInterests] = useState(initial.careerInterests.join(', '))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = () => {
    const value = { ...form, careerInterests: interests.split(',').map(s => s.trim()).filter(Boolean) }
    const e = validateProfile(value)
    setErrors(e)
    if (!Object.keys(e).length) onSave(value)
  }
  return (
    <Dialog open={open} onClose={onClose} title="Edit profile" footer={<><button className="cx-btn" onClick={onClose}>Cancel</button><button className="cx-btn cx-btn-primary" onClick={submit}>Save changes</button></>}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit() }}>
        <Field label="Preferred role" htmlFor="pf-role" error={errors.preferredRole}><input id="pf-role" className="cx-input" value={form.preferredRole} onChange={e => setForm({ ...form, preferredRole: e.target.value })} aria-invalid={!!errors.preferredRole} /></Field>
        <Field label="Location" htmlFor="pf-loc" error={errors.location}><input id="pf-loc" className="cx-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} aria-invalid={!!errors.location} /></Field>
        <Field label="Biography" htmlFor="pf-bio" error={errors.bio} hint={`${form.bio.length}/600`}><textarea id="pf-bio" rows={4} className="cx-textarea" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} aria-invalid={!!errors.bio} /></Field>
        <Field label="Career interests" htmlFor="pf-int" error={errors.careerInterests} hint="Separate with commas."><input id="pf-int" className="cx-input" value={interests} onChange={e => setInterests(e.target.value)} /></Field>
      </form>
    </Dialog>
  )
}

export default function StudentProfilePage() {
  const state = useDemoState()
  const student = state.students.find(s => s.id === PRIMARY_STUDENT_ID)!
  const uni = university(state, student.universityId)
  const skills = skillsFor(state, student.id)
  const projects = projectsFor(state, student.id)
  const education = state.education.find(e => e.studentId === student.id)
  const achievements = state.achievements.filter(a => a.studentId === student.id)
  const [editing, setEditing] = useState(false)
  const [flash, show] = useFlash()

  return (
    <>
      <PageHeader eyebrow="Capability profile" title="Your capability profile" description="Everything on this page is the record employers can see, if you choose to share it." />

      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={student.name} size={64} />
            <div className="min-w-0">
              <h2 className="text-[22px] font-semibold">{student.name}</h2>
              <div className="mt-0.5 text-[13.5px] text-cx-ink2">{student.degree} · {uni?.name}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-cx-dim">
                <span>Graduating {student.graduationYear}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{student.location || 'No location'}</span>
                <span>Preferred role: <span className="font-medium text-cx-ink">{student.preferredRole || '—'}</span></span>
              </div>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-cx-ink2">{student.bio || <span className="text-cx-dim">No biography yet.</span>}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{student.careerInterests.map(i => <Tag key={i} tone="accent">{i}</Tag>)}</div>
            </div>
          </div>
          <button className="cx-btn shrink-0" onClick={() => setEditing(true)}><Pencil size={14} aria-hidden />Edit profile</button>
        </div>
      </Card>
      {editing && (
        <EditProfile
          open={editing} onClose={() => setEditing(false)}
          initial={{ preferredRole: student.preferredRole, location: student.location, bio: student.bio, careerInterests: student.careerInterests }}
          onSave={v => { updateProfile(student.id, v); setEditing(false); show('Profile updated') }}
        />
      )}

      <div className="mt-4">
        <Card title="Capability summary" description="Average proficiency per area, from the skills on your profile.">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {areaSummary(skills).map(a => (
              <div key={a.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="font-medium">{a.label}</span>
                  <span className="cx-num text-cx-dim">{a.average ?? '—'}</span>
                </div>
                <Meter value={a.average ?? 0} label={`${a.label} average proficiency`} />
                <div className="mt-1.5 text-[12px] text-cx-dim">{a.count ? `${a.count} skill${a.count > 1 ? 's' : ''} · ${a.verified} verified · ${a.top.join(', ')}` : 'No skills in this area yet'}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Skills" description="Each claim keeps its evidence type and verification status." action={<Link href="/demo/student/skills" className="text-[12.5px] font-medium text-cx-accent-ink">Manage →</Link>} padded={false}>
          <div className="cx-scroll-x">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead><tr className="text-left text-[11.5px] text-cx-dim"><th className="px-5 py-2 font-medium">Skill</th><th className="py-2 font-medium">Level</th><th className="py-2 font-medium">Evidence</th><th className="py-2 font-medium">Status</th><th className="px-5 py-2 font-medium">Last assessed</th></tr></thead>
              <tbody>
                {skills.map(s => (
                  <tr key={s.id} className="border-t border-cx-line">
                    <td className="px-5 py-2.5 font-medium">{s.skill.name}{s.projects.length > 0 && <div className="text-[11.5px] font-normal text-cx-dim">{s.projects.map(p => p.name).join(', ')}</div>}</td>
                    <td className="cx-num py-2.5">{s.proficiency}</td>
                    <td className="py-2.5"><EvidenceBadge type={s.evidenceType} /></td>
                    <td className="py-2.5"><VerificationBadge status={s.verificationStatus} /></td>
                    <td className="px-5 py-2.5 text-cx-dim">{s.lastAssessedAt ? <Time iso={s.lastAssessedAt} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Education" description="One part of the profile. Not used to calculate matches.">
            {education ? (
              <div className="text-[13px]">
                <div className="flex items-center gap-2 font-medium"><BookOpen size={14} className="text-cx-dim" aria-hidden />{education.degree}</div>
                <div className="ml-[22px] text-cx-dim">{uni?.name} · {education.startYear}–{education.graduationYear}</div>
                <div className="ml-[22px] mt-1 text-cx-ink2">CGPA {education.cgpa.toFixed(1)} / {education.cgpaScale} <span className="text-cx-dim">(sample)</span></div>
                <ul className="ml-[22px] mt-2 list-disc pl-4 text-cx-ink2">{education.highlights.map(h => <li key={h}>{h}</li>)}</ul>
              </div>
            ) : <p className="text-[13px] text-cx-dim">No education record.</p>}
          </Card>
          <Card title="Profile sharing">
            <SharingPanel studentId={student.id} showSections={false} />
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Projects" action={<Link href="/demo/student/projects" className="text-[12.5px] font-medium text-cx-accent-ink">Manage →</Link>} padded={false}>
          <ul>
            {projects.map(p => (
              <li key={p.id} className="border-t border-cx-line px-5 py-3.5 first:border-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-[14px] font-medium"><FolderKanban size={15} className="text-cx-info" aria-hidden />{p.name}</div>
                  <VerificationBadge status={p.verificationStatus} />
                </div>
                <p className="mt-1 text-[13px] text-cx-ink2">{p.summary}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-cx-dim">
                  <span>{p.role} · <Time iso={p.completedAt} /></span>
                  {p.skillIds.map(id => <Tag key={id}>{state.skills.find(s => s.id === id)?.name ?? id}</Tag>)}
                </div>
                {p.evidence.length > 0 && <div className="mt-1.5 flex flex-wrap gap-3">{p.evidence.map(e => <a key={e.id} href={e.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[12.5px] text-cx-accent-ink"><ExternalLink size={12} aria-hidden />{e.label}</a>)}</div>}
              </li>
            ))}
            {!projects.length && <li className="px-5 py-6 text-[13px] text-cx-dim">No projects yet.</li>}
          </ul>
        </Card>
        <Card title="Achievements" action={<DemoBadge />}>
          <ul className="space-y-3">
            {achievements.map(a => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-cx-sunken text-cx-dim"><Award size={15} aria-hidden /></span>
                <div className="text-[13px]">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-[12px] text-cx-dim">{a.issuer} · <Time iso={a.date} /> · <span className="capitalize">{a.kind}</span></div>
                  <p className="mt-0.5 text-cx-ink2">{a.description}</p>
                </div>
              </li>
            ))}
            {!achievements.length && <li className="text-[13px] text-cx-dim">No achievements yet.</li>}
          </ul>
          <p className="mt-4 text-[11.5px] text-cx-faint">Fictional demo records. Issuers are not real organisations.</p>
        </Card>
      </div>
      <Flash message={flash} />
    </>
  )
}
