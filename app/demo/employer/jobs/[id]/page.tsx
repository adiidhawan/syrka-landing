import JobDetailView from '@/components/campus/views/JobDetailView'

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <JobDetailView id={id} />
}
