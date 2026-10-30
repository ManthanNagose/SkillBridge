import { PROJECT_ROLE } from '../../data/constants.js'

// How each project role is shown in the UI.
export const PROJECT_ROLE_LABEL = {
  [PROJECT_ROLE.OWNER]: 'Owner',
  [PROJECT_ROLE.MEMBER]: 'Member',
}

export function projectRoleLabel(role) {
  return PROJECT_ROLE_LABEL[role] ?? role
}
