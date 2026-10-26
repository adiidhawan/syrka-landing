'use client'

import { useState } from 'react'
import { CircleCheck, CircleX } from 'lucide-react'
import { ASSESSMENT_MAPPING_NOTE, type AttemptResult } from '@/lib/campus/assessments'
import { submitAssessment, ValidationError } from '@/lib/campus/store'
import type { Assessment, StudentSkill } from '@/lib/campus/types'
import { cn, Dialog, EvidenceBadge, Tag } from './ui'

/**
 * Runs a five-question sample assessment. The score is computed from the submitted answers in the browser and
 * applied to the skill through the documented mapping in lib/campus/assessments.ts.
 */
export default function AssessmentRunner({ assessment, studentId, skillBefore, open, onClose, skillAfter }: {
  assessment: Assessment
  studentId: string
  skillBefore?: StudentSkill
  skillAfter?: StudentSkill
  open: boolean
  onClose: () => void
}) {
  const [answers, setAnswers] = useState<number[]>(() => assessment.questions.map(() => -1))
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [before] = useState(skillBefore)
  const [error, setError] = useState<string | null>(null)
  const unanswered = answers.filter(a => a < 0).length

  const submit = () => {
    try {
      setResult(submitAssessment(studentId, assessment.id, answers).result)
      setError(null)
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : 'Something went wrong saving the attempt. Try again.')
    }
  }

  const footer = result
    ? <button className="cx-btn cx-btn-primary" onClick={onClose}>Done</button>
    : <>
        <span className="mr-auto self-center text-[12.5px] text-cx-dim">{unanswered ? `${unanswered} unanswered` : 'All questions answered'}</span>
        <button className="cx-btn" onClick={onClose}>Cancel</button>
        <button className="cx-btn cx-btn-accent" onClick={submit} disabled={unanswered > 0}>Submit answers</button>
      </>

  return (
    <Dialog open={open} onClose={onClose} title={assessment.title} description={`${assessment.questions.length} questions · pass mark ${assessment.passMark}% · sample assessment`} width={680} footer={footer}>
      {result && (
        <div className={cn('mb-5 rounded-[10px] p-4', result.passed ? 'bg-cx-ok-soft' : 'bg-cx-warn-soft')}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[15px] font-semibold text-cx-ink">{result.correct} of {result.total} correct · {result.score}%</div>
            <Tag tone={result.passed ? 'ok' : 'warn'}>{result.passed ? 'Passed — counts as assessment evidence' : 'Below the pass mark'}</Tag>
          </div>
          <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
            <div><div className="text-[11.5px] text-cx-dim">Before</div>{before ? <div className="flex items-center gap-2"><span className="cx-num font-medium">{before.proficiency}</span><EvidenceBadge type={before.evidenceType} /></div> : <span className="text-cx-dim">Not on profile</span>}</div>
            <div><div className="text-[11.5px] text-cx-dim">After</div>{skillAfter && <div className="flex items-center gap-2"><span className="cx-num font-medium">{skillAfter.proficiency}</span><EvidenceBadge type={skillAfter.evidenceType} /></div>}</div>
          </div>
          <p className="mt-3 text-[12.5px] text-cx-ink2">{ASSESSMENT_MAPPING_NOTE}</p>
          <p className="mt-2 text-[12px] text-cx-dim">Five questions sample one topic on one occasion. The result is evidence, not a measure of your overall ability.</p>
        </div>
      )}
      {error && <p className="mb-4 rounded-[8px] bg-cx-bad-soft px-3 py-2 text-[13px] text-cx-bad" role="alert">{error}</p>}
      <ol className="space-y-6">
        {assessment.questions.map((q, qi) => {
          const mark = result ? answers[qi] === q.correctIndex : null
          return (
            <li key={q.id}>
              <fieldset disabled={!!result}>
                <legend className="flex gap-2 text-[14px] font-medium text-cx-ink">
                  <span className="cx-num text-cx-dim">{qi + 1}.</span>
                  <span>{q.prompt}</span>
                  {mark !== null && (mark ? <CircleCheck size={16} className="ml-auto shrink-0 text-cx-ok" aria-label="Correct" /> : <CircleX size={16} className="ml-auto shrink-0 text-cx-bad" aria-label="Incorrect" />)}
                </legend>
                {q.code && <pre className="cx-mono mt-2 overflow-x-auto rounded-[8px] bg-cx-sunken p-3 text-[12.5px] leading-relaxed text-cx-ink">{q.code}</pre>}
                <div className="mt-2.5 grid gap-1.5">
                  {q.options.map((opt, oi) => {
                    const chosen = answers[qi] === oi
                    const correct = result && oi === q.correctIndex
                    const wrong = result && chosen && oi !== q.correctIndex
                    return (
                      <label key={oi} className={cn('flex cursor-pointer items-center gap-2.5 rounded-[8px] border px-3 py-2 text-[13px] transition-colors',
                        correct ? 'border-cx-ok bg-cx-ok-soft' : wrong ? 'border-cx-bad bg-cx-bad-soft' : chosen ? 'border-cx-accent bg-cx-accent-soft' : 'border-cx-line hover:border-cx-strong')}>
                        <input type="radio" name={q.id} className="h-3.5 w-3.5 border-cx-strong text-cx-accent focus:ring-cx-accent" checked={chosen} onChange={() => setAnswers(a => a.map((v, i) => (i === qi ? oi : v)))} />
                        <span className={q.code || /[()[\]"=]/.test(opt) ? 'cx-mono text-[12.5px]' : undefined}>{opt}</span>
                      </label>
                    )
                  })}
                </div>
                {result && <p className="mt-2 text-[12.5px] text-cx-ink2"><span className="font-medium">{mark ? 'Correct.' : `Answer: ${q.options[q.correctIndex]}.`}</span> {q.explanation}</p>}
              </fieldset>
            </li>
          )
        })}
      </ol>
    </Dialog>
  )
}
