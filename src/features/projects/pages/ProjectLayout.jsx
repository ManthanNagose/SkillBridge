import { useCallback, useState } from 'react'
import { Archive } from 'lucide-react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import SectionError from '../../../components/common/SectionError.jsx'
import Header from '../../../components/layout/Header.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import { formatDate } from '../../../utils/dates.js'
import { pluralize } from '../../../utils/text.js'
import ProjectNoAccess from '../components/ProjectNoAccess.jsx'
import ProjectProgress from '../components/ProjectProgress.jsx'
import { projectRoleLabel } from '../projectLabels.js'
import RestoreProjectButton from '../components/RestoreProjectButton.jsx'
import { canManageProject } from '../projectPermissions.js'
import { getProject } from '../services/projectsService.js'
import '../components/projects.css'

const TABS = [
  { to: 'tasks', label: 'Tasks' },
  { to: 'members', label: 'Members' },
  { to: 'settings', label: 'Settings', ownerOnly: true },
]

function ProjectLoading() {
  return (
    <>
      <header className="page-header">
        <div className="page-container page-header-inner">
          <h1>
            <span className="visually-hidden">Loading project</span>
            <span className="skeleton skeleton-heading" aria-hidden="true" />
          </h1>
        </div>
      </header>
      <PageContainer className="project-page">
        <div className="project-summary" aria-hidden="true">
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line skeleton-short" />
        </div>
      </PageContainer>
    </>
  )
}

// Project header, archived banner, details and tabs (FR-PRJ-03, FR-PRJ-09).
// The selected tab renders below and gets the project through outlet context,
// with onProjectChange (show a project returned by an action) and
// refreshProject (fetch it again quietly, without the loading state).
function ProjectLayout() {
  const { projectId } = useParams()
  const load = useCallback(() => getProject(projectId), [projectId])
  const { status, data, error, retry } = useServiceData(load)
  // The latest project from an action, valid only for the data it replaced.
  const [updated, setUpdated] = useState(null)

  if (status === 'loading') return <ProjectLoading />

  if (status === 'error') {
    if (error?.code === SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS) return <ProjectNoAccess />
    return (
      <>
        <Header title="Project" />
        <PageContainer className="project-page">
          <SectionError error={error} what="this project" onRetry={retry} />
        </PageContainer>
      </>
    )
  }

  const project = updated?.forData === data ? updated.project : data
  const isArchived = Boolean(project.archivedAt)
  const isOwner = canManageProject({ role: project.role })

  function onProjectChange(next) {
    setUpdated({ forData: data, project: next })
  }

  function refreshProject() {
    getProject(projectId).then(onProjectChange, () => {})
  }

  return (
    <>
      <header className="page-header">
        <div className="page-container project-header">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol>
              <li>
                <Link to={isArchived ? '/projects/archived' : '/projects'}>Projects</Link>
              </li>
              <li>
                <span aria-current="page">{project.name}</span>
              </li>
            </ol>
          </nav>
          <div className="project-title-row">
            <h1>{project.name}</h1>
            {isArchived && <span className="project-label project-label-archived">Archived</span>}
          </div>
        </div>
      </header>

      <PageContainer className="project-page">
        {isArchived && (
          <div className="project-banner">
            <p>
              <Archive size={18} aria-hidden="true" />
              This project is archived. It's read-only.
            </p>
            {isOwner && (
              <RestoreProjectButton
                project={project}
                onProjectChange={onProjectChange}
                refreshProject={refreshProject}
              />
            )}
          </div>
        )}

        <div className="project-summary">
          {project.description && <p className="project-description">{project.description}</p>}
          <ul className="project-facts">
            <li>Your role: {projectRoleLabel(project.role)}</li>
            <li>{project.dueDate ? `Due ${formatDate(project.dueDate)}` : 'No due date'}</li>
            <li>{pluralize(project.memberCount, 'member')}</li>
          </ul>
          <ProjectProgress
            name={project.name}
            taskCount={project.taskCount}
            completedTaskCount={project.completedTaskCount}
          />
        </div>

        <nav className="project-views" aria-label="Project sections">
          <ul>
            {TABS.filter((tab) => isOwner || !tab.ownerOnly).map(({ to, label }) => (
              <li key={to}>
                <NavLink className="project-view-link" to={to}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <Outlet context={{ project, onProjectChange, refreshProject }} />
      </PageContainer>
    </>
  )
}

export default ProjectLayout
