// Avatar initials (FR-PROF-03): the first letter of the first two words of the
// display name, in capitals; one word gives one letter. Without a display
// name, the first letter of the email.
export function avatarInitials(displayName, email) {
  const words = String(displayName ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
  }
  return String(email ?? '').trim().charAt(0).toUpperCase()
}
