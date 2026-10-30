import { useRef, useState } from 'react'
import { ArchiveRestore } from 'lucide-react'
import Button from '../../../components/common/Button.jsx'
import { useToast } from '../../../components/common/toastContext.js'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import { isAccessLost, projectActionMessage } from '../projectMessages.js'
import { restoreProject } from '../services/projectsService.js'
import ProjectNotice from './ProjectNotice.jsx'

// Restore project (FR-PRJ-08), shown to the owner in the archived banner.
// "Restoring…" while it runs, then the toast "Project restored".
function RestoreProjectButton({ project, onProjectChange, refreshProject }) {
  const showToast = useToast()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState(null)
  const pendingRef = useRef(false)

  async function handleRestore() {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    setFailure(null)
    try {
      onProjectChange(await restoreProject(project.id))
      showToast('Project restored')
    } catch (error) {
      // Already restored elsewhere: show the current state instead of an error.
      if (error.code === SERVICE_ERROR.NOT_ARCHIVED) {
        refreshProject()
      } else {
        setFailure(error)
      }
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <>
      <Button variant="secondary" loading={pending} onClick={handleRestore}>
        {!pending && <ArchiveRestore size={18} aria-hidden="true" />}
        {pending ? 'Restoring…' : 'Restore project'}
      </Button>
      {failure && (
        <ProjectNotice
          message={projectActionMessage(failure, "Couldn't restore the project. Try again.")}
          showDashboardLink={isAccessLost(failure)}
        />
      )}
    </>
  )
}

export default RestoreProjectButton
