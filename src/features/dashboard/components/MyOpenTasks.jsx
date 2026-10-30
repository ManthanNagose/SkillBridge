import { Link } from 'react-router-dom'
import Card from '../../../components/common/Card.jsx'
import StatusBadge from '../../../components/common/StatusBadge.jsx'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { formatDate } from '../../../utils/dates.js'
import { isTaskOverdue } from '../../../utils/tasks.js'
import { listMyOpenTasks } from '../services/dashboardService.js'
import SectionError from '../../../components/common/SectionError.jsx'

// FR-DASH-03 (Should). Each task links to its task detail page (PRD F-01).
function MyOpenTasks() {
  const { status, data: tasks, error, retry } = useServiceData(listMyOpenTasks)

  return (
    <section className="dashboard-section" aria-labelledby="open-tasks-title" aria-busy={status === 'loading'}>
      <div className="dashboard-section-header">
        <h2 id="open-tasks-title">My open tasks</h2>
      </div>

      {status === 'loading' && (
        <Card className="task-list" aria-hidden="true">
          {[0, 1].map((n) => (
            <div key={n} className="task-row">
              <span className="skeleton skeleton-line skeleton-title" />
              <span className="skeleton skeleton-line skeleton-short" />
            </div>
          ))}
        </Card>
      )}
      {status === 'loading' && <p className="visually-hidden">Loading your open tasks</p>}

      {status === 'error' && <SectionError error={error} what="your open tasks" onRetry={retry} />}

      {status === 'success' && tasks.length === 0 && (
        <Card className="dashboard-empty">
          <p className="dashboard-meta">Nothing assigned to you right now.</p>
        </Card>
      )}

      {status === 'success' && tasks.length > 0 && (
        <Card className="task-list">
          <ul>
            {tasks.map((task) => (
              <li key={task.id} className="task-row">
                <div className="task-row-main">
                  <Link to={`/projects/${task.projectId}/tasks/${task.id}`}>{task.title}</Link>
                  <span className="dashboard-meta">{task.projectName}</span>
                </div>
                <div className="task-row-details">
                  <StatusBadge status={task.status} />
                  <span className="dashboard-meta">
                    {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
                  </span>
                  {isTaskOverdue(task) && <span className="task-overdue">Overdue</span>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}

export default MyOpenTasks
