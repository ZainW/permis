import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";
import type { Root } from "fumadocs-core/page-tree";

interface LoaderData {
  path: string;
  title: string;
  pageTree: Root;
}

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }): Promise<LoaderData> => {
    const slugs = params._splat?.split("/") ?? [];
    const page = source.getPage(slugs);
    if (!page) throw notFound();
    return {
      path: page.path,
      title: (page.data.title as string) ?? "Untitled",
      pageTree: source.getPageTree(),
    };
  },
});

function Page() {
  const data = Route.useLoaderData();

  return (
    <DocsLayout {...baseOptions()} tree={data.pageTree}>
      <article className="prose py-6 px-4">
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <p>Docs content coming soon.</p>
      </article>
    </DocsLayout>
  );
}
