// Error codes shared by every service (PRD section 11). Feature-specific codes,
// such as user-not-found or already-member, are added with the operations that
// need them. Mock and Supabase implementations both throw ServiceError, so
// screens handle errors the same way whichever is in use.
export const SERVICE_ERROR = {
  VALIDATION: 'validation',
  NOT_FOUND_OR_NO_ACCESS: 'not-found-or-no-access',
  NO_PERMISSION: 'no-permission',
  ARCHIVED: 'archived',
  RATE_LIMITED: 'rate-limited',
  NETWORK: 'network',
  SESSION_EXPIRED: 'session-expired',
  UNEXPECTED: 'unexpected',
  TASK_NOT_FOUND: 'task-not-found',
  INVALID_CREDENTIALS: 'invalid-credentials',
  ASSIGNEE_NOT_MEMBER: 'assignee-not-member',
  ALREADY_ARCHIVED: 'already-archived',
  NOT_ARCHIVED: 'not-archived',
  OWNER_CANNOT_LEAVE: 'owner-cannot-leave',
  NOT_A_MEMBER: 'not-a-member',
  USER_NOT_FOUND: 'user-not-found',
  ALREADY_MEMBER: 'already-member',
  CANNOT_REMOVE_OWNER: 'cannot-remove-owner',
}

export class ServiceError extends Error {
  constructor(code, message = code, details = undefined) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.details = details
  }
}
