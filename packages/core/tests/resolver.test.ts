import { expect, test } from "vite-plus/test";
import { matchAction, matchResource, evaluateConditions } from "../src/resolver.ts";
import type { PermissionContext, Subject } from "../src/types.ts";

const makeSubject = (id: string): Subject => ({ id });

// --- matchAction ---
test("matchAction — exact string match", () => {
  expect(matchAction("read", "read")).toBe(true);
  expect(matchAction("read", "write")).toBe(false);
});

test("matchAction — permission has array action, one matches", () => {
  expect(matchAction(["read", "write"], "read")).toBe(true);
  expect(matchAction(["read", "write"], "delete")).toBe(false);
});

test("matchAction — 'manage' permits all actions", () => {
  expect(matchAction("manage", "read")).toBe(true);
  expect(matchAction("manage", "write")).toBe(true);
  expect(matchAction("manage", "delete")).toBe(true);
  expect(matchAction("manage", "any-custom-action")).toBe(true);
});

test("matchAction — '*' wildcard matches any action", () => {
  expect(matchAction("*", "read")).toBe(true);
  expect(matchAction("*", "write")).toBe(true);
  expect(matchAction("*", "unknown")).toBe(true);
});

test("matchAction — array containing 'manage' matches all", () => {
  expect(matchAction(["read", "manage"], "delete")).toBe(true);
  expect(matchAction(["read", "manage"], "read")).toBe(true);
});

test("matchAction — array containing '*' matches all", () => {
  expect(matchAction(["read", "*"], "delete")).toBe(true);
});

// --- matchResource ---
test("matchResource — exact string match", () => {
  expect(matchResource("post", "post")).toBe(true);
  expect(matchResource("post", "comment")).toBe(false);
});

test("matchResource — permission has array resource, one matches", () => {
  expect(matchResource(["post", "comment"], "post")).toBe(true);
  expect(matchResource(["post", "comment"], "user")).toBe(false);
});

// --- evaluateConditions ---
test("evaluateConditions — empty/undefined conditions pass", async () => {
  const ctx: PermissionContext = {
    subject: makeSubject("user-1"),
    action: "read",
  };
  const result = await evaluateConditions(undefined, ctx);
  expect(result).toBe(true);
});

test("evaluateConditions — single 'when' condition that returns true passes", async () => {
  const ctx: PermissionContext = { subject: makeSubject("user-1"), action: "read" };
  const conditions = [{ type: "when" as const, fn: () => true }];
  const result = await evaluateConditions(conditions, ctx);
  expect(result).toBe(true);
});

test("evaluateConditions — single 'when' condition that returns false fails", async () => {
  const ctx: PermissionContext = { subject: makeSubject("user-1"), action: "read" };
  const conditions = [{ type: "when" as const, fn: () => false }];
  const result = await evaluateConditions(conditions, ctx);
  expect(result).toBe(false);
});

test("evaluateConditions — async 'when' condition", async () => {
  const ctx: PermissionContext = { subject: makeSubject("user-1"), action: "read" };
  const conditions = [{ type: "when" as const, fn: () => Promise.resolve(true) }];
  const result = await evaluateConditions(conditions, ctx);
  expect(result).toBe(true);
});

test("evaluateConditions — all conditions must pass (AND logic)", async () => {
  const ctx: PermissionContext = { subject: makeSubject("user-1"), action: "read" };
  const conditions = [
    { type: "when" as const, fn: () => true },
    { type: "when" as const, fn: () => false },
    { type: "when" as const, fn: () => true },
  ];
  const result = await evaluateConditions(conditions, ctx);
  expect(result).toBe(false);
});

test("evaluateConditions — 'where' eq condition resolves path", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { orgId: "acme" } },
    action: "read",
    environment: { tenant: "acme" },
  };
  const conditions = [
    { type: "where" as const, path: "subject.attrs.orgId", operator: "eq" as const, value: "acme" },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'where' ref condition compares two paths", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { orgId: "acme" } },
    resource: { type: "post", id: "1", attrs: { orgId: "acme" } },
    action: "read",
  };
  const conditions = [
    {
      type: "where" as const,
      path: "subject.attrs.orgId",
      operator: "ref" as const,
      value: "resource.attrs.orgId",
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'where' in condition", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { role: "admin" } },
    action: "read",
  };
  const conditions = [
    {
      type: "where" as const,
      path: "subject.attrs.role",
      operator: "in" as const,
      value: ["admin", "editor"],
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'where' matches condition (regex)", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { email: "user@test.com" } },
    action: "read",
  };
  const conditions = [
    {
      type: "where" as const,
      path: "subject.attrs.email",
      operator: "matches" as const,
      value: "^[a-z]+@test\\.com$",
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'having' condition validates with schema", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { plan: "pro" } },
    action: "read",
  };
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (v: unknown) => {
        if (
          v &&
          typeof (v as Record<string, unknown>).attrs === "object" &&
          (v as Record<string, unknown>).attrs !== null
        ) {
          const attrs = (v as Record<string, unknown>).attrs as Record<string, unknown>;
          if (typeof attrs.plan === "string") return { issues: [] };
        }
        return { issues: [{ message: "invalid subject" }] };
      },
    },
  };
  const conditions = [{ type: "having" as const, key: "subject" as const, schema }];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'having' condition fails when schema returns issues", async () => {
  const ctx: PermissionContext = { subject: { id: "user-1" }, action: "read" };
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: () => ({ issues: [{ message: "fail" }] }),
    },
  };
  const conditions = [{ type: "having" as const, key: "resource" as const, schema }];
  expect(await evaluateConditions(conditions, ctx)).toBe(false);
});
