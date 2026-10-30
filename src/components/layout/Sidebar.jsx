import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FolderKanban, LayoutDashboard, Menu, X } from 'lucide-react'
import Button from '../common/Button.jsx'
import UserMenu from './UserMenu.jsx'
import './layout.css'

// Primary navigation is Dashboard and Projects; Profile and Sign out are in
// the user menu (PRD section 04).
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', Icon: FolderKanban },
]

// Primary navigation and the user menu. NavLink sets aria-current="page" on
// the active link; Projects also stays active on project detail pages.
// On narrow screens the links and the user menu move into a drawer opened by
// the menu button. The drawer isn't modal, so focus isn't trapped. While
// closed it is hidden with display: none, which removes it from the tab order.
function Sidebar() {
  const [open, setOpen] = useState(false)
  const drawerId = useId()
  const sidebarRef = useRef(null)
  const toggleRef = useRef(null)

  // Choosing a link hides the drawer, and with it the focused link. Moving focus
  // to the menu button keeps keyboard users in place. On desktop the button is
  // hidden, so focus() does nothing and stays on the link.
  function handleLinkClick() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      const focusWasInside = sidebarRef.current?.contains(document.activeElement)
      setOpen(false)
      if (focusWasInside) toggleRef.current?.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div className="sidebar" ref={sidebarRef}>
      <div className="sidebar-top">
        <Link className="sidebar-brand" to="/dashboard">
          SkillBridge
        </Link>
        <Button
          ref={toggleRef}
          variant="secondary"
          className="sidebar-toggle"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen((isOpen) => !isOpen)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          Menu
        </Button>
      </div>
      <div id={drawerId} className="sidebar-drawer" data-open={open}>
        <nav className="sidebar-nav" aria-label="Main">
          <ul>
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink className="sidebar-link" to={to} onClick={handleLinkClick}>
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-account">
          <UserMenu onNavigate={handleLinkClick} />
        </div>
      </div>
    </div>
  )
}

export default Sidebar
