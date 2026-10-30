import { PROJECT_ROLE, TASK_STATUS } from '../../../data/constants.js'
import {
  mockRequest,
  requireProjectMembership,
  requireSignedInUserId,
} from '../../../services/mock/mockDb.js'
import { SERVICE_ERROR, ServiceError } from '../../../services/serviceError.js'
import { isTaskOverdue, todayDateString } from '../../../utils/tasks.js'
import { canManageProject } from '../projectPermissions.js'
import { normalizeProjectInput, validateProject } from '../validation.js'

// Projects service. Mock implementation. Deferred: search, and sorting by due
// date (D-15).

export const PROJECT_VIEW = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
}

export const PROJECT_SORT = {
  LAST_UPDATED: 'last-updated',
}

function toProjectSummary(db, project, role, today = todayDateString()) {
  const tasks = db.tasks.filter((t) => t.projectId === project.id)
  return {
    ...project,
    role,
    memberCount: db.projectMemberships.filter((m) => m.projectId === project.id).length,
    taskCount: tasks.length,
    completedTaskCount: tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length,
    overdueTaskCount: tasks.filter((t) => isTaskOverdue(t, today)).length,
  }
}

// Projects the signed-in user belongs to, in the active or archived view.
// Optional sort (PROJECT_SORT.LAST_UPDATED: most recently updated first) and
// limit (the most to return).
export function listMyProjects({ view = PROJECT_VIEW.ACTIVE, sort, limit } = {}) {
  return mockRequest((db) => {
    const userId = requireSignedInUserId(db)
    const wantArchived = view === PROJECT_VIEW.ARCHIVED
    const projects = db.projectMemberships
      .filter((m) => m.userId === userId)
      .map((m) => ({ project: db.projects.find((p) => p.id === m.projectId), role: m.role }))
      .filter(({ project }) => project && Boolean(project.archivedAt) === wantArchived)
      .map(({ project, role }) => toProjectSummary(db, project, role))
    if (sort === PROJECT_SORT.LAST_UPDATED) {
      projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
    return limit === undefined ? projects : projects.slice(0, limit)
  })
}

export function getProject(projectId) {
  return mockRequest((db) => {
    const { project, membership } = requireProjectMembership(db, projectId)
    return toProjectSummary(db, project, membership.role)
  })
}

function throwIfInvalid(fieldErrors) {
  if (Object.keys(fieldErrors).length > 0) {
    throw new ServiceError(SERVICE_ERROR.VALIDATION, 'validation', { fieldErrors })
  }
}

// Returns the project and membership if the signed-in user is its owner.
function requireOwnedProject(db, projectId) {
  const { project, membership } = requireProjectMembership(db, projectId)
  if (!canManageProject({ role: membership.role })) {
    throw new ServiceError(SERVICE_ERROR.NO_PERMISSION)
  }
  return { project, membership }
}

// Creates a project; the creator becomes its only owner (FR-PRJ-01, F-04).
// Returns the new project's summary.
export function createProject(input) {
  return mockRequest((db) => {
    const userId = requireSignedInUserId(db)
    throwIfInvalid(validateProject(input))
    const now = new Date().toISOString()
    const project = {
      id: `project-${crypto.randomUUID()}`,
      ...normalizeProjectInput(input),
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    db.projects.push(project)
    db.projectMemberships.push({ projectId: project.id, userId, role: PROJECT_ROLE.OWNER })
    return toProjectSummary(db, project, PROJECT_ROLE.OWNER)
  })
}

// Edits name, description and due date (owner only, FR-PRJ-04). `changes`
// holds only the fields to change. Returns the updated summary.
export function updateProject(projectId, changes = {}) {
  return mockRequest((db) => {
    const { project, membership } = requireOwnedProject(db, projectId)
    if (project.archivedAt) {
      throw new ServiceError(SERVICE_ERROR.ARCHIVED)
    }
    const editable = ['name', 'description', 'dueDate'].filter((field) => field in changes)
    const next = { ...project, ...Object.fromEntries(editable.map((f) => [f, changes[f]])) }
    throwIfInvalid(validateProject(next))
    Object.assign(project, normalizeProjectInput(next), { updatedAt: new Date().toISOString() })
    return toProjectSummary(db, project, membership.role)
  })
}

// Archives a project (owner only, FR-PRJ-05). Returns the archived summary.
export function archiveProject(projectId) {
  return mockRequest((db) => {
    const { project, membership } = requireOwnedProject(db, projectId)
    if (project.archivedAt) {
      throw new ServiceError(SERVICE_ERROR.ALREADY_ARCHIVED)
    }
    const now = new Date().toISOString()
    Object.assign(project, { archivedAt: now, updatedAt: now })
    return toProjectSummary(db, project, membership.role)
  })
}

// Makes an archived project active and editable again (owner only,
// FR-PRJ-08; backend enforcement pending A-02). Returns the active summary.
export function restoreProject(projectId) {
  return mockRequest((db) => {
    const { project, membership } = requireOwnedProject(db, projectId)
    if (!project.archivedAt) {
      throw new ServiceError(SERVICE_ERROR.NOT_ARCHIVED)
    }
    Object.assign(project, { archivedAt: null, updatedAt: new Date().toISOString() })
    return toProjectSummary(db, project, membership.role)
  })
}
