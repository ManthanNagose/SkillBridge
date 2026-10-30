import { useEffect, useId, useRef } from 'react'
import Button from './Button.jsx'

// Confirmation dialog on the native <dialog>: showModal() keeps focus inside,
// Esc closes it, and closing returns focus to the button that opened it
// (PRD section 09). Focus starts on Cancel (section 08). While the action
// runs, both buttons are locked and Esc is ignored.
function ConfirmDialog({ open, title, children, confirmLabel, pendingLabel, pending, onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) {
      dialog.showModal()
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleCancel(event) {
    event.preventDefault()
    if (!pending) onCancel()
  }

  return (
    <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby={titleId} onCancel={handleCancel}>
      <h2 id={titleId} className="confirm-dialog-title">
        {title}
      </h2>
      <div className="confirm-dialog-body">{children}</div>
      <div className="confirm-dialog-actions">
        <Button ref={cancelRef} variant="secondary" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" loading={pending} onClick={onConfirm}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
