import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import Avatar from '../common/Avatar.jsx'
import Button from '../common/Button.jsx'
import { signOut } from '../../features/auth/services/authService.js'
import { useSession } from '../../features/auth/sessionContext.js'
import './layout.css'

// User menu (PRD section 04): avatar initials and name, opening Profile and
// Sign out (FR-AUTH-03). A disclosure button, not an ARIA menu, so links and
// buttons keep their normal keyboard behavior. Opening moves focus to the
// first item; Esc closes it and returns focus to the button; clicking outside
// or tabbing away closes it. After sign-out the RequireAuth route guard takes
// the user to Sign in. onNavigate runs when Profile is chosen (the phone
// drawer uses it to close).
function UserMenu({ onNavigate }) {
  const { user } = useSession()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuId = useId()
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const firstItemRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    firstItemRef.current?.focus()

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function handleKeyDown(event) {
    if (event.key !== 'Escape' || !open) return
    // Closes only this menu, not the phone drawer around it.
    event.stopPropagation()
    setOpen(false)
    buttonRef.current?.focus()
  }

  function handleBlur(event) {
    if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false)
  }

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    await signOut()
  }

  if (!user) return null

  return (
    <div className="user-menu" ref={rootRef} onKeyDown={handleKeyDown} onBlur={handleBlur}>
      <button
        ref={buttonRef}
        type="button"
        className="user-menu-button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Avatar displayName={user.displayName} email={user.email} size="sm" />
        <span className="user-menu-name">
          <span className="visually-hidden">Account menu: </span>
          {user.displayName}
        </span>
        <ChevronDown size={16} aria-hidden="true" className="user-menu-chevron" />
      </button>
      <div id={menuId} className="user-menu-panel" hidden={!open}>
        <ul>
          <li>
            <NavLink
              ref={firstItemRef}
              className="sidebar-link"
              to="/profile"
              onClick={() => {
                setOpen(false)
                onNavigate?.()
              }}
            >
              <UserRound size={18} aria-hidden="true" />
              Profile
            </NavLink>
          </li>
          <li>
            <Button variant="secondary" loading={signingOut} onClick={handleSignOut}>
              {!signingOut && <LogOut size={18} aria-hidden="true" />}
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default UserMenu
