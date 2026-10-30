import { TASK_STATUS } from '../../../data/constants.js'
import { mockRequest, requireSignedInUserId } from '../../../services/mock/mockDb.js'
import { isTaskOverdue, todayDateString } from '../../../utils/tasks.js'

// Dashboard service. Mock implementation. Deferred: the "completed this week"
// figure, which needs a completion time the schema doesn't define yet
// (PRD B-01). Recent projects use listMyProjects from the projects service.
//
// Archived projects are left out of every figure and list (PRD F-05, pending A-04).

function activeProjectsOf(db, userId) {
  return db.projectMemberships
    .filter((m) => m.userId === userId)
    .map((m) => db.projects.find((p) => p.id === m.projectId))
    .filter((p) => p && !p.archivedAt)
}

// Tasks in the given projects that are assigned to the user and not Completed.
function openTasksOf(db, userId, projectIds) {
  return db.tasks.filter(
    (t) =>
      projectIds.includes(t.projectId) &&
      t.assigneeId === userId &&
      t.status !== TASK_STATUS.COMPLETED,
  )
}

export function getDashboardSummary() {
  return mockRequest((db) => {
    const userId = requireSignedInUserId(db)
    const activeProjectIds = activeProjectsOf(db, userId).map((p) => p.id)
    const myOpenTasks = openTasksOf(db, userId, activeProjectIds)
    const today = todayDateString()
    return {
      activeProjectCount: activeProjectIds.length,
      myOpenTaskCount: myOpenTasks.length,
      myOverdueTaskCount: myOpenTasks.filter((t) => isTaskOverdue(t, today)).length,
    }
  })
}

// "My open tasks" (FR-DASH-03): up to `limit` tasks, soonest due date first and
// tasks without a date last. Each task also carries its project's name.
export function listMyOpenTasks({ limit = 10 } = {}) {
  return mockRequest((db) => {
    const userId = requireSignedInUserId(db)
    const projectNames = new Map(activeProjectsOf(db, userId).map((p) => [p.id, p.name]))
    return openTasksOf(db, userId, [...projectNames.keys()])
      .toSorted((a, b) => {
        if (a.dueDate === b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      })
      .slice(0, limit)
      .map((task) => ({ ...task, projectName: projectNames.get(task.projectId) }))
  })
}
