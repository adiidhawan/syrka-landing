'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, Check, Eye, MessageSquare, Trash2 } from 'lucide-react'
import { PRIMARY_COMPANY_ID } from '@/lib/campus/seed'
import { addEmployerNote, deleteEmployerNote, markReviewed, toggleShortlist, useDemoState, ValidationError } from '@/lib/campus/store'
import { cn, Dialog, Field, Time } from './ui'

export function useCandidateStatus(studentId: string, jobId: string) {
  const state = useDemoState()
  return {
    shortlisted: state.shortlists.some(s => s.companyId === PRIMARY_COMPANY_ID && s.studentId === studentId && s.jobId === jobId),
    reviewed: state.reviews.some(r => r.companyId === PRIMARY_COMPANY_ID && r.studentId === studentId),
    notes: state.notes.filter(n => n.companyId === PRIMARY_COMPANY_ID && n.studentId === studentId),
  }
}

export function NotesList({ studentId }: { studentId: string }) {
  const { notes } = useCandidateStatus(studentId, '')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const save = () => {
    try { addEmployerNote(PRIMARY_COMPANY_ID, studentId, body); setBody(''); setError(null) } catch (e) { setError(e instanceof ValidationError ? e.message : 'Could not save the note.') }
  }
  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); save() }}>
        <Field label="Add an internal note" htmlFor={`note-${studentId}`} error={error ?? undefined} hint="Visible to your hiring team only. Never shown to the candidate.">
          <textarea id={`note-${studentId}`} rows={3} className="cx-textarea" value={body} onChange={e => setBody(e.target.value)} aria-invalid={!!error} />
        </Field>
        <button type="submit" className="cx-btn cx-btn-sm mt-2">Save note</button>
      </form>
      <ul className="mt-4 space-y-2">
        {notes.map(n => (
          <li key={n.id} className="rounded-[8px] bg-cx-sunken px-3 py-2 text-[13px]">
            <div className="text-cx-ink">{n.body}</div>
            <div className="mt-1 flex items-center justify-between text-[11.5px] text-cx-dim"><Time iso={n.createdAt} relative /><button className="inline-flex items-center gap-1 hover:text-cx-bad" onClick={() => deleteEmployerNote(n.id)} aria-label="Delete note"><Trash2 size={11} />Delete</button></div>
          </li>
        ))}
        {!notes.length && <li className="text-[12.5px] text-cx-dim">No notes yet.</li>}
      </ul>
    </div>
  )
}

/** Shortlist (for the selected job), mark reviewed and add notes. Every action is persisted and logged. */
export default function CandidateActions({ studentId, jobId, jobTitle, size = 'sm', showNotes = true }: { studentId: string; jobId: string; jobTitle?: string; size?: 'sm' | 'md'; showNotes?: boolean }) {
  const { shortlisted, reviewed, notes } = useCandidateStatus(studentId, jobId)
  const [notesOpen, setNotesOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const btn = cn('cx-btn', size === 'sm' && 'cx-btn-sm')
  const run = (fn: () => void) => { try { fn(); setError(null) } catch (e) { setError(e instanceof Error ? e.message : 'Action failed') } }
  return (
    <>
      <button className={cn(btn, shortlisted && 'cx-btn-accent')} aria-pressed={shortlisted} onClick={() => run(() => toggleShortlist(PRIMARY_COMPANY_ID, jobId, studentId))} title={jobTitle ? `${shortlisted ? 'Remove from' : 'Add to'} the ${jobTitle} shortlist` : undefined}>
        {shortlisted ? <BookmarkCheck size={13} aria-hidden /> : <Bookmark size={13} aria-hidden />}{shortlisted ? 'Shortlisted' : 'Shortlist'}
      </button>
      <button className={btn} disabled={reviewed} onClick={() => run(() => markReviewed(PRIMARY_COMPANY_ID, studentId))}>
        {reviewed ? <Check size={13} aria-hidden /> : <Eye size={13} aria-hidden />}{reviewed ? 'Reviewed' : 'Mark reviewed'}
      </button>
      {showNotes && (
        <>
          <button className={btn} onClick={() => setNotesOpen(true)}><MessageSquare size={13} aria-hidden />Notes{notes.length ? ` (${notes.length})` : ''}</button>
          <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} title="Internal notes" description="Demo notes for your hiring team." width={480}><NotesList studentId={studentId} /></Dialog>
        </>
      )}
      {error && <span className="basis-full text-[12px] text-cx-bad" role="alert">{error}</span>}
    </>
  )
}
