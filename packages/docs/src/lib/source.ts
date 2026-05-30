import type { Root } from "fumadocs-core/page-tree";

interface Page {
  url: string;
  title: string;
  description?: string;
}

const pages: Record<string, Page> = {
  "": {
    url: "/docs",
    title: "Getting Started",
    description: "Install and configure Permis for your application",
  },
  "concepts/rbac": {
    url: "/docs/concepts/rbac",
    title: "Role-Based Access Control (RBAC)",
    description: "Define roles with permissions and manage access by role assignment",
  },
  "concepts/abac": {
    url: "/docs/concepts/abac",
    title: "Attribute-Based Access Control (ABAC)",
    description: "Fine-grained access control based on resource and subject attributes",
  },
  "concepts/conditions": {
    url: "/docs/concepts/conditions",
    title: "Conditions",
    description: "Deep dive into Permis condition types",
  },
  "concepts/role-merging": {
    url: "/docs/concepts/role-merging",
    title: "Role Merging",
    description: "Combine roles to create role hierarchies",
  },
  "guides/quick-start": {
    url: "/docs/guides/quick-start",
    title: "Quick Start",
    description: "Get up and running with Permis in 5 minutes",
  },
  "guides/defining-permissions": {
    url: "/docs/guides/defining-permissions",
    title: "Defining Permissions",
    description: "Master the permission builder API",
  },
  "guides/engine-usage": {
    url: "/docs/guides/engine-usage",
    title: "Engine Usage",
    description: "Using PermisEngine for runtime authorization",
  },
  "adapters/drizzle": {
    url: "/docs/adapters/drizzle",
    title: "Drizzle ORM Adapter",
    description: "Store permissions and roles in a database",
  },
  "adapters/better-auth": {
    url: "/docs/adapters/better-auth",
    title: "Better-Auth Integration",
    description: "Integrate Permis with Better-Auth",
  },
};

export const source = {
  getPage(slugs: string[]) {
    const key = slugs.join("/");
    const page = pages[key];
    if (!page) return undefined;
    return {
      path: key,
      data: {
        title: page.title,
        description: page.description,
      },
      slugs,
      url: page.url,
    };
  },

  getPageTree(): Root {
    return {
      name: "Docs",
      children: [
        {
          type: "page",
          name: "Getting Started",
          url: "/docs",
        },
        {
          type: "separator",
          name: "Concepts",
        },
        {
          type: "page",
          name: "RBAC",
          url: "/docs/concepts/rbac",
        },
        {
          type: "page",
          name: "ABAC",
          url: "/docs/concepts/abac",
        },
        {
          type: "page",
          name: "Conditions",
          url: "/docs/concepts/conditions",
        },
        {
          type: "page",
          name: "Role Merging",
          url: "/docs/concepts/role-merging",
        },
        {
          type: "separator",
          name: "Guides",
        },
        {
          type: "page",
          name: "Quick Start",
          url: "/docs/guides/quick-start",
        },
        {
          type: "page",
          name: "Defining Permissions",
          url: "/docs/guides/defining-permissions",
        },
        {
          type: "page",
          name: "Engine Usage",
          url: "/docs/guides/engine-usage",
        },
        {
          type: "separator",
          name: "Adapters",
        },
        {
          type: "page",
          name: "Drizzle ORM",
          url: "/docs/adapters/drizzle",
        },
        {
          type: "page",
          name: "Better-Auth",
          url: "/docs/adapters/better-auth",
        },
      ],
    };
  },
};
