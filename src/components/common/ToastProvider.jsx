import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { ToastContext } from './toastContext.js'

const TOAST_DURATION_MS = 6000

// Short success messages after creating, saving or deleting (PRD section 07),
// announced through a polite live region (section 09). The region sits
// outside the router, so a toast survives the navigation that follows it.
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Set())

  const showToast = useCallback((message) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message }])
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      setToasts((current) => current.filter((t) => t.id !== id))
    }, TOAST_DURATION_MS)
    timers.current.add(timer)
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  return (
    <ToastContext value={showToast}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} className="toast">
            <CheckCircle2 size={18} aria-hidden="true" />
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext>
  )
}

export default ToastProvider
