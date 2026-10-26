import { NextResponse, type NextRequest } from 'next/server'
import { fetchRepoMetadata, parseRepoRef, RateLimitedError } from '@/lib/campus/github'

/**
 * Read-only public metadata for a repository a student links to a project. Only the repository name is sent to
 * GitHub; nothing about the student is. Private or missing repositories return 404.
 */
export async function GET(request: NextRequest) {
  const repo = parseRepoRef(request.nextUrl.searchParams.get('repo') ?? '')
  if (!repo) return NextResponse.json({ error: 'Enter a public repository as owner/name or a github.com link.' }, { status: 400 })
  try {
    const meta = await fetchRepoMetadata(repo, { token: process.env.GITHUB_TOKEN || undefined })
    if (!meta) return NextResponse.json({ error: 'No public repository found with that name.' }, { status: 404 })
    return NextResponse.json(meta, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (e instanceof RateLimitedError) return NextResponse.json({ error: 'GitHub’s rate limit has been reached. Try again later.', resetAt: e.resetAt }, { status: 429 })
    return NextResponse.json({ error: 'GitHub could not be reached. Try again shortly.' }, { status: 502 })
  }
}
