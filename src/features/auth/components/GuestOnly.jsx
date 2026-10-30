import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { safeReturnPath } from '../returnPath.js'
import { useSession } from '../sessionContext.js'
import SessionLoading from './SessionLoading.jsx'

// Route guard for Sign in and Sign up. Signed-in users go to the page they
// originally asked for, if it is a safe internal path, or the dashboard
// (FR-AUTH-04, FR-AUTH-05). This is also what moves the user on after a
// successful sign-in.
function GuestOnly() {
  const session = useSession()
  const location = useLocation()

  if (session.status === 'loading') return <SessionLoading />

  if (session.status === 'signed-in') {
    return <Navigate to={safeReturnPath(location.state?.from) ?? '/dashboard'} replace />
  }

  return <Outlet />
}

export default GuestOnly
