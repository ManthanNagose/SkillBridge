import { useRef, useState } from 'react'
import { Archive } from 'lucide-react'
import { Navigate, useOutletContext } from 'react-router-dom'
import Button from '../../../components/common/Button.jsx'
import Card from '../../../components/common/Card.jsx'
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx'
import { useToast } from '../../../components/common/toastContext.js'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import ProjectForm from '../components/ProjectForm.jsx'
import ProjectNotice from '../components/ProjectNotice.jsx'
import { isAccessLost, projectActionMessage } from '../projectMessages.js'
import { canManageProject } from '../projectPermissions.js'
import { archiveProject, updateProject } from '../services/projectsService.js'

// Failures that mean the page is out of date: show why, then reload the project.
const STALE_CODES = [
  SERVICE_ERROR.NO_PERMISSION,
  SERVICE_ERROR.ARCHIVED,
  SERVICE_ERROR.ALREADY_ARCHIVED,
  SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS,
]

// Settings tab (owner only): edit details (FR-PRJ-04) and archive (FR-PRJ-05).
// When archived, details can't be edited and Restore project is in the banner
// above. Members who open it go to the Tasks tab (PRD section 04).
function ProjectSettingsTab() {
  const { project, onProjectChange, refreshProject } = useOutletContext()
  const showToast = useToast()
  const [failure, setFailure] = useState(null)
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const headingRef = useRef(null)

  if (!canManageProject({ role: project.role })) {
    return <Navigate to={`/projects/${project.id}/tasks`} replace />
  }

  function handleStaleFailure(error) {
    setFailure(error)
    if (error.code !== SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS) refreshProject()
  }

  async function handleSave(values) {
    setFailure(null)
    const changes = Object.fromEntries(
      Object.entries(values).filter(([field, value]) => value !== (project[field] ?? '')),
    )
    try {
      onProjectChange(await updateProject(project.id, changes))
      showToast('Project updated')
    } catch (error) {
      if (!STALE_CODES.includes(error.code)) throw error
      handleStaleFailure(error)
    }
  }

  async function handleArchive() {
    if (archiving) return
    setArchiving(true)
    setFailure(null)
    try {
      const archived = await archiveProject(project.id)
      setConfirmingArchive(false)
      onProjectChange(archived)
      showToast('Project archived')
      // The Archive button is gone now, so focus moves to the tab heading.
      requestAnimationFrame(() => headingRef.current?.focus())
    } catch (error) {
      // On failure the dialog closes and the error shows on the page.
      setConfirmingArchive(false)
      if (STALE_CODES.includes(error.code)) handleStaleFailure(error)
      else setFailure(error)
    } finally {
      setArchiving(false)
    }
  }

  const isArchived = Boolean(project.archivedAt)

  return (
    <section className="project-tab" aria-labelledby="project-tab-title">
      <div className="project-tab-header">
        <h2 id="project-tab-title" ref={headingRef} tabIndex={-1}>
          Settings
        </h2>
      </div>

      {failure && (
        <ProjectNotice
          message={projectActionMessage(failure, "Couldn't archive the project. Try again.")}
          showDashboardLink={isAccessLost(failure)}
        />
      )}

      {isArchived ? (
        <Card className="settings-card">
          <p>
            This project is archived, so its details can't be edited. Restore it to make it active
            and editable again.
          </p>
        </Card>
      ) : (
        <>
          <Card className="settings-card">
            <h3 id="project-details-title">Project details</h3>
            <ProjectForm
              key={project.id}
              initialValues={project}
              submitLabel="Save changes"
              pendingLabel="Saving…"
              onSubmit={handleSave}
              failureMessage={(error) =>
                projectActionMessage(error, "Couldn't save the project. Try again.")
              }
            />
          </Card>

          <Card className="settings-card">
            <h3 id="archive-project-title">Archive project</h3>
            <p>Members can still view it, but no one can change it until you restore it.</p>
            <Button variant="danger" onClick={() => setConfirmingArchive(true)}>
              <Archive size={18} aria-hidden="true" />
              Archive project
            </Button>
          </Card>

          <ConfirmDialog
            open={confirmingArchive}
            title={`Archive ‘${project.name}’?`}
            confirmLabel="Archive project"
            pendingLabel="Archiving…"
            pending={archiving}
            onConfirm={handleArchive}
            onCancel={() => setConfirmingArchive(false)}
          >
            <p>Members can still view it, but no one can change it until you restore it.</p>
          </ConfirmDialog>
        </>
      )}
    </section>
  )
}

export default ProjectSettingsTab
