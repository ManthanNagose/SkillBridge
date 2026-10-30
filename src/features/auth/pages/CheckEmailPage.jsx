import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'

// Shown after sign-up (FR-AUTH-11). The email comes from router state, so it
// is missing if the page is opened directly or refreshed; the page then shows
// general guidance instead. Wording stays neutral about whether the email was
// already registered (PRD F-08), and never claims an email was sent.
function CheckEmailPage() {
  const { state } = useLocation()
  const email = typeof state?.email === 'string' ? state.email : null
  const titleRef = useRef(null)

  // Arriving here replaces the sign-up form, so focus the heading.
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <AuthCard title="Check your email" titleRef={titleRef}>
      {email ? (
        <p className="auth-switch">
          The next step is to check your email. If <strong>{email}</strong> can be used for a
          new account, it will receive a link to verify the address.
        </p>
      ) : (
        <p className="auth-switch">
          If you've just created an account, the next step is to check your email for a link to
          verify your address.
        </p>
      )}
      <p className="auth-note">
        Development preview: no email is sent, and mock accounts don't need verifying.
      </p>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
        {!email && (
          <>
            {' '}
            · <Link to="/signup">Create an account</Link>
          </>
        )}
      </p>
    </AuthCard>
  )
}

export default CheckEmailPage
