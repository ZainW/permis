import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Permis</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        TypeScript permissions library — RBAC + ABAC with Drizzle and Better-Auth adapters
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/docs/$"
          params={{ _splat: "" } as any}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/your-org/permis"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          GitHub
        </a>
      </div>
    </main>
  );
}
