import type {
  SubjectId,
  Action,
  ResourceType,
  Subject,
  Resource,
  PermissionContext,
  PermisEngineOptions,
  PermisAdapter,
  Role,
} from "./types.ts";
import { normalizeSubject, normalizeResource } from "./types.ts";
import { matchAction, matchResource, evaluateConditions } from "./resolver.ts";

export class PermisEngine {
  private _roles: Role[] = [];
  private _adapter?: PermisAdapter;

  constructor(options: PermisEngineOptions = {}) {
    this._roles = options.roles ?? [];
    this._adapter = options.adapter;
  }

  async can(
    subject: SubjectId | Subject,
    action: Action,
    resource: ResourceType | Resource,
  ): Promise<boolean> {
    const subjectObj = normalizeSubject(typeof subject === "string" ? subject : subject);
    const resourceObj = normalizeResource(typeof resource === "string" ? resource : resource);
    let roleNames = await this._resolveRoles(subjectObj.id);
    if (!this._adapter && roleNames.length === 0 && typeof subject !== "string") {
      roleNames = this._roles.map((r) => r.name);
    }
    const ctx = await this._buildContext(subjectObj, resourceObj, action);

    for (const roleName of roleNames) {
      const role = this._roles.find((r) => r.name === roleName);
      if (!role) continue;
      if (role.conditions && role.conditions.length > 0) {
        const roleOk = await evaluateConditions(role.conditions, ctx);
        if (!roleOk) continue;
      }
      for (const perm of role.permissions) {
        if (!matchAction(perm.action, action) || !matchResource(perm.resource, resourceObj.type))
          continue;
        const permOk = await evaluateConditions(perm.conditions, ctx);
        if (permOk) return true;
      }
    }
    return false;
  }

  async cannot(
    subject: SubjectId | Subject,
    action: Action,
    resource: ResourceType | Resource,
  ): Promise<boolean> {
    return !(await this.can(subject, action, resource));
  }

  async authorize(
    subject: SubjectId | Subject,
    action: Action,
    resource: ResourceType | Resource,
  ): Promise<void> {
    const allowed = await this.can(subject, action, resource);
    if (!allowed) throw new Error("Permission denied");
  }

  async getRolesFor(subject: SubjectId | Subject): Promise<string[]> {
    const id = typeof subject === "string" ? subject : subject.id;
    return this._resolveRoles(id);
  }

  private async _resolveRoles(subjectId: SubjectId): Promise<string[]> {
    if (this._adapter) return this._adapter.getRolesForSubject(subjectId);
    return this._roles.filter((r) => r.name === subjectId).map((r) => r.name);
  }

  private async _buildContext(
    subjectObj: { id: string; type?: string; attrs?: Record<string, unknown> },
    resourceObj: { type: string; id?: string; attrs?: Record<string, unknown> },
    action: string,
  ): Promise<PermissionContext> {
    let subject = subjectObj;
    let resource = resourceObj;
    if (this._adapter) {
      try {
        subject = normalizeSubject(await this._adapter.resolveSubject(subjectObj.id));
      } catch {
        /* keep as-is */
      }
      if (resourceObj.id) {
        try {
          resource = normalizeResource(
            await this._adapter.resolveResource(resourceObj.type, resourceObj.id),
          );
        } catch {
          /* keep as-is */
        }
      }
    }
    return { subject, resource, action };
  }
}
