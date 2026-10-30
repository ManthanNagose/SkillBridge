// Fixed values agreed in the PRD. Screens and services use these constants
// rather than repeating the strings. How they are stored in the database is
// still to be agreed with the backend (PRD B-01).

export const TASK_STATUS = {
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const PROJECT_ROLE = {
  OWNER: 'owner',
  MEMBER: 'member',
}

// Account field rules (FR-AUTH-01, FR-PROF-02). The password minimum is a
// frontend proposal until it is matched to the Supabase setting (PRD B-09).
export const PASSWORD_MIN_LENGTH = 8
export const DISPLAY_NAME_MIN_LENGTH = 2
export const DISPLAY_NAME_MAX_LENGTH = 50

// Every new task starts unassigned with status To Do (FR-TSK-01, FR-TSK-02).
export const NEW_TASK_DEFAULTS = {
  status: TASK_STATUS.TO_DO,
  priority: TASK_PRIORITY.MEDIUM,
  assigneeId: null,
}

// Project field rules (FR-PRJ-01).
export const PROJECT_NAME_MIN_LENGTH = 3
export const PROJECT_NAME_MAX_LENGTH = 80
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500

// Task field rules (FR-TSK-01).
export const TASK_TITLE_MIN_LENGTH = 3
export const TASK_TITLE_MAX_LENGTH = 120
export const TASK_DESCRIPTION_MAX_LENGTH = 2000
