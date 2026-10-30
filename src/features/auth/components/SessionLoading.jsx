import { useEffect, useState } from 'react'
import './auth.css'

const SHOW_AFTER_MS = 400

// Shown while the session is being checked (FR-AUTH-06), instead of briefly
// showing the wrong page. The text appears only if the check takes a moment,
// so quick checks don't flicker.
function SessionLoading() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="session-loading" role="status" aria-live="polite">
      {visible && (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          Checking your session…
        </>
      )}
    </div>
  )
}

export default SessionLoading
