import { SERVICE_ERROR } from '../../services/serviceError.js'

// Messages for a failed project action (PRD section 08). Never shows raw error text.
export function projectActionMessage(error, fallback) {
  switch (error?.code) {
    case SERVICE_ERROR.NO_PERMISSION:
      return "You don't have permission to do this. Ask the project owner."
    case SERVICE_ERROR.ARCHIVED:
      return "This project is archived. Changes aren't allowed."
    case SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS:
    case SERVICE_ERROR.NOT_A_MEMBER:
      return 'You no longer have access to this project.'
    case SERVICE_ERROR.NETWORK:
      return "Can't reach SkillBridge. Check your connection and try again."
    default:
      return fallback
  }
}

// Access-removed failures offer the dashboard instead of a retry (E-07).
export function isAccessLost(error) {
  return (
    error?.code === SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS || error?.code === SERVICE_ERROR.NOT_A_MEMBER
  )
}
