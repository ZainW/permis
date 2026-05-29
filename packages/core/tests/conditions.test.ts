import { expect, test } from "vite-plus/test";
import { WhereBuilder, ChainedWhereBuilder } from "../src/conditions.ts";

test("WhereBuilder .equals(value) builds condition with eq operator", () => {
  const wb = new WhereBuilder("orgId");
  const condition = wb.equals("acme-corp").build();
  expect(condition.type).toBe("where");
  expect(condition.path).toBe("orgId");
  expect(condition.operator).toBe("eq");
  expect(condition.value).toBe("acme-corp");
});

test("WhereBuilder .ref(path) builds condition with ref operator", () => {
  const wb = new WhereBuilder("orgId");
  const condition = wb.ref("subject.orgId").build();
  expect(condition.type).toBe("where");
  expect(condition.path).toBe("orgId");
  expect(condition.operator).toBe("ref");
  expect(condition.value).toBe("subject.orgId");
});

test("WhereBuilder .in(values) builds condition with in operator", () => {
  const wb = new WhereBuilder("role");
  const condition = wb.in(["admin", "editor"]).build();
  expect(condition.operator).toBe("in");
  expect(condition.value).toEqual(["admin", "editor"]);
});

test("WhereBuilder .matches(regex) builds condition with matches operator", () => {
  const wb = new WhereBuilder("email");
  const condition = wb.matches("^[a-z]+@test\\.com$").build();
  expect(condition.operator).toBe("matches");
  expect(condition.value).toBeInstanceOf(RegExp);
  expect((condition.value as RegExp).source).toBe("^[a-z]+@test\\.com$");
});

test("WhereBuilder throws if build() called before operator", () => {
  const wb = new WhereBuilder("x");
  expect(() => wb.build()).toThrow("No operator set");
});

test("WhereBuilder chains are independent — each call overwrites", () => {
  const wb = new WhereBuilder("p");
  const c = wb.equals(1).build();
  expect(c.operator).toBe("eq");
  expect(c.value).toBe(1);
  const c2 = wb.in([2, 3]).build();
  expect(c2.operator).toBe("in");
  expect(c2.value).toEqual([2, 3]);
  expect(c).not.toBe(c2);
});

test("ChainedWhereBuilder .equals creates new WhereBuilder and returns parent", () => {
  const parent: string[] = [];
  const cb = new ChainedWhereBuilder<string[]>("orgId", (cond) => {
    parent.push(cond.operator!);
    return parent;
  });
  const result = cb.equals("acme-corp");
  expect(result).toBe(parent);
  expect(parent).toEqual(["eq"]);
});

test("ChainedWhereBuilder .ref creates new WhereBuilder and returns parent", () => {
  const parent: { op: unknown; val: unknown }[] = [];
  const cb = new ChainedWhereBuilder<{ op: unknown; val: unknown }[]>("orgId", (cond) => {
    parent.push({ op: cond.operator, val: cond.value });
    return parent;
  });
  const result = cb.ref("subject.orgId");
  expect(result).toBe(parent);
  expect(parent).toEqual([{ op: "ref", val: "subject.orgId" }]);
});

test("ChainedWhereBuilder can chain multiple where calls", () => {
  const parent: string[] = [];
  const cb = new ChainedWhereBuilder<string[]>("p", (cond) => {
    parent.push(`${cond.path}:${cond.operator}`);
    return parent;
  });
  const result = cb.equals(1);
  expect(result).toEqual(["p:eq"]);
  const result2 = new ChainedWhereBuilder<string[]>("q", (cond) => {
    parent.push(`${cond.path}:${cond.operator}`);
    return parent;
  }).in(["a", "b"]);
  expect(result2).toEqual(["p:eq", "q:in"]);
});
