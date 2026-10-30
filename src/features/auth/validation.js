import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../data/constants.js'
import { isValidEmail, normalizeEmail } from '../../utils/validation.js'

// Field rules for the auth forms, shared by the screens (checked before
// submitting) and the mock service (checked again, as a backend would).
// Each returns an object of field codes, e.g. { email: 'invalid' }; empty means valid.
// Codes: 'required', 'invalid', 'too-short', 'too-long'.

function emailError(email) {
  const value = normalizeEmail(email)
  if (!value) return 'required'
  if (!isValidEmail(value)) return 'invalid'
  return null
}

function withoutEmpty(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, code]) => code))
}

export function validateSignIn({ email, password } = {}) {
  return withoutEmpty({
    email: emailError(email),
    password: password ? null : 'required',
  })
}

// Display name: required, 2–50 characters after trimming (FR-PROF-02). Also
// used by the Profile page.
export function displayNameError(displayName) {
  const name = String(displayName ?? '').trim()
  if (!name) return 'required'
  if (name.length < DISPLAY_NAME_MIN_LENGTH) return 'too-short'
  if (name.length > DISPLAY_NAME_MAX_LENGTH) return 'too-long'
  return null
}

export function validateSignUp({ displayName, email, password } = {}) {
  const nameError = displayNameError(displayName)

  let passwordError = null
  if (!password) passwordError = 'required'
  else if (password.length < PASSWORD_MIN_LENGTH) passwordError = 'too-short'

  return withoutEmpty({
    displayName: nameError,
    email: emailError(email),
    password: passwordError,
  })
}
