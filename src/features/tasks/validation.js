import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITY,
  TASK_TITLE_MAX_LENGTH,
  TASK_TITLE_MIN_LENGTH,
} from '../../data/constants.js'
import { isValidDateString } from '../../utils/dates.js'

// Task field rules (FR-TSK-01, FR-TSK-03), shared by the task form (checked
// before submitting) and the mock service (checked again, as a backend would).
// Returns field codes, e.g. { title: 'too-short' }; empty means valid.

// Trims the text fields and turns an empty due date into null.
export function normalizeTaskInput({ title, description, priority, dueDate } = {}) {
  return {
    title: String(title ?? '').trim(),
    description: String(description ?? '').trim(),
    priority,
    dueDate: dueDate ? String(dueDate) : null,
  }
}

export function validateTask(input) {
  const { title, description, priority, dueDate } = normalizeTaskInput(input)
  const errors = {}
  if (!title) errors.title = 'required'
  else if (title.length < TASK_TITLE_MIN_LENGTH) errors.title = 'too-short'
  else if (title.length > TASK_TITLE_MAX_LENGTH) errors.title = 'too-long'
  if (description.length > TASK_DESCRIPTION_MAX_LENGTH) errors.description = 'too-long'
  if (!Object.values(TASK_PRIORITY).includes(priority)) errors.priority = 'invalid'
  if (dueDate && !isValidDateString(dueDate)) errors.dueDate = 'invalid'
  return errors
}

// Copy from PRD section 08 (Task form, Validation).
const FIELD_MESSAGES = {
  title: {
    required: 'Enter a task title.',
    'too-short': `Task title must be at least ${TASK_TITLE_MIN_LENGTH} characters.`,
    'too-long': `Task title can be up to ${TASK_TITLE_MAX_LENGTH} characters.`,
  },
  description: {
    'too-long': `Description can be up to ${TASK_DESCRIPTION_MAX_LENGTH} characters.`,
  },
  priority: {
    invalid: 'Choose a priority.',
  },
  dueDate: {
    invalid: 'Enter a valid date.',
  },
}

export function taskFieldMessages(fieldErrors) {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, code]) => [
      field,
      FIELD_MESSAGES[field]?.[code] ?? 'Check this field.',
    ]),
  )
}
