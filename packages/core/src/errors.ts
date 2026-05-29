export class PermisError extends Error {
  readonly subject: string;
  readonly action: string;
  readonly resource: string;

  constructor(subject: string, action: string, resource: string) {
    super(`Permission denied: "${subject}" cannot "${action}" on "${resource}"`);
    this.name = "PermisError";
    this.subject = subject;
    this.action = action;
    this.resource = resource;
  }
}
