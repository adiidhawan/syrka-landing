'use client'

import { useState } from 'react'
import { Copy, CopyCheck, Eye, Lock } from 'lucide-react'
import { employerCandidate } from '@/lib/campus/queries'
import { setEmployerVisibility, setSectionVisibility, useDemoState } from '@/lib/campus/store'
import type { Student } from '@/lib/campus/types'
import CandidateProfile, { CandidateHeader } from './CandidateProfile'
import { Dialog, Switch } from './ui'

const SECTIONS: { key: keyof Student['visibility']['sections']; label: string; description: string }[] = [
  { key: 'projects', label: 'Projects and evidence links', description: 'Project write-ups, reviews and links. Also used as project evidence in matching.' },
  { key: 'assessments', label: 'Assessment results', description: 'Assessment-verified scores. When off, those skills show your self-rating, unverified.' },
  { key: 'education', label: 'Education and academic record', description: 'Degree, CGPA and course highlights. CGPA is never used in matching.' },
  { key: 'achievements', label: 'Achievements', description: 'Competitions, certificates and activities.' },
]

export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false)
  return [copied, (text: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }, () => setCopied(false))
  }]
}

/** Visibility switch, per-section sharing, shareable link and a preview of exactly what employers see. */
export default function SharingPanel({ studentId, showSections = true }: { studentId: string; showSections?: boolean }) {
  const state = useDemoState()
  const student = state.students.find(s => s.id === studentId)
  const [preview, setPreview] = useState(false)
  const [copied, copy] = useCopy()
  if (!student) return null
  const visible = student.visibility.employerVisible
  const shareUrl = `/demo/employer/candidates/${student.id}`
  // The preview is built through the same access-controlled read the employer portal uses.
  const employerView = employerCandidate(state, student.id)

  return (
    <div className="space-y-5">
      <Switch
        label="Visible to employers"
        description={visible ? 'Employers on SYRKA Campus can find you in candidate search and open your profile.' : 'Your profile is private. It does not appear in employer search and the link below will not open it.'}
        checked={visible}
        onChange={v => setEmployerVisibility(student.id, v)}
      />
      {showSections && (
        <fieldset className="space-y-4 border-t border-cx-line pt-5" disabled={!visible}>
          <legend className="cx-eyebrow mb-3">Sections shared with employers</legend>
          {SECTIONS.map(s => (
            <Switch key={s.key} label={s.label} description={s.description} checked={student.visibility.sections[s.key]} disabled={!visible} onChange={v => setSectionVisibility(student.id, s.key, v)} />
          ))}
          <p className="text-[12px] text-cx-dim">Your name, degree, university, graduation year, preferred role, bio and skills are always included when your profile is visible.</p>
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2 border-t border-cx-line pt-5">
        <button type="button" className="cx-btn" onClick={() => copy(`${window.location.origin}${shareUrl}`)} disabled={!visible}>
          {copied ? <CopyCheck size={14} aria-hidden /> : <Copy size={14} aria-hidden />}{copied ? 'Link copied' : 'Copy demo profile link'}
        </button>
        <button type="button" className="cx-btn" onClick={() => setPreview(true)}><Eye size={14} aria-hidden />Preview as an employer</button>
      </div>
      <Dialog open={preview} onClose={() => setPreview(false)} title="What employers see" description="Built from the same access-controlled view the employer portal uses." variant="drawer" width={720}>
        {employerView ? (
          <><CandidateHeader c={employerView} /><div className="mt-6"><CandidateProfile c={employerView} /></div></>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <Lock size={22} className="text-cx-faint" aria-hidden />
            <div className="mt-3 text-[14px] font-semibold">Nothing is visible</div>
            <p className="mt-1 max-w-sm text-[13px] text-cx-dim">Your profile is private, so employers cannot find or open it. Turn on employer visibility to share it.</p>
          </div>
        )}
      </Dialog>
    </div>
  )
}
