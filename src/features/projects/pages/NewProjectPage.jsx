import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/common/toastContext.js'
import Header from '../../../components/layout/Header.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import ProjectForm from '../components/ProjectForm.jsx'
import { createProject } from '../services/projectsService.js'

function failureMessage(error) {
  return error?.code === SERVICE_ERROR.NETWORK
    ? "Can't reach SkillBridge. Check your connection and try again."
    : "Couldn't create the project. Try again."
}

// New project (FR-PRJ-01). On success: toast "Project created", then the new
// project's Tasks tab (PRD section 07).
function NewProjectPage() {
  const navigate = useNavigate()
  const showToast = useToast()

  async function handleSubmit(values) {
    const project = await createProject(values)
    showToast('Project created')
    navigate(`/projects/${project.id}/tasks`)
  }

  return (
    <>
      <Header title="New project" />
      <PageContainer>
        <ProjectForm
          submitLabel="Create project"
          pendingLabel="Creating…"
          onSubmit={handleSubmit}
          failureMessage={failureMessage}
          actions={
            <Link className="btn btn-secondary" to="/projects">
              Cancel
            </Link>
          }
        />
      </PageContainer>
    </>
  )
}

export default NewProjectPage
