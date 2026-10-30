import { useId } from 'react'
import Button from '../../../components/common/Button.jsx'
import FormErrorSummary from '../../../components/common/FormErrorSummary.jsx'
import Input from '../../../components/common/Input.jsx'
import { PROJECT_DESCRIPTION_MAX_LENGTH } from '../../../data/constants.js'
import { summaryItems, useValidatedForm } from '../../../hooks/useValidatedForm.js'
import { projectFieldMessages, validateProject } from '../validation.js'
import './projects.css'

const FIELD_ORDER = ['name', 'description', 'dueDate']

// Name, description and due date (FR-PRJ-01, FR-PRJ-04), for New project and
// the Settings tab. onSubmit(values) returns a promise; failureMessage(error)
// gives the message for anything other than a validation error.
function ProjectForm({ initialValues, submitLabel, pendingLabel, onSubmit, failureMessage, actions }) {
  const formId = useId()
  const fieldId = (name) => `${formId}-${name}`
  const { values, fieldErrors, formError, pending, summaryRef, handleChange, handleSubmit } =
    useValidatedForm({
      initialValues: {
        name: initialValues?.name ?? '',
        description: initialValues?.description ?? '',
        dueDate: initialValues?.dueDate ?? '',
      },
      validate: validateProject,
      onSubmit,
      describeFailure: (error) => ({ message: failureMessage(error) }),
    })
  const messages = projectFieldMessages(fieldErrors)

  return (
    <div className="project-form">
      <FormErrorSummary
        ref={summaryRef}
        items={summaryItems({ formError, messages, fieldOrder: FIELD_ORDER, fieldId })}
      />
      <form onSubmit={handleSubmit} noValidate>
        <Input
          id={fieldId('name')}
          label="Project name"
          name="name"
          required
          autoComplete="off"
          value={values.name}
          onChange={handleChange}
          error={messages.name}
        />
        <Input
          id={fieldId('description')}
          label="Description (optional)"
          name="description"
          multiline
          rows={4}
          hint={`Up to ${PROJECT_DESCRIPTION_MAX_LENGTH} characters.`}
          value={values.description}
          onChange={handleChange}
          error={messages.description}
        />
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

export default ProjectForm
