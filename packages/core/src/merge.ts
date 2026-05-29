import type { Role } from "./types.ts";

export function mergeRoles(name: string, ...parents: Role[]): Role {
  const seen = new Map<string, Role["permissions"][number]>();
  for (const parent of parents) {
    for (const perm of parent.permissions) {
      const key = `${String(perm.action)}:${String(perm.resource)}`;
      if (!seen.has(key)) seen.set(key, perm);
    }
  }
  return { name, permissions: [...seen.values()] };
}
