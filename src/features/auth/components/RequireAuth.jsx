import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AppShell from '../../../components/layout/AppShell.jsx'
import { SESSION_EVENT } from '../services/authService.js'
import { useSession } from '../sessionContext.js'
import SessionLoading from './SessionLoading.jsx'

// Route guard for signed-in pages. Frontend only: it decides what to show,
// not who may see data. The backend must enforce access (PRD B-13).
function RequireAuth() {
  const session = useSession()
  const location = useLocation()

  if (session.status === 'loading') {
    return (
      <AppShell>
        <SessionLoading />
      </AppShell>
    )
  }

  if (session.status === 'signed-out') {
    // After an explicit sign-out, go to Sign in with a message and no return
    // path. Otherwise remember where the user was going (FR-AUTH-04).
    const state =
      session.event === SESSION_EVENT.SIGNED_OUT
        ? { signedOut: true }
        : { from: location.pathname + location.search + location.hash }
    return <Navigate to="/login" replace state={state} />
  }

  return <Outlet />
}

export default RequireAuth
