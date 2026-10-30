import { PROJECT_ROLE, TASK_STATUS } from '../../../data/constants.js'
import {
  mockRequest,
  requireProjectMembership,
  requireSignedInUserId,
} from '../../../services/mock/mockDb.js'
import { SERVICE_ERROR, ServiceError } from '../../../services/serviceError.js'
import { normalizeEmail } from '../../../utils/validation.js'
import { canLeaveProject, canManageMembers } from '../../projects/projectPermissions.js'
import { validateMemberEmail } from '../validation.js'

// Members service. Mock implementation. The real email lookup must run on the
// backend: owner only, minimal data returned and rate limited (FR-TEAM-07,
// PRD B-12). The mock doesn't simulate rate limiting.

// What the member list shows, and nothing more (FR-TEAM-01, FR-TEAM-07).
function toMemberSummary(db, membership) {
  const user = db.users.find((u) => u.id === membership.userId)
  return {
    userId: membership.userId,
    displayName: user?.displayName ?? '',
    email: user?.email ?? '',
    role: membership.role,
    openTaskCount: db.tasks.filter(
      (t) =>
        t.projectId === membership.projectId &&
        t.assigneeId === membership.userId &&
        t.status !== TASK_STATUS.COMPLETED,
    ).length,
  }
}

// Removes a membership. The person's assigned tasks in the project become
// unassigned; the tasks stay (FR-TSK-07). Returns how many were unassigned.
function endMembership(db, membership) {
  db.projectMemberships = db.projectMemberships.filter((m) => m !== membership)
  const assigned = db.tasks.filter(
    (t) => t.projectId === membership.projectId && t.assigneeId === membership.userId,
  )
  assigned.forEach((t) => {
    t.assigneeId = null
  })
  return assigned.length
}

export function listMembers(projectId) {
  return mockRequest((db) => {
    requireProjectMembership(db, projectId)
    return db.projectMemberships
      .filter((m) => m.projectId === projectId)
      .map((m) => toMemberSummary(db, m))
  })
}

// Adds an existing SkillBridge account by email (owner only, FR-TEAM-02). No
// invitation or email is sent. Blocked in archived projects (F-09). Returns
// the added member.
export function addMemberByEmail(projectId, email) {
  return mockRequest((db) => {
    const { project, membership } = requireProjectMembership(db, projectId)
    if (!canManageMembers({ role: membership.role })) {
      throw new ServiceError(SERVICE_ERROR.NO_PERMISSION)
    }
    if (project.archivedAt) {
      throw new ServiceError(SERVICE_ERROR.ARCHIVED)
    }
    const fieldErrors = validateMemberEmail({ email })
    if (fieldErrors.email) {
      throw new ServiceError(SERVICE_ERROR.VALIDATION, 'validation', { fieldErrors })
    }
    const user = db.users.find((u) => u.email === normalizeEmail(email))
    if (!user) {
      throw new ServiceError(SERVICE_ERROR.USER_NOT_FOUND)
    }
    if (db.projectMemberships.some((m) => m.projectId === projectId && m.userId === user.id)) {
      throw new ServiceError(SERVICE_ERROR.ALREADY_MEMBER)
    }
    const added = { projectId, userId: user.id, role: PROJECT_ROLE.MEMBER }
    db.projectMemberships.push(added)
    return toMemberSummary(db, added)
  })
}

// Removes a member (owner only, FR-TEAM-03); also works in archived projects
// (A-05). They lose all access at once. Returns { unassignedTaskCount }.
export function removeMember(projectId, userId) {
  return mockRequest((db) => {
    const { membership } = requireProjectMembership(db, projectId)
    if (!canManageMembers({ role: membership.role })) {
      throw new ServiceError(SERVICE_ERROR.NO_PERMISSION)
    }
    const target = db.projectMemberships.find(
      (m) => m.projectId === projectId && m.userId === userId,
    )
    if (!target) {
      throw new ServiceError(SERVICE_ERROR.NOT_A_MEMBER)
    }
    if (target.role === PROJECT_ROLE.OWNER) {
      throw new ServiceError(SERVICE_ERROR.CANNOT_REMOVE_OWNER)
    }
    return { unassignedTaskCount: endMembership(db, target) }
  })
}

// The signed-in member leaves a project, also an archived one (FR-TEAM-04,
// A-05). Access ends at once, exactly like removal. The owner can't leave (E-08).
export function leaveProject(projectId) {
  return mockRequest((db) => {
    const userId = requireSignedInUserId(db)
    const membership = db.projectMemberships.find(
      (m) => m.projectId === projectId && m.userId === userId,
    )
    if (!membership) {
      throw new ServiceError(SERVICE_ERROR.NOT_A_MEMBER)
    }
    if (!canLeaveProject({ role: membership.role })) {
      throw new ServiceError(SERVICE_ERROR.OWNER_CANNOT_LEAVE)
    }
    endMembership(db, membership)
    return null
  })
}
