export function createPermisSchemaExtension() {
  return {
    permis_roles: {
      name: { type: "string" as const, required: true },
      description: { type: "string" as const, required: false },
      condition: { type: "string" as const, required: false },
      active: { type: "boolean" as const, required: false },
      createdAt: { type: "string" as const, required: true },
    },
    permis_permissions: {
      id: { type: "string" as const, required: true },
      action: { type: "string" as const, required: true },
      resource: { type: "string" as const, required: true },
      fields: { type: "string" as const, required: false },
      condition: { type: "string" as const, required: false },
      description: { type: "string" as const, required: false },
    },
    permis_role_permissions: {
      roleName: { type: "string" as const, required: true },
      permissionId: { type: "string" as const, required: true },
    },
    permis_subject_roles: {
      subjectId: { type: "string" as const, required: true },
      roleName: { type: "string" as const, required: true },
      grantedAt: { type: "string" as const, required: true },
      grantedBy: { type: "string" as const, required: false },
    },
  };
}
