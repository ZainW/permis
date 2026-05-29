import { expect, test } from "vite-plus/test";
import { permisPlugin } from "../src/plugin.ts";
import { createGuard } from "../src/guard.ts";
import { definePermission, defineRole, PermisEngine } from "@permis/core";

test("permisPlugin returns an object with id and init", () => {
  const plugin = permisPlugin({});
  expect(plugin.id).toBeDefined();
  expect(plugin.init).toBeDefined();
  expect(typeof plugin.init).toBe("function");
});

test("permisPlugin id is 'permis'", () => {
  const plugin = permisPlugin({});
  expect(plugin.id).toBe("permis");
});

test("permisPlugin init adds permis context to auth", () => {
  const plugin = permisPlugin({});
  const mockAuth = { $context: {} as Record<string, unknown> };
  plugin.init?.(mockAuth as Parameters<NonNullable<typeof plugin.init>>[0]);
  expect(mockAuth.$context.permis).toBeDefined();
});

test("permisPlugin with roles passes them to context", () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const plugin = permisPlugin({ roles: [editor] });
  const mockAuth = { $context: {} as Record<string, unknown> };
  plugin.init?.(mockAuth as Parameters<NonNullable<typeof plugin.init>>[0]);
  expect(mockAuth.$context.permis).toBeDefined();
});

test("createGuard returns a function", () => {
  const engine = new PermisEngine();
  const guard = createGuard(engine);
  expect(typeof guard).toBe("function");
});

test("createGuard guard returns true for allowed action", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  const guard = createGuard(engine);
  const result = await guard("editor", "read", "post");
  expect(result).toBe(true);
});

test("createGuard guard returns false for denied action", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  const guard = createGuard(engine);
  const result = await guard("editor", "delete", "post");
  expect(result).toBe(false);
});
