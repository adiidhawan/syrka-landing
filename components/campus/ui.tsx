'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { BadgeCheck, Building2, Circle, CircleDot, ClipboardCheck, FolderKanban, GraduationCap, UserRound, X } from 'lucide-react'
import type { EvidenceType, VerificationStatus } from '@/lib/campus/types'
import { EVIDENCE_LABEL, initials } from '@/lib/campus/queries'

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="cx-eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="text-[24px] font-semibold leading-tight text-cx-ink md:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] text-cx-dim">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, description, action, children, className, padded = true, id }: {
  title?: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean; id?: string
}) {
  return (
    <section id={id} className={cn('cx-card', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-cx-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-[14px] font-semibold text-cx-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[12.5px] text-cx-dim">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </section>
  )
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <div className="text-[12.5px] text-cx-dim">{label}</div>
      <div className="cx-num mt-1 text-[26px] font-semibold leading-none tracking-tight text-cx-ink">{value}</div>
      {hint && <div className="mt-2 text-[12px] text-cx-dim">{hint}</div>}
    </>
  )
  return href
    ? <Link href={href} className="cx-card block p-4 transition-colors hover:border-cx-strong">{body}</Link>
    : <div className="cx-card p-4">{body}</div>
}

export function DemoBadge({ className }: { className?: string }) {
  return <span className={cn('cx-chip cx-mono bg-cx-warn-soft !text-[10.5px] uppercase tracking-wider text-cx-warn', className)} style={{ borderColor: '#ecd9ab' }}>Demo</span>
}

const EVIDENCE_STYLE: Record<EvidenceType, { cls: string; Icon: typeof Circle }> = {
  self_reported: { cls: 'bg-cx-sunken text-cx-ink2', Icon: UserRound },
  assessment_verified: { cls: 'bg-cx-accent-soft text-cx-accent-ink', Icon: ClipboardCheck },
  project_demonstrated: { cls: 'bg-cx-info-soft text-cx-info', Icon: FolderKanban },
  institution_verified: { cls: 'bg-cx-ok-soft text-cx-ok', Icon: GraduationCap },
  employer_verified: { cls: 'bg-cx-ok-soft text-cx-ok', Icon: Building2 },
}

export function EvidenceBadge({ type, compact = false }: { type: EvidenceType; compact?: boolean }) {
  const { cls, Icon } = EVIDENCE_STYLE[type]
  return (
    <span className={cn('cx-chip', cls)} title={EVIDENCE_LABEL[type]}>
      <Icon size={12} aria-hidden />
      {compact ? <span className="sr-only">{EVIDENCE_LABEL[type]}</span> : EVIDENCE_LABEL[type]}
    </span>
  )
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === 'verified') return <span className="cx-chip bg-cx-ok-soft text-cx-ok"><BadgeCheck size={12} aria-hidden />Verified</span>
  if (status === 'pending') return <span className="cx-chip bg-cx-warn-soft text-cx-warn"><CircleDot size={12} aria-hidden />Review pending</span>
  return <span className="cx-chip border-cx-line bg-transparent text-cx-dim" style={{ borderColor: 'var(--cx-line-strong)' }}><Circle size={11} aria-hidden />Unverified</span>
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' }) {
  const tones = { neutral: 'bg-cx-sunken text-cx-ink2', accent: 'bg-cx-accent-soft text-cx-accent-ink', ok: 'bg-cx-ok-soft text-cx-ok', warn: 'bg-cx-warn-soft text-cx-warn', bad: 'bg-cx-bad-soft text-cx-bad' }
  return <span className={cn('cx-chip', tones[tone])}>{children}</span>
}

