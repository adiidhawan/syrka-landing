'use client'

import { useState } from 'react'
import { ExternalLink, FolderKanban, Pencil, Plus, Send, Trash2, X } from 'lucide-react'
import { Card, clearQuery, cn, ConfirmButton, Dialog, EmptyState, Field, Flash, PageHeader, Tag, Time, useFlash, VerificationBadge } from '@/components/campus/ui'
import { CATEGORY_LABEL, projectsFor, type ProjectView } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { addProject, deleteProject, requestProjectReview, updateProject, useDemoState, validateProject, ValidationError, type ProjectInput } from '@/lib/campus/store'
import type { ProjectEvidence } from '@/lib/campus/types'

const ROLES: ProjectInput['role'][] = ['Solo', 'Lead', 'Contributor']
const EVIDENCE_KINDS: ProjectEvidence['kind'][] = ['repository', 'demo', 'report', 'video']

function emptyInput(skill?: string): ProjectInput {
  return { name: '', summary: '', problem: '', implementation: '', contribution: '', role: 'Solo', completedAt: '', skillIds: skill ? [skill] : [], evidence: [] }
}

function toInput(p: ProjectView): ProjectInput {
  return {
    name: p.name, summary: p.summary, problem: p.problem, implementation: p.implementation, contribution: p.contribution,
    role: p.role, completedAt: p.completedAt, skillIds: p.skillIds, evidence: p.evidence.map(({ label, url, kind }) => ({ label, url, kind })),
  }
}

