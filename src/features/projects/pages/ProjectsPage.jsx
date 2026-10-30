import { Plus } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import Card from '../../../components/common/Card.jsx'
import SectionError from '../../../components/common/SectionError.jsx'
import Header from '../../../components/layout/Header.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { pluralize } from '../../../utils/text.js'
import ProjectCard, { ProjectCardSkeletons } from '../components/ProjectCard.jsx'
import { projectRoleLabel } from '../projectLabels.js'
import { PROJECT_VIEW, listMyProjects } from '../services/projectsService.js'
import '../components/projects.css'

// Defined once, so useServiceData gets the same function on every render.
const LOADERS = {
  [PROJECT_VIEW.ACTIVE]: () => listMyProjects({ view: PROJECT_VIEW.ACTIVE }),
  [PROJECT_VIEW.ARCHIVED]: () => listMyProjects({ view: PROJECT_VIEW.ARCHIVED }),
}

const VIEWS = [
  { view: PROJECT_VIEW.ACTIVE, to: '/projects', label: 'Active', heading: 'Active projects' },
  { view: PROJECT_VIEW.ARCHIVED, to: '/projects/archived', label: 'Archived', heading: 'Archived projects' },
]

function NewProjectLink({ children = 'New project' }) {
  return (
    <Link className="btn btn-primary" to="/projects/new">
      <Plus size={18} aria-hidden="true" />
      {children}
    </Link>
  )
}

// Active view with no projects. Mentions the Archived view only if the user
// has archived projects (PRD section 07).
function ActiveEmptyState() {
  const archived = useServiceData(LOADERS[PROJECT_VIEW.ARCHIVED])

  return (
    <Card className="projects-empty">
      <p className="projects-empty-title">You don't have any active projects.</p>
      {archived.status === 'success' && archived.data.length > 0 && (
        <p>
          Archived projects are under <Link to="/projects/archived">Archived</Link>.
        </p>
      )}
      <NewProjectLink />
    </Card>
  )
}

function ProjectList({ view }) {
  const { status, data: projects, error, retry } = useServiceData(LOADERS[view])

  if (status === 'loading') {
    return (
      <>
        <ProjectCardSkeletons />
        <p className="visually-hidden">Loading your projects</p>
      </>
    )
  }

  if (status === 'error') {
    return <SectionError error={error} what="your projects" onRetry={retry} />
  }

  if (projects.length === 0) {
    return view === PROJECT_VIEW.ACTIVE ? (
      <ActiveEmptyState />
    ) : (
      <Card className="projects-empty">
        <p className="projects-empty-title">No archived projects.</p>
      </Card>
    )
  }

  return (
    <ul className="project-grid">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard
            project={project}
            labels={
              <>
                <span className="project-label">{projectRoleLabel(project.role)}</span>
                {project.archivedAt && (
                  <span className="project-label project-label-archived">Archived</span>
                )}
              </>
            }
          >
            <p className="project-meta">{pluralize(project.memberCount, 'member')}</p>
          </ProjectCard>
        </li>
      ))}
    </ul>
  )
}

// Projects list (FR-PRJ-02, FR-PRJ-09). Active and Archived are separate
// routes, so each view can be linked and bookmarked. Search and sorting
// (FR-PRJ-07, D-15) come after the core features.
function ProjectsPage({ view = PROJECT_VIEW.ACTIVE }) {
  const { heading } = VIEWS.find((v) => v.view === view)

  return (
    <>
      <Header title="Projects">
        <NewProjectLink />
      </Header>
      <PageContainer className="projects-page">
        <nav className="project-views" aria-label="Project views">
          <ul>
            {VIEWS.map(({ to, label }) => (
              <li key={to}>
                <NavLink className="project-view-link" to={to} end>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <section aria-labelledby="project-list-title">
          <h2 id="project-list-title" className="visually-hidden">
            {heading}
          </h2>
          {/* A new key per view starts each view in its loading state. */}
          <ProjectList key={view} view={view} />
        </section>
      </PageContainer>
    </>
  )
}

export default ProjectsPage
