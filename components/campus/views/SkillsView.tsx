'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardCheck, FolderKanban, Plus, Search, Sparkles } from 'lucide-react'
import AssessmentRunner from '@/components/campus/AssessmentRunner'
import { Card, clearQuery, ConfirmButton, Dialog, EmptyState, EvidenceBadge, Field, Flash, Meter, PageHeader, Tag, Time, useFlash, VerificationBadge } from '@/components/campus/ui'
import { ASSESSMENTS, getAssessment } from '@/lib/campus/assessments'
import { resolveSkillId } from '@/lib/campus/matching'
import { CATEGORY_LABEL, EVIDENCE_LABEL, EVIDENCE_ORDER, skillsFor, type SkillView } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { addSkill, removeSelfReportedSkill, updateSelfRating, useDemoState, ValidationError } from '@/lib/campus/store'
import type { EvidenceType, Skill } from '@/lib/campus/types'

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Skill['category'][]

function AddSkillDialog({ open, onClose, initialName, onAdded }: { open: boolean; onClose: () => void; initialName: string; onAdded: (name: string) => void }) {
  const state = useDemoState()
  const [name, setName] = useState(initialName)
  const [rating, setRating] = useState(60)
  const resolved = resolveSkillId(name, state.skills)
  const known = resolved ? state.skills.find(s => s.id === resolved) : undefined
  const [category, setCategory] = useState<Skill['category']>('programming')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = () => {
    try {
      addSkill(PRIMARY_STUDENT_ID, { name: known?.name ?? name, proficiency: rating, category: known?.category ?? category })
      onAdded(known?.name ?? name.trim())
    } catch (e) {
      if (e instanceof ValidationError) setErrors(e.fields)
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title="Add a skill" description="New skills start as self-reported. Verification comes from assessments, reviewed projects, your institution or an employer." width={480}
      footer={<><button className="cx-btn" onClick={onClose}>Cancel</button><button className="cx-btn cx-btn-primary" onClick={submit}>Add skill</button></>}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit() }}>
        <Field label="Skill" htmlFor="sk-name" error={errors.name} hint={known ? `Matches the catalogue skill “${known.name}”.` : name.trim() ? 'New skill — it will be added to the catalogue.' : 'Start typing to see catalogue skills.'}>
          <input id="sk-name" list="sk-catalogue" className="cx-input" value={name} onChange={e => setName(e.target.value)} aria-invalid={!!errors.name} autoFocus />
          <datalist id="sk-catalogue">{state.skills.map(s => <option key={s.id} value={s.name} />)}</datalist>
        </Field>
        {!known && (
          <Field label="Category" htmlFor="sk-cat">
            <select id="sk-cat" className="cx-select" value={category} onChange={e => setCategory(e.target.value as Skill['category'])}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </Field>
        )}
        <Field label={`Self-rating: ${rating}`} htmlFor="sk-rating" error={errors.proficiency} hint="Your own estimate, 1–100. It will be labelled self-reported.">
          <input id="sk-rating" type="range" min={1} max={100} value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full accent-[var(--cx-accent)]" />
        </Field>
      </form>
    </Dialog>
  )
}

