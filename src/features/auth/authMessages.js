import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../data/constants.js'
import { SERVICE_ERROR } from '../../services/serviceError.js'

// User-facing wording for auth field codes and service errors (PRD section 08).
const FIELD_MESSAGES = {
  displayName: {
    required: 'Enter your name.',
    'too-short': `Name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.`,
    'too-long': `Name can be up to ${DISPLAY_NAME_MAX_LENGTH} characters.`,
  },
  email: {
    required: 'Enter your email address.',
    invalid: 'Enter a valid email address, like name@example.com.',
  },
  password: {
    required: 'Enter your password.',
    'too-short': `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  },
}

export function fieldMessages(fieldErrors) {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, code]) => [
      field,
      FIELD_MESSAGES[field]?.[code] ?? 'Check this field.',
    ]),
  )
}

// Never shows raw service text. Field-level validation is handled separately.
export function formErrorMessage(error) {
  switch (error?.code) {
    case SERVICE_ERROR.INVALID_CREDENTIALS:
      return 'Email or password is incorrect.'
    case SERVICE_ERROR.RATE_LIMITED:
      return 'Too many attempts. Wait a few minutes and try again.'
    case SERVICE_ERROR.NETWORK:
      return "Can't reach SkillBridge. Check your connection and try again."
    default:
      return 'Something went wrong. Try again.'
  }
}
