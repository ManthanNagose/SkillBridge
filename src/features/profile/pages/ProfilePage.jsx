import { useId, useState } from 'react'
import Avatar from '../../../components/common/Avatar.jsx'
import Button from '../../../components/common/Button.jsx'
import Card from '../../../components/common/Card.jsx'
import FormErrorSummary from '../../../components/common/FormErrorSummary.jsx'
import Input from '../../../components/common/Input.jsx'
import SectionError from '../../../components/common/SectionError.jsx'
import { useToast } from '../../../components/common/toastContext.js'
import Header from '../../../components/layout/Header.jsx'
import PageContainer from '../../../components/layout/PageContainer.jsx'
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
} from '../../../data/constants.js'
import { useServiceData } from '../../../hooks/useServiceData.js'
import { summaryItems, useValidatedForm } from '../../../hooks/useValidatedForm.js'
import { SERVICE_ERROR } from '../../../services/serviceError.js'
import { refreshSession } from '../../auth/services/authService.js'
import { displayNameError } from '../../auth/validation.js'
import { getMyProfile, updateMyProfile } from '../services/profileService.js'
import '../components/profile.css'

// Copy from PRD section 08 (Profile).
const NAME_MESSAGES = {
  required: 'Enter a display name.',
  'too-short': `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.`,
  'too-long': `Display name can be up to ${DISPLAY_NAME_MAX_LENGTH} characters.`,
}

function validateProfile({ displayName }) {
  const code = displayNameError(displayName)
  return code ? { displayName: code } : {}
}

function describeFailure(error) {
  return {
    message:
      error?.code === SERVICE_ERROR.NETWORK
        ? "Can't reach SkillBridge. Check your connection and try again."
        : "Couldn't save your profile. Try again.",
  }
}

function ProfileLoading() {
  return (
    <Card className="profile-card" aria-hidden="true">
      <span className="skeleton profile-avatar-skeleton" />
      <span className="skeleton skeleton-line skeleton-title" />
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-line skeleton-short" />
    </Card>
  )
}

// Display name (editable), email (read-only) and an avatar-initials preview
// (FR-PROF-01). Save changes is enabled only when the name has changed and is
// valid (FR-PROF-04); an invalid edit shows its message inline as you type.
function ProfileForm({ profile }) {
  const showToast = useToast()
  const formId = useId()
  const fieldId = (name) => `${formId}-${name}`
  const [savedName, setSavedName] = useState(profile.displayName)
  const { values, fieldErrors, formError, pending, summaryRef, handleChange, handleSubmit } =
    useValidatedForm({
      initialValues: { displayName: profile.displayName },
      validate: validateProfile,
      onSubmit: async ({ displayName }) => {
        const updated = await updateMyProfile({ displayName })
        setSavedName(updated.displayName)
        showToast('Profile updated')
        // Shows the new name everywhere, such as the sidebar and dashboard.
        refreshSession()
      },
      describeFailure,
    })

  const changed = values.displayName.trim() !== savedName
  const liveCode = changed ? displayNameError(values.displayName) : null
  const nameCode = fieldErrors.displayName ?? liveCode
  const messages = nameCode ? { displayName: NAME_MESSAGES[nameCode] ?? 'Check this field.' } : {}

  return (
    <Card className="profile-card">
      <div className="profile-identity">
        <Avatar displayName={values.displayName} email={profile.email} size="lg" />
        <div className="profile-identity-text">
          <p className="profile-name">{savedName}</p>
          <p className="project-meta">Avatar preview: your initials, from your display name.</p>
        </div>
      </div>

      <FormErrorSummary
        ref={summaryRef}
        items={summaryItems({
          formError,
          // Only errors from a save attempt; live typing errors stay inline.
          messages: fieldErrors.displayName ? messages : {},
          fieldOrder: ['displayName'],
          fieldId,
        })}
      />
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <Input
          id={fieldId('displayName')}
          label="Display name"
          name="displayName"
          required
          autoComplete="name"
          value={values.displayName}
          onChange={handleChange}
          error={messages.displayName}
        />
        <dl className="profile-readonly">
          <dt>Email</dt>
          <dd>{profile.email}</dd>
        </dl>
        <div className="project-form-actions">
          <Button type="submit" loading={pending} disabled={!changed || Boolean(liveCode)}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

// Profile (FR-PROF-01 to 04). No email change, account deletion or image
// upload (PRD F-10).
function ProfilePage() {
  const { status, data: profile, error, retry } = useServiceData(getMyProfile)

  return (
    <>
      <Header title="Profile" />
      <PageContainer className="profile-page">
        {status === 'loading' && (
          <>
            <ProfileLoading />
            <p className="visually-hidden">Loading your profile</p>
          </>
        )}
        {status === 'error' && <SectionError error={error} what="your profile" onRetry={retry} />}
        {status === 'success' && <ProfileForm profile={profile} />}
      </PageContainer>
    </>
  )
}

export default ProfilePage
