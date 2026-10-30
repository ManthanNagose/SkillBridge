import { Link } from 'react-router-dom'
import Header from '../../../components/layout/Header.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import './projects.css'

// The same message for a missing project and one the user can't open, so the
// page doesn't reveal whether a private project exists (PRD section 08).
function ProjectNoAccess() {
  return (
    <>
      <Header title="Project not available" />
      <PageContainer className="project-page">
        <p>This project doesn't exist or you don't have access to it.</p>
        <Link className="btn btn-primary project-page-action" to="/dashboard">
          Go to dashboard
        </Link>
      </PageContainer>
    </>
  )
}

export default ProjectNoAccess
