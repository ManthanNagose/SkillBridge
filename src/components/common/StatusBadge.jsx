import { TASK_STATUS } from '../../data/constants.js'

// The only place that maps a task status to its badge style.
const STATUS_CLASS = {
  [TASK_STATUS.TO_DO]: 'status-badge-to-do',
  [TASK_STATUS.IN_PROGRESS]: 'status-badge-in-progress',
  [TASK_STATUS.COMPLETED]: 'status-badge-completed',
}

// Shows one of the agreed task statuses. An unknown value falls back to the
// To Do style but still shows its own text.
function StatusBadge({ status, className = '' }) {
  const statusClass = STATUS_CLASS[status] ?? STATUS_CLASS[TASK_STATUS.TO_DO]

  return (
    <span className={['status-badge', statusClass, className].filter(Boolean).join(' ')}>
      {status}
    </span>
  )
}

export default StatusBadge
