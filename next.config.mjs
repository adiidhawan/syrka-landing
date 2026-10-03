import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root: a stray lockfile in a parent directory otherwise makes Turbopack guess the wrong one.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
}

export default nextConfig
