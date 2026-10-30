import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../../../components/layout/Header.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import { useSession } from '../../auth/sessionContext.js'
import MyOpenTasks from '../components/MyOpenTasks.jsx'
import RecentProjects from '../components/RecentProjects.jsx'
import SummaryStats from '../components/SummaryStats.jsx'
import '../components/dashboard.css'

// Dashboard (PRD D-13): greeting, summary statistics, recent projects, then
// My open tasks. Each section loads and fails on its own, with its own Try again.
function DashboardPage() {
  const { user } = useSession()

  return (
    <>
      <Header title="Dashboard">
        <Link className="btn btn-primary" to="/projects/new">
          <Plus size={18} aria-hidden="true" />
          New project
        </Link>
      </Header>
      <PageContainer className="dashboard">
        <p className="dashboard-greeting">Hello, {user.displayName}.</p>
        <SummaryStats />
        <RecentProjects />
        <MyOpenTasks />
      </PageContainer>
    </>
  )
}

export default DashboardPage
