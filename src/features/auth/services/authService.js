import { mockRequest, setSessionUser } from '../../../services/mock/mockDb.js'
import { SERVICE_ERROR, ServiceError } from '../../../services/serviceError.js'
import { normalizeEmail } from '../../../utils/validation.js'
import { validateSignIn, validateSignUp } from '../validation.js'

// Auth service. Mock implementation for frontend development only: it is not
// secure and is replaced by Supabase Auth at integration. Mock accounts are
// treated as already verified; email verification isn't simulated.
// Deferred: resendVerification, completeVerification, requestPasswordReset,
// openResetLink, setNewPassword.
//
// Validation failures throw ServiceError('validation') with
// details.fieldErrors, e.g. { email: 'invalid' }. The rules and codes are in
// ../validation.js. Screens turn these into messages.

export const SESSION_EVENT = {
  SIGNED_IN: 'SIGNED_IN',
  SIGNED_OUT: 'SIGNED_OUT',
  USER_UPDATED: 'USER_UPDATED',
}

const sessionListeners = new Set()

function notifySessionChange(event, session) {
  sessionListeners.forEach((listener) => listener(event, session))
}

// Calls callback(event, session) after every sign-in and sign-out, where
// session is { user } or null. Returns a function that stops watching.
// Shaped like Supabase's onAuthStateChange so the Supabase version can drop in.
export function watchSession(callback) {
  sessionListeners.add(callback)
  return () => {
    sessionListeners.delete(callback)
  }
}

function throwIfInvalid(fieldErrors) {
  if (Object.keys(fieldErrors).length > 0) {
    throw new ServiceError(SERVICE_ERROR.VALIDATION, 'validation', { fieldErrors })
  }
}

// Returns { user } for the current session, or null when signed out.
export function getSession() {
  return mockRequest((db) => {
    const user = db.users.find((u) => u.id === db.session.userId)
    return user ? { user } : null
  })
}

// Reads the session again and tells watchers with USER_UPDATED, for example
// after the display name changes, so it shows everywhere (FR-PROF-04).
export async function refreshSession() {
  const session = await getSession()
  if (session) notifySessionChange(SESSION_EVENT.USER_UPDATED, session)
  return session
}

// Signs in a known mock account and returns { user }. Unknown emails and wrong
// passwords give the same 'invalid-credentials' error (FR-AUTH-02).
export async function signIn({ email, password } = {}) {
  const session = await mockRequest((db) => {
    throwIfInvalid(validateSignIn({ email, password }))

    const normalizedEmail = normalizeEmail(email)
    const user = db.users.find((u) => u.email === normalizedEmail)
    const credential = user && db.credentials.find((c) => c.userId === user.id)
    if (!credential || credential.password !== password) {
      throw new ServiceError(SERVICE_ERROR.INVALID_CREDENTIALS)
    }

    setSessionUser(db, user.id)
    return { user }
  })
  notifySessionChange(SESSION_EVENT.SIGNED_IN, session)
  return session
}

// Creates a mock account. Does not sign in: the user goes to Check your email
// next (FR-AUTH-11). Always returns the same neutral result, so the response
// never reveals whether the email was already registered (PRD F-08). An
// existing email is left unchanged.
export function signUp({ displayName, email, password } = {}) {
  return mockRequest((db) => {
    throwIfInvalid(validateSignUp({ displayName, email, password }))

    const normalizedEmail = normalizeEmail(email)
    if (!db.users.some((u) => u.email === normalizedEmail)) {
      const id = `user-${crypto.randomUUID()}`
      db.users.push({ id, displayName: String(displayName).trim(), email: normalizedEmail })
      db.credentials.push({ userId: id, password })
    }

    return { status: 'verification-pending', email: normalizedEmail }
  })
}

// Ends the mock session. Always succeeds.
export async function signOut() {
  await mockRequest((db) => {
    setSessionUser(db, null)
    return null
  })
  notifySessionChange(SESSION_EVENT.SIGNED_OUT, null)
  return null
}
