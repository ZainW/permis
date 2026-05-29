export type SubjectId = string;

export type Action = string;

export type ResourceType = string;

export type Subject =
  | SubjectId
  | {
      id: SubjectId;
      type?: string;
      attrs?: Record<string, unknown>;
    };

export type Resource =
  | ResourceType
  | {
      type: ResourceType;
      id?: string;
      attrs?: Record<string, unknown>;
    };

export interface PermissionContext {
  subject: {
    id: SubjectId;
    type?: string;
    attrs?: Record<string, unknown>;
  };
  resource?: Resource;
  action: Action;
  environment?: Record<string, unknown>;
}

export interface Condition {
  type: "when" | "where" | "having";
  fn?: (ctx: PermissionContext) => boolean | Promise<boolean>;
  path?: string;
  operator?: "eq" | "ref" | "in" | "matches";
  value?: unknown;
  schema?: StandardSchemaV1;
  key?: string;
}

export interface Permission {
  action: Action | Action[];
  resource: ResourceType | ResourceType[];
  conditions?: Condition[];
  fields?: string[];
  description?: string;
}

export interface Role {
  name: string;
  permissions: Permission[];
  conditions?: Condition[];
}

export interface PermisAdapter {
  getRolesForSubject(subjectId: SubjectId): Promise<string[]>;
  getPermissionsForRole(roleName: string): Promise<Permission[]>;
  getPermissionsForSubject(subjectId: SubjectId): Promise<Permission[]>;
  resolveSubject(subjectId: SubjectId): Promise<Subject>;
  resolveResource(type: ResourceType, id: string): Promise<Resource>;
  assignRole?(subjectId: SubjectId, roleName: string): Promise<void>;
  revokeRole?(subjectId: SubjectId, roleName: string): Promise<void>;
  grantPermission?(roleName: string, permission: Permission): Promise<void>;
  revokePermission?(roleName: string, action: Action, resource: ResourceType): Promise<void>;
}

export interface PermisEngineOptions {
  roles?: Role[];
  permissions?: Permission[];
  adapter?: PermisAdapter;
}

export interface StandardSchemaV1 {
  "~standard": {
    version: 1;
    vendor: string;
    validate: (value: unknown) => StandardResultV1;
  };
}

export interface StandardResultV1 {
  issues?: StandardIssueV1[];
}

export interface StandardIssueV1 {
  message: string;
  path?: ReadonlyArray<string | number>;
}

export function normalizeSubject(s: Subject): {
  id: SubjectId;
  type?: string;
  attrs?: Record<string, unknown>;
} {
  if (typeof s === "string") return { id: s };
  return s;
}

export function normalizeResource(r: Resource): {
  type: ResourceType;
  id?: string;
  attrs?: Record<string, unknown>;
} {
  if (typeof r === "string") return { type: r };
  return r;
}
