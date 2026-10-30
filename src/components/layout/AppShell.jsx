import './layout.css'

// Overall page frame: a skip link, an optional sidebar or header and the
// page's single <main> landmark. Navigation is passed in, so the shell stays
// free of navigation and business logic.
function AppShell({ sidebar = null, header = null, children }) {
  return (
    <div className={sidebar ? 'app-shell' : 'app-shell app-shell-no-sidebar'}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      {sidebar}
      <div className="app-shell-content">
        {header}
        <main id="main-content" className="app-shell-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
