import { useCallback } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import Card from '../../../components/common/Card.jsx'
import SectionError from '../../../components/common/SectionError.jsx'
import StatusBadge from '../../../components/common/StatusBadge.jsx'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { formatDate } from '../../../utils/dates.js'
import { isTaskOverdue } from '../../../utils/tasks.js'
import { listMembers } from '../../members/services/membersService.js'
import { listTasks } from '../../tasks/services/tasksService.js'

// Task list (FR-TSK-05): title, status, priority, assignee and due date. A
// table on wide screens, stacked cards on phones. Read-only here: status
// changes and assignment belong to the task detail page (FR-TSK-11).
// Add task is hidden in archived projects (FR-PRJ-05).
function ProjectTasksTab() {
  const { project } = useOutletContext()
  const projectId = project.id
  const isArchived = Boolean(project.archivedAt)

  // Members give assignee names; listTasks returns only the assignee's ID.
  const load = useCallback(
    () =>
      Promise.all([listTasks(projectId), listMembers(projectId)]).then(([tasks, members]) => ({
        tasks,
        memberNames: new Map(members.map((m) => [m.userId, m.displayName])),
      })),
    [projectId],
  )
  const { status, data, error, retry } = useServiceData(load)
  const addTaskLink = !isArchived && (
    <Link className="btn btn-primary" to={`/projects/${projectId}/tasks/new`}>
      <Plus size={18} aria-hidden="true" />
      Add task
    </Link>
  )

  function assigneeName(assigneeId) {
    if (!assigneeId) return 'Unassigned'
    return data.memberNames.get(assigneeId) ?? 'Unknown member'
  }

  return (
    <section className="project-tab" aria-labelledby="project-tab-title" aria-busy={status === 'loading'}>
      <div className="project-tab-header">
        <h2 id="project-tab-title">Tasks</h2>
        {status === 'success' && data.tasks.length > 0 && addTaskLink}
      </div>

      {status === 'loading' && (
        <Card aria-hidden="true" className="task-table-skeleton">
          <span className="skeleton skeleton-line skeleton-title" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line skeleton-short" />
        </Card>
      )}
      {status === 'loading' && <p className="visually-hidden">Loading tasks</p>}

      {status === 'error' && <SectionError error={error} what="the tasks" onRetry={retry} />}

      {status === 'success' && data.tasks.length === 0 && (
        <Card className="projects-empty">
          <p className="projects-empty-title">No tasks in this project yet.</p>
          {addTaskLink}
        </Card>
      )}

      {status === 'success' && data.tasks.length > 0 && (
        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">Assignee</th>
                <th scope="col">Due date</th>
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((task) => (
                <tr key={task.id}>
                  <th scope="row" className="task-table-title">
                    <Link to={`/projects/${projectId}/tasks/${task.id}`}>{task.title}</Link>
                  </th>
                  <td data-label="Status">
                    <StatusBadge status={task.status} />
                  </td>
                  <td data-label="Priority">{task.priority}</td>
                  <td data-label="Assignee">{assigneeName(task.assigneeId)}</td>
                  <td data-label="Due date">
                    {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                    {isTaskOverdue(task) && (
                      <span className="task-overdue-flag">
                        <AlertTriangle size={14} aria-hidden="true" />
                        Overdue
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ProjectTasksTab
