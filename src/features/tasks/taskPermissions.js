import { PROJECT_ROLE } from '../../data/constants.js'

// Task rules from the PRD permission matrix (section 03). The mock services
// enforce them and screens use them to decide which controls to show. Neither
// is security: the backend must enforce the same rules (PRD B-13).
// Every rule assumes current membership of the project. Archived projects
// allow no task changes at all (E-10); callers check that separately, because
// it has its own error.

// Owners change the status of any task; members only of tasks assigned to them.
// Creating a task doesn't grant status changes until E-01 is confirmed (F-06).
export function canChangeTaskStatus({ role, assigneeId, userId }) {
  return role === PROJECT_ROLE.OWNER || (Boolean(assigneeId) && assigneeId === userId)
}

// Only owners assign, reassign or unassign (FR-TSK-10).
export function canAssignTask({ role }) {
  return role === PROJECT_ROLE.OWNER
}

// Owners edit any task's details; members only tasks they created
// (FR-TSK-06). Being the assignee grants no editing.
export function canEditTaskDetails({ role, createdBy, userId }) {
  return role === PROJECT_ROLE.OWNER || (Boolean(createdBy) && createdBy === userId)
}

// Only owners delete tasks (E-02).
export function canDeleteTask({ role }) {
  return role === PROJECT_ROLE.OWNER
}
