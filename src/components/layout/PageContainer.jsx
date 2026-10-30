import './layout.css'

// Page content area with a consistent maximum width and responsive padding.
function PageContainer({ className = '', children }) {
  return (
    <div className={['page-container', 'page-body', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

export default PageContainer
