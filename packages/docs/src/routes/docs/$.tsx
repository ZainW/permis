import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { source } from "@/lib/source";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { baseOptions } from "@/lib/layout.shared";
import { useMDXComponents } from "@/components/mdx";
import { Suspense, useEffect, useState } from "react";
import type { ComponentType } from "react";

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? [];
    const data = await serverLoader({ data: slugs });
    return data as { path: string; pageTree: ReturnType<typeof source.getPageTree> };
  },
});

const serverLoader = createServerFn({ method: "GET" })
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();
    const result: any = {
      path: page.path,
      pageTree: source.getPageTree(),
    };
    return result;
  });

function Page() {
  const { path, pageTree } = Route.useLoaderData();
  const [Component, setComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const browserCollections: any = await import("collections/browser");
      const clientLoader: any = browserCollections.docs.createClientLoader({
        component(props: any) {
          const { toc, frontmatter, default: MDX } = props;
          return (
            <DocsPage toc={toc}>
              <DocsTitle>{frontmatter?.title}</DocsTitle>
              <DocsDescription>{frontmatter?.description}</DocsDescription>
              <DocsBody>
                <MDX components={useMDXComponents()} />
              </DocsBody>
            </DocsPage>
          );
        },
      });
      if (!cancelled) {
        setComponent(() => clientLoader.getComponent(path));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Suspense fallback={<div>Loading...</div>}>{Component ? <Component /> : null}</Suspense>
    </DocsLayout>
  );
}
