import { pluralize } from '../../../utils/text.js'
import './projects.css'

// Progress = Completed tasks ÷ all tasks (FR-PRJ-06). No tasks shows
// "No tasks yet" instead of 0%.
function ProjectProgress({ name, taskCount, completedTaskCount }) {
  if (taskCount === 0) {
    return <p className="project-meta">No tasks yet</p>
  }

  const percent = Math.round((completedTaskCount / taskCount) * 100)
  return (
    <div className="project-progress">
      <progress value={completedTaskCount} max={taskCount} aria-label={`${name} progress`}>
        {percent}%
      </progress>
      <p className="project-meta">
        {completedTaskCount} of {pluralize(taskCount, 'task')} completed ({percent}%)
      </p>
    </div>
  )
}

export default ProjectProgress
