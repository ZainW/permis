import { createFileRoute } from '@tanstack/react-router'
import { source } from '@/lib/source'
import { createFromSource } from 'fumadocs-core/search/server'

const searchServer = createFromSource(source, { language: 'english' })

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => searchServer.GET(request),
    },
  },
})
