import { useCallback, useId, useRef, useState } from 'react'
import { AlertTriangle, Archive, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/common/Button.jsx'
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx'
import SectionError from '../../../components/common/SectionError.jsx'
import StatusBadge from '../../../components/common/StatusBadge.jsx'
import { useToast } from '../../../components/common/toastContext.js'
import Header from '../../../components/layout/Header.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import { TASK_STATUS } from '../../../data/constants.js'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import { formatDate } from '../../../utils/dates.js'
import { isTaskOverdue } from '../../../utils/tasks.js'
import { useSession } from '../../auth/sessionContext.js'
import { listMembers } from '../../members/services/membersService.js'
import ProjectNoAccess from '../../projects/components/ProjectNoAccess.jsx'
import { projectActionMessage } from '../../projects/projectMessages.js'
import { getProject } from '../../projects/services/projectsService.js'
import TaskForm from '../components/TaskForm.jsx'
import {
  assignTask,
  changeTaskStatus,
  deleteTask,
  getTask,
  updateTaskDetails,
} from '../services/tasksService.js'
import {
  canAssignTask,
  canChangeTaskStatus,
  canDeleteTask,
  canEditTaskDetails,
} from '../taskPermissions.js'
import '../../projects/components/projects.css'
import '../components/tasks.css'

// Messages from PRD section 08.
const MESSAGES = {
  updateFailed: "Couldn't update the task. Try again.",
  noPermission: "You don't have permission to do this. Ask the project owner.",
  archived: "This project is archived. Changes aren't allowed.",
  saveFailed: "Couldn't save the task. Try again.",
  deleteFailed: "Couldn't delete the task. Try again.",
}

// Rejections that end editing and are shown on the page instead of the form.
const PAGE_LEVEL_CODES = [
  SERVICE_ERROR.TASK_NOT_FOUND,
  SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS,
  SERVICE_ERROR.NO_PERMISSION,
  SERVICE_ERROR.ARCHIVED,
]

// The task is gone. Unsaved edits, if any, are shown read-only so they can be
// copied (PRD section 08).
function TaskUnavailable({ projectId, draft }) {
  return (
    <>
      <Header title="Task not available" />
      <PageContainer className="project-page">
        <p>This task was deleted.</p>
        <Link className="btn btn-primary project-page-action" to={`/projects/${projectId}/tasks`}>
          Back to tasks
        </Link>
        {draft && (
          <section className="task-draft" aria-labelledby="task-draft-title">
            <h2 id="task-draft-title">Your unsaved changes</h2>
            <dl className="task-fields">
              <div>
                <dt>Title</dt>
                <dd>{draft.title}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{draft.priority}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{draft.dueDate ? formatDate(draft.dueDate) : 'No due date'}</dd>
              </div>
            </dl>
            <h3>Description</h3>
            <p>{draft.description || 'No description.'}</p>
          </section>
        )}
      </PageContainer>
    </>
  )
}

// Shown when an action fails because the user was removed meanwhile (E-07).
function AccessRemoved() {
  return (
    <>
      <Header title="Project not available" />
      <PageContainer className="project-page">
        <p>You no longer have access to this project.</p>
        <Link className="btn btn-primary project-page-action" to="/dashboard">
          Go to dashboard
        </Link>
      </PageContainer>
    </>
  )
}

function TaskLoading() {
  return (
    <>
      <header className="page-header">
        <div className="page-container page-header-inner">
          <h1>
            <span className="visually-hidden">Loading task</span>
            <span className="skeleton skeleton-heading" aria-hidden="true" />
          </h1>
        </div>
      </header>
      <PageContainer className="project-page">
        <div className="task-table-skeleton" aria-hidden="true">
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line skeleton-short" />
        </div>
      </PageContainer>
    </>
  )
}

// Task detail (F-01). Shows every task field. Each control appears only for
// users the permission matrix allows, and never in archived projects; the
// rest is read-only text (FR-TSK-11):
// - Status: owner, or the assignee. Assignee: owner.
// - Edit task (title, description, priority, due date): owner, or the creator.
// - Delete task: owner, after confirming.
// Viewing and editing are states of this route (PRD route map).
function TaskDetailPage({ projectId, taskId }) {
  const { user } = useSession()
  const navigate = useNavigate()
  const showToast = useToast()
  const statusId = useId()
  const assigneeId = useId()
  const headingRef = useRef(null)

  const load = useCallback(
    () =>
      Promise.all([getProject(projectId), getTask(projectId, taskId), listMembers(projectId)]).then(
        ([project, task, members]) => ({ project, task, members }),
      ),
    [projectId, taskId],
  )
  const { status, data, error, retry } = useServiceData(load)

  // The latest saved task, valid only for the data it was saved against; a
  // reload replaces it.
  const [saved, setSaved] = useState(null)
  const [pending, setPending] = useState(null)
  const [notice, setNotice] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [blocked, setBlocked] = useState(null)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const pendingRef = useRef(false)

  if (blocked === 'access-removed') return <AccessRemoved />
  if (blocked === 'deleted') return <TaskUnavailable projectId={projectId} draft={draft} />
  if (status === 'loading') return <TaskLoading />
  if (status === 'error') {
    if (error?.code === SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS) return <ProjectNoAccess />
    if (error?.code === SERVICE_ERROR.TASK_NOT_FOUND) return <TaskUnavailable projectId={projectId} />
    return (
      <>
        <Header title="Task" />
        <PageContainer className="project-page">
          <SectionError error={error} what="this task" onRetry={retry} />
        </PageContainer>
      </>
    )
  }

  const { project, members } = data
  const task = saved?.forData === data ? saved.task : data.task
  const isArchived = Boolean(project.archivedAt)
  const canEditStatus =
    !isArchived &&
    canChangeTaskStatus({ role: project.role, assigneeId: task.assigneeId, userId: user?.id })
  const canEditAssignee = !isArchived && canAssignTask({ role: project.role })
  const canEditDetails =
    !isArchived &&
    canEditTaskDetails({ role: project.role, createdBy: task.createdBy, userId: user?.id })
  const canDelete = !isArchived && canDeleteTask({ role: project.role })
  const memberName = (userId) =>
    members.find((m) => m.userId === userId)?.displayName ?? 'Former member'
  const tasksPath = `/projects/${project.id}/tasks`

  // Shows why a change was rejected. Deleted tasks and lost access replace the
  // page; permission and archive rejections reload the task (FR-TSK-11).
  function handleRejected(rejection, fallbackMessage) {
    switch (rejection.code) {
      case SERVICE_ERROR.TASK_NOT_FOUND:
        setBlocked('deleted')
        break
      case SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS:
        setBlocked('access-removed')
        break
      case SERVICE_ERROR.NO_PERMISSION:
        setNotice(MESSAGES.noPermission)
        retry()
        break
      case SERVICE_ERROR.ARCHIVED:
        setNotice(MESSAGES.archived)
        retry()
        break
      case SERVICE_ERROR.ASSIGNEE_NOT_MEMBER:
        setNotice(MESSAGES.updateFailed)
        retry()
        break
      default:
        setNotice(fallbackMessage)
    }
  }

  function focusHeading() {
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  // Sends only the changed fields. Other failures stay in the form, with the
  // input kept (PRD section 07).
  async function handleSave(values) {
    const changes = Object.fromEntries(
      Object.entries(values).filter(([field, value]) => value !== (task[field] ?? '')),
    )
    setNotice(null)
    try {
      const updated = await updateTaskDetails(task.id, changes)
      setSaved({ forData: data, task: updated })
      setEditing(false)
      showToast('Task updated')
      focusHeading()
    } catch (saveError) {
      if (!PAGE_LEVEL_CODES.includes(saveError.code)) throw saveError
      if (saveError.code === SERVICE_ERROR.TASK_NOT_FOUND) setDraft(values)
      setEditing(false)
      handleRejected(saveError, MESSAGES.saveFailed)
    }
  }

  // On success: back to the task list with the toast "Task deleted". On
  // failure the dialog closes, the task stays and the error shows (section 08).
  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    setNotice(null)
    try {
      await deleteTask(task.id)
      showToast('Task deleted')
      navigate(tasksPath)
    } catch (deleteError) {
      setConfirmingDelete(false)
      setDeleting(false)
      handleRejected(deleteError, MESSAGES.deleteFailed)
    }
  }

  // Runs one change at a time. On failure the control shows the saved value
  // again (PRD section 08); permission and archive rejections reload the task
  // so the page shows what the user may actually do (FR-TSK-11).
  async function runChange(field, value, action, describe) {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending({ field, value })
    setNotice(null)
    try {
      const updated = await action()
      setSaved({ forData: data, task: updated })
      setAnnouncement(describe(updated))
    } catch (changeError) {
      handleRejected(changeError, MESSAGES.updateFailed)
    } finally {
      pendingRef.current = false
      setPending(null)
    }
  }

  function handleStatusChange(event) {
    const value = event.target.value
    runChange('status', value, () => changeTaskStatus(task.id, value), (t) => `Status changed to ${t.status}.`)
  }

  function handleAssigneeChange(event) {
    const value = event.target.value || null
    runChange(
      'assignee',
      value ?? '',
      () => assignTask(task.id, value),
      (t) => (t.assigneeId ? `Assigned to ${memberName(t.assigneeId)}.` : 'Task unassigned.'),
    )
  }

  const statusValue = pending?.field === 'status' ? pending.value : task.status
  const assigneeValue = pending?.field === 'assignee' ? pending.value : (task.assigneeId ?? '')

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
                <Link to={tasksPath}>{project.name}</Link>
              </li>
              <li>
                <span aria-current="page">{task.title}</span>
              </li>
            </ol>
          </nav>
          <div className="project-title-row">
            <h1 ref={headingRef} tabIndex={-1}>
              {task.title}
            </h1>
          </div>
        </div>
      </header>

      <PageContainer className="project-page task-detail">
        <Link className="task-back-link" to={tasksPath}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to tasks
        </Link>

        {isArchived && (
          <div className="project-banner">
            <p>
              <Archive size={18} aria-hidden="true" />
              This project is archived. It's read-only.
            </p>
          </div>
        )}

        {notice && (
          <div className="section-error" role="alert">
            <p>{notice}</p>
          </div>
        )}
        <p className="visually-hidden" role="status">
          {announcement}
        </p>

        {editing && (
          <section className="task-edit" aria-labelledby="task-edit-title">
            <h2 id="task-edit-title">Edit task</h2>
            <TaskForm
              initialValues={task}
              submitLabel="Save changes"
              pendingLabel="Saving…"
              onSubmit={handleSave}
              describeFailure={(saveError) => ({
                message: projectActionMessage(saveError, MESSAGES.saveFailed),
              })}
              actions={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(false)
                    focusHeading()
                  }}
                >
                  Cancel
                </Button>
              }
            />
          </section>
        )}

        {!editing && (canEditDetails || canDelete) && (
          <div className="task-actions">
            {canEditDetails && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Pencil size={16} aria-hidden="true" />
                Edit task
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                <Trash2 size={16} aria-hidden="true" />
                Delete task
              </Button>
            )}
          </div>
        )}

        {canDelete && (
          <ConfirmDialog
            open={confirmingDelete}
            title={`Delete ‘${task.title}’?`}
            confirmLabel="Delete task"
            pendingLabel="Deleting…"
            pending={deleting}
            onConfirm={handleDelete}
            onCancel={() => setConfirmingDelete(false)}
          >
            <p>This can't be undone.</p>
          </ConfirmDialog>
        )}

        {!editing && (
          <dl className="task-fields">
            <div>
              <dt>{canEditStatus ? <label htmlFor={statusId}>Status</label> : 'Status'}</dt>
              <dd>
                {canEditStatus ? (
                  <span className="task-control">
                    <select
                      id={statusId}
                      className="input"
                      value={statusValue}
                      disabled={pending !== null}
                      aria-busy={pending?.field === 'status'}
                      onChange={handleStatusChange}
                    >
                      {Object.values(TASK_STATUS).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                    {pending?.field === 'status' && <span className="task-saving">Saving…</span>}
                  </span>
                ) : (
                  <StatusBadge status={task.status} />
                )}
              </dd>
            </div>
            <div>
              <dt>{canEditAssignee ? <label htmlFor={assigneeId}>Assignee</label> : 'Assignee'}</dt>
              <dd>
                {canEditAssignee ? (
                  <span className="task-control">
                    {/* Only current members, plus Unassigned (FR-TSK-10). */}
                    <select
                      id={assigneeId}
                      className="input"
                      value={assigneeValue}
                      disabled={pending !== null}
                      aria-busy={pending?.field === 'assignee'}
                      onChange={handleAssigneeChange}
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.displayName}
                        </option>
                      ))}
                    </select>
                    {pending?.field === 'assignee' && <span className="task-saving">Saving…</span>}
                  </span>
                ) : task.assigneeId ? (
                  memberName(task.assigneeId)
                ) : (
                  'Unassigned'
                )}
              </dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{task.priority}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>
                {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                {isTaskOverdue(task) && (
                  <span className="task-overdue-flag">
                    <AlertTriangle size={14} aria-hidden="true" />
                    Overdue
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{memberName(task.createdBy)}</dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>
                <Link to={tasksPath}>{project.name}</Link>
              </dd>
            </div>
          </dl>
        )}

        {!editing && (
          <section className="task-description" aria-labelledby="task-description-title">
            <h2 id="task-description-title">Description</h2>
            {task.description ? (
              <p>{task.description}</p>
            ) : (
              <p className="project-meta">No description.</p>
            )}
          </section>
        )}
      </PageContainer>
    </>
  )
}

// A new key per task, so moving between tasks starts with fresh state.
function TaskDetailRoute() {
  const { projectId, taskId } = useParams()
  return <TaskDetailPage key={`${projectId}/${taskId}`} projectId={projectId} taskId={taskId} />
}

export default TaskDetailRoute
