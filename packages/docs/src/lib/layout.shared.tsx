import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Permis',
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'API',
        url: '/docs/api',
        active: 'nested-url',
      },
      {
        text: 'GitHub',
        url: 'https://github.com/your-org/permis',
        external: true,
      },
    ],
  }
}
