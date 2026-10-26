import StudentDashboardView from '@/components/campus/views/StudentDashboardView'
import { getLandscape, getMarketDemand } from '@/lib/campus/external.server'

// Re-render hourly so freshness checks run even while the underlying data is cached for longer.
export const revalidate = 3600

export default async function StudentDashboardPage() {
  const [market, landscape] = await Promise.all([getMarketDemand(), getLandscape()])
  return <StudentDashboardView market={market} landscape={landscape} />
}
