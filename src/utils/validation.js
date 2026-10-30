// A basic shape check for email addresses: something@something.something.
// The real check is whether an email can be delivered, which only the auth
// provider can confirm.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value)
}

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}
