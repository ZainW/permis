import type { PermisEngine } from "@permis/core";
import type { SubjectId, Subject, Action, ResourceType, Resource } from "@permis/core";

export function createGuard(engine: PermisEngine) {
  return async (
    subject: SubjectId | Subject,
    action: Action,
    resource: ResourceType | Resource,
  ): Promise<boolean> => {
    return engine.can(subject, action, resource);
  };
}
