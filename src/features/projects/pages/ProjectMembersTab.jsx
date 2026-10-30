import { useCallback, useId, useRef, useState } from 'react'
import { LogOut, UserMinus, UserPlus } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import Button from '../../../components/common/Button.jsx'
import Card from '../../../components/common/Card.jsx'
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx'
import FormErrorSummary from '../../../components/common/FormErrorSummary.jsx'
import Input from '../../../components/common/Input.jsx'
import SectionError from '../../../components/common/SectionError.jsx'
import { useToast } from '../../../components/common/toastContext.js'
import { PROJECT_ROLE } from '../../../data/constants.js'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { summaryItems, useValidatedForm } from '../../../hooks/useValidatedForm.js'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import { pluralize } from '../../../utils/text.js'
import {
  addMemberByEmail,
  leaveProject,
  listMembers,
  removeMember,
} from '../../members/services/membersService.js'
import { memberFieldMessages, validateMemberEmail } from '../../members/validation.js'
import { useSession } from '../../auth/sessionContext.js'
import ProjectNotice from '../components/ProjectNotice.jsx'
import { projectRoleLabel } from '../projectLabels.js'
import { isAccessLost, projectActionMessage } from '../projectMessages.js'
import { canLeaveProject, canManageMembers } from '../projectPermissions.js'

// User not found and already a member show on the email field (section 08).
function describeAddFailure(error) {
  if (error.code === SERVICE_ERROR.USER_NOT_FOUND) return { fieldErrors: { email: 'not-found' } }
  if (error.code === SERVICE_ERROR.ALREADY_MEMBER) return { fieldErrors: { email: 'already-member' } }
  if (error.code === SERVICE_ERROR.RATE_LIMITED) {
    return { message: 'Too many attempts. Wait a few minutes and try again.' }
  }
  return { message: projectActionMessage(error, "Couldn't add the member. Try again.") }
}