function SkillDrawer({ skill, onClose, onAssess }: { skill: SkillView | null; onClose: () => void; onAssess: (assessmentId: string) => void }) {
  const state = useDemoState()
  const [rating, setRating] = useState<number | null>(null)
  if (!skill) return <Dialog open={false} onClose={onClose} title="">{null}</Dialog>
  const assessment = ASSESSMENTS.find(a => a.skillId === skill.skillId)
  const attempts = state.attempts.filter(a => a.studentId === skill.studentId && a.assessmentId === assessment?.id).sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  const current = rating ?? skill.proficiency
  return (
    <Dialog open onClose={onClose} title={skill.skill.name} description={CATEGORY_LABEL[skill.skill.category]} variant="drawer" width={460}>
      <div className="space-y-6">
        <div>
          <div className="flex items-baseline justify-between"><span className="cx-num text-[32px] font-semibold leading-none">{skill.proficiency}</span><span className="text-[12px] text-cx-dim">of 100</span></div>
          <div className="mt-3"><Meter value={skill.proficiency} tone={skill.evidenceType === 'self_reported' ? 'muted' : 'accent'} label="Proficiency" /></div>
          <div className="mt-3 flex flex-wrap gap-1.5"><EvidenceBadge type={skill.evidenceType} /><VerificationBadge status={skill.verificationStatus} /></div>
          {skill.selfRating !== undefined && skill.evidenceType !== 'self_reported' && <p className="mt-2 text-[12px] text-cx-dim">Your self-rating was {skill.selfRating}.</p>}
        </div>

        <section>
          <h3 className="cx-eyebrow mb-2">Verification record</h3>
          {skill.verification ? (
            <div className="rounded-[10px] border border-cx-line p-3 text-[13px]">
              <div className="font-medium">{skill.verification.verifierName}</div>
              <div className="text-cx-ink2">{skill.verification.note}</div>
              <div className="mt-1 text-[12px] text-cx-dim">Verified <Time iso={skill.verification.verifiedAt} /></div>
            </div>
          ) : (
            <p className="text-[13px] text-cx-dim">{skill.verificationStatus === 'pending' ? 'A project demonstrating this skill is waiting for faculty review.' : 'No verification record. This claim is not verified.'}</p>
          )}
        </section>

        <section>
          <h3 className="cx-eyebrow mb-2">Supporting projects</h3>
          {skill.projects.length ? (
            <ul className="space-y-1.5">{skill.projects.map(p => <li key={p.id}><Link href={`/demo/student/projects#${p.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-cx-accent-ink"><FolderKanban size={13} aria-hidden />{p.name}</Link></li>)}</ul>
          ) : <p className="text-[13px] text-cx-dim">No project is linked to this skill. <Link className="font-medium text-cx-accent-ink" href={`/demo/student/projects?new=1&skill=${skill.skillId}`}>Add one →</Link></p>}
        </section>

        <section>
          <h3 className="cx-eyebrow mb-2">Assessment history</h3>
          {assessment ? (
            <>
              {attempts.length ? (
                <ul className="space-y-1.5 text-[13px]">{attempts.map(a => <li key={a.id} className="flex justify-between"><span><Time iso={a.completedAt} /></span><span className="cx-num">{a.correct}/{a.total} · {a.score}% {a.passed ? <Tag tone="ok">Passed</Tag> : <Tag tone="warn">Not passed</Tag>}</span></li>)}</ul>
              ) : <p className="text-[13px] text-cx-dim">No attempts yet.</p>}
              <button className="cx-btn cx-btn-accent mt-3" onClick={() => onAssess(assessment.id)}><ClipboardCheck size={14} aria-hidden />{attempts.length ? 'Retake' : 'Take'} “{assessment.title}”</button>
            </>
          ) : <p className="text-[13px] text-cx-dim">No sample assessment exists for this skill in the demo.</p>}
        </section>

        {skill.evidenceType === 'self_reported' && (
          <section className="border-t border-cx-line pt-5">
            <h3 className="cx-eyebrow mb-2">Self-rating</h3>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={100} value={current} onChange={e => setRating(Number(e.target.value))} className="flex-1 accent-[var(--cx-accent)]" aria-label="Self-rating" />
              <span className="cx-num w-8 text-right font-medium">{current}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="cx-btn cx-btn-sm" disabled={rating === null || rating === skill.proficiency} onClick={() => { updateSelfRating(skill.id, current); setRating(null) }}>Save rating</button>
              <ConfirmButton className="cx-btn cx-btn-sm cx-btn-danger" title={`Remove ${skill.skill.name}?`} body="The self-reported claim will be removed from your profile. Projects that mention it are not changed." confirmLabel="Remove skill" onConfirm={() => { removeSelfReportedSkill(skill.id); onClose() }}>Remove skill</ConfirmButton>
            </div>
          </section>
        )}
      </div>
    </Dialog>
  )
}

export default function SkillsView({ initialAssess, initialAdd }: { initialAssess?: string; initialAdd?: string }) {
  const state = useDemoState()
  const skills = skillsFor(state, PRIMARY_STUDENT_ID)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | Skill['category']>('all')
  const [evidence, setEvidence] = useState<'all' | EvidenceType | 'verified'>('all')
  const [openSkillId, setOpenSkillId] = useState<string | null>(null)
  const [adding, setAdding] = useState(initialAdd !== undefined)
  const [assessing, setAssessing] = useState<string | null>(() => (initialAssess ? ASSESSMENTS.find(a => a.skillId === initialAssess || a.id === initialAssess)?.id ?? null : null))
  const [assessBefore, setAssessBefore] = useState(() => (assessing ? skills.find(s => s.skillId === getAssessment(assessing)?.skillId) : undefined))
  const [flash, show] = useFlash()

  const filtered = useMemo(() => skills.filter(s =>
    (!query || s.skill.name.toLowerCase().includes(query.toLowerCase())) &&
    (category === 'all' || s.skill.category === category) &&
    (evidence === 'all' || (evidence === 'verified' ? s.verificationStatus === 'verified' : s.evidenceType === evidence)),
  ), [skills, query, category, evidence])

  const grouped = CATEGORIES.map(c => ({ c, list: filtered.filter(s => s.skill.category === c) })).filter(g => g.list.length)
  const openSkill = skills.find(s => s.id === openSkillId) ?? null
  const assessment = assessing ? getAssessment(assessing) : undefined
  const startAssessment = (id: string) => {
    setAssessBefore(skills.find(s => s.skillId === getAssessment(id)?.skillId))
    setOpenSkillId(null)
    setAssessing(id)
  }

  return (
    <>
      <PageHeader
        eyebrow="Skills and assessments"
        title="Skills"
        description="Every claim shows where it comes from. Verified means an explicit record exists from an assessment, a faculty project review, your institution or an employer."
        actions={<button className="cx-btn cx-btn-primary" onClick={() => setAdding(true)}><Plus size={14} aria-hidden />Add skill</button>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="cx-card mb-4 grid grid-cols-2 gap-2 p-3 sm:flex sm:flex-wrap">
            <div className="relative col-span-2 min-w-[180px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-cx-faint" aria-hidden />
              <input className="cx-input !pl-8" placeholder="Search skills" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search skills" />
            </div>
            <select className="cx-select sm:!w-auto" value={category} onChange={e => setCategory(e.target.value as typeof category)} aria-label="Category">
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
            <select className="cx-select sm:!w-auto" value={evidence} onChange={e => setEvidence(e.target.value as typeof evidence)} aria-label="Evidence">
              <option value="all">All evidence</option>
              <option value="verified">Verified only</option>
              {EVIDENCE_ORDER.map(ev => <option key={ev} value={ev}>{EVIDENCE_LABEL[ev]}</option>)}
            </select>
          </div>

          {grouped.length ? (
            <div className="space-y-4">
              {grouped.map(({ c, list }) => (
                <Card key={c} title={CATEGORY_LABEL[c]} padded={false}>
                  <ul>
                    {list.map(s => (
                      <li key={s.id} className="border-t border-cx-line first:border-0">
                        <button className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 text-left transition-colors hover:bg-cx-sunken sm:grid-cols-[180px_1fr_auto]" onClick={() => setOpenSkillId(s.id)}>
                          <span className="text-[13.5px] font-medium">{s.skill.name}</span>
                          <span className="flex items-center gap-3 max-sm:order-3 max-sm:col-span-2">
                            <Meter value={s.proficiency} tone={s.evidenceType === 'self_reported' ? 'muted' : 'accent'} label={`${s.skill.name} proficiency`} />
                            <span className="cx-num w-6 text-right text-[13px] font-medium">{s.proficiency}</span>
                          </span>
                          <span className="flex flex-wrap justify-end gap-1.5"><EvidenceBadge type={s.evidenceType} /><span className="max-md:hidden"><VerificationBadge status={s.verificationStatus} /></span></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          ) : (
            <div className="cx-card"><EmptyState icon={<Sparkles size={22} />} title="No skills match these filters" action={<button className="cx-btn" onClick={() => { setQuery(''); setCategory('all'); setEvidence('all') }}>Clear filters</button>} /></div>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Sample assessments" description="Five questions, scored in the browser.">
            <ul className="space-y-3">
              {ASSESSMENTS.map(a => {
                const last = state.attempts.filter(t => t.studentId === PRIMARY_STUDENT_ID && t.assessmentId === a.id).sort((x, y) => y.completedAt.localeCompare(x.completedAt))[0]
                return (
                  <li key={a.id} className="rounded-[10px] border border-cx-line p-3">
                    <div className="text-[13.5px] font-medium">{a.title}</div>
                    <div className="text-[12px] text-cx-dim">{a.description}</div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[12px] text-cx-dim">{last ? <>Last: {last.correct}/{last.total} · <Time iso={last.completedAt} /></> : 'Not attempted'}</span>
                      <button className="cx-btn cx-btn-sm" onClick={() => startAssessment(a.id)}>{last ? 'Retake' : 'Start'}</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
          <Card title="Evidence types">
            <ul className="space-y-2.5 text-[12.5px] text-cx-ink2">
              <li><EvidenceBadge type="self_reported" /><div className="mt-1">Your own rating. Counts toward matches, with lower confidence.</div></li>
              <li><EvidenceBadge type="assessment_verified" /><div className="mt-1">Passed an in-app sample assessment.</div></li>
              <li><EvidenceBadge type="project_demonstrated" /><div className="mt-1">Shown in a project; verified once faculty review it.</div></li>
              <li><EvidenceBadge type="institution_verified" /><div className="mt-1">Confirmed by your university, e.g. a course result.</div></li>
              <li><EvidenceBadge type="employer_verified" /><div className="mt-1">Confirmed by an internship or employer supervisor.</div></li>
            </ul>
          </Card>
        </div>
      </div>

      <SkillDrawer key={openSkillId ?? 'none'} skill={openSkill} onClose={() => setOpenSkillId(null)} onAssess={startAssessment} />
      {adding && <AddSkillDialog open initialName={initialAdd ?? ''} onClose={() => { setAdding(false); clearQuery() }} onAdded={n => { setAdding(false); clearQuery(); show(`${n} added as self-reported`) }} />}
      {assessment && (
        <AssessmentRunner
          key={assessment.id + (assessBefore?.updatedAt ?? '')}
          open assessment={assessment} studentId={PRIMARY_STUDENT_ID}
          skillBefore={assessBefore}
          skillAfter={state.studentSkills.find(s => s.studentId === PRIMARY_STUDENT_ID && s.skillId === assessment.skillId)}
          onClose={() => { setAssessing(null); clearQuery() }}
        />
      )}
      <Flash message={flash} />
    </>
  )
}
