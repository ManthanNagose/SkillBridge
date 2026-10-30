import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NAME_MIN_LENGTH,
} from '../../data/constants.js'
import { isValidDateString } from '../../utils/dates.js'

// Project field rules (FR-PRJ-01), shared by the project form (checked before
// submitting) and the mock service (checked again, as a backend would).
// Returns field codes, e.g. { name: 'too-short' }; empty means valid.
// Codes: 'required', 'too-short', 'too-long', 'invalid'.

// Trims the text fields and turns an empty due date into null.
export function normalizeProjectInput({ name, description, dueDate } = {}) {
  return {
    name: String(name ?? '').trim(),
    description: String(description ?? '').trim(),
    dueDate: dueDate ? String(dueDate) : null,
  }
}

export function validateProject(input) {
  const { name, description, dueDate } = normalizeProjectInput(input)
  const errors = {}
  if (!name) errors.name = 'required'
  else if (name.length < PROJECT_NAME_MIN_LENGTH) errors.name = 'too-short'
  else if (name.length > PROJECT_NAME_MAX_LENGTH) errors.name = 'too-long'
  if (description.length > PROJECT_DESCRIPTION_MAX_LENGTH) errors.description = 'too-long'
  if (dueDate && !isValidDateString(dueDate)) errors.dueDate = 'invalid'
  return errors
}

const FIELD_MESSAGES = {
  name: {
    required: 'Enter a project name.',
    'too-short': `Project name must be at least ${PROJECT_NAME_MIN_LENGTH} characters.`,
    'too-long': `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`,
  },
  description: {
    'too-long': `Description must be ${PROJECT_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
  },
  dueDate: {
    invalid: 'Enter a valid due date.',
  },
}

export function projectFieldMessages(fieldErrors) {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, code]) => [
      field,
      FIELD_MESSAGES[field]?.[code] ?? 'Check this field.',
    ]),
  )
}
