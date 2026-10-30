// Where to send a user after sign-in (FR-AUTH-04). Only paths inside
// SkillBridge are accepted; anything else, including protocol-relative
// (//host) or backslash tricks and the auth pages themselves, gives null.
const AUTH_PATHS = ['/login', '/signup', '/check-email']

export function safeReturnPath(value) {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  const pathname = value.split(/[?#]/)[0]
  if (AUTH_PATHS.includes(pathname)) return null
  return value
}
