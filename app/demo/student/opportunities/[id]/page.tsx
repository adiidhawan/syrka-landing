import OpportunityDetailView from '@/components/campus/views/OpportunityDetailView'

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OpportunityDetailView id={id} />
}
