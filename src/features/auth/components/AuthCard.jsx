import Card from '../../../components/common/Card.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import './auth.css'

// Centred card shared by the sign-in and sign-up screens. The public header
// above it shows the SkillBridge name. Pass titleRef to move focus to the
// heading, for example after the content changes.
function AuthCard({ title, titleRef, children }) {
  return (
    <PageContainer className="auth-page">
      <Card className="auth-card">
        <h1 ref={titleRef} tabIndex={titleRef ? -1 : undefined}>
          {title}
        </h1>
        {children}
      </Card>
    </PageContainer>
  )
}

export default AuthCard
