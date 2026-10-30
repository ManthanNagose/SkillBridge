import { FolderKanban, ListChecks, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import '../components/landing.css'

// The three points named in FR-LAND-01, each describing a built feature.
const POINTS = [
  {
    Icon: FolderKanban,
    title: 'Plan projects',
    text: 'Give each piece of team work its own project, with a description and a due date.',
  },
  {
    Icon: ListChecks,
    title: 'Assign tasks',
    text: 'Split the work into tasks and give each one to a teammate.',
  },
  {
    Icon: TrendingUp,
    title: 'See progress',
    text: "Check each project's progress and what's overdue from your dashboard.",
  },
]

// Landing page (FR-LAND-01): product name, one-sentence description (from PRD
// section 01), three points, Create account and Sign in. No pricing,
// testimonials or usage figures. Signed-in users never see it: the GuestOnly
// route guard sends them to the dashboard (FR-LAND-02).
function LandingPage() {
  return (
    <PageContainer className="landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <h1 id="landing-title">SkillBridge</h1>
        <p className="landing-lead">
          SkillBridge is a web application where small teams plan projects, split work into tasks,
          assign those tasks to members, and see progress in one place.
        </p>
        <div className="landing-actions">
          <Link className="btn btn-primary landing-cta" to="/signup">
            Create account
          </Link>
          <Link to="/login">Sign in</Link>
        </div>
      </section>

      <ul className="landing-points">
        {POINTS.map(({ Icon, title, text }) => (
          <li key={title} className="card landing-point">
            <Icon size={24} aria-hidden="true" className="landing-point-icon" />
            <h2>{title}</h2>
            <p>{text}</p>
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}

export default LandingPage
