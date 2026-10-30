import { RotateCw } from 'lucide-react'
import Button from './Button.jsx'
import { SERVICE_ERROR } from '../../services/serviceError.js'

// Page-level load error with Try again (PRD section 07). Never shows raw error text.
function SectionError({ error, what, onRetry }) {
  const message =
    error?.code === SERVICE_ERROR.NETWORK
      ? "Can't reach SkillBridge. Check your connection and try again."
      : `Couldn't load ${what}. Try again.`

  return (
    <div className="section-error" role="alert">
      <p>{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        <RotateCw size={16} aria-hidden="true" />
        Try again
      </Button>
    </div>
  )
}

export default SectionError
