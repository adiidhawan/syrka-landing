import SkillsView from '@/components/campus/views/SkillsView'
import { getMarketDemand } from '@/lib/campus/external.server'

export default async function SkillsPage({ searchParams }: { searchParams: Promise<{ assess?: string; add?: string }> }) {
  const [{ assess, add }, market] = await Promise.all([searchParams, getMarketDemand()])
  return <SkillsView initialAssess={assess} initialAdd={add} market={market} />
}
