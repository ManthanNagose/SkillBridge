import { useId } from 'react'
import Button from '../../../components/common/Button.jsx'
import FormErrorSummary from '../../../components/common/FormErrorSummary.jsx'
import Input from '../../../components/common/Input.jsx'
import {
  NEW_TASK_DEFAULTS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITY,
} from '../../../data/constants.js'
import { summaryItems, useValidatedForm } from '../../../hooks/useValidatedForm.js'
import { taskFieldMessages, validateTask } from '../validation.js'
import '../../projects/components/projects.css'

const FIELD_ORDER = ['title', 'description', 'priority', 'dueDate']
const PRIORITY_OPTIONS = Object.values(TASK_PRIORITY).map((p) => ({ value: p, label: p }))

// Title, description, priority and due date (FR-TSK-01), for New task and
// editing on the task detail page. There is no status field: new tasks always
// start as To Do (FR-TSK-02), and status changes have their own control.
// assigneeOptions ([{ value, label }]) adds an Assignee field defaulting to
// Unassigned; New task passes it to owners only (FR-TSK-01, E-03).
// onSubmit(values) returns a promise; describeFailure(error) returns
// { message } or { fieldErrors } for anything other than a validation error.
function TaskForm({
  initialValues,
  assigneeOptions,
  submitLabel,
  pendingLabel,
  onSubmit,
  describeFailure,
  actions,
}) {
  const formId = useId()
  const fieldId = (name) => `${formId}-${name}`
  const { values, fieldErrors, formError, pending, summaryRef, handleChange, handleSubmit } =
    useValidatedForm({
      initialValues: {
        title: initialValues?.title ?? '',
        description: initialValues?.description ?? '',
        priority: initialValues?.priority ?? NEW_TASK_DEFAULTS.priority,
        dueDate: initialValues?.dueDate ?? '',
        ...(assigneeOptions && { assigneeId: '' }),
      },
      validate: validateTask,
      onSubmit,
      describeFailure,
    })
  const messages = taskFieldMessages(fieldErrors)

  return (
    <div className="project-form">
      <FormErrorSummary
        ref={summaryRef}
        items={summaryItems({ formError, messages, fieldOrder: FIELD_ORDER, fieldId })}
      />
      <form onSubmit={handleSubmit} noValidate>
        <Input
          id={fieldId('title')}
          label="Title"
          name="title"
          required
          autoComplete="off"
          value={values.title}
          onChange={handleChange}
          error={messages.title}
        />
        <Input
          id={fieldId('description')}
          label="Description (optional)"
          name="description"
          multiline
          rows={5}
          hint={`Up to ${TASK_DESCRIPTION_MAX_LENGTH} characters.`}
          value={values.description}
          onChange={handleChange}
          error={messages.description}
        />
        <Input
          id={fieldId('priority')}
          label="Priority"
          name="priority"
          options={PRIORITY_OPTIONS}
          value={values.priority}
          onChange={handleChange}
          error={messages.priority}
        />
        {assigneeOptions && (
          <Input
            id={fieldId('assigneeId')}
            label="Assignee"
            name="assigneeId"
            options={[{ value: '', label: 'Unassigned' }, ...assigneeOptions]}
            value={values.assigneeId}
            onChange={handleChange}
          />
        )}
        <Input
          id={fieldId('dueDate')}
          label="Due date (optional)"
          name="dueDate"
          type="date"
          value={values.dueDate}
          onChange={handleChange}
          error={messages.dueDate}
        />
        <div className="project-form-actions">
          <Button type="submit" loading={pending}>
            {pending ? pendingLabel : submitLabel}
          </Button>
          {actions}
        </div>
      </form>
    </div>
  )
}

export default TaskForm
