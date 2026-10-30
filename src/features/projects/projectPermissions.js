import { PROJECT_ROLE } from '../../data/constants.js'

// Project rules from the PRD permission matrix (section 03). The mock services
// enforce them and screens use them to decide which controls to show. Neither
// is security: the backend must enforce the same rules (PRD B-13).

// Edit details, archive and restore: owner only.
export function canManageProject({ role }) {
  return role === PROJECT_ROLE.OWNER
}

// Add and remove members: owner only (permission matrix, FR-TEAM-02, 03).
export function canManageMembers({ role }) {
  return role === PROJECT_ROLE.OWNER
}

// Members can leave, including archived projects (A-05). The owner can't
// (E-08, under the one-owner proposal F-04).
export function canLeaveProject({ role }) {
  return role === PROJECT_ROLE.MEMBER
}
