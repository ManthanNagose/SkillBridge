import { Link } from 'react-router-dom'
import './projects.css'

// Error from a project action. When access was lost it offers the dashboard (E-07).
function ProjectNotice({ message, showDashboardLink = false }) {
  if (!message) return null
  return (
    <div className="section-error" role="alert">
      <p>{message}</p>
      {showDashboardLink && (
        <Link className="btn btn-secondary" to="/dashboard">
          Go to dashboard
        </Link>
      )}
    </div>
  )
}

export default ProjectNotice
