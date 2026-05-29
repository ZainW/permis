import type { Condition, Permission, PermissionContext, Role } from "./types.ts";
import { ChainedWhereBuilder } from "./conditions.ts";

class RoleBuilder {
  private _name: string;
  private _permissions: Permission[] = [];
  private _conditions: Condition[] = [];

  constructor(name: string) {
    this._name = name;
  }

  with(...permissions: Permission[]): this {
    this._permissions.push(...permissions);
    return this;
  }

  whenActive(fn: (ctx: PermissionContext) => boolean | Promise<boolean>): this {
    this._conditions.push({ type: "when", fn });
    return this;
  }

  where(path: string): ChainedWhereBuilder<this> {
    return new ChainedWhereBuilder<this>(path, (condition) => {
      this._conditions.push(condition);
      return this;
    });
  }

  build(): Role {
    const role: Role = {
      name: this._name,
      permissions: this._permissions,
    };
    if (this._conditions.length > 0) {
      role.conditions = this._conditions;
    }
    return role;
  }
}

export function defineRole(name: string): RoleBuilder {
  return new RoleBuilder(name);
}

export { RoleBuilder };
