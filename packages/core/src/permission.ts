import type {
  Action,
  Condition,
  ResourceType,
  Permission,
  PermissionContext,
  StandardSchemaV1,
} from "./types.ts";
import { ChainedWhereBuilder } from "./conditions.ts";

class PermissionBuilder {
  private _action: Action | Action[];
  private _resource: ResourceType | ResourceType[];
  private _conditions: Condition[] = [];
  private _fields?: string[];
  private _description?: string;

  constructor(action: Action | Action[], resource: ResourceType | ResourceType[]) {
    this._action = action;
    this._resource = resource;
  }

  when(fn: (ctx: PermissionContext) => boolean | Promise<boolean>): this {
    this._conditions.push({ type: "when", fn });
    return this;
  }

  where(path: string): ChainedWhereBuilder<this> {
    return new ChainedWhereBuilder<this>(path, (condition) => {
      this._conditions.push(condition);
      return this;
    });
  }

  having(key: "subject" | "resource" | "environment", schema: StandardSchemaV1): this {
    this._conditions.push({ type: "having", key, schema });
    return this;
  }

  fields(fields: string[]): this {
    this._fields = fields;
    return this;
  }

  describe(description: string): this {
    this._description = description;
    return this;
  }

  build(): Permission {
    const perm: Permission = {
      action: this._action,
      resource: this._resource,
    };
    if (this._conditions.length > 0) {
      perm.conditions = this._conditions;
    }
    if (this._fields !== undefined) {
      perm.fields = this._fields;
    }
    if (this._description !== undefined) {
      perm.description = this._description;
    }
    return perm;
  }
}

export function definePermission(
  action: Action | Action[],
  resource: ResourceType | ResourceType[],
): PermissionBuilder {
  return new PermissionBuilder(action, resource);
}

export { PermissionBuilder };
