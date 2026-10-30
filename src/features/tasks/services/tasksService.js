import { NEW_TASK_DEFAULTS, TASK_STATUS } from '../../../data/constants.js'
import {
  mockRequest,
  requireProjectMembership,
  requireSignedInUserId,
} from '../../../services/mock/mockDb.js'
import { SERVICE_ERROR, ServiceError } from '../../../services/serviceError.js'
import {
  canAssignTask,
  canChangeTaskStatus,
  canDeleteTask,
  canEditTaskDetails,
} from '../taskPermissions.js'
import { normalizeTaskInput, validateTask } from '../validation.js'

// Tasks service. Mock implementation. Deferred: filters (D-15).

function throwIfInvalid(fieldErrors) {
  if (Object.keys(fieldErrors).length > 0) {
    throw new ServiceError(SERVICE_ERROR.VALIDATION, 'validation', { fieldErrors })
  }
}

function isProjectMember(db, projectId, userId) {
  return db.projectMemberships.some((m) => m.projectId === projectId && m.userId === userId)
}

export function listTasks(projectId) {
  return mockRequest((db) => {
    requireProjectMembership(db, projectId)
    return db.tasks.filter((t) => t.projectId === projectId)
  })
}

export function getTask(projectId, taskId) {
  return mockRequest((db) => {
    requireProjectMembership(db, projectId)
    const task = db.tasks.find((t) => t.id === taskId && t.projectId === projectId)
    if (!task) {
      throw new ServiceError(SERVICE_ERROR.TASK_NOT_FOUND)
    }
    return task
  })
}

// Finds a task for a change: the caller must be a current member of its
// project, and the project must not be archived (E-10).
function requireChangeableTask(db, taskId) {
  requireSignedInUserId(db)
  const task = db.tasks.find((t) => t.id === taskId)
  if (!task) {
    throw new ServiceError(SERVICE_ERROR.TASK_NOT_FOUND)
  }
  const { project, membership } = requireProjectMembership(db, task.projectId)
  if (project.archivedAt) {
    throw new ServiceError(SERVICE_ERROR.ARCHIVED)
  }
  return { task, membership }
}

// Moves a task to another status. Owners: any task. Members: only tasks
// assigned to them. Returns the updated task.
export function changeTaskStatus(taskId, status) {
  return mockRequest((db) => {
    const { task, membership } = requireChangeableTask(db, taskId)
    if (!Object.values(TASK_STATUS).includes(status)) {
      throw new ServiceError(SERVICE_ERROR.VALIDATION, 'validation', {
        fieldErrors: { status: 'invalid' },
      })
    }
    if (
      !canChangeTaskStatus({
        role: membership.role,
        assigneeId: task.assigneeId,
        userId: membership.userId,
      })
    ) {
      throw new ServiceError(SERVICE_ERROR.NO_PERMISSION)
    }
    task.status = status
    task.updatedAt = new Date().toISOString()
    return task
  })
}

// Assigns a task to a current project member, or unassigns it with null.
// Owner only. Returns the updated task.
export function assignTask(taskId, assigneeId) {
  return mockRequest((db) => {
    const { task, membership } = requireChangeableTask(db, taskId)
    if (!canAssignTask({ role: membership.role })) {
      throw new ServiceError(SERVICE_ERROR.NO_PERMISSION)
    }
    if (assigneeId !== null && !isProjectMember(db, task.projectId, assigneeId)) {
      throw new ServiceError(SERVICE_ERROR.ASSIGNEE_NOT_MEMBER)
    }
    task.assigneeId = assigneeId
    task.updatedAt = new Date().toISOString()
    return task
  })
}

// Creates a task (FR-TSK-01). It always starts as To Do and the caller is
// recorded as its creator. It starts unassigned unless an owner sends an
// assigneeId; one sent by a member is rejected (E-03). Returns the new task.
export function createTask(projectId, input = {}) {
  return mockRequest((db) => {
    const { project, membership } = requireProjectMembership(db, projectId)
    if (project.archivedAt) {
      throw new ServiceError(SERVICE_ERROR.ARCHIVED)
    }
    const values = { priority: NEW_TASK_DEFAULTS.priority, ...input }
    throwIfInvalid(validateTask(values))

    const assigneeId = input.assigneeId || null
    if (assigneeId !== null) {
      if (!canAssignTask({ role: membership.role })) {
        throw new ServiceError(SERVICE_ERROR.NO_PERMISSION)
      }
      if (!isProjectMember(db, projectId, assigneeId)) {
        throw new ServiceError(SERVICE_ERROR.ASSIGNEE_NOT_MEMBER)
      }
    }

    const now = new Date().toISOString()
    const task = {
      id: `task-${crypto.randomUUID()}`,
      projectId,
      ...normalizeTaskInput(values),
      status: NEW_TASK_DEFAULTS.status,
      assigneeId,
      createdBy: membership.userId,
      createdAt: now,
      updatedAt: now,
    }
    db.tasks.push(task)
    return task
  })
}

// Edits title, description, priority and due date (FR-TSK-06): owners any
// task, members only tasks they created. `changes` holds only the fields to
// change. Status and assignee have their own operations. Returns the task.
export function updateTaskDetails(taskId, changes = {}) {
  return mockRequest((db) => {
    const { task, membership } = requireChangeableTask(db, taskId)
    if (
      !canEditTaskDetails({
        role: membership.role,
        createdBy: task.createdBy,
        userId: membership.userId,
      })
    ) {
      throw new ServiceError(SERVICE_ERROR.NO_PERMISSION)
    }
    const editable = ['title', 'description', 'priority', 'dueDate'].filter((f) => f in changes)
    const next = { ...task, ...Object.fromEntries(editable.map((f) => [f, changes[f]])) }
    throwIfInvalid(validateTask(next))
    Object.assign(task, normalizeTaskInput(next), { updatedAt: new Date().toISOString() })
    return task
  })
}

// Deletes a task (owner only, E-02). The MVP keeps no copy.
export function deleteTask(taskId) {
  return mockRequest((db) => {
    const { task, membership } = requireChangeableTask(db, taskId)
    if (!canDeleteTask({ role: membership.role })) {
      throw new ServiceError(SERVICE_ERROR.NO_PERMISSION)
    }
    db.tasks = db.tasks.filter((t) => t !== task)
    return null
  })
}
