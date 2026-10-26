import MissionsView from '@/components/campus/views/MissionsView'
import { getMissions } from '@/lib/campus/external.server'

export const revalidate = 3600

export default async function MissionsPage() {
  return <MissionsView state={await getMissions()} />
}
