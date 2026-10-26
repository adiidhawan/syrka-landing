import { ExternalLink } from 'lucide-react'
import { Card, PageHeader, Tag, Time } from '@/components/campus/ui'
import { getLandscape, getMissions } from '@/lib/campus/external.server'
import { getLiveState } from '@/lib/campus/live-jobs.server'
import { parsePartnerBoards } from '@/lib/campus/live-jobs'
import { snapshotStoreKind } from '@/lib/campus/snapshot-store'
import { DATA_SOURCES, type SourceKey } from '@/lib/campus/sources'

export const revalidate = 3600

export default async function DataSourcesPage() {
  const [live, missions, landscape] = await Promise.all([getLiveState(), getMissions(), getLandscape()])
  const partners = parsePartnerBoards(process.env.CAMPUS_PARTNER_BOARDS)
  const history = snapshotStoreKind()
  const status: Record<SourceKey, { label: string; tone: 'ok' | 'warn' | 'neutral'; at?: string }> = {
    himalayas: live.status === 'live' ? { label: 'Live', tone: 'ok', at: live.data.fetchedAt } : { label: live.status === 'disabled' ? 'Switched off' : live.status === 'stale' ? 'Stale, hidden' : 'Unavailable', tone: 'warn' },
    partner_boards: partners.length ? { label: `${partners.length} partner${partners.length > 1 ? 's' : ''} enabled`, tone: 'ok' } : { label: 'Off (no partners configured)', tone: 'neutral' },
    github: missions.status === 'live' ? { label: 'Live', tone: 'ok', at: missions.data.fetchedAt } : { label: missions.rateLimitedUntil ? 'Rate limited' : 'Unavailable', tone: 'warn' },
    openalex: { label: process.env.OPENALEX_API_KEY ? 'On request (API key set)' : 'On request (shared free allowance)', tone: 'neutral' },
    onet: { label: 'Internal mapping, O*NET 31.0', tone: 'neutral' },
    worldbank: landscape.status === 'live' ? { label: 'Live', tone: 'ok', at: landscape.fetchedAt } : { label: 'Unavailable or stale', tone: 'warn' },
  }
  return (
    <>
      <PageHeader
        eyebrow="Data sources"
        title="Where external data comes from"
        description="Every external module names its source and refresh time. External data describes the job market, open work or national context; it never changes your skills, verification, project evidence, assessments or scores."
      />
      <div className="space-y-4">
        {DATA_SOURCES.map(s => {
          const st = status[s.key]
          return (
            <Card key={s.key} title={<a href={s.homepage} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline-offset-2 hover:underline">{s.name}<ExternalLink size={12} aria-hidden /></a>} action={<Tag tone={st.tone}>{st.label}</Tag>}>
              <dl className="grid gap-x-6 gap-y-3 text-[13px] md:grid-cols-2">
                <div><dt className="cx-eyebrow mb-0.5">Used for</dt><dd className="text-cx-ink2">{s.usedFor}</dd></div>
                <div><dt className="cx-eyebrow mb-0.5">Never used for</dt><dd className="text-cx-ink2">{s.neverUsedFor}</dd></div>
                <div><dt className="cx-eyebrow mb-0.5">Licence</dt><dd><a href={s.licenceUrl} target="_blank" rel="noreferrer noopener" className="text-cx-accent-ink underline underline-offset-2">{s.licence}</a></dd></div>
                <div><dt className="cx-eyebrow mb-0.5">Refresh</dt><dd className="text-cx-ink2">{s.refresh}{st.at && <> Last refreshed <Time iso={st.at} relative />.</>}</dd></div>
                <div className="md:col-span-2"><dt className="cx-eyebrow mb-0.5">Attribution</dt><dd className="text-cx-ink2">{s.attribution}</dd></div>
              </dl>
            </Card>
          )
        })}
        <Card title="Market-demand history">
          <p className="text-[13px] text-cx-ink2">
            {history === 'redis' ? 'Daily snapshots of aggregate skill demand are kept in the configured key-value store for 40 days, so weekly changes can be shown.'
              : history === 'file' ? 'Local development: daily snapshots are written to .data/ on this machine.'
                : 'No snapshot store is configured, so only current demand is shown and no weekly change is calculated.'}
          </p>
        </Card>
      </div>
    </>
  )
}
