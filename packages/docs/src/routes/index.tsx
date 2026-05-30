import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="isolate flex min-h-dvh flex-col">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Permissions for TypeScript
          </p>
          <h1 className="mt-4 max-w-[20ch] text-6xl font-semibold tracking-tight text-balance text-zinc-900 dark:text-zinc-100">
            Permis
          </h1>
          <p className="mt-4 max-w-[48ch] text-base text-pretty text-zinc-600 dark:text-zinc-400">
            Define who can do what. Role-based and attribute-based access control for TypeScript
            applications.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              to="/docs/$"
              params={{ _splat: "" } as any}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Get Started
            </Link>
            <a
              href="https://github.com/your-org/permis"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              GitHub <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-full overflow-hidden rounded-2xl bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center gap-1.5 pb-4">
              <div className="size-3 rounded-full bg-red-500/80" />
              <div className="size-3 rounded-full bg-yellow-500/80" />
              <div className="size-3 rounded-full bg-green-500/80" />
            </div>
            <pre className="overflow-x-auto text-sm leading-7">
              <code className="font-mono">
                <span className="text-violet-400">import</span>
                <span className="text-zinc-500">{" {"}</span>
                <span className="text-amber-300"> definePermission</span>
                <span className="text-zinc-500">,</span>
                <span className="text-amber-300"> defineRole</span>
                <span className="text-zinc-500">,</span>
                <span className="text-amber-300"> PermisEngine </span>
                <span className="text-zinc-500">{"} "}</span>
                <span className="text-violet-400">from</span>
                <span className="text-emerald-400"> &quot;@permis/core&quot;</span>
                {"\n\n"}
                <span className="text-violet-400">const</span>
                <span className="text-zinc-300"> readDocs</span>
                <span className="text-zinc-500"> = </span>
                <span className="text-amber-300">definePermission</span>
                <span className="text-zinc-500">(</span>
                <span className="text-emerald-400">&quot;documents&quot;</span>
                <span className="text-zinc-500">)</span>
                {"\n"}
                <span className="text-zinc-500"> .</span>
                <span className="text-sky-300">can</span>
                <span className="text-zinc-500">(</span>
                <span className="text-emerald-400">&quot;read&quot;</span>
                <span className="text-zinc-500">)</span>
                {"\n"}
                <span className="text-zinc-500"> .</span>
                <span className="text-sky-300">where</span>
                <span className="text-zinc-500">(</span>
                <span className="text-emerald-400">&quot;status&quot;</span>
                <span className="text-zinc-500">, </span>
                <span className="text-emerald-400">&quot;published&quot;</span>
                <span className="text-zinc-500">)</span>
                {"\n"}
                <span className="text-zinc-500"> .</span>
                <span className="text-sky-300">build</span>
                <span className="text-zinc-500">()</span>
                {"\n\n"}
                <span className="text-violet-400">const</span>
                <span className="text-zinc-300"> editor</span>
                <span className="text-zinc-500"> = </span>
                <span className="text-amber-300">defineRole</span>
                <span className="text-zinc-500">(</span>
                <span className="text-emerald-400">&quot;editor&quot;</span>
                <span className="text-zinc-500">)</span>
                {"\n"}
                <span className="text-zinc-500"> .</span>
                <span className="text-sky-300">grantAll</span>
                <span className="text-zinc-500">([</span>
                <span className="text-zinc-300">readDocs</span>
                <span className="text-zinc-500">])</span>
                {"\n"}
                <span className="text-zinc-500"> .</span>
                <span className="text-sky-300">build</span>
                <span className="text-zinc-500">()</span>
                {"\n\n"}
                <span className="text-violet-400">const</span>
                <span className="text-zinc-300"> engine</span>
                <span className="text-zinc-500"> = </span>
                <span className="text-violet-400">new</span>
                <span className="text-amber-300"> PermisEngine</span>
                <span className="text-zinc-500">({"{"} </span>
                <span className="text-zinc-300">roles</span>
                <span className="text-zinc-500">: [</span>
                <span className="text-zinc-300">editor</span>
                <span className="text-zinc-500">] {"}"})</span>
                {"\n\n"}
                <span className="text-zinc-300">engine</span>
                <span className="text-zinc-500">.</span>
                <span className="text-sky-300">can</span>
                <span className="text-zinc-500">(</span>
                <span className="text-zinc-300">editor</span>
                <span className="text-zinc-500">, </span>
                <span className="text-emerald-400">&quot;read&quot;</span>
                <span className="text-zinc-500">, {"{"} </span>
                {"\n"}
                <span className="text-zinc-500"> </span>
                <span className="text-zinc-300">type</span>
                <span className="text-zinc-500">: </span>
                <span className="text-emerald-400">&quot;documents&quot;</span>
                <span className="text-zinc-500">,</span>
                {"\n"}
                <span className="text-zinc-500"> </span>
                <span className="text-zinc-300">status</span>
                <span className="text-zinc-500">: </span>
                <span className="text-emerald-400">&quot;published&quot;</span>
                <span className="text-zinc-500">,</span>
                {"\n"}
                <span className="text-zinc-500">{"}"})</span>
                <span className="text-zinc-600"> // =&gt; true</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
