import { SCHEMA_VERSION } from './seed'
import type { DemoState } from './types'

/**
 * Upgrades a visitor's saved demo state to the current schema without discarding their own work. Returns null when
 * the saved state is too old or malformed to upgrade, in which case the store starts again from the seed.
 *
 * v3 → v4: removes the seeded student activity and the illustrative proficiency history (neither came from the
 * visitor), and adds the collections for saved and dismissed opportunities, saved missions and connected repositories.
 */
export function migrateState(raw: unknown): DemoState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (s.schemaVersion === SCHEMA_VERSION) return s as unknown as DemoState
  if (s.schemaVersion !== 3 || !Array.isArray(s.students) || !Array.isArray(s.activity)) return null

  // Seeded events used the seed's short counter ids (act-0xx); anything the visitor did has a longer timestamp id.
  const seededStudentEvent = (a: { id?: unknown; actor?: unknown }) => a.actor === 'student' && typeof a.id === 'string' && /^act-[0-9a-z]{3}$/.test(a.id)
  const { skillHistory: _dropped, ...rest } = s
  void _dropped
  return {
    ...(rest as unknown as DemoState),
    schemaVersion: SCHEMA_VERSION,
    activity: (s.activity as DemoState['activity']).filter(a => !seededStudentEvent(a)),
    savedOpportunities: [],
    dismissedOpportunities: [],
    savedMissions: [],
    connectedRepos: [],
  }
}
