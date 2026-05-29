import { expect, test } from "vite-plus/test";
import { betterAuthBridge } from "../src/bridge.ts";
import type { Permission } from "@permis/core";

function createMockAuth(sessionData: Record<string, unknown> = {}) {
  return {
    $context: { session: sessionData },
    api: { getSession: async () => sessionData },
  };
}

test("betterAuthBridge: getRolesForSubject uses roleResolver", async () => {
  const auth = createMockAuth({ user: { id: "user-1", role: "admin" } });
  const adapter = betterAuthBridge(auth, {
    roleResolver: (_session: Record<string, unknown>) => ["admin", "editor"],
  });
  const roles = await adapter.getRolesForSubject("user-1");
  expect(roles).toEqual(["admin", "editor"]);
});

test("betterAuthBridge: getPermissionsForRole uses permissionResolver", async () => {
  const auth = createMockAuth({ user: { id: "user-1", role: "admin" } });
  const readPerm: Permission = { action: "read", resource: "post" };
  const adapter = betterAuthBridge(auth, {
    roleResolver: () => ["admin"],
    permissionResolver: (_session: Record<string, unknown>) => [readPerm],
  });
  const perms = await adapter.getPermissionsForRole("admin");
  expect(perms).toEqual([readPerm]);
});

test("betterAuthBridge: getPermissionsForSubject aggregates perms", async () => {
  const auth = createMockAuth({ user: { id: "user-1", role: "admin" } });
  const readPerm: Permission = { action: "read", resource: "post" };
  const writePerm: Permission = { action: "write", resource: "post" };
  const adapter = betterAuthBridge(auth, {
    roleResolver: () => ["admin", "editor"],
    permissionResolver: (_session: Record<string, unknown>) => [readPerm, writePerm],
  });
  const perms = await adapter.getPermissionsForSubject("user-1");
  expect(perms).toEqual([readPerm, writePerm, readPerm, writePerm]);
});

test("betterAuthBridge: resolveSubject returns basic subject", async () => {
  const auth = createMockAuth({ user: { id: "user-1", name: "Alice" } });
  const adapter = betterAuthBridge(auth);
  const subject = await adapter.resolveSubject("user-1");
  expect(subject).toEqual({ id: "user-1" });
});

test("betterAuthBridge: resolveResource returns basic resource", async () => {
  const auth = createMockAuth({});
  const adapter = betterAuthBridge(auth);
  const resource = await adapter.resolveResource("post", "1");
  expect(resource).toEqual({ type: "post", id: "1" });
});

test("betterAuthBridge: is read-only — no write methods", async () => {
  const auth = createMockAuth({});
  const adapter = betterAuthBridge(auth);
  expect(adapter["assignRole"]).toBeUndefined();
  expect(adapter["revokeRole"]).toBeUndefined();
  expect(adapter["grantPermission"]).toBeUndefined();
  expect(adapter["revokePermission"]).toBeUndefined();
});
