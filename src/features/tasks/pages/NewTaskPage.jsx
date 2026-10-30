import { useCallback } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import SectionError from '../../../components/common/SectionError.jsx'
import { useToast } from '../../../components/common/toastContext.js'
import Header from '../../../components/layout/Header.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import ProjectNoAccess from '../../projects/components/ProjectNoAccess.jsx'
import { projectActionMessage } from '../../projects/projectMessages.js'
import { getProject } from '../../projects/services/projectsService.js'
import TaskForm from '../components/TaskForm.jsx'
import { createTask } from '../services/tasksService.js'
import { canAssignTask } from '../taskPermissions.js'
import { listMembers } from '../../members/services/membersService.js'
import '../components/tasks.css'

function describeFailure(error) {
  return { message: projectActionMessage(error, "Couldn't create the task. Try again.") }
}

// New task (FR-TSK-01), for any project member. Every new task starts as To Do.
// Only the owner sees the Assignee field (default Unassigned, current members
// only); tasks created by members start unassigned (E-03). Archived projects
// redirect to the Tasks tab (PRD route map). On success: toast "Task
// created", back to the list.
function NewTaskPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const load = useCallback(
    () =>
      Promise.all([getProject(projectId), listMembers(projectId)]).then(([project, members]) => ({
        project,
        members,
      })),
    [projectId],
  )
  const { status, data, error, retry } = useServiceData(load)
  const project = data?.project
  const tasksPath = `/projects/${projectId}/tasks`

  if (status === 'loading') {
    return (
      <>
        <Header title="New task" />
        <PageContainer>
          <p className="visually-hidden">Loading project</p>
        </PageContainer>
      </>
    )
  }
  if (status === 'error') {
    if (error?.code === SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS) return <ProjectNoAccess />
    return (
      <>
        <Header title="New task" />
        <PageContainer>
          <SectionError error={error} what="this project" onRetry={retry} />
        </PageContainer>
      </>
    )
  }
  if (project.archivedAt) return <Navigate to={tasksPath} replace />

  const isOwner = canAssignTask({ role: project.role })
  const assigneeOptions = isOwner
    ? data.members.map((m) => ({ value: m.userId, label: m.displayName }))
    : undefined

  // Sends an assignee only when the owner chose one.
  async function handleSubmit({ assigneeId, ...fields }) {
    await createTask(projectId, isOwner && assigneeId ? { ...fields, assigneeId } : fields)
    showToast('Task created')
    navigate(tasksPath)
  }

  return (
    <>
      <header className="page-header">
        <div className="page-container project-header">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol>
              <li>
                <Link to="/projects">Projects</Link>
              </li>
              <li>
                <Link to={tasksPath}>{project.name}</Link>
              </li>
              <li>
                <span aria-current="page">New task</span>
              </li>
            </ol>
          </nav>
          <div className="project-title-row">
            <h1>New task</h1>
          </div>
        </div>
      </header>
      <PageContainer className="project-page">
        <p className="project-meta">
          {isOwner ? 'New tasks start as To Do.' : 'New tasks start as To Do and unassigned.'}
        </p>
        <TaskForm
          assigneeOptions={assigneeOptions}
          submitLabel="Create task"
          pendingLabel="Creating…"
          onSubmit={handleSubmit}
          describeFailure={describeFailure}
          actions={
            <Link className="btn btn-secondary" to={tasksPath}>
              Cancel
            </Link>
          }
        />
      </PageContainer>
    </>
  )
}

export default NewTaskPage
