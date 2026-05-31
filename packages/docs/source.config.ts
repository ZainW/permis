import { defineDocs, applyMdxPreset } from "fumadocs-mdx/config";
import { remarkAutoTypeTable } from "fumadocs-typescript";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    mdxOptions: applyMdxPreset({
      remarkPlugins: [remarkAutoTypeTable],
    }),
  },
});
