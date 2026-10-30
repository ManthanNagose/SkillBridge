import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/common/Button.jsx'
import FormErrorSummary from '../../../components/common/FormErrorSummary.jsx'
import Input from '../../../components/common/Input.jsx'
import { PASSWORD_MIN_LENGTH } from '../../../data/constants.js'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import AuthCard from '../components/AuthCard.jsx'
import { fieldMessages, formErrorMessage } from '../authMessages.js'
import { signUp } from '../services/authService.js'
import { validateSignUp } from '../validation.js'

const FIELD_ORDER = ['displayName', 'email', 'password']

function SignUpPage() {
  const navigate = useNavigate()
  const formId = useId()
  const fieldId = (name) => `${formId}-${name}`

  const [values, setValues] = useState({ displayName: '', email: '', password: '' })
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

    const errors = validateSignUp(values)
    setFormError(null)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setFailedAttempts((n) => n + 1)
      return
    }

    pendingRef.current = true
    setPending(true)
    try {
      // Sign-up never signs in; the next step is Check your email (FR-AUTH-11).
      const result = await signUp(values)
      if (result.status === 'verification-pending') {
        navigate('/check-email', { state: { email: result.email } })
      }
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
    <AuthCard title="Create an account">
      <FormErrorSummary ref={summaryRef} items={summaryItems} />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Input
          id={fieldId('displayName')}
          label="Name"
          name="displayName"
          autoComplete="name"
          required
          value={values.displayName}
          onChange={handleChange}
          error={messages.displayName}
        />
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
          autoComplete="new-password"
          required
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          value={values.password}
          onChange={handleChange}
          error={messages.password}
        />
        <Button type="submit" loading={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthCard>
  )
}

export default SignUpPage
