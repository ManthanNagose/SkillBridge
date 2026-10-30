import { TASK_STATUS } from '../data/constants.js'

// Today's date as YYYY-MM-DD in the user's local time zone.
export function todayDateString() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

// Overdue means past its due date and not Completed (FR-TSK-05).
export function isTaskOverdue(task, today = todayDateString()) {
  return Boolean(task.dueDate) && task.dueDate < today && task.status !== TASK_STATUS.COMPLETED
}
