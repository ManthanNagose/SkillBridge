import { isValidEmail, normalizeEmail } from '../../utils/validation.js'

// Add member email check, shared by the form (before any request, FR-TEAM-06)
// and the mock service. Returns { email: code } or {}.
export function validateMemberEmail({ email } = {}) {
  const value = normalizeEmail(email)
  if (!value) return { email: 'required' }
  if (!isValidEmail(value)) return { email: 'invalid' }
  return {}
}

// Copy from PRD section 08 (Add member). 'not-found' and 'already-member'
// come from the service result, shown inline on the email field.
const EMAIL_MESSAGES = {
  required: 'Enter an email address.',
  invalid: 'Enter a valid email address, like name@example.com.',
  'not-found': 'No SkillBridge account uses this email. Ask them to sign up first.',
  'already-member': 'This person is already in the project.',
}

export function memberFieldMessages(fieldErrors) {
  return fieldErrors.email ? { email: EMAIL_MESSAGES[fieldErrors.email] ?? 'Check this field.' } : {}
}
