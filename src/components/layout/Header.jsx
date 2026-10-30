import './layout.css'

// Top bar for a page: the page title as its <h1>, plus optional children
// (for example a page's primary action). Aligned with PageContainer.
function Header({ title, children }) {
  return (
    <header className="page-header">
      <div className="page-container page-header-inner">
        {title && <h1>{title}</h1>}
        {children}
      </div>
    </header>
  )
}

export default Header
