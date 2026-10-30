import { Link } from 'react-router-dom'
import './layout.css'

// Header for public pages (PRD section 04): the SkillBridge name linking to
// the landing page, Sign in and Create account.
function PublicHeader() {
  return (
    <header className="public-header">
      <div className="page-container public-header-inner">
        <Link className="sidebar-brand public-brand" to="/">
          SkillBridge
        </Link>
        <nav aria-label="Account">
          <ul className="public-header-links">
            <li>
              <Link to="/login">Sign in</Link>
            </li>
            <li>
              <Link className="btn btn-primary" to="/signup">
                Create account
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default PublicHeader
