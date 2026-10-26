'use client'

import { useState } from 'react'
import { cn } from './ui'

/**
 * Small dependency-free charts for the demo. Single-series bars use the accent; the multi-series line chart uses
 * the validated categorical order (--cx-series-1..3), always with a legend and direct end labels so identity never
 * relies on colour alone. Every chart has a hover readout and a visually hidden table.
 */

export interface BarDatum { key: string; label: string; value: number; secondary?: number; note?: string }

/** Ranked horizontal bars. `secondary` draws an inner portion (e.g. the verified share of a count). */
export function BarList({ data, max, unit = '', secondaryLabel, caption }: { data: BarDatum[]; max?: number; unit?: string; secondaryLabel?: string; caption: string }) {
  const [hover, setHover] = useState<string | null>(null)
  const top = max ?? Math.max(1, ...data.map(d => d.value))
  if (!data.length) return <p className="py-6 text-center text-[13px] text-cx-dim">No data yet.</p>
  return (
    <figure>
      <ul className="space-y-2.5" onMouseLeave={() => setHover(null)}>
        {data.map(d => (
          <li key={d.key} className="group" onMouseEnter={() => setHover(d.key)} onFocus={() => setHover(d.key)} tabIndex={0} aria-label={`${d.label}: ${d.value}${unit}${d.secondary !== undefined ? `, ${d.secondary} ${secondaryLabel}` : ''}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className={cn('truncate', hover === d.key ? 'text-cx-ink' : 'text-cx-ink2')}>{d.label}</span>
              <span className="cx-num shrink-0 text-cx-dim">
                {hover === d.key && d.secondary !== undefined && <span className="mr-2">{d.secondary} {secondaryLabel}</span>}
                <span className="font-medium text-cx-ink">{d.value}{unit}</span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-cx-sunken">
              <div className="absolute inset-y-0 left-0 rounded-full transition-opacity" style={{ width: `${(d.value / top) * 100}%`, background: 'var(--cx-accent)', opacity: hover && hover !== d.key ? 0.45 : d.secondary !== undefined ? 0.35 : 1 }} />
              {d.secondary !== undefined && <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(d.secondary / top) * 100}%`, background: 'var(--cx-accent)', opacity: hover && hover !== d.key ? 0.55 : 1 }} />}
            </div>
          </li>
        ))}
      </ul>
      {secondaryLabel && (
        <figcaption className="mt-3 flex items-center gap-4 text-[11.5px] text-cx-dim">
          <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ background: 'var(--cx-accent)' }} />{secondaryLabel}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ background: 'var(--cx-accent)', opacity: 0.35 }} />Total</span>
        </figcaption>
      )}
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>{data.map(d => <tr key={d.key}><th>{d.label}</th><td>{d.value}{unit}</td>{d.secondary !== undefined && <td>{d.secondary} {secondaryLabel}</td>}</tr>)}</tbody>
      </table>
    </figure>
  )
}

export interface LineSeries { key: string; name: string; points: { x: string; y: number }[] }

const SERIES_COLORS = ['var(--cx-series-1)', 'var(--cx-series-2)', 'var(--cx-series-3)']

/** Multi-series line chart over shared x labels (up to three series), with crosshair readout. */
export function LineChart({ series, xLabels, yMin = 0, yMax = 100, caption, formatX = (x: string) => x }: {
  series: LineSeries[]; xLabels: string[]; yMin?: number; yMax?: number; caption: string; formatX?: (x: string) => string
}) {
  const [hi, setHi] = useState<number | null>(null)
  const W = 640, H = 220, L = 34, R = 70, T = 12, B = 26
  const x = (i: number) => L + (xLabels.length <= 1 ? 0 : (i / (xLabels.length - 1)) * (W - L - R))
  const y = (v: number) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B)
  const ticks = [yMin, (yMin + yMax) / 2, yMax]
  const shown = series.slice(0, SERIES_COLORS.length)

  // Direct labels at the line ends, nudged apart so they never overlap.
  const ends = shown.map((s, i) => ({ i, name: s.name, y: y(s.points[s.points.length - 1]?.y ?? yMin) })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 14) ends[k].y = ends[k - 1].y + 14

  return (
    <figure>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-cx-ink2" aria-hidden>
        {shown.map((s, i) => <span key={s.key} className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES_COLORS[i] }} />{s.name}</span>)}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={caption}
          onMouseLeave={() => setHi(null)}
          onMouseMove={e => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
            const px = ((e.clientX - r.left) / r.width) * W
            const idx = Math.round(((px - L) / (W - L - R)) * (xLabels.length - 1))
            setHi(Math.max(0, Math.min(xLabels.length - 1, idx)))
          }}
        >
          {ticks.map(t => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--cx-grid)" strokeWidth={1} />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--cx-dim)">{t}</text>
            </g>
          ))}
          {xLabels.map((lab, i) => <text key={lab} x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--cx-dim)">{formatX(lab)}</text>)}
          {hi !== null && <line x1={x(hi)} x2={x(hi)} y1={T} y2={H - B} stroke="var(--cx-line-strong)" strokeWidth={1} />}
          {shown.map((s, si) => {
            const pts = s.points.map(p => ({ i: xLabels.indexOf(p.x), y: p.y })).filter(p => p.i >= 0)
            return (
              <g key={s.key}>
                <polyline fill="none" stroke={SERIES_COLORS[si]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={pts.map(p => `${x(p.i)},${y(p.y)}`).join(' ')} />
                {hi !== null && pts.filter(p => p.i === hi).map(p => <circle key={p.i} cx={x(p.i)} cy={y(p.y)} r={4.5} fill={SERIES_COLORS[si]} stroke="var(--cx-surface)" strokeWidth={2} />)}
              </g>
            )
          })}
          {ends.map(e => <text key={e.i} x={W - R + 8} y={e.y + 4} fontSize={11} fill="var(--cx-ink-2)">{shown[e.i].name}</text>)}
        </svg>
        {hi !== null && (
          <div className="pointer-events-none absolute top-0 rounded-[8px] border border-cx-line bg-cx-surface px-2.5 py-1.5 text-[12px] shadow-md" style={{ left: `${(x(hi) / W) * 100}%`, transform: `translateX(${hi > xLabels.length / 2 ? '-110%' : '10%'})` }}>
            <div className="mb-0.5 font-medium text-cx-ink">{formatX(xLabels[hi])}</div>
            {shown.map((s, si) => {
              const p = s.points.find(pt => pt.x === xLabels[hi])
              return p ? <div key={s.key} className="flex items-center gap-1.5 text-cx-ink2"><span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[si] }} />{s.name}<span className="cx-num ml-auto pl-3 font-medium text-cx-ink">{p.y}</span></div> : null
            })}
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th>Date</th>{shown.map(s => <th key={s.key}>{s.name}</th>)}</tr></thead>
        <tbody>{xLabels.map(lab => <tr key={lab}><th>{formatX(lab)}</th>{shown.map(s => <td key={s.key}>{s.points.find(p => p.x === lab)?.y ?? '—'}</td>)}</tr>)}</tbody>
      </table>
    </figure>
  )
}
