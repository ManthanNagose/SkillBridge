import { mockRequest, requireSignedInUserId } from '../../../services/mock/mockDb.js'
import { SERVICE_ERROR, ServiceError } from '../../../services/serviceError.js'
import { displayNameError } from '../../auth/validation.js'

// Profile service. Mock implementation. The email address can't be changed
// here, and there's no account deletion or image upload (PRD F-10).

function requireMyUser(db) {
  const userId = requireSignedInUserId(db)
  const user = db.users.find((u) => u.id === userId)
  if (!user) {
    throw new ServiceError(SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS)
  }
  return user
}

// Returns { id, displayName, email }.
export function getMyProfile() {
  return mockRequest((db) => requireMyUser(db))
}

// Changes the display name (FR-PROF-02): required, 2–50 characters after
// trimming. Returns the updated profile.
export function updateMyProfile({ displayName } = {}) {
  return mockRequest((db) => {
    const user = requireMyUser(db)
    const code = displayNameError(displayName)
    if (code) {
      throw new ServiceError(SERVICE_ERROR.VALIDATION, 'validation', {
        fieldErrors: { displayName: code },
      })
    }
    user.displayName = String(displayName).trim()
    return user
  })
}