// Add member (FR-TEAM-02, FR-TEAM-06): owner only, not in archived projects
// (F-09). Adds an existing account by email; no invitation is sent. The email
// field stays editable while adding, and clears on success.
function AddMemberForm({ project, onAdded, refreshProject }) {
  const showToast = useToast()
  const formId = useId()
  const fieldId = (name) => `${formId}-${name}`
  const { values, setValues, fieldErrors, formError, pending, summaryRef, handleChange, handleSubmit } =
    useValidatedForm({
      initialValues: { email: '' },
      validate: validateMemberEmail,
      onSubmit: async ({ email }) => {
        try {
          onAdded(await addMemberByEmail(project.id, email))
        } catch (error) {
          // Archived meanwhile: reload, which hides this form.
          if (error.code === SERVICE_ERROR.ARCHIVED) refreshProject()
          throw error
        }
        setValues({ email: '' })
        showToast('Member added.')
      },
      describeFailure: describeAddFailure,
    })
  const messages = memberFieldMessages(fieldErrors)

  return (
    <Card className="settings-card">
      <h3>Add member</h3>
      <div className="project-form">
        <FormErrorSummary
          ref={summaryRef}
          items={summaryItems({
            formError,
            messages,
            fieldOrder: ['email'],
            fieldId,
          })}
        />
        <form className="add-member-form" onSubmit={handleSubmit} noValidate>
          <Input
            id={fieldId('email')}
            label="Email"
            name="email"
            type="email"
            autoComplete="off"
            hint="They need a SkillBridge account already. No invitation is sent."
            value={values.email}
            onChange={handleChange}
            error={messages.email}
          />
          <div className="project-form-actions">
            <Button type="submit" loading={pending}>
              {!pending && <UserPlus size={18} aria-hidden="true" />}
              {pending ? 'Adding…' : 'Add member'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

// Leave project (FR-TEAM-04), for members only; also in archived projects
// (A-05). After confirming: the dashboard with the toast "You left [project]."
function LeaveProject({ project }) {
  const navigate = useNavigate()
  const showToast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [failure, setFailure] = useState(null)

  async function handleLeave() {
    if (leaving) return
    setLeaving(true)
    setFailure(null)
    try {
      await leaveProject(project.id)
      showToast(`You left ${project.name}.`)
      navigate('/dashboard')
    } catch (error) {
      setConfirming(false)
      setLeaving(false)
      setFailure(error)
    }
  }

  return (
    <>
      {failure && (
        <ProjectNotice
          message={projectActionMessage(failure, "Couldn't leave the project. Try again.")}
          showDashboardLink={isAccessLost(failure)}
        />
      )}
      <div>
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          <LogOut size={18} aria-hidden="true" />
          Leave project
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={`Leave ${project.name}?`}
        confirmLabel="Leave project"
        pendingLabel="Leaving…"
        pending={leaving}
        onConfirm={handleLeave}
        onCancel={() => setConfirming(false)}
      >
        <p>You'll lose access right away.</p>
      </ConfirmDialog>
    </>
  )
}

// Members tab (FR-TEAM-01): name, email, role and open task count. The owner
// can add members (not in archived projects) and remove anyone but
// themselves (also in archived projects, A-05). Members can leave.
function ProjectMembersTab() {
  const { project, refreshProject } = useOutletContext()
  const { user } = useSession()
  const showToast = useToast()
  const load = useCallback(() => listMembers(project.id), [project.id])
  const { status, data, error, retry } = useServiceData(load)
  // The list after an add or remove, valid only for the data it changed.
  const [changed, setChanged] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [removePending, setRemovePending] = useState(false)
  const [failure, setFailure] = useState(null)
  const headingRef = useRef(null)

  const members = changed?.forData === data ? changed.members : data
  const isOwner = canManageMembers({ role: project.role })
  const isArchived = Boolean(project.archivedAt)

  function handleAdded(member) {
    setChanged({ forData: data, members: [...members, member] })
    refreshProject()
  }

  // On failure the dialog closes, the member stays and the error shows
  // (PRD section 08).
  async function handleRemove() {
    if (removePending) return
    setRemovePending(true)
    setFailure(null)
    try {
      await removeMember(project.id, removing.userId)
      setChanged({ forData: data, members: members.filter((m) => m.userId !== removing.userId) })
      setRemoving(null)
      showToast('Member removed')
      refreshProject()
      // The Remove button is gone now, so focus moves to the tab heading.
      requestAnimationFrame(() => headingRef.current?.focus())
    } catch (removeError) {
      setRemoving(null)
      setFailure(removeError)
      if (removeError.code === SERVICE_ERROR.NOT_A_MEMBER) retry()
      if (removeError.code === SERVICE_ERROR.NO_PERMISSION) refreshProject()
    } finally {
      setRemovePending(false)
    }
  }

  // Here not-a-member means the person was already removed, not lost access.
  const failureMessage =
    failure?.code === SERVICE_ERROR.NOT_A_MEMBER
      ? "Couldn't remove the member. Try again."
      : projectActionMessage(failure, "Couldn't remove the member. Try again.")

  return (
    <section className="project-tab" aria-labelledby="project-tab-title" aria-busy={status === 'loading'}>
      <div className="project-tab-header">
        <h2 id="project-tab-title" ref={headingRef} tabIndex={-1}>
          Members
        </h2>
      </div>

      {failure && (
        <ProjectNotice
          message={failureMessage}
          showDashboardLink={failure.code === SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS}
        />
      )}

      {status === 'loading' && (
        <Card aria-hidden="true" className="task-table-skeleton">
          <span className="skeleton skeleton-line skeleton-title" />
          <span className="skeleton skeleton-line skeleton-short" />
        </Card>
      )}
      {status === 'loading' && <p className="visually-hidden">Loading members</p>}

      {status === 'error' && <SectionError error={error} what="the members" onRetry={retry} />}

      {status === 'success' && (
        <Card className="member-list">
          <ul>
            {members.map((member) => (
              <li key={member.userId} className="member-row">
                <div className="member-identity">
                  <span className="member-name">
                    {member.displayName}
                    {member.userId === user?.id && ' (you)'}
                  </span>
                  <span className="project-meta">{member.email}</span>
                </div>
                <div className="member-details">
                  <span className="project-label">{projectRoleLabel(member.role)}</span>
                  <span className="project-meta">
                    {pluralize(member.openTaskCount, 'open task')}
                  </span>
                  {isOwner && member.role !== PROJECT_ROLE.OWNER && (
                    <Button variant="secondary" onClick={() => setRemoving(member)}>
                      <UserMinus size={16} aria-hidden="true" />
                      Remove<span className="visually-hidden"> {member.displayName}</span>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isOwner && !isArchived && status === 'success' && (
        <AddMemberForm project={project} onAdded={handleAdded} refreshProject={refreshProject} />
      )}

      {canLeaveProject({ role: project.role }) && <LeaveProject project={project} />}

      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing?.displayName ?? ''} from ${project.name}?`}
        confirmLabel="Remove member"
        pendingLabel="Removing…"
        pending={removePending}
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      >
        <p>Tasks assigned to them will become unassigned.</p>
      </ConfirmDialog>
    </section>
  )
}

export default ProjectMembersTab
