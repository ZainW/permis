import { expect, test } from "vite-plus/test";
import { defineRole } from "../src/role.ts";
import { definePermission } from "../src/permission.ts";

const readPost = definePermission("read", "post").build();
const writePost = definePermission("write", "post").build();

test("defineRole creates a role with a name", () => {
  const role = defineRole("editor").build();
  expect(role.name).toBe("editor");
  expect(role.permissions).toEqual([]);
  expect(role.conditions).toBeUndefined();
});

test("defineRole .with(...permissions) adds permissions", () => {
  const role = defineRole("editor").with(readPost, writePost).build();
  expect(role.permissions).toHaveLength(2);
  expect(role.permissions[0]).toBe(readPost);
  expect(role.permissions[1]).toBe(writePost);
});

test("defineRole .with can be called multiple times", () => {
  const role = defineRole("editor").with(readPost).with(writePost).build();
  expect(role.permissions).toHaveLength(2);
});

test("defineRole .whenActive(fn) adds a role-level condition", () => {
  const fn = () => true;
  const role = defineRole("editor").with(readPost).whenActive(fn).build();
  expect(role.conditions).toHaveLength(1);
  expect(role.conditions![0].type).toBe("when");
  expect(role.conditions![0].fn).toBe(fn);
});

test("defineRole .where(path) chains condition on role", () => {
  const role = defineRole("editor").with(readPost).where("orgId").equals("acme-corp").build();
  expect(role.conditions).toHaveLength(1);
  expect(role.conditions![0].type).toBe("where");
  expect(role.conditions![0].path).toBe("orgId");
  expect(role.conditions![0].operator).toBe("eq");
  expect(role.conditions![0].value).toBe("acme-corp");
});

test("defineRole combines where, whenActive, and with", () => {
  const activeFn = () => true;
  const role = defineRole("admin")
    .with(readPost, writePost)
    .whenActive(activeFn)
    .where("ip")
    .in(["10.0.0.1", "10.0.0.2"])
    .build();
  expect(role.name).toBe("admin");
  expect(role.permissions).toHaveLength(2);
  expect(role.conditions).toHaveLength(2);
  expect(role.conditions![0].type).toBe("when");
  expect(role.conditions![1].type).toBe("where");
});
