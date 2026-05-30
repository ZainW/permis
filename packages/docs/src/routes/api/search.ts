import { createFileRoute } from "@tanstack/react-router";
import { source } from "@/lib/source";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async () => {
        const pages = source.getPageTree();
        return Response.json({ results: pages });
      },
    },
  },
});
