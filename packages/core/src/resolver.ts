import type { Action, ResourceType, Condition, PermissionContext } from "./types.ts";

export function matchAction(permAction: Action | Action[], checkAction: Action): boolean {
  if (Array.isArray(permAction)) {
    return permAction.some((a) => matchAction(a, checkAction));
  }
  if (permAction === "*" || permAction === "manage") return true;
  return permAction === checkAction;
}

export function matchResource(
  permResource: ResourceType | ResourceType[],
  checkResource: ResourceType,
): boolean {
  const permArr = Array.isArray(permResource) ? permResource : [permResource];
  return permArr.includes(checkResource);
}

function resolvePath(ctx: PermissionContext, path: string): unknown {
  if (path === "subject") return ctx.subject;
  if (path === "resource") return ctx.resource;
  if (path === "action") return ctx.action;
  if (path === "environment") return ctx.environment;

  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = ctx;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

async function evaluateWhereCondition(
  condition: Condition,
  ctx: PermissionContext,
): Promise<boolean> {
  const path = condition.path;
  const operator = condition.operator;
  const value = condition.value;
  if (path === undefined || operator === undefined) return false;
  const resolved = resolvePath(ctx, path);

  switch (operator) {
    case "eq":
      return resolved === value;
    case "ref":
      return resolved === resolvePath(ctx, value as string);
    case "in":
      return Array.isArray(value) ? value.includes(resolved) : false;
    case "matches": {
      if (value instanceof RegExp) return value.test(String(resolved));
      try {
        return new RegExp(value as string).test(String(resolved));
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

export async function evaluateConditions(
  conditions: Condition[] | undefined,
  ctx: PermissionContext,
): Promise<boolean> {
  if (!conditions || conditions.length === 0) return true;
  for (const c of conditions) {
    let result: boolean;
    if (c.type === "when") {
      result = c.fn ? await c.fn(ctx) : true;
    } else if (c.type === "where") {
      result = await evaluateWhereCondition(c, ctx);
    } else if (c.type === "having") {
      if (!c.schema || !c.key) {
        result = false;
      } else {
        let value: unknown;
        if (c.key === "subject") value = ctx.subject;
        else if (c.key === "resource") value = ctx.resource;
        else if (c.key === "environment") value = ctx.environment;
        else value = resolvePath(ctx, c.key);
        const r = c.schema["~standard"].validate(value);
        result = !r.issues || r.issues.length === 0;
      }
    } else {
      result = false;
    }
    if (!result) return false;
  }
  return true;
}
