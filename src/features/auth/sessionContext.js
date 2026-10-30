import { createContext, useContext } from 'react'

// Session as seen by the UI: { status, user, event }.
// status is 'loading' until the first getSession() answers, then
// 'signed-in' or 'signed-out'. event is the last SESSION_EVENT, or null.
export const SessionContext = createContext(null)

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) {
    throw new Error('useSession must be used inside SessionProvider')
  }
  return session
}
