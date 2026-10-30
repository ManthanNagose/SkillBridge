const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// Formats a date-only value (YYYY-MM-DD) in the user's locale, e.g. "20 Nov 2026".
// Parsed as a local date, so it never shifts a day across time zones.
export function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return dateFormat.format(new Date(year, month - 1, day))
}

// True for a real calendar date written as YYYY-MM-DD.
export function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}
