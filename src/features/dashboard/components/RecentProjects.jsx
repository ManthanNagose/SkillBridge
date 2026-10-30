import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../../components/common/Card.jsx'
import SectionError from '../../../components/common/SectionError.jsx'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { pluralize } from '../../../utils/text.js'
import ProjectCard, { ProjectCardSkeletons } from '../../projects/components/ProjectCard.jsx'
import {
  PROJECT_SORT,
  PROJECT_VIEW,
  listMyProjects,
} from '../../projects/services/projectsService.js'

const RECENT_PROJECT_LIMIT = 6

// Defined once, so useServiceData gets the same function on every render.
function loadRecentProjects() {
  return listMyProjects({
    view: PROJECT_VIEW.ACTIVE,
    sort: PROJECT_SORT.LAST_UPDATED,
    limit: RECENT_PROJECT_LIMIT,
  })
}

// FR-DASH-04, with the new-user empty state from PRD section 07.
function RecentProjects() {
  const { status, data: projects, error, retry } = useServiceData(loadRecentProjects)
  const hasProjects = status === 'success' && projects.length > 0

  return (
    <section className="dashboard-section" aria-labelledby="recent-projects-title" aria-busy={status === 'loading'}>
      <div className="dashboard-section-header">
        <h2 id="recent-projects-title">Recent projects</h2>
        {hasProjects && <Link to="/projects">View all projects</Link>}
      </div>

      {status === 'loading' && <ProjectCardSkeletons />}
      {status === 'loading' && <p className="visually-hidden">Loading recent projects</p>}

      {status === 'error' && <SectionError error={error} what="your projects" onRetry={retry} />}

      {status === 'success' && projects.length === 0 && (
        <Card className="dashboard-empty">
          <p className="dashboard-empty-title">You're not in any projects yet.</p>
          <p className="dashboard-meta">
            Teammates can also add you to their projects using your email address.
          </p>
          <Link className="btn btn-primary" to="/projects/new">
            <Plus size={18} aria-hidden="true" />
            Create a project
          </Link>
        </Card>
      )}

      {hasProjects && (
        <ul className="project-grid">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project}>
                <p className="project-overdue" data-alert={project.overdueTaskCount > 0}>
                  {project.overdueTaskCount > 0
                    ? pluralize(project.overdueTaskCount, 'overdue task')
                    : 'No overdue tasks'}
                </p>
              </ProjectCard>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default RecentProjects
