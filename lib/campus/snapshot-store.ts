import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DemandSnapshot } from './market-demand'

/**
 * Where daily market-demand snapshots are kept, so demand can be compared week on week:
 * - a Redis REST store (Vercel KV / Upstash) when KV_REST_API_URL + KV_REST_API_TOKEN, or
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, are set — no client library needed;
 * - otherwise, in local development, a JSON file under .data/ (git-ignored);
 * - otherwise none, and the dashboard shows current demand only.
 * Snapshots hold aggregate counts per skill, never job postings or anything about a student.
 */

const KEEP_DAYS = 40
const FILE = join(process.cwd(), '.data', 'campus-demand-snapshots.json')
const keyFor = (date: string) => `campus:demand:${date}`

export type SnapshotStoreKind = 'redis' | 'file' | 'none'

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

export function snapshotStoreKind(): SnapshotStoreKind {
  if (redisConfig()) return 'redis'
  return process.env.NODE_ENV === 'production' || process.env.VERCEL ? 'none' : 'file'
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const cfg = redisConfig()!
  const res = await fetch(cfg.url, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8_000),
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`Snapshot store HTTP ${res.status}`)
  return ((await res.json()) as { result?: unknown }).result
}

function lastDates(days: number, from = new Date()): string[] {
  return Array.from({ length: days }, (_, i) => new Date(from.getTime() - i * 86_400_000).toISOString().slice(0, 10))
}

async function readFileStore(): Promise<DemandSnapshot[]> {
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as DemandSnapshot[]
  } catch {
    return []
  }
}

/** Snapshots from the last 10 days, newest first. Never throws: no history simply means no trend. */
export async function readSnapshots(): Promise<DemandSnapshot[]> {
  try {
    const kind = snapshotStoreKind()
    if (kind === 'redis') {
      const values = await redis(['MGET', ...lastDates(10).map(keyFor)]) as (string | null)[]
      return (values ?? []).flatMap(v => (v ? [JSON.parse(v) as DemandSnapshot] : []))
    }
    if (kind === 'file') return (await readFileStore()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
  } catch {
    // Fall through: history unavailable.
  }
  return []
}

/** Stores one snapshot per UTC day (a later run the same day replaces it). Returns where it was stored. */
export async function writeSnapshot(snapshot: DemandSnapshot): Promise<SnapshotStoreKind> {
  const kind = snapshotStoreKind()
  if (kind === 'redis') {
    await redis(['SET', keyFor(snapshot.date), JSON.stringify(snapshot), 'EX', KEEP_DAYS * 86_400])
  } else if (kind === 'file') {
    const cutoff = lastDates(KEEP_DAYS).at(-1)!
    const rest = (await readFileStore()).filter(s => s.date !== snapshot.date && s.date >= cutoff)
    await mkdir(join(process.cwd(), '.data'), { recursive: true })
    await writeFile(FILE, JSON.stringify([snapshot, ...rest], null, 1))
  }
  return kind
}
