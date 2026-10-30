import { Link } from 'react-router-dom'
import { useSession } from '../../features/auth/sessionContext.js'
import SessionLoading from '../../features/auth/components/SessionLoading.jsx'
import AppShell from '../layout/AppShell.jsx'
import Header from '../layout/Header.jsx'
import PageContainer from '../layout/PageContainer.jsx'
import PublicHeader from '../layout/PublicHeader.jsx'
import Sidebar from '../layout/Sidebar.jsx'
import './NotFoundPage.css'

// 404 (PRD section 08): "Page not found." with links to Dashboard and
// Projects. Signed-in users see it inside the app shell (route map).
function NotFoundPage() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <AppShell>
        <SessionLoading />
      </AppShell>
    )
  }

  const signedIn = status === 'signed-in'
  return (
    <AppShell
      sidebar={signedIn ? <Sidebar /> : undefined}
      header={signedIn ? undefined : <PublicHeader />}
    >
      <Header title="Page not found" />
      <PageContainer className="not-found-page">
        <p>Page not found.</p>
        <ul className="not-found-links">
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/projects">Projects</Link>
          </li>
        </ul>
      </PageContainer>
    </AppShell>
  )
}

export default NotFoundPage
