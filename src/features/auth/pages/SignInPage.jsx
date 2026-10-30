import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../../components/common/Button.jsx'
import FormErrorSummary from '../../../components/common/FormErrorSummary.jsx'
import Input from '../../../components/common/Input.jsx'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import AuthCard from '../components/AuthCard.jsx'
import { fieldMessages, formErrorMessage } from '../authMessages.js'
import { signIn } from '../services/authService.js'
import { validateSignIn } from '../validation.js'

const FIELD_ORDER = ['email', 'password']

// After a successful sign-in the session updates and the GuestOnly route
// guard sends the user on, to the page they asked for or the dashboard.
function SignInPage() {
  const { state } = useLocation()
  const signedOut = state?.signedOut === true
  const formId = useId()
  const fieldId = (name) => `${formId}-${name}`

  const [values, setValues] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [pending, setPending] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const pendingRef = useRef(false)
  const summaryRef = useRef(null)

  // After each failed submit, move focus to the summary so it is read out once.
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

    const errors = validateSignIn(values)
    setFormError(null)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setFailedAttempts((n) => n + 1)
      return
    }

    pendingRef.current = true
    setPending(true)
    try {
      await signIn(values)
    } catch (error) {
      if (error.code === SERVICE_ERROR.VALIDATION) {
        setFieldErrors(error.details?.fieldErrors ?? {})
      } else {
        setFormError(formErrorMessage(error))
      }
      setFailedAttempts((n) => n + 1)
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  const messages = fieldMessages(fieldErrors)
  const summaryItems = [
    ...(formError ? [{ message: formError }] : []),
    ...FIELD_ORDER.filter((name) => messages[name]).map((name) => ({
      fieldId: fieldId(name),
      message: messages[name],
    })),
  ]

  return (
    <AuthCard title="Sign in">
      {signedOut && summaryItems.length === 0 && (
        <p className="auth-status" role="status">
          You've signed out.
        </p>
      )}
      <FormErrorSummary ref={summaryRef} items={summaryItems} />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Input
          id={fieldId('email')}
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={handleChange}
          error={messages.email}
        />
        <Input
          id={fieldId('password')}
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={handleChange}
          error={messages.password}
        />
        <Button type="submit" loading={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="auth-switch">
        Don't have an account? <Link to="/signup">Create an account</Link>
      </p>
    </AuthCard>
  )
}

export default SignInPage
