import { avatarInitials } from '../../utils/avatar.js'

// Avatar initials on a neutral background (FR-PROF-03). No uploaded images.
// Decorative by default, because the name is always shown next to it.
function Avatar({ displayName, email, size = 'md', className = '' }) {
  return (
    <span
      className={['avatar', `avatar-${size}`, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {avatarInitials(displayName, email)}
    </span>
  )
}

export default Avatar
