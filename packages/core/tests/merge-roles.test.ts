import { expect, test } from "vite-plus/test";
import { definePermission, defineRole, mergeRoles } from "../src/index.ts";

const readPost = definePermission("read", "post").build();
const writePost = definePermission("write", "post").build();
const deletePost = definePermission("delete", "post").build();

test("mergeRoles inherits all permissions from a single parent", () => {
  const editor = defineRole("editor").with(readPost, writePost).build();
  const admin = mergeRoles("admin", editor);
  expect(admin.name).toBe("admin");
  expect(admin.permissions).toHaveLength(2);
  expect(admin.permissions).toEqual([readPost, writePost]);
});

test("mergeRoles inherits permissions from multiple parents", () => {
  const editor = defineRole("editor").with(readPost, writePost).build();
  const mod = defineRole("mod").with(deletePost).build();
  const admin = mergeRoles("admin", editor, mod);
  expect(admin.permissions).toHaveLength(3);
});

test("mergeRoles deduplicates shared permissions (keeps first occurrence)", () => {
  const editor = defineRole("editor").with(readPost).build();
  const viewer = defineRole("viewer").with(readPost).build();
  const admin = mergeRoles("admin", editor, viewer);
  expect(admin.permissions).toHaveLength(1);
  expect(admin.permissions[0]).toBe(readPost);
});

test("mergeRoles with no parents produces empty permissions", () => {
  const empty = mergeRoles("nothing");
  expect(empty.name).toBe("nothing");
  expect(empty.permissions).toEqual([]);
});

test("mergeRoles does not mutate parents", () => {
  const editor = defineRole("editor").with(readPost).build();
  const original = [...editor.permissions];
  mergeRoles("admin", editor);
  expect(editor.permissions).toEqual(original);
});

test("mergeRoles preserves conditions on inherited permissions", () => {
  const ownerDelete = definePermission("delete", "post")
    .when((ctx) => ctx.subject.id === "owner")
    .build();
  const editor = defineRole("editor").with(ownerDelete).build();
  const admin = mergeRoles("admin", editor);
  expect(admin.permissions[0]!.conditions).toEqual(ownerDelete.conditions);
});
