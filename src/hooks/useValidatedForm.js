import { useEffect, useRef, useState } from 'react'
import { SERVICE_ERROR } from '../services/serviceError.js'

// Form state shared by the app's forms (PRD section 07): validates before
// submitting, ignores a second submit while one is running, keeps the input
// on failure, and moves focus to the error summary after each failed submit.
//
// - validate(values) returns field codes; empty means valid.
// - onSubmit(values) returns a promise. A 'validation' error shows its field
//   codes; any other error goes to describeFailure(error), which returns
//   { fieldErrors } for an inline field error or { message } for the summary.
export function useValidatedForm({ initialValues, validate, onSubmit, describeFailure }) {
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [pending, setPending] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const pendingRef = useRef(false)
  const summaryRef = useRef(null)

  useEffect(() => {
    if (failedAttempts > 0) summaryRef.current?.focus()
  }, [failedAttempts])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors(({ [name]: _cleared, ...rest }) => rest)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (pendingRef.current) return

    const errors = validate(values)
    setFormError(null)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setFailedAttempts((n) => n + 1)
      return
    }

    pendingRef.current = true
    setPending(true)
    try {
      await onSubmit(values)
    } catch (error) {
      if (error.code === SERVICE_ERROR.VALIDATION) {
        setFieldErrors(error.details?.fieldErrors ?? {})
      } else {
        const failure = describeFailure(error)
        if (failure.fieldErrors) setFieldErrors(failure.fieldErrors)
        else setFormError(failure.message)
      }
      setFailedAttempts((n) => n + 1)
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return { values, setValues, fieldErrors, formError, pending, summaryRef, handleChange, handleSubmit }
}

// Summary items: the form-level error first, then field errors in form order.
export function summaryItems({ formError, messages, fieldOrder, fieldId }) {
  return [
    ...(formError ? [{ message: formError }] : []),
    ...fieldOrder.filter((name) => messages[name]).map((name) => ({
      fieldId: fieldId(name),
      message: messages[name],
    })),
  ]
}
