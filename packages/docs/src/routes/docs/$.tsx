import { createFileRoute, notFound } from '@tanstack/react-router'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { createServerFn } from '@tanstack/react-start'
import { source } from '@/lib/source'
import browserCollections from 'collections/browser'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import { baseOptions } from '@/lib/layout.shared'
import { useMDXComponents } from '@/components/mdx'
import { Suspense } from 'react'

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? []
    const data = await serverLoader({ data: slugs })
    return data
  },
})

const serverLoader = createServerFn({ method: 'GET' })
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs)
    if (!page) throw notFound()
    return {
      path: page.path,
      pageTree: source.getPageTree(),
    }
  })

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    _props: undefined,
  ) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const { path, pageTree } = Route.useLoaderData()
  const Component = clientLoader.getComponent(path)
  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Suspense fallback={<div>Loading...</div>}>
        <Component />
      </Suspense>
    </DocsLayout>
  )
}
