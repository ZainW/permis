import { expect, test } from "vite-plus/test";
import { definePermission } from "../src/permission.ts";

test("definePermission with single action and resource", () => {
  const perm = definePermission("read", "post").build();
  expect(perm.action).toBe("read");
  expect(perm.resource).toBe("post");
  expect(perm.conditions).toBeUndefined();
});

test("definePermission with array action and array resource", () => {
  const perm = definePermission(["read", "write"], ["post", "comment"]).build();
  expect(perm.action).toEqual(["read", "write"]);
  expect(perm.resource).toEqual(["post", "comment"]);
});

test("definePermission .when(fn) adds a condition", () => {
  const fn = () => true;
  const perm = definePermission("read", "post").when(fn).build();
  expect(perm.conditions).toHaveLength(1);
  expect(perm.conditions![0].type).toBe("when");
  expect(perm.conditions![0].fn).toBe(fn);
});

test("definePermission .when chains multiple conditions", () => {
  const fn1 = () => true;
  const fn2 = () => false;
  const perm = definePermission("read", "post").when(fn1).when(fn2).build();
  expect(perm.conditions).toHaveLength(2);
  expect(perm.conditions![0].fn).toBe(fn1);
  expect(perm.conditions![1].fn).toBe(fn2);
});

test("definePermission .having(key, schema) adds a having condition", () => {
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (_v: unknown) => ({ issues: [] }),
    },
  };
  const perm = definePermission("read", "post").having("subject", schema).build();
  expect(perm.conditions).toHaveLength(1);
  expect(perm.conditions![0].type).toBe("having");
  expect(perm.conditions![0].key).toBe("subject");
  expect(perm.conditions![0].schema).toBe(schema);
});

test("definePermission .having with resource key", () => {
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (_v: unknown) => ({ issues: [] }),
    },
  };
  const perm = definePermission("read", "post").having("resource", schema).build();
  expect(perm.conditions![0].key).toBe("resource");
});

test("definePermission .having with environment key", () => {
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (_v: unknown) => ({ issues: [] }),
    },
  };
  const perm = definePermission("read", "post").having("environment", schema).build();
  expect(perm.conditions![0].key).toBe("environment");
});

test("definePermission .where(path) creates a chained condition", () => {
  const perm = definePermission("read", "post").where("orgId").equals("acme-corp").build();
  expect(perm.conditions).toHaveLength(1);
  expect(perm.conditions![0].type).toBe("where");
  expect(perm.conditions![0].path).toBe("orgId");
  expect(perm.conditions![0].operator).toBe("eq");
  expect(perm.conditions![0].value).toBe("acme-corp");
});

test("definePermission chaining when, where, having together", () => {
  const fn = () => true;
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (_v: unknown) => ({ issues: [] }),
    },
  };
  const perm = definePermission("write", "post")
    .when(fn)
    .where("orgId")
    .equals("x-corp")
    .having("subject", schema)
    .build();
  expect(perm.conditions).toHaveLength(3);
  expect(perm.conditions![0].type).toBe("when");
  expect(perm.conditions![1].type).toBe("where");
  expect(perm.conditions![2].type).toBe("having");
});

test("definePermission .fields() sets field-level restrictions", () => {
  const perm = definePermission("read", "user").fields(["id", "name", "email"]).build();
  expect(perm.fields).toEqual(["id", "name", "email"]);
  expect(perm.conditions).toBeUndefined();
});

test("definePermission .describe() sets description", () => {
  const perm = definePermission("delete", "post").describe("Can delete a post").build();
  expect(perm.description).toBe("Can delete a post");
});
