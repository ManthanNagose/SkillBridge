import { useEffect, useState } from 'react'
import { getSession, watchSession } from '../services/authService.js'
import { SessionContext } from '../sessionContext.js'

function toState(session, event) {
  return {
    status: session ? 'signed-in' : 'signed-out',
    user: session?.user ?? null,
    event,
  }
}

// Mirrors the auth service's session for the whole app: one getSession() on
// start, then updates from watchSession(). The auth service stays the source
// of truth; this holds no session of its own.
function SessionProvider({ children }) {
  const [session, setSession] = useState({ status: 'loading', user: null, event: null })

  useEffect(() => {
    let active = true
    let changedWhileLoading = false

    // Subscribe first so a sign-in or sign-out during the initial check isn't missed.
    const stopWatching = watchSession((event, nextSession) => {
      changedWhileLoading = true
      setSession(toState(nextSession, event))
    })

    getSession()
      .then((current) => {
        if (active && !changedWhileLoading) setSession(toState(current, null))
      })
      .catch(() => {
        if (active && !changedWhileLoading) setSession(toState(null, null))
      })

    return () => {
      active = false
      stopWatching()
    }
  }, [])

  return <SessionContext value={session}>{children}</SessionContext>
}

export default SessionProvider