function ProjectForm({ initial, title, onCancel, onSubmit, warnReview }: { initial: ProjectInput; title: string; onCancel: () => void; onSubmit: (v: ProjectInput) => void; warnReview?: boolean }) {
  const state = useDemoState()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [skillQuery, setSkillQuery] = useState('')
  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => setForm(f => ({ ...f, [k]: v }))
  const submit = () => {
    const e = validateProject(form)
    setErrors(e)
    if (Object.keys(e).length) return
    try { onSubmit(form) } catch (err) { if (err instanceof ValidationError) setErrors(err.fields) }
  }
  const suggestions = state.skills.filter(s => !form.skillIds.includes(s.id) && (!skillQuery || s.name.toLowerCase().includes(skillQuery.toLowerCase()))).slice(0, 10)
  const name = (id: string) => state.skills.find(s => s.id === id)?.name ?? id

  return (
    <Dialog open onClose={onCancel} title={title} width={680}
      footer={<><span className="mr-auto self-center text-[12px] text-cx-dim">{Object.keys(errors).length ? `${Object.keys(errors).length} field${Object.keys(errors).length > 1 ? 's need' : ' needs'} attention` : ''}</span><button className="cx-btn" onClick={onCancel}>Cancel</button><button className="cx-btn cx-btn-primary" onClick={submit}>Save project</button></>}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit() }} noValidate>
        {warnReview && <p className="rounded-[8px] bg-cx-warn-soft px-3 py-2 text-[12.5px] text-cx-warn">This project has been faculty-reviewed. Saving changes withdraws the review, and skills verified by it become unverified until it is reviewed again.</p>}
        <Field label="Project name" htmlFor="pj-name" error={errors.name}><input id="pj-name" className="cx-input" value={form.name} onChange={e => set('name', e.target.value)} aria-invalid={!!errors.name} /></Field>
        <Field label="Summary" htmlFor="pj-sum" error={errors.summary}><input id="pj-sum" className="cx-input" value={form.summary} onChange={e => set('summary', e.target.value)} aria-invalid={!!errors.summary} placeholder="One sentence on what it does" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Problem being solved" htmlFor="pj-prob"><textarea id="pj-prob" rows={3} className="cx-textarea" value={form.problem} onChange={e => set('problem', e.target.value)} /></Field>
          <Field label="Technical implementation" htmlFor="pj-impl"><textarea id="pj-impl" rows={3} className="cx-textarea" value={form.implementation} onChange={e => set('implementation', e.target.value)} /></Field>
        </div>
        <Field label="Your contribution" htmlFor="pj-con"><textarea id="pj-con" rows={2} className="cx-textarea" value={form.contribution} onChange={e => set('contribution', e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your role" htmlFor="pj-role"><select id="pj-role" className="cx-select" value={form.role} onChange={e => set('role', e.target.value as ProjectInput['role'])}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Completion date" htmlFor="pj-date" error={errors.completedAt}><input id="pj-date" type="date" className="cx-input" value={form.completedAt} onChange={e => set('completedAt', e.target.value)} aria-invalid={!!errors.completedAt} /></Field>
        </div>

        <Field label="Skills demonstrated" error={errors.skillIds} hint="Skills not yet on your profile are added as project-demonstrated, unverified.">
          <div className={cn('rounded-[8px] border p-2', errors.skillIds ? 'border-cx-bad' : 'border-cx-strong')}>
            <div className="flex flex-wrap gap-1.5">
              {form.skillIds.map(id => (
                <span key={id} className="cx-chip bg-cx-accent-soft text-cx-accent-ink">{name(id)}<button type="button" aria-label={`Remove ${name(id)}`} onClick={() => set('skillIds', form.skillIds.filter(x => x !== id))}><X size={11} /></button></span>
              ))}
              <input className="min-w-[140px] flex-1 border-0 bg-transparent p-0.5 text-[13px] focus:ring-0" placeholder="Search skills to link…" value={skillQuery} onChange={e => setSkillQuery(e.target.value)} aria-label="Search skills to link" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1 border-t border-cx-line pt-2">
              {suggestions.map(s => <button type="button" key={s.id} className="cx-chip border-cx-line bg-cx-surface text-cx-ink2 hover:bg-cx-sunken" style={{ borderColor: 'var(--cx-line)' }} title={CATEGORY_LABEL[s.category]} onClick={() => { set('skillIds', [...form.skillIds, s.id]); setSkillQuery('') }}><Plus size={10} aria-hidden />{s.name}</button>)}
              {!suggestions.length && <span className="text-[12px] text-cx-dim">No matching catalogue skills. Add new skills on the Skills page first.</span>}
            </div>
          </div>
        </Field>

        <div>
          <div className="mb-1 flex items-center justify-between"><span className="text-[12.5px] font-medium text-cx-ink2">Evidence links</span><button type="button" className="cx-btn cx-btn-sm" onClick={() => set('evidence', [...form.evidence, { label: '', url: 'https://', kind: 'repository' }])}><Plus size={12} aria-hidden />Add link</button></div>
          {form.evidence.length === 0 && <p className="text-[12px] text-cx-dim">No links yet. A repository, live demo or report makes the project easier to review.</p>}
          <ul className="space-y-2">
            {form.evidence.map((ev, i) => (
              <li key={i}>
                <div className="grid gap-2 sm:grid-cols-[110px_1fr_1.4fr_auto]">
                  <select className="cx-select" value={ev.kind} aria-label="Link type" onChange={e => set('evidence', form.evidence.map((x, j) => j === i ? { ...x, kind: e.target.value as ProjectEvidence['kind'] } : x))}>{EVIDENCE_KINDS.map(k => <option key={k} value={k}>{k}</option>)}</select>
                  <input className="cx-input" placeholder="Label" aria-label="Link label" value={ev.label} onChange={e => set('evidence', form.evidence.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                  <input className="cx-input" placeholder="https://" aria-label="Link URL" value={ev.url} aria-invalid={!!errors[`evidence.${i}`]} onChange={e => set('evidence', form.evidence.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
                  <button type="button" className="cx-btn cx-btn-ghost" aria-label="Remove link" onClick={() => set('evidence', form.evidence.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                </div>
                {errors[`evidence.${i}`] && <p className="mt-1 text-[12px] text-cx-bad">{errors[`evidence.${i}`]}</p>}
              </li>
            ))}
          </ul>
        </div>
      </form>
    </Dialog>
  )
}

function ProjectCard({ p, onEdit, onDelete, onReview }: { p: ProjectView; onEdit: () => void; onDelete: () => void; onReview: () => void }) {
  const state = useDemoState()
  return (
    <article id={p.id} className="cx-card scroll-mt-20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold"><FolderKanban size={16} className="text-cx-info" aria-hidden />{p.name}</h2>
          <p className="mt-1 text-[13.5px] text-cx-ink2">{p.summary}</p>
        </div>
        <VerificationBadge status={p.verificationStatus} />
      </div>
      <dl className="mt-4 grid gap-4 text-[13px] md:grid-cols-3">
        <div><dt className="cx-eyebrow mb-1">Problem</dt><dd className="text-cx-ink2">{p.problem || '—'}</dd></div>
        <div><dt className="cx-eyebrow mb-1">Implementation</dt><dd className="text-cx-ink2">{p.implementation || '—'}</dd></div>
        <div><dt className="cx-eyebrow mb-1">Contribution</dt><dd className="text-cx-ink2">{p.contribution || '—'}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {p.skillIds.map(id => <Tag key={id} tone="accent">{state.skills.find(s => s.id === id)?.name ?? id}</Tag>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-cx-dim">
        <span>{p.role}</span>
        <span>Completed <Time iso={p.completedAt} /></span>
        {p.evidence.map(e => <a key={e.id} href={e.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-cx-accent-ink"><ExternalLink size={12} aria-hidden />{e.label}</a>)}
        {!p.evidence.length && <span className="text-cx-warn">No evidence link</span>}
      </div>
      {p.review && <p className="mt-3 rounded-[8px] bg-cx-ok-soft px-3 py-2 text-[12.5px] text-cx-ok">Reviewed by {p.review.verifierName} on <Time iso={p.review.verifiedAt} />: {p.review.note}</p>}
      {p.verificationStatus === 'pending' && <p className="mt-3 text-[12.5px] text-cx-dim">Submitted for faculty review. In this demo, reviews are not completed automatically.</p>}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-cx-line pt-4">
        <button className="cx-btn cx-btn-sm" onClick={onEdit}><Pencil size={12} aria-hidden />Edit</button>
        {p.verificationStatus === 'unverified' && <button className="cx-btn cx-btn-sm" onClick={onReview}><Send size={12} aria-hidden />Request faculty review</button>}
        <ConfirmButton className="cx-btn cx-btn-sm cx-btn-danger" title={`Delete “${p.name}”?`} body={<>The project, its evidence links and any review are removed. Skills you added stay on your profile but lose this project as evidence.</>} confirmLabel="Delete project" onConfirm={onDelete}>
          <Trash2 size={12} aria-hidden />Delete
        </ConfirmButton>
      </div>
    </article>
  )
}

export default function ProjectsView({ startNew, skill }: { startNew?: boolean; skill?: string }) {
  const state = useDemoState()
  const projects = projectsFor(state, PRIMARY_STUDENT_ID)
  const [editing, setEditing] = useState<'new' | string | null>(startNew ? 'new' : null)
  const [flash, show] = useFlash()
  const current = editing && editing !== 'new' ? projects.find(p => p.id === editing) : undefined

  return (
    <>
      <PageHeader
        eyebrow="Projects and evidence"
        title="Projects"
        description="Projects are evidence for the skills they demonstrate. A faculty review turns that evidence into a verified claim."
        actions={<button className="cx-btn cx-btn-primary" onClick={() => setEditing('new')}><Plus size={14} aria-hidden />Add project</button>}
      />
      {projects.length ? (
        <div className="space-y-4">
          {projects.map(p => (
            <ProjectCard key={p.id} p={p}
              onEdit={() => setEditing(p.id)}
              onDelete={() => { deleteProject(p.id); show('Project deleted') }}
              onReview={() => { requestProjectReview(p.id); show('Submitted for review') }}
            />
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={<FolderKanban size={24} />} title="No projects yet" action={<button className="cx-btn cx-btn-primary" onClick={() => setEditing('new')}><Plus size={14} aria-hidden />Add your first project</button>}>Add work you have built, with the skills it shows and a link to the evidence.</EmptyState></Card>
      )}
      {editing === 'new' && (
        <ProjectForm title="Add project" initial={emptyInput(skill && state.skills.some(s => s.id === skill) ? skill : undefined)} onCancel={() => { setEditing(null); clearQuery() }}
          onSubmit={v => { addProject(PRIMARY_STUDENT_ID, v); setEditing(null); clearQuery(); show('Project added') }} />
      )}
      {current && (
        <ProjectForm key={current.id} title="Edit project" initial={toInput(current)} warnReview={current.verificationStatus === 'verified'} onCancel={() => setEditing(null)}
          onSubmit={v => { updateProject(current.id, v); setEditing(null); show('Project saved') }} />
      )}
      <Flash message={flash} />
    </>
  )
}
