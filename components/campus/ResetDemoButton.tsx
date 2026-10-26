'use client'

import { RotateCcw } from 'lucide-react'
import { resetDemo } from '@/lib/campus/store'
import { ConfirmButton, Flash, useFlash } from './ui'

export default function ResetDemoButton({ className = 'cx-btn' }: { className?: string }) {
  const [flash, show] = useFlash()
  return (
    <>
      <ConfirmButton
        className={className}
        title="Reset the demo?"
        body={<>This restores every student, project, assessment, shortlist and note to the original fictional dataset. Changes you made in this browser will be lost.</>}
        confirmLabel="Reset demo data"
        onConfirm={() => { resetDemo(); show('Demo data restored') }}
      >
        <RotateCcw size={14} aria-hidden /> Reset demo data
      </ConfirmButton>
      <Flash message={flash} />
    </>
  )
}