/** Horizontal proficiency bar. `marker` draws a required-level tick. */
export function Meter({ value, marker, tone = 'accent', label }: { value: number; marker?: number; tone?: 'accent' | 'ink' | 'muted'; label?: string }) {
  const color = tone === 'accent' ? 'var(--cx-accent)' : tone === 'ink' ? 'var(--cx-ink)' : 'var(--cx-faint)'
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="relative h-1.5 w-full rounded-full bg-cx-sunken" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label}>
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${v}%`, background: color }} />
      {marker !== undefined && <div className="absolute -top-1 h-3.5 w-0.5 rounded bg-cx-ink" style={{ left: `calc(${marker}% - 1px)` }} title={`Required level ${marker}`} />}
    </div>
  )
}

export function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const tone = score >= 75 ? 'text-cx-ok bg-cx-ok-soft' : score >= 50 ? 'text-cx-accent-ink bg-cx-accent-soft' : 'text-cx-ink2 bg-cx-sunken'
  const dims = size === 'lg' ? 'h-16 min-w-16 text-[26px] rounded-[14px] px-3' : size === 'sm' ? 'h-7 min-w-11 text-[13px] rounded-[7px] px-1.5' : 'h-10 min-w-14 text-[17px] rounded-[10px] px-2'
  return (
    <div className={cn('cx-num inline-flex shrink-0 items-center justify-center font-semibold', tone, dims)} aria-label={`${score}% requirement alignment`}>
      {score}<span className="ml-px text-[0.6em] font-medium opacity-70">%</span>
    </div>
  )
}

export function Avatar({ name, size = 36, hue }: { name: string; size?: number; hue?: number }) {
  const h = hue ?? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${h} 45% 92%)`, color: `hsl(${h} 45% 28%)` }}>
      {initials(name)}
    </div>
  )
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon && <div className="mb-3 text-cx-faint">{icon}</div>}
      <div className="text-[14px] font-semibold text-cx-ink">{title}</div>
      {children && <div className="mt-1 max-w-sm text-[13px] text-cx-dim">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode; disabled?: boolean }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[13.5px] font-medium text-cx-ink">{label}</label>
        {description && <div className="mt-0.5 text-[12.5px] text-cx-dim">{description}</div>}
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-cx-accent' : 'bg-cx-strong')}
      >
        <span className={cn('absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[19px]' : 'translate-x-[3px]')} />
      </button>
    </div>
  )
}

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[12.5px] font-medium text-cx-ink2">{label}</label>
      {children}
      {error ? <p className="mt-1 text-[12px] text-cx-bad" role="alert">{error}</p> : hint ? <p className="mt-1 text-[12px] text-cx-dim">{hint}</p> : null}
    </div>
  )
}

/** Modal or right-hand drawer built on the native <dialog> element (focus trapping and Esc come for free). */
export function Dialog({ open, onClose, title, description, children, footer, variant = 'modal', width = 560 }: {
  open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; variant?: 'modal' | 'drawer' | 'drawer-left'; width?: number
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const position = variant === 'drawer'
    ? 'm-0 ml-auto h-[100dvh] max-h-[100dvh] w-full'
    : variant === 'drawer-left'
      ? 'm-0 mr-auto h-[100dvh] max-h-[100dvh] w-[86%]'
      : 'm-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)]'
  return (
    <dialog
      ref={ref}
      className={cn('cx-dialog', position)}
      style={{ maxWidth: width }}
      onClose={onClose}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {open && (
        <div className={cn('flex flex-col bg-cx-surface shadow-2xl', variant !== 'modal' ? 'h-full' : 'max-h-[calc(100dvh-32px)] rounded-[14px]')}>
          <header className="flex items-start justify-between gap-4 border-b border-cx-line px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-cx-ink">{title}</h2>
              {description && <p className="mt-0.5 text-[13px] text-cx-dim">{description}</p>}
            </div>
            <button type="button" className="cx-btn cx-btn-ghost cx-btn-sm -mr-1" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-cx-line px-5 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}

/** A button that asks for confirmation in a dialog before running a destructive action. */
export function ConfirmButton({ children, title, body, confirmLabel, onConfirm, className, danger = true }: {
  children: ReactNode; title: string; body: ReactNode; confirmLabel: string; onConfirm: () => void; className?: string; danger?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={className ?? 'cx-btn'} onClick={() => setOpen(true)}>{children}</button>
      <Dialog
        open={open} onClose={() => setOpen(false)} title={title} width={440}
        footer={<>
          <button type="button" className="cx-btn" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className={cn('cx-btn', danger ? 'cx-btn-danger-solid' : 'cx-btn-primary')} onClick={() => { onConfirm(); setOpen(false) }}>{confirmLabel}</button>
        </>}
      >
        <div className="text-[13.5px] text-cx-ink2">{body}</div>
      </Dialog>
    </>
  )
}

/** Small transient confirmation message ("Saved"). */
export function useFlash(ms = 2200): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return [msg, (m: string) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(null), ms) }]
}

export function Flash({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      {message && <div className="rounded-[10px] bg-cx-ink px-4 py-2 text-[13px] text-white shadow-lg">{message}</div>}
    </div>
  )
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', opts)
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`
  return formatDate(iso)
}

/** A date or relative time. Rendered with suppressHydrationWarning because it depends on the visitor's clock and zone. */
export function Time({ iso, relative = false, className }: { iso: string; relative?: boolean; className?: string }) {
  return <time dateTime={iso} className={className} suppressHydrationWarning>{relative ? timeAgo(iso) : formatDate(iso)}</time>
}

/** Drops one-shot query parameters (?new=1, ?assess=sql) once their dialog has closed, so a refresh does not reopen it. */
export function clearQuery() {
  if (window.location.search) window.history.replaceState(null, '', window.location.pathname)
}
