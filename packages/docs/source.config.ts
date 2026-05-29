import { defineDocs } from 'fumadocs-mdx/config'
import {
  remarkAutoTypeTable,
  createGenerator,
  createFileSystemGeneratorCache,
} from 'fumadocs-typescript'

const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.output/fumadocs-typescript'),
})

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    mdxOptions: {
      remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    },
  },
})
