import { Link } from 'react-router-dom'
import Card from '../../../components/common/Card.jsx'
import { formatDate } from '../../../utils/dates.js'
import ProjectProgress from './ProjectProgress.jsx'
import './projects.css'

// A project summary from listMyProjects: name linking to the project, optional
// labels, due date and progress (FR-PRJ-06). Callers add their own details as
// children. Used by the Projects list and the dashboard's Recent projects.
function ProjectCard({ project, labels, children }) {
  const { id, name, dueDate, taskCount, completedTaskCount } = project

  return (
    <Card className="project-card">
      <h3 className="project-card-title">
        {/* /projects/:projectId opens the project's Tasks tab (PRD route map). */}
        <Link to={`/projects/${id}`}>{name}</Link>
      </h3>
      {labels && <div className="project-labels">{labels}</div>}
      <p className="project-meta">{dueDate ? `Due ${formatDate(dueDate)}` : 'No due date'}</p>
      <ProjectProgress name={name} taskCount={taskCount} completedTaskCount={completedTaskCount} />
      {children}
    </Card>
  )
}

// Placeholder cards while projects load. Hidden from assistive technology; the
// caller announces loading in words.
export function ProjectCardSkeletons({ count = 3 }) {
  return (
    <ul className="project-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, n) => (
        <li key={n}>
          <Card className="project-card">
            <span className="skeleton skeleton-line skeleton-title" />
            <span className="skeleton skeleton-line" />
            <span className="skeleton skeleton-line skeleton-short" />
          </Card>
        </li>
      ))}
    </ul>
  )
}

export default ProjectCard
